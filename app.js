/* =========================================================
   Cas RC Trainingsweek — app-logica
   Schema staat in data.js. Voortgang blijft op dit toestel
   (localStorage) en wordt elke nieuwe week automatisch gewist.
   ========================================================= */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const daysEl = $("days");
  const main = $("main");
  const toast = $("toast");

  const yt = (q) => "https://www.youtube.com/results?search_query=" + encodeURIComponent(q);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const CHECK = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 10.5l4.5 4.5L17 5" fill="none" stroke="#1a1500" stroke-width="3"/></svg>';

  /* ---------- Opslag per ISO-week ---------- */
  function weekId(d = new Date()) {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const n = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - n);
    const y = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return t.getUTCFullYear() + "-w" + Math.ceil(((t - y) / 864e5 + 1) / 7);
  }
  const PREFIX = "casrc-";
  const SKEY = PREFIX + weekId();

  let state = {};
  try {
    state = JSON.parse(localStorage.getItem(SKEY)) || {};
    // oude weken opruimen
    Object.keys(localStorage).forEach((k) => { if (k.startsWith(PREFIX) && k !== SKEY) localStorage.removeItem(k); });
  } catch (e) { state = {}; }

  let warned = false;
  function save() {
    try { localStorage.setItem(SKEY, JSON.stringify(state)); }
    catch (e) {
      if (!warned) { showToast("Opslaan lukt niet in deze browser (privémodus?). Je vinkjes verdwijnen na herladen."); warned = true; }
    }
  }

  let toastT;
  function showToast(msg) {
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(toastT);
    toastT = setTimeout(() => (toast.hidden = true), 4500);
  }

  /* ---------- Dag kiezen ---------- */
  const todayIdx = (new Date().getDay() + 6) % 7; // maandag = 0
  let sel = todayIdx;
  const fromHash = WEEK.findIndex((d) => d.key === location.hash.slice(1));
  if (fromHash >= 0) sel = fromHash;

  function renderDays() {
    daysEl.innerHTML = WEEK.map((d, i) => {
      const cls = ["day"];
      if (d.rest && !d.active) cls.push("rest");
      if (i === todayIdx) cls.push("today");
      return `<button type="button" role="tab" class="${cls.join(" ")}" aria-selected="${i === sel}" aria-label="${d.long}: ${d.title}" data-i="${i}"><b>${d.short}</b><span>${d.tag}</span></button>`;
    }).join("");
  }

  daysEl.addEventListener("click", (e) => {
    const b = e.target.closest(".day");
    if (!b) return;
    sel = +b.dataset.i;
    try { history.replaceState(null, "", "#" + WEEK[sel].key); } catch (err) {}
    renderDays();
    renderDay();
    window.scrollTo({ top: 0 });
  });

  window.addEventListener("hashchange", () => {
    const i = WEEK.findIndex((d) => d.key === location.hash.slice(1));
    if (i >= 0 && i !== sel) { sel = i; renderDays(); renderDay(); }
  });

  /* ---------- Dag tekenen ---------- */
  const footer = () =>
    `<footer>Schema TeamBuildr · ${SCHEMA_WEEK}<br>Vinkjes en kg staan alleen op dit toestel en worden elke maandag gewist.</footer>`;

  function renderDay() {
    const d = WEEK[sel];
    let h = `<div class="dayhead"><div class="kicker">${d.long}${sel === todayIdx ? " · vandaag" : ""}</div><h2>${esc(d.title)}</h2>`;

    if (d.rest) {
      h += `</div><div class="restcard"><p>${esc(d.text)}</p><ul>${d.tips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>`;
      main.innerHTML = h + footer();
      return;
    }

    h += `<div class="progress"><div class="bar"><i id="pbar"></i></div><span id="ptext"></span></div></div>`;

    d.blocks.forEach((b, bi) => {
      h += `<section class="section"><div class="sechead"><div class="letter" aria-hidden="true">${b.letter}</div><div class="secname"><strong>${esc(b.name)}</strong><small>${esc(b.sub)}</small></div></div>`;

      if (b.type === "list") {
        if (b.intro) h += `<p class="intro">${esc(b.intro)}</p>`;
        h += `<div class="list">` + b.items.map((it, ii) => {
          const id = `${d.key}-${bi}-${ii}`;
          const on = !!state[id];
          return `<div class="item${on ? " done" : ""}" data-id="${id}">
            <button type="button" class="tick" aria-pressed="${on}" aria-label="${esc(it[0])} afvinken">${CHECK}</button>
            <div class="it-name">${esc(it[0])}${it[1] ? `<span class="it-dose">${esc(it[1])}</span>` : ""}</div>
            <a class="how" href="${yt(it[2])}" target="_blank" rel="noopener">Uitleg</a>
          </div>`;
        }).join("") + `</div>`;
      } else {
        b.ex.forEach((ex, ei) => {
          h += `<div class="ex"><div class="extop"><div class="exname"><h3>${esc(ex[0])}</h3>${ex[2] ? `<p class="note">${esc(ex[2])}</p>` : ""}</div><a class="how" href="${yt(ex[3])}" target="_blank" rel="noopener">Uitleg</a></div><div class="sets">`;
          ex[1].forEach((r, si) => {
            const id = `${d.key}-${bi}-${ei}-${si}`;
            const on = !!state[id];
            const kg = state[id + "-kg"] || "";
            h += `<div class="set${on ? " done" : ""}" data-id="${id}">
              <button type="button" aria-pressed="${on}" aria-label="Set ${si + 1} van ${esc(ex[0])}: ${r}"><span class="sl">Set ${si + 1}</span><span class="rp">${r}</span></button>
              <input id="kg-${id}" type="text" inputmode="decimal" enterkeyhint="done" autocomplete="off" placeholder="kg" value="${esc(kg)}" aria-label="Gewicht set ${si + 1} ${esc(ex[0])}">
            </div>`;
          });
          h += `</div></div>`;
        });
      }
      h += `</section>`;
    });

    h += `<button type="button" class="reset" id="reset">Wis vinkjes van ${d.long.toLowerCase()}</button>`;
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
  main.addEventListener("click", (e) => {
    const btn = e.target.closest(".set button, .tick");
    if (btn) {
      unlockAudio();
      const box = btn.closest("[data-id]");
      const id = box.dataset.id;
      if (state[id]) delete state[id]; else state[id] = 1;
      save();
      const on = !!state[id];
      box.classList.toggle("done", on);
      btn.setAttribute("aria-pressed", on);
      updateProgress();
      if (on && box.classList.contains("set")) startTimer(90);
      return;
    }

    const r = e.target.closest("#reset");
    if (r) {
      const label = "Wis vinkjes van " + WEEK[sel].long.toLowerCase();
      if (!r.classList.contains("arm")) {
        r.classList.add("arm");
        r.textContent = "Tik nog een keer om te wissen";
        setTimeout(() => { if (r.isConnected) { r.classList.remove("arm"); r.textContent = label; } }, 3000);
        return;
      }
      const k = WEEK[sel].key + "-";
      Object.keys(state).forEach((x) => { if (x.startsWith(k)) delete state[x]; });
      save();
      renderDay();
      showToast(WEEK[sel].long + " is gewist.");
    }
  });

  main.addEventListener("input", (e) => {
    if (!e.target.matches(".set input")) return;
    const id = e.target.closest("[data-id]").dataset.id;
    const v = e.target.value.trim().slice(0, 12);
    if (v) state[id + "-kg"] = v; else delete state[id + "-kg"];
    save();
  });

  // Enter / "gereed" op het toetsenbord sluit het toetsenbord
  main.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.matches(".set input")) e.target.blur();
  });

  /* ---------- Rusttimer ---------- */
  const timerEl = $("timer");
  const clock = $("clock");
  let end = 0, tick = null, wake = null, audio = null;

  const fmt = (s) => Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");

  // iOS laat geluid alleen toe na een tik: audio wordt bij de eerste tik "ontgrendeld"
  function unlockAudio() {
    try {
      if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === "suspended") audio.resume();
    } catch (e) {}
  }

  function beep() {
    try {
      if (audio) {
        [0, 0.25, 0.5].forEach((t) => {
          const o = audio.createOscillator();
          const g = audio.createGain();
          o.frequency.value = 880;
          g.gain.value = 0.25;
          o.connect(g).connect(audio.destination);
          o.start(audio.currentTime + t);
          o.stop(audio.currentTime + t + 0.15);
        });
      }
    } catch (e) {}
    try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch (e) {}
  }

  async function keepAwake() {
    try { if ("wakeLock" in navigator && !wake) { wake = await navigator.wakeLock.request("screen"); wake.addEventListener("release", () => (wake = null)); } } catch (e) {}
  }

  function startTimer(s) {
    unlockAudio();
    end = Date.now() + s * 1000;
    timerEl.classList.add("running");
    timerEl.classList.remove("finished");
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
    timerEl.classList.remove("running");
    if (finished) { timerEl.classList.add("finished"); beep(); }
    else { timerEl.classList.remove("finished"); clock.textContent = "0:00"; }
  }

  timerEl.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.id === "stop") stopTimer(false); else startTimer(+b.dataset.s);
  });

  // Terug in de app: timer bijwerken en scherm weer wakker houden
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && tick) { run(); keepAwake(); }
  });

  /* ---------- Start ---------- */
  renderDays();
  renderDay();

  /* ---------- Offline (service worker) ---------- */
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }
})();
