/* =========================================================
   Cas RC Trainingsweek — schema-weergave, navigatie, taal en rusttimer
   Teksten: i18n.js · Schema: data.js · Opslag: store.js · Stats: stats.js
   ========================================================= */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const daysNav = $("daysNav");
  const daysEl = $("days");
  const main = $("main");
  const statsEl = $("stats");

  const yt = (q) => "https://www.youtube.com/results?search_query=" + encodeURIComponent(q);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const CHECK = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 10.5l4.5 4.5L17 5" fill="none" stroke="#1a1500" stroke-width="3"/></svg>';
  const { fmtKg, parseKg } = Store;
  const fmtRest = (s) => (s >= 120 && s % 60 === 0 ? s / 60 + " min" : s + " sec");
  const buzz = (ms) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };

  /* ---------- Melding ---------- */
  const toast = $("toast");
  let toastT;
  function showToast(msg) {
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(toastT);
    toastT = setTimeout(() => (toast.hidden = true), 4500);
  }
  window.showToast = showToast;

  let warned = false;
  function saved(ok) {
    if (!ok && !warned) { showToast(t("saveFail")); warned = true; }
  }

  /* ---------- Vaste teksten in de HTML ---------- */
  function applyStatic() {
    document.querySelectorAll("[data-i18n]").forEach((n) => { n.textContent = t(n.dataset.i18n); });
    document.querySelectorAll("[data-i18n-aria]").forEach((n) => n.setAttribute("aria-label", t(n.dataset.i18nAria)));
    document.querySelectorAll(".lang button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.lang === I18N.lang));
    document.title = "Cas RC " + t("title").replace(/\u00AD/g, "");
  }

  document.querySelector(".lang").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-lang]");
    if (!b || b.dataset.lang === I18N.lang) return;
    I18N.set(b.dataset.lang);
    applyStatic();
    showView();
  });

  /* ---------- Weergave + dag ---------- */
  const todayIdx = (new Date().getDay() + 6) % 7; // maandag = 0
  let sel = todayIdx;
  let view = "schema";

  function readHash() {
    const h = location.hash.slice(1);
    if (h === "stats") { view = "stats"; return; }
    const i = WEEK.findIndex((d) => d.key === h);
    view = "schema";
    if (i >= 0) sel = i;
  }

  function setHash(v) { try { history.replaceState(null, "", "#" + v); } catch (e) {} }

  function showView() {
    const stats = view === "stats";
    document.body.classList.toggle("is-stats", stats);
    $("tab-schema").setAttribute("aria-selected", !stats);
    $("tab-stats").setAttribute("aria-selected", stats);
    daysNav.hidden = stats;
    main.hidden = stats;
    statsEl.hidden = !stats;
    if (stats) Stats.render(statsEl);
    else { renderDays(); renderDay(); }
  }

  document.querySelector(".viewtabs").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-view]");
    if (!b || b.dataset.view === view) return;
    view = b.dataset.view;
    setHash(view === "stats" ? "stats" : WEEK[sel].key);
    showView();
    window.scrollTo({ top: 0 });
  });

  window.addEventListener("hashchange", () => { readHash(); showView(); });

  function renderDays() {
    daysEl.innerHTML = WEEK.map((d, i) => {
      const cls = ["day"];
      if (d.rest && !d.active) cls.push("rest");
      if (i === todayIdx) cls.push("today");
      return `<button type="button" role="tab" class="${cls.join(" ")}" aria-selected="${i === sel}" aria-label="${esc(L(d.long))}: ${esc(L(d.title))}" data-i="${i}"><b>${esc(L(d.short))}</b><span>${esc(L(d.tag))}</span></button>`;
    }).join("");
  }

  daysEl.addEventListener("click", (e) => {
    const b = e.target.closest(".day");
    if (!b) return;
    sel = +b.dataset.i;
    setHash(WEEK[sel].key);
    renderDays();
    renderDay();
    window.scrollTo({ top: 0 });
  });

  /* ---------- Vergelijking met vorige keer ---------- */
  function compareHtml(id, date, si, kg) {
    const prev = Store.prevSession(id, date);
    const pkg = prev ? (prev.kg[si] != null ? prev.kg[si] : Math.max(0, ...prev.kg.filter((v) => v != null))) : null;
    if (kg == null) {
      if (pkg == null || !prev) return "";
      return `<button type="button" class="fill" data-fill="${pkg}" aria-label="${esc(t("ariaFill", { kg: fmtKg(pkg) }))}">${t("prev")} <b>${fmtKg(pkg)}</b></button>`;
    }
    const best = Store.bestBefore(id, date);
    const pr = best > 0 && kg > best;
    if (pkg == null || !prev) return `<span class="cmp-txt">${t("first")}</span>`;
    const diff = Math.round((kg - pkg) * 10) / 10;
    const cls = diff > 0 ? "up" : diff < 0 ? "down" : "";
    const txt = diff === 0 ? t("same") : (diff > 0 ? "+" : "−") + fmtKg(Math.abs(diff));
    return `<span class="cmp-txt ${cls}">${pr ? '<i class="pr">PR</i>' : ""}${txt}<small> ${t("vs")} ${fmtKg(pkg)}</small></span>`;
  }

  /* ---------- Dag tekenen ---------- */
  const footer = () => `<footer>${t("footer", { week: esc(L(SCHEMA_WEEK)) })}</footer>`;

  /** code per oefening: A, of P1/P2, B1/B2 als er meer in het blok staan */
  const codeOf = (b, ei) => (b.ex.length > 1 ? b.letter + (ei + 1) : b.letter);

  /** rusttijd na een set: in een superset alleen na de laatste oefening */
  const restFor = (b, ei) => (b.superset && ei < b.ex.length - 1 ? 0 : b.rest || 90);

  function blockSub(b) {
    let s = L(b.sub);
    if (b.type === "sets" && b.rest) {
      s += " · " + (b.superset ? t("restAfter", { t: fmtRest(b.rest), code: codeOf(b, b.ex.length - 1) }) : t("restTag", { t: fmtRest(b.rest) }));
    }
    return s;
  }

  function renderDay() {
    const d = WEEK[sel];
    const date = Store.dateOfWeekday(sel);
    const dateTxt = Store.parseYmd(date).toLocaleDateString(I18N.locale, { day: "numeric", month: "short" });
    let h = `<div class="dayhead"><div class="kicker">${esc(L(d.long))} ${esc(dateTxt)}${sel === todayIdx ? " · " + t("today") : ""}</div><h2>${esc(L(d.title))}</h2>`;

    if (d.rest) {
      h += `</div><div class="restcard"><p>${esc(L(d.text))}</p><ul>${d.tips.map((x) => `<li>${esc(L(x))}</li>`).join("")}</ul></div>`;
      main.innerHTML = h + footer();
      return;
    }

    h += `<div class="progress"><div class="bar"><i id="pbar"></i></div><span id="ptext"></span></div></div>`;

    d.blocks.forEach((b) => {
      h += `<section class="section"><div class="sechead"><div class="letter" aria-hidden="true">${b.letter}</div><div class="secname"><strong>${esc(L(b.name))}</strong><small>${esc(blockSub(b))}</small></div></div>`;

      if (b.type === "list") {
        if (b.intro) h += `<p class="intro">${esc(L(b.intro))}</p>`;
        h += `<div class="list">` + b.items.map((it) => {
          const id = Store.idFor(b, it);
          const on = Store.isDone(id, date, 0);
          const name = it[0];
          let logRow = "";
          if (it[4]) {
            const kg = Store.getKg(id, date, 0);
            logRow = `<div class="it-log" data-id="${id}" data-si="0" data-reps="">
              <input id="kg-${id}-${date}" type="text" inputmode="decimal" enterkeyhint="done" autocomplete="off" placeholder="kg" value="${kg != null ? fmtKg(kg) : ""}" aria-label="${esc(t("ariaTop", { name }))}">
              <span class="cmp">${compareHtml(id, date, 0, kg)}</span></div>`;
          }
          const dose = L(it[1]);
          return `<div class="item${on ? " done" : ""}" data-id="${id}" data-si="0">
            <button type="button" class="tick" aria-pressed="${on}" aria-label="${esc(t("ariaTick", { name }))}">${CHECK}</button>
            <div class="it-name">${esc(name)}${dose ? `<span class="it-dose">${esc(dose)}</span>` : ""}${logRow}</div>
            <a class="how" href="${yt(it[2])}" target="_blank" rel="noopener">${t("howto")}</a>
          </div>`;
        }).join("") + `</div>`;
      } else {
        b.ex.forEach((ex, ei) => {
          const id = Store.idFor(b, ex);
          const code = codeOf(b, ei);
          const note = L(ex[2]);
          h += `<div class="ex"><div class="extop"><div class="exname"><h3>${b.ex.length > 1 ? `<span class="code">${code}</span>` : ""}${esc(ex[0])}</h3>${note ? `<p class="note">${esc(note)}</p>` : ""}</div><a class="how" href="${yt(ex[3])}" target="_blank" rel="noopener">${t("howto")}</a></div><div class="sets">`;
          const rest = restFor(b, ei);
          const next = rest === 0 ? codeOf(b, ei + 1) : "";
          ex[1].forEach((r, si) => {
            const on = Store.isDone(id, date, si);
            const kg = Store.getKg(id, date, si);
            h += `<div class="set${on ? " done" : ""}" data-id="${id}" data-si="${si}" data-reps="${r}" data-rest="${rest}" data-next="${next}">
              <button type="button" class="set-btn" aria-pressed="${on}" aria-label="${esc(t("ariaSet", { n: si + 1, name: ex[0], reps: r }))}"><span class="sl">${t("set")} ${si + 1}</span><span class="rp">${r}</span></button>
              <input id="kg-${id}-${si}-${date}" type="text" inputmode="decimal" enterkeyhint="done" autocomplete="off" placeholder="kg" value="${kg != null ? fmtKg(kg) : ""}" aria-label="${esc(t("ariaKg", { n: si + 1, name: ex[0] }))}">
              <span class="cmp">${compareHtml(id, date, si, kg)}</span>
            </div>`;
          });
          h += `</div></div>`;
        });
      }
      h += `</section>`;
    });

    h += `<button type="button" class="reset" id="reset">${esc(t("clearDay", { day: L(d.long).toLowerCase() }))}</button>`;
    main.innerHTML = h + footer();
    updateProgress();
  }

  function updateProgress() {
    const all = main.querySelectorAll(".set, .item").length;
    if (!all) return;
    const done = main.querySelectorAll(".set.done, .item.done").length;
    $("pbar").style.width = (done / all) * 100 + "%";
    $("ptext").textContent = done + "/" + all;
  }

  /* ---------- Interactie ---------- */
  function boxOf(el) { return el.closest(".it-log") || el.closest("[data-id]"); }

  function commitKg(input) {
    const box = boxOf(input);
    const id = box.dataset.id, si = +box.dataset.si;
    const repsRaw = box.dataset.reps;
    const reps = repsRaw === "" ? null : (isNaN(+repsRaw) ? repsRaw : +repsRaw);
    const date = Store.dateOfWeekday(sel);
    const raw = input.value.trim();
    const kg = raw === "" ? null : parseKg(raw);
    input.classList.toggle("bad", raw !== "" && kg == null);
    if (raw !== "" && kg == null) return;
    saved(Store.setKg(id, date, si, kg, reps));
    box.querySelector(".cmp").innerHTML = compareHtml(id, date, si, kg);
  }

  main.addEventListener("click", (e) => {
    const fill = e.target.closest(".fill");
    if (fill) {
      const input = boxOf(fill).querySelector("input");
      input.value = fmtKg(+fill.dataset.fill);
      commitKg(input);
      return;
    }

    const btn = e.target.closest(".set-btn, .tick");
    if (btn) {
      unlockAudio();
      keepAwake();
      const box = btn.closest("[data-id]");
      const id = box.dataset.id, si = +box.dataset.si;
      const date = Store.dateOfWeekday(sel);
      const on = !Store.isDone(id, date, si);
      saved(Store.setDone(id, date, si, on));
      box.classList.toggle("done", on);
      btn.setAttribute("aria-pressed", on);
      updateProgress();
      if (on) buzz(15);
      if (on && box.classList.contains("set")) {
        const rest = +box.dataset.rest;
        if (rest > 0) startTimer(rest);
        else if (box.dataset.next) showNext(box.dataset.next);
      }
      return;
    }

    const r = e.target.closest("#reset");
    if (r) {
      const dayName = L(WEEK[sel].long).toLowerCase();
      if (!r.classList.contains("arm")) {
        r.classList.add("arm");
        r.textContent = t("clearConfirm");
        setTimeout(() => { if (r.isConnected) { r.classList.remove("arm"); r.textContent = t("clearDay", { day: dayName }); } }, 3500);
        return;
      }
      saved(Store.clearDone(Store.dateOfWeekday(sel)));
      renderDay();
      showToast(t("cleared", { day: dayName }));
    }
  });

  main.addEventListener("input", (e) => { if (e.target.matches("input")) commitKg(e.target); });
  main.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.matches("input")) e.target.blur(); });

  /* ---------- Rusttimer ---------- */
  const timerEl = $("timer");
  const clock = $("clock");
  const tlabel = $("tlabel");
  let end = 0, tick = null, wake = null, audio = null;

  const fmt = (s) => Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");

  // iOS laat geluid alleen toe na een tik: audio wordt bij de eerste tik ontgrendeld
  function unlockAudio() {
    try {
      if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === "suspended") audio.resume();
    } catch (e) {}
  }

  function beep() {
    try {
      if (audio) {
        [0, 0.25, 0.5].forEach((s) => {
          const o = audio.createOscillator();
          const g = audio.createGain();
          o.frequency.value = 880;
          g.gain.value = 0.3;
          o.connect(g).connect(audio.destination);
          o.start(audio.currentTime + s);
          o.stop(audio.currentTime + s + 0.15);
        });
      }
    } catch (e) {}
    buzz([200, 100, 200]);
  }

  // Scherm aan houden tijdens de training (waar de telefoon dat toestaat)
  async function keepAwake() {
    try { if ("wakeLock" in navigator && !wake && document.visibilityState === "visible") { wake = await navigator.wakeLock.request("screen"); wake.addEventListener("release", () => (wake = null)); } } catch (e) {}
  }

  function showNext(code) {
    clearInterval(tick); tick = null;
    timerEl.classList.remove("running", "finished");
    timerEl.classList.add("next");
    tlabel.textContent = t("nextUp", { code });
    clock.textContent = code;
  }

  function startTimer(s) {
    unlockAudio();
    end = Date.now() + s * 1000;
    timerEl.classList.remove("finished", "next");
    timerEl.classList.add("running");
    tlabel.textContent = t("rest");
    clearInterval(tick);
    tick = setInterval(run, 250);
    run();
    keepAwake();
  }

  function run() {
    const left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
    clock.textContent = fmt(left);
    if (left === 0) stopTimer(true);
  }

  function stopTimer(finished) {
    clearInterval(tick);
    tick = null;
    timerEl.classList.remove("running", "next");
    tlabel.textContent = t("rest");
    if (finished) { timerEl.classList.add("finished"); beep(); showFlash(); }
    else { timerEl.classList.remove("finished"); clock.textContent = "0:00"; hideFlash(); }
  }

  /* ---------- Schermvullende flits als de rust voorbij is ----------
     Knippert 30 sec geel/zwart (max 2× per sec), blijft daarna geel
     tot je ergens tikt. Herhaalt piep + trilling na 10 en 20 sec. */
  const flash = $("flash");
  let flashTimers = [];

  function showFlash() {
    hideFlash();
    $("flashText").textContent = t("flashText");
    flash.hidden = false;
    flash.classList.add("blink");
    flashTimers.push(setTimeout(beep, 10000), setTimeout(beep, 20000));
    flashTimers.push(setTimeout(() => flash.classList.remove("blink"), 30000));
  }

  function hideFlash() {
    flashTimers.forEach(clearTimeout);
    flashTimers = [];
    flash.hidden = true;
    flash.classList.remove("blink");
  }

  flash.addEventListener("click", () => { hideFlash(); timerEl.classList.remove("finished"); });

  timerEl.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.id === "stop") stopTimer(false); else { hideFlash(); startTimer(+b.dataset.s); }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") { if (tick) run(); if (tick || main.querySelector(".done")) keepAwake(); }
  });

  /* ---------- Start ---------- */
  applyStatic();
  readHash();
  showView();

  if ("serviceWorker" in navigator && location.protocol === "https:") {
    window.addEventListener("load", () => { navigator.serviceWorker.register("sw.js").catch(() => {}); });
  }
})();
