/* =========================================================
   Delen met de trainers (Google Sheet)

   1. De webapp-URL van je Google Apps Script staat in config.js
      (zo overschrijf je hem niet bij een update van dit bestand).
      Leeg = de app werkt alleen lokaal, zonder wachtwoord.
   2. Bij de eerste keer openen vult een speler het wachtwoord in
      (TEAM_CODE in Code.gs). Het script controleert het; het
      wachtwoord staat dus niet in deze code. Daarna kiest hij
      één keer zijn naam. Beide worden op de telefoon onthouden.
   3. Wachtwoord veranderd in Code.gs? Dan vraagt de app het
      opnieuw. Zo sluit je de toegang als het toch rondgaat.

   Alles wat een speler logt, gaat per set naar de sheet: gebundeld
   (na een minuut stilte) en meteen als de app gesloten wordt.
   Offline? Dan wacht het in een wachtrij tot er weer internet is.
   Bij het kiezen van een naam haalt de app eerdere trainingen van
   die speler uit de sheet terug (nieuwe of gewiste telefoon).
   Bij een overstap naar een andere database hoeft alleen dit
   bestand te veranderen.
   ========================================================= */
const Sync = (function () {
  "use strict";

  const K = { player: "casrc-player", team: "casrc-team", device: "casrc-device", queue: "casrc-outbox", last: "casrc-lastsync", local: "casrc-localonly", list: "casrc-players" };
  const get = (k, fb) => { try { const v = localStorage.getItem(k); return v == null ? fb : JSON.parse(v); } catch (e) { return fb; } };
  const set = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const slug = (s) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const URL_ = typeof SYNC_URL !== "undefined" ? String(SYNC_URL).trim() : "";
  const enabled = !!URL_;


  let device = get(K.device, null);
  if (!device) {
    device = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : "d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    set(K.device, device);
  }

  /* ---------- wachtrij: "oefening|datum|set" -> versienummer ---------- */
  let queue = get(K.queue, {});
  let version = 0;
  const saveQueue = () => set(K.queue, queue);
  const pending = () => Object.keys(queue).length;

  let state = get(K.last, null) ? "ok" : "never";
  let busy = false;
  let timer = null;

  const player = () => get(K.player, null);
  const teamCode = () => get(K.team, "");
  const unlocked = () => !enabled || !!teamCode();
  if (!unlocked()) document.body.classList.add("locked");
  const sharing = () => enabled && !!player() && !get(K.local, false);

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

  async function flush(closing) {
    clearTimeout(timer);
    if (!sharing() || busy || !pending()) return;
    if (navigator.onLine === false) { state = "offline"; refreshBox(); return; }
    busy = true;
    const p = player();
    const team = teamCode();
    try {
      const keys = Object.keys(queue);
      const size = closing ? 150 : 300; // keepalive mag maar ~64 kB meesturen
      for (let i = 0; i < keys.length; i += size) {
        const batch = keys.slice(i, i + size);
        const snap = {};
        batch.forEach((k) => { snap[k] = queue[k]; });
        const res = await post({ code: team, player: p, device, app: "casrc-training", rows: batch.map(rowFor) }, closing);
        if (!res || !res.ok) {
          state = res && res.error === "code" ? "code" : "error";
          break;
        }
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
    if (state === "code") { set(K.team, null); openOnboarding(); }
    else if (pending() && state !== "ok") schedule(60000);
  }

  /* ---------- status in Stats ---------- */
  function statusHtml() {
    if (!enabled) return "";
    const p = player();
    if (!p || get(K.local, false)) {
      return `<div class="sync-box"><p>${esc(t("syncLocal"))}</p><div class="tool-row"><button type="button" data-sync="join">${esc(t("syncJoin"))}</button></div></div>`;
    }
    const n = pending();
    const last = get(K.last, null);
    let line, cls = "";
    if (state === "code") { line = t("syncCodeErr"); cls = "warn"; }
    else if (n && (state === "offline" || state === "error")) { line = state === "error" ? t("syncError") : t("syncPending", { n }); cls = "warn"; }
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

  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-sync]");
    if (!b) return;
    const a = b.dataset.sync;
    if (a === "now") {
      if (!pending()) Store.allSets().forEach(([id, d, si]) => { queue[id + "|" + d + "|" + si] = ++version; });
      saveQueue();
      flush().then(() => { if (state === "ok" && window.showToast) showToast(t("syncSent")); });
    }
    if (a === "join") { set(K.local, false); openOnboarding(); }
    if (a === "restore") {
      b.disabled = true;
      restore().then((n) => {
        b.disabled = false;
        if (!window.showToast) return;
        showToast(n < 0 ? t("syncError") : n === 0 ? t("syncRestoreNone") : t("syncRestored", { n }));
      });
    }
    if (a === "switch") {
      if (!b.classList.contains("arm")) {
        b.classList.add("arm");
        b.textContent = t("syncSwitchConfirm");
        setTimeout(() => { if (b.isConnected) { b.classList.remove("arm"); b.textContent = t("syncSwitch"); } }, 3500);
        return;
      }
      set(K.player, null);
      queue = {}; saveQueue();
      refreshBox();
      openOnboarding();
    }
  });

  /* ---------- eerste keer: teamcode + naam kiezen ---------- */
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
    return ov;
  }

  function close() {
    if (!unlocked()) return;
    if (!ov) return;
    ov.remove(); ov = null;
    document.body.classList.remove("onb-open");
  }

  function frame(inner) {
    overlay().innerHTML = `<div class="onb-hoops" aria-hidden="true"></div><div class="onb-body">
      <svg class="onb-mark" viewBox="0 0 512 512" aria-hidden="true"><use href="#kettlebell"/></svg>${inner}</div>`;
    document.body.classList.add("onb-open");
  }

  function stepCode(msg) {
    frame(`<h2>${esc(t("onbWelcome"))}</h2><p class="onb-text">${esc(t("onbCodeText"))}</p>
      <form class="onb-form" data-form="code">
        <label for="onb-code">${esc(t("onbCode"))}</label>
        <input id="onb-code" type="password" autocomplete="current-password" autocapitalize="off" spellcheck="false" enterkeyhint="go">
        <p class="onb-msg" id="onb-msg" role="status">${msg ? esc(msg) : ""}</p>
        <button type="button" class="onb-main" data-onb="code">${esc(t("onbNext"))}</button>
      </form>`);
    document.body.classList.add("locked");
    setTimeout(() => { const i = ov && ov.querySelector("#onb-code"); i && i.focus(); }, 50);
    const i = ov.querySelector("#onb-code");
    i.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); checkCode(); } });
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
    const msg = ov.querySelector("#onb-msg");
    if (!code) { input.focus(); return; }
    msg.textContent = t("onbChecking");
    try {
      const res = await loadPlayers(code);
      if (!res || !res.ok) { msg.textContent = t("onbWrongCode"); return; }
      set(K.team, code);
      document.body.classList.remove("locked");
      list = res.players || [];
      set(K.list, list);
      if (player() || get(K.local, false)) close(); else stepWho();
    } catch (e) {
      msg.textContent = t("onbOffline");
    }
  }

  function listHtml(q) {
    const norm = (s) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();
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
      <div class="onb-foot"><button type="button" class="linkbtn" data-onb="new">${esc(t("onbNotListed"))}</button><button type="button" class="linkbtn" data-onb="later">${esc(t("onbLater"))}</button></div>`);
  }

  function stepNew() {
    frame(`<h2>${esc(t("onbNotListed"))}</h2>
      <form class="onb-form" data-form="new">
        <label for="onb-new">${esc(t("onbYourName"))}</label>
        <input id="onb-new" type="text" autocomplete="name" autocapitalize="words" enterkeyhint="done">
        <button type="button" class="onb-main" data-onb="usename">${esc(t("onbUseName"))}</button>
      </form>
      <div class="onb-foot"><button type="button" class="linkbtn" data-onb="who">${esc(t("onbBack"))}</button></div>`);
  }

  function stepConfirm(p) {
    frame(`<h2>${esc(t("onbConfirm", { name: p.name }))}</h2>
      <div class="onb-form"><button type="button" class="onb-main" data-onb="yes" data-id="${esc(p.id)}" data-name="${esc(p.name)}">${esc(t("onbYes"))}</button></div>
      <div class="onb-foot"><button type="button" class="linkbtn" data-onb="who">${esc(t("onbBack"))}</button></div>`);
  }

  /** eerdere trainingen van deze speler uit de sheet terugzetten (vult alleen lege plekken) */
  async function restore() {
    const p = player();
    if (!enabled || !p) return -1;
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 25000);
    try {
      const res = await fetch(URL_ + "?action=mine&code=" + encodeURIComponent(teamCode()) + "&player=" + encodeURIComponent(p.id), { signal: ctrl.signal, redirect: "follow" });
      const data = await res.json();
      if (!data || !data.ok) return -1;
      const n = Store.mergeRows(data.rows || []);
      if (n) window.dispatchEvent(new Event("casrc:data"));
      return n;
    } catch (e) { return -1; }
    finally { clearTimeout(to); }
  }

  async function choose(p) {
    const local = Store.allSets(); // wat al op deze telefoon stond
    set(K.player, { id: p.id, name: p.name });
    set(K.local, false);
    close();
    if (window.showToast) showToast(t("onbWelcomeName", { name: p.name.split(" ")[0] }));
    const n = await restore();
    if (n > 0 && window.showToast) showToast(t("syncRestored", { n }));
    enqueue(local);
    flush();
  }

  function onInput(e) {
    if (e.target.id === "onb-q") ov.querySelector("#onb-list").innerHTML = listHtml(e.target.value);
  }

  function onClick(e) {
    const pick = e.target.closest("[data-pick]");
    if (pick) { const p = list.find((x) => x.id === pick.dataset.pick); if (p) stepConfirm(p); return; }
    const b = e.target.closest("[data-onb]");
    if (!b) return;
    const a = b.dataset.onb;
    if (a === "code") checkCode();
    if (a === "retry") loadAndPick();
    if (a === "later") close();
    if (a === "local") { set(K.local, true); close(); refreshBox(); }
    if (a === "who") stepWho();
    if (a === "new") stepNew();
    if (a === "usename") {
      const v = ov.querySelector("#onb-new").value.trim().replace(/\s+/g, " ");
      if (v.length < 3) { ov.querySelector("#onb-new").focus(); return; }
      stepConfirm({ id: "nieuw-" + slug(v), name: v });
    }
    if (a === "yes") choose({ id: b.dataset.id, name: b.dataset.name });
  }

  function stepLoading(msg, retry) {
    frame(`<h2>${esc(t("onbWho"))}</h2><p class="onb-text">${esc(msg || t("onbChecking"))}</p>
      ${retry ? `<div class="onb-form"><button type="button" class="onb-main" data-onb="retry">${esc(t("onbRetry"))}</button></div>` : ""}
      <div class="onb-foot"><button type="button" class="linkbtn" data-onb="later">${esc(t("onbLater"))}</button><button type="button" class="linkbtn" data-onb="local">${esc(t("onbLocal"))}</button></div>`);
  }

  async function loadAndPick() {
    stepLoading();
    try {
      const res = await loadPlayers(teamCode());
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
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") flush(); else if (pending()) flush(true); });
    window.addEventListener("pagehide", () => { if (pending()) flush(true); });
    setInterval(() => { if (pending()) flush(); }, 120000);
    window.addEventListener("load", () => {
      if (!unlocked() || (!player() && !get(K.local, false))) openOnboarding();
      else flush();
    });
  }

  return { statusHtml, flush, restore, open: openOnboarding, get enabled() { return enabled; } };
})();
