/* =========================================================
   Delen met de trainers (Google Sheet) + inloggen met e-mailcode

   1. De webapp-URL van je Google Apps Script staat in config.js
      (zo overschrijf je hem niet bij een update van dit bestand).
      Leeg = de app werkt alleen lokaal, zonder inloggen.
   2. Eerste keer op een apparaat:
      wachtwoord (TEAM_CODE in Code.gs, gecontroleerd door het script)
      → naam kiezen → e-mail (alleen de allereerste keer)
      → code uit de mail invullen → ingelogd, blijft ingelogd.
   3. Elk apparaat krijgt een eigen geheime sleutel. Alleen daarmee
      kan een speler zijn eigen trainingen insturen en ophalen.
      Apparaat afmelden: regel verwijderen in het tabblad Sessies.

   Alles wat een speler logt, gaat per set naar de sheet: gebundeld
   (na een minuut stilte) en meteen als de app gesloten wordt.
   Offline? Dan wacht het in een wachtrij tot er weer internet is.
   Bij inloggen en bij het openen van de app wordt opgehaald wat
   er al in de sheet staat (ook van andere apparaten).
   Bij een overstap naar een andere database hoeft alleen dit
   bestand te veranderen.
   ========================================================= */
const Sync = (function () {
  "use strict";

  const K = { player: "casrc-player", team: "casrc-team", token: "casrc-token", queue: "casrc-outbox", last: "casrc-lastsync", pull: "casrc-lastpull", local: "casrc-localonly", list: "casrc-players" };
  const get = (k, fb) => { try { const v = localStorage.getItem(k); return v == null ? fb : JSON.parse(v); } catch (e) { return fb; } };
  const set = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = (s) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const slug = (s) => norm(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const toast = (m) => { if (window.showToast) showToast(m); };

  const URL_ = typeof SYNC_URL !== "undefined" ? String(SYNC_URL).trim() : "";
  const enabled = !!URL_;

  /** korte, herkenbare naam van dit apparaat (voor het tabblad Sessies) */
  const deviceName = (function () {
    const ua = navigator.userAgent || "";
    const os = /iPhone/.test(ua) ? "iPhone" : /iPad/.test(ua) ? "iPad" : /Android/.test(ua) ? "Android" : /Mac/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "Apparaat";
    const br = /CriOS|Chrome/.test(ua) ? "Chrome" : /FxiOS|Firefox/.test(ua) ? "Firefox" : /Safari/.test(ua) ? "Safari" : "";
    return os + (br ? " · " + br : "");
  })();

  /* ---------- wachtrij: "oefening|datum|set" -> versienummer ---------- */
  let queue = get(K.queue, {});
  let version = 0;
  const saveQueue = () => set(K.queue, queue);
  const pending = () => Object.keys(queue).length;

  let state = get(K.last, null) ? "ok" : "never";
  let busy = false;
  let timer = null;

  const player = () => get(K.player, null);
  const token = () => get(K.token, "");
  const teamCode = () => get(K.team, "");
  const unlocked = () => !enabled || !!teamCode() || !!token();
  if (!unlocked()) document.body.classList.add("locked");
  const sharing = () => enabled && !!token() && !!player() && !get(K.local, false);

  function enqueue(changes) {
    if (!sharing()) return;
    changes.forEach(([id, date, si]) => { queue[id + "|" + date + "|" + si] = ++version; });
    saveQueue();
    schedule(60000); // bundelen: pas versturen na een minuut zonder wijzigingen
    refreshBox();
  }

  function schedule(ms) {
    clearTimeout(timer);
    timer = setTimeout(flush, ms);
  }

  function weekday(date) { return (Store.parseYmd(date).getDay() + 6) % 7; }
  function plain(v) { return v == null ? "" : typeof v === "object" ? (v.nl || v.en || "") : v; }

  function rowFor(key) {
    const [id, date, si] = key.split("|");
    const n = +si;
    const w = Store.workoutFor(weekday(date), date);
    const c = Store.catalog[id];
    const kg = Store.getKg(id, date, n);
    return {
      date, workout: plain(w && w.title), exId: id, exName: c ? c.name : id,
      set: n + 1, reps: Store.repsFor(id, date, n), kg: kg == null ? null : kg, done: Store.isDone(id, date, n) ? 1 : 0
    };
  }

  async function post(body, keepalive) {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 25000);
    try {
      // geen extra headers: zo accepteert Google het verzoek zonder voorcontrole.
      // keepalive: het verzoek gaat ook door als de app net gesloten wordt.
      const res = await fetch(URL_, { method: "POST", body: JSON.stringify(body), signal: ctrl.signal, redirect: "follow", keepalive: !!keepalive });
      return await res.json();
    } finally { clearTimeout(to); }
  }

  /** sleutel ongeldig (afgemeld door de trainer): opnieuw inloggen, wachtrij blijft bewaard */
  function signedOut() {
    set(K.token, null);
    state = "auth";
    refreshBox();
    openOnboarding();
  }

  async function flush(closing) {
    clearTimeout(timer);
    if (!sharing() || busy || !pending()) return;
    if (navigator.onLine === false) { state = "offline"; refreshBox(); return; }
    busy = true;
    try {
      const keys = Object.keys(queue);
      const size = closing ? 150 : 300; // keepalive mag maar ~64 kB meesturen
      for (let i = 0; i < keys.length; i += size) {
        const batch = keys.slice(i, i + size);
        const snap = {};
        batch.forEach((k) => { snap[k] = queue[k]; });
        const res = await post({ token: token(), deviceName, app: "casrc-training", rows: batch.map(rowFor) }, closing);
        if (!res || !res.ok) { state = res && res.error === "auth" ? "auth" : "error"; break; }
        // alleen weghalen wat tijdens het versturen niet opnieuw is gewijzigd
        batch.forEach((k) => { if (queue[k] === snap[k]) delete queue[k]; });
        saveQueue();
        set(K.last, Date.now());
        state = "ok";
      }
    } catch (e) {
      state = navigator.onLine === false ? "offline" : "error";
    }
    busy = false;
    refreshBox();
    if (state === "auth") signedOut();
    else if (pending() && state !== "ok") schedule(60000);
  }

  /** eigen trainingen uit de sheet ophalen (ook wat op andere apparaten is gelogd); vult alleen lege plekken */
  async function restore() {
    if (!sharing()) return -1;
    try {
      const data = await post({ action: "mine", token: token() });
      if (data && data.error === "auth") { signedOut(); return -1; }
      if (!data || !data.ok) return -1;
      set(K.pull, Date.now());
      const n = Store.mergeRows(data.rows || []);
      if (n) window.dispatchEvent(new Event("casrc:data"));
      return n;
    } catch (e) { return -1; }
  }

  /** bij openen van de app: hooguit eens per 5 minuten ophalen */
  function pullIfStale() {
    if (sharing() && Date.now() - (get(K.pull, 0) || 0) > 5 * 60 * 1000) restore();
  }

  /* ---------- status in Stats ---------- */
  function statusHtml() {
    if (!enabled) return "";
    const p = player();
    if (!token() || !p || get(K.local, false)) {
      return `<div class="sync-box"><p>${esc(state === "auth" ? t("syncAuth") : t("syncLocal"))}</p><div class="tool-row"><button type="button" data-sync="join">${esc(t("syncJoin"))}</button></div></div>`;
    }
    const n = pending();
    const last = get(K.last, null);
    let line, cls = "";
    if (n && (state === "offline" || state === "error")) { line = state === "error" ? t("syncError") : t("syncPending", { n }); cls = "warn"; }
    else if (n) line = t("syncPending", { n });
    else if (last) line = t("syncOk", { time: new Date(last).toLocaleString(I18N.locale, { weekday: "short", hour: "2-digit", minute: "2-digit" }) });
    else line = t("syncNever");
    return `<div class="sync-box">
      <p class="sync-who">${esc(t("syncAs", { name: p.name }))}</p>
      <p class="sync-line ${cls}"><span class="dot" aria-hidden="true"></span>${esc(line)}</p>
      <div class="tool-row">
        <button type="button" data-sync="now">${esc(t("syncNow"))}</button>
        <button type="button" data-sync="restore">${esc(t("syncRestore"))}</button>
        <button type="button" data-sync="switch">${esc(t("syncSwitch"))}</button>
      </div>
    </div>`;
  }

  function refreshBox() {
    const box = document.getElementById("sync-box");
    if (box) box.innerHTML = statusHtml();
  }

  /** dit apparaat afmelden en leegmaken (alles staat al in de sheet) */
  async function logout() {
    const tk = token();
    if (tk) { try { await post({ action: "logout", token: tk }); } catch (e) {} }
    Store.resetAll();
    set(K.token, null); set(K.player, null); set(K.pull, null); set(K.last, null);
    queue = {}; saveQueue();
    state = "never";
    window.dispatchEvent(new Event("casrc:data"));
    refreshBox();
    openOnboarding();
  }

  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-sync]");
    if (!b) return;
    const a = b.dataset.sync;
    if (a === "now") {
      if (!pending()) Store.allSets().forEach(([id, d, si]) => { queue[id + "|" + d + "|" + si] = ++version; });
      saveQueue();
      flush().then(() => { if (state === "ok") toast(t("syncSent")); });
    }
    if (a === "join") { set(K.local, false); openOnboarding(); }
    if (a === "restore") {
      b.disabled = true;
      restore().then((n) => {
        b.disabled = false;
        toast(n < 0 ? t("syncError") : n === 0 ? t("syncRestoreNone") : t("syncRestored", { n }));
      });
    }
    if (a === "switch") {
      if (!b.classList.contains("arm")) {
        b.classList.add("arm");
        b.textContent = t("syncSwitchConfirm");
        setTimeout(() => { if (b.isConnected) { b.classList.remove("arm"); b.textContent = t("syncSwitch"); } }, 3500);
        return;
      }
      if (pending()) { toast(t("syncSwitchPending")); flush(); return; }
      logout();
    }
  });

  /* ---------- inloggen: wachtwoord → naam → e-mail → code ---------- */
  let ov = null;
  let list = get(K.list, []);

  function overlay() {
    if (ov) return ov;
    ov = document.createElement("div");
    ov.className = "onb";
    ov.setAttribute("role", "dialog");
    ov.setAttribute("aria-modal", "true");
    document.body.appendChild(ov);
    ov.addEventListener("click", onClick);
    ov.addEventListener("input", onInput);
    ov.addEventListener("submit", (e) => e.preventDefault());
    ov.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      const id = e.target.id;
      if (id === "onb-code") { e.preventDefault(); checkCode(); }
      if (id === "onb-email") { e.preventDefault(); sendEmail(); }
      if (id === "onb-otp") { e.preventDefault(); verify(); }
      if (id === "onb-new") { e.preventDefault(); useNewName(); }
    });
    return ov;
  }

  function close() {
    if (!unlocked()) return;
    if (!ov) return;
    clearInterval(countdown);
    ov.remove(); ov = null;
    document.body.classList.remove("onb-open");
  }

  function frame(inner) {
    clearInterval(countdown);
    overlay().innerHTML = `<div class="onb-hoops" aria-hidden="true"></div><div class="onb-body">
      <svg class="onb-mark" viewBox="0 0 512 512" aria-hidden="true"><use href="#kettlebell"/></svg>${inner}</div>`;
    document.body.classList.add("onb-open");
  }
  const focus = (sel) => setTimeout(() => { const i = ov && ov.querySelector(sel); i && i.focus(); }, 50);
  const msg = (text) => { const m = ov && ov.querySelector("#onb-msg"); if (m) m.textContent = text || ""; };
  const foot = (...btns) => `<div class="onb-foot">${btns.map(([a, l]) => `<button type="button" class="linkbtn" data-onb="${a}">${esc(l)}</button>`).join("")}</div>`;

  /* 1. wachtwoord */
  function stepCode(m) {
    frame(`<h2>${esc(t("onbWelcome"))}</h2><p class="onb-text">${esc(t("onbCodeText"))}</p>
      <form class="onb-form">
        <label for="onb-code">${esc(t("onbCode"))}</label>
        <input id="onb-code" type="password" autocomplete="current-password" autocapitalize="off" spellcheck="false" enterkeyhint="go">
        <p class="onb-msg" id="onb-msg" role="status">${m ? esc(m) : ""}</p>
        <button type="button" class="onb-main" data-onb="code">${esc(t("onbNext"))}</button>
      </form>`);
    document.body.classList.add("locked");
    focus("#onb-code");
  }

  async function loadPlayers(code) {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await fetch(URL_ + "?action=players&code=" + encodeURIComponent(code), { signal: ctrl.signal, redirect: "follow" });
      return await res.json();
    } finally { clearTimeout(to); }
  }

  async function checkCode() {
    const input = ov.querySelector("#onb-code");
    const code = input.value.trim();
    if (!code) { input.focus(); return; }
    msg(t("onbChecking"));
    try {
      const res = await loadPlayers(code);
      if (!res || !res.ok) { msg(t("onbWrongCode")); return; }
      set(K.team, code);
      document.body.classList.remove("locked");
      list = res.players || [];
      set(K.list, list);
      if ((token() && player()) || get(K.local, false)) close(); else stepWho();
    } catch (e) { msg(t("onbOffline")); }
  }

  /* 2. naam */
  function listHtml(q) {
    const nq = norm(q || "");
    const hits = list.filter((p) => !nq || norm(p.name).includes(nq));
    if (!hits.length) return `<p class="onb-empty">${esc(t("onbNoMatch"))}</p>`;
    let h = "", g = null;
    hits.forEach((p) => {
      if (p.group !== g) { g = p.group; h += `<p class="onb-group">${esc(g)}</p>`; }
      h += `<button type="button" class="onb-name" data-pick="${esc(p.id)}">${esc(p.name)}</button>`;
    });
    return h;
  }

  function stepWho() {
    frame(`<h2>${esc(t("onbWho"))}</h2><p class="onb-text">${esc(t("onbWhoText"))}</p>
      <label class="onb-search" for="onb-q"><span class="sr">${esc(t("onbSearch"))}</span>
        <input id="onb-q" type="search" placeholder="${esc(t("onbSearch"))}" autocomplete="off" spellcheck="false" enterkeyhint="search"></label>
      <div class="onb-list" id="onb-list">${listHtml("")}</div>
      ${foot(["new", t("onbNotListed")], ["later", t("onbLater")])}`);
  }

  function stepNew() {
    frame(`<h2>${esc(t("onbNotListed"))}</h2>
      <form class="onb-form">
        <label for="onb-new">${esc(t("onbYourName"))}</label>
        <input id="onb-new" type="text" autocomplete="name" autocapitalize="words" enterkeyhint="done">
        <button type="button" class="onb-main" data-onb="usename">${esc(t("onbUseName"))}</button>
      </form>${foot(["who", t("onbBack")])}`);
    focus("#onb-new");
  }

  function useNewName() {
    const v = ov.querySelector("#onb-new").value.trim().replace(/\s+/g, " ");
    if (v.length < 3) { ov.querySelector("#onb-new").focus(); return; }
    stepConfirm({ id: "nieuw-" + slug(v), name: v });
  }

  let chosen = null;   // { id, name }
  let sentTo = "";     // gemaskeerd e-mailadres
  let isNewEmail = false;
  let countdown = null;

  function stepConfirm(p) {
    chosen = p;
    frame(`<h2>${esc(t("onbConfirm", { name: p.name }))}</h2>
      <p class="onb-text">${esc(t("onbConfirmText"))}</p>
      <div class="onb-form"><p class="onb-msg" id="onb-msg" role="status"></p>
        <button type="button" class="onb-main" data-onb="send">${esc(t("onbSendCode"))}</button></div>
      ${foot(["who", t("onbBack")])}`);
  }

  /* 3. code aanvragen (eventueel met e-mail) */
  async function requestCode(email) {
    msg(t("onbChecking"));
    let res;
    try { res = await post({ action: "requestCode", code: teamCode(), player: chosen, email: email || "" }); }
    catch (e) { msg(t("onbOffline")); return; }
    if (res && res.error === "code") { set(K.team, null); stepCode(t("onbWrongCode")); return; }
    if (res && res.error === "needEmail") { stepEmail(); return; }
    if (res && res.error === "badEmail") { msg(t("onbBadEmail")); return; }
    if (res && res.error === "emailUsed") { msg(t("onbEmailUsed")); return; }
    if (!res || !res.ok) { msg(t("onbSetupErr")); return; }
    sentTo = res.masked || "";
    isNewEmail = !!res.isNew;
    stepOtp("");
  }

  function stepEmail() {
    frame(`<h2>${esc(t("onbEmailTitle"))}</h2><p class="onb-text">${esc(t("onbEmailText"))}</p>
      <form class="onb-form">
        <label for="onb-email">${esc(t("onbEmailLabel"))}</label>
        <input id="onb-email" type="email" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false" enterkeyhint="send">
        <p class="onb-msg" id="onb-msg" role="status"></p>
        <button type="button" class="onb-main" data-onb="email">${esc(t("onbSendCode"))}</button>
      </form>${foot(["who", t("onbBack")])}`);
    focus("#onb-email");
  }

  function sendEmail() {
    const v = ov.querySelector("#onb-email").value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { msg(t("onbBadEmail")); ov.querySelector("#onb-email").focus(); return; }
    requestCode(v);
  }

  /* 4. code invullen */
  function stepOtp(m) {
    frame(`<h2>${esc(t("onbOtpTitle"))}</h2><p class="onb-text">${esc(t("onbOtpText", { email: sentTo }))}</p>
      <form class="onb-form">
        <label for="onb-otp">${esc(t("onbOtpLabel"))}</label>
        <input id="onb-otp" class="otp" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="one-time-code" enterkeyhint="go">
        <p class="onb-msg" id="onb-msg" role="status">${m ? esc(m) : ""}</p>
        <button type="button" class="onb-main" data-onb="verify">${esc(t("onbVerify"))}</button>
      </form>
      <div class="onb-foot">
        <button type="button" class="linkbtn" data-onb="resend" id="onb-resend" disabled></button>
        ${isNewEmail ? `<button type="button" class="linkbtn" data-onb="otheremail">${esc(t("onbChangeEmail"))}</button>` : ""}
      </div>
      ${isNewEmail ? "" : `<p class="onb-hint">${esc(t("onbOtherEmail"))}</p>`}`);
    startCountdown();
    focus("#onb-otp");
  }

  function startCountdown() {
    let s = 60;
    const btn = ov.querySelector("#onb-resend");
    const tick = () => {
      if (!btn.isConnected) { clearInterval(countdown); return; }
      if (s <= 0) { btn.disabled = false; btn.textContent = t("onbResend"); clearInterval(countdown); return; }
      btn.disabled = true; btn.textContent = t("onbResendIn", { s }); s--;
    };
    clearInterval(countdown);
    tick();
    countdown = setInterval(tick, 1000);
  }

  async function verify() {
    const input = ov.querySelector("#onb-otp");
    const otp = input.value.replace(/\D/g, "");
    if (otp.length !== 6) { input.focus(); return; }
    msg(t("onbChecking"));
    let res;
    try { res = await post({ action: "verify", code: teamCode(), player: chosen, otp, deviceName }); }
    catch (e) { msg(t("onbOffline")); return; }
    if (res && res.ok && res.token) { await loggedIn(res.player || chosen, res.token); return; }
    const err = res && res.error;
    if (err === "wrong") { msg(t("onbWrongOtp", { n: res.left })); input.select(); return; }
    if (err === "expired" || err === "tooMany" || err === "noCode") {
      msg(t(err === "expired" ? "onbExpired" : err === "tooMany" ? "onbTooMany" : "onbExpired"));
      const btn = ov.querySelector("#onb-resend");
      if (btn) { clearInterval(countdown); btn.disabled = false; btn.textContent = t("onbNewCode"); }
      return;
    }
    if (err === "code") { set(K.team, null); stepCode(t("onbWrongCode")); return; }
    msg(t("onbSetupErr"));
  }

  async function loggedIn(p, tk) {
    const prev = player();
    // stond hier data van een andere speler? dan eerst leegmaken, nooit onder de verkeerde naam insturen
    if (prev && prev.id !== p.id) { Store.resetAll(); queue = {}; saveQueue(); }
    const local = Store.allSets(); // wat al op dit apparaat stond (van deze speler)
    set(K.player, { id: p.id, name: p.name });
    set(K.token, tk);
    set(K.local, false);
    state = "never";
    close();
    toast(t("onbWelcomeName", { name: p.name.split(" ")[0] }));
    const n = await restore();
    if (n > 0) toast(t("syncRestored", { n }));
    enqueue(local);
    flush();
  }

  function onInput(e) {
    if (e.target.id === "onb-q") ov.querySelector("#onb-list").innerHTML = listHtml(e.target.value);
    if (e.target.id === "onb-otp") {
      e.target.value = e.target.value.replace(/\D/g, "").slice(0, 6);
      if (e.target.value.length === 6) verify();
    }
  }

  function onClick(e) {
    const pick = e.target.closest("[data-pick]");
    if (pick) { const p = list.find((x) => x.id === pick.dataset.pick); if (p) stepConfirm(p); return; }
    const b = e.target.closest("[data-onb]");
    if (!b || b.disabled) return;
    const a = b.dataset.onb;
    if (a === "code") checkCode();
    if (a === "retry") loadAndPick();
    if (a === "later") close();
    if (a === "local") { set(K.local, true); close(); refreshBox(); }
    if (a === "who") stepWho();
    if (a === "new") stepNew();
    if (a === "usename") useNewName();
    if (a === "send") requestCode("");
    if (a === "email") sendEmail();
    if (a === "verify") verify();
    if (a === "otheremail") stepEmail();
    if (a === "resend") {
      b.disabled = true;
      post({ action: "requestCode", code: teamCode(), player: chosen, email: "" })
        .then((res) => {
          if (res && res.error === "needEmail") { stepEmail(); return; }
          msg(res && res.ok ? t("onbResent") : t("onbSetupErr"));
          startCountdown();
        })
        .catch(() => { msg(t("onbOffline")); b.disabled = false; });
    }
  }

  function stepLoading(m, retry) {
    frame(`<h2>${esc(t("onbWho"))}</h2><p class="onb-text">${esc(m || t("onbChecking"))}</p>
      ${retry ? `<div class="onb-form"><button type="button" class="onb-main" data-onb="retry">${esc(t("onbRetry"))}</button></div>` : ""}
      ${foot(["later", t("onbLater")], ["local", t("onbLocal")])}`);
  }

  async function loadAndPick() {
    stepLoading();
    try {
      const res = await loadPlayers(teamCode());
      if (res && res.error === "code") { set(K.team, null); stepCode(); return; }
      if (!res || !res.ok) { stepLoading(t("onbSetupErr"), true); return; }
      list = res.players || [];
      set(K.list, list);
      stepWho();
    } catch (e) {
      if (list.length) stepWho(); else stepLoading(t("onbOffline"), true);
    }
  }

  function openOnboarding() {
    if (!enabled) return;
    if (teamCode()) loadAndPick();
    else stepCode();
  }

  /* ---------- start ---------- */
  Store.onChange(enqueue);
  if (enabled) {
    window.addEventListener("online", () => flush());
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") { flush(); pullIfStale(); }
      else if (pending()) flush(true);
    });
    window.addEventListener("pagehide", () => { if (pending()) flush(true); });
    setInterval(() => { if (pending()) flush(); }, 120000);
    window.addEventListener("load", () => {
      if (!unlocked() || ((!token() || !player()) && !get(K.local, false))) openOnboarding();
      else { flush(); pullIfStale(); }
    });
  }

  return { statusHtml, flush, restore, logout, open: openOnboarding, get enabled() { return enabled; } };
})();
