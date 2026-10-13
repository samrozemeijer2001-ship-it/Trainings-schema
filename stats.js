/* =========================================================
   Stats: progressie uit je eigen log (store.js)
   - Krachtindex: geschatte 1RM per oefening t.o.v. je eerste keer (100 = start)
   - Volume per week (kg × reps)
   - Per spiergroep: krachtgroei en sets deze week vs vorige week
   - Aanwezigheid: laatste 8 weken
   - Per oefening: verloop, PR, sessies
   Grafieken zijn eigen SVG, zodat alles offline werkt.
   ========================================================= */
const Stats = (function () {
  "use strict";

  const S = Store;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt1 = (n) => S.fmtKg(n);
  const pct = (n) => (n > 0 ? "+" : n < 0 ? "−" : "") + Math.abs(Math.round(n)) + "%";
  const NS = "http://www.w3.org/2000/svg";
  const WEEKS = 8;

  let demo = null;       // voorbeelddata (alleen in geheugen)
  let selEx = null;      // gekozen oefening
  let root = null;
  let charts = [];       // [{el, draw}] voor opnieuw tekenen bij draaien scherm

  /* =======================================================
     Rekenwerk
     ======================================================= */
  function build(log) {
    const today = S.ymd(new Date());
    const thisMon = S.mondayOf(new Date());
    const weeks = [];
    for (let i = WEEKS - 1; i >= 0; i--) weeks.push(S.ymd(S.addDays(thisMon, -7 * i)));
    const weekOf = (d) => S.ymd(S.mondayOf(S.parseYmd(d)));
    const weekEnd = (w) => S.ymd(S.addDays(S.parseYmd(w), 6));

    // sessies per oefening
    const sessions = {};
    Object.keys(log).forEach((id) => {
      const cat = S.catalog[id];
      const list = Object.keys(log[id]).sort().map((date) => {
        const e = log[id][date];
        let top = 0, str = 0, vol = 0, sets = 0;
        const n = Math.max(e.kg.length, e.done.length);
        for (let i = 0; i < n; i++) {
          const kg = e.kg[i];
          const reps = e.reps[i] != null ? e.reps[i] : cat ? cat.reps[i] : null;
          if (e.done[i] || kg != null) sets++;
          if (kg > 0) {
            top = Math.max(top, kg);
            str = Math.max(str, S.strength(kg, reps));
            if (S.numReps(reps)) vol += kg * reps;
          }
        }
        return { date, kg: e.kg, top, str, vol, sets };
      });
      sessions[id] = list;
    });

    const lifted = (id) => sessions[id].filter((s) => s.str > 0);

    // krachtindex per week
    function indexAt(end, ids) {
      const r = [];
      ids.forEach((id) => {
        const l = lifted(id);
        if (!l.length || l[0].date > end) return;
        const best = Math.max(...l.filter((s) => s.date <= end).map((s) => s.str));
        r.push(best / l[0].str);
      });
      return r.length ? (r.reduce((a, b) => a + b, 0) / r.length) * 100 : null;
    }
    const allIds = Object.keys(sessions);
    const strengthWeeks = weeks.map((w) => ({ w, v: indexAt(weekEnd(w), allIds) }));

    // volume / trainingen per week
    const volWeeks = weeks.map((w) => {
      let v = 0; const dates = new Set();
      allIds.forEach((id) => sessions[id].forEach((s) => { if (weekOf(s.date) === w) { v += s.vol; if (s.sets) dates.add(s.date); } }));
      return { w, v, trainings: dates.size };
    });

    // PR's laatste 30 dagen
    const since = S.ymd(S.addDays(new Date(), -30));
    let prs = 0;
    allIds.forEach((id) => {
      let max = 0;
      lifted(id).forEach((s) => { if (max > 0 && s.top > max && s.date >= since) prs++; max = Math.max(max, s.top); });
    });

    // spiergroepen
    const curW = weeks[weeks.length - 1], prevW = weeks[weeks.length - 2];
    const groups = Object.keys(GROUPS).map((g) => {
      const ids = allIds.filter((id) => S.catalog[id] && S.catalog[id].groups.includes(g));
      const main = allIds.filter((id) => S.catalog[id] && S.catalog[id].groups[0] === g);
      const gains = ids.map((id) => lifted(id)).filter((l) => l.length >= 2).map((l) => (Math.max(...l.map((s) => s.str)) / l[0].str - 1) * 100);
      const setsIn = (w) => main.reduce((n, id) => n + sessions[id].filter((s) => weekOf(s.date) === w).reduce((m, s) => m + s.sets, 0), 0);
      return { g, name: L(GROUPS[g]), gain: gains.length ? gains.reduce((a, b) => a + b, 0) / gains.length : null, n: gains.length, cur: setsIn(curW), prev: setsIn(prevW) };
    });

    // aanwezigheid
    const activity = {};
    allIds.forEach((id) => Object.keys(log[id]).forEach((d) => {
      const e = log[id][d];
      const n = Math.max(e.kg.length, e.done.length);
      let c = 0;
      for (let i = 0; i < n; i++) if (e.done[i] || e.kg[i] != null) c++;
      activity[d] = (activity[d] || 0) + c;
    }));

    const cur = strengthWeeks[strengthWeeks.length - 1].v;
    const vNow = volWeeks[volWeeks.length - 1];
    // vorige week tot en met dezelfde weekdag, zodat midden in de week eerlijk wordt vergeleken
    const sameDayLastWeek = S.ymd(S.addDays(new Date(), -7));
    let pv = 0;
    allIds.forEach((id) => sessions[id].forEach((s) => { if (weekOf(s.date) === prevW && s.date <= sameDayLastWeek) pv += s.vol; }));
    const vPrev = { v: pv };

    return { today, weeks, sessions, strengthWeeks, volWeeks, prs, groups, activity, curIndex: cur, vNow, vPrev, hasData: allIds.some((id) => sessions[id].some((s) => s.sets)) };
  }

  /* =======================================================
     Grafieken (SVG)
     ======================================================= */
  function niceTicks(min, max, count) {
    if (min === max) { min -= 1; max += 1; }
    const span = max - min;
    const step0 = span / count;
    const mag = Math.pow(10, Math.floor(Math.log10(step0)));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= step0) || 10 * mag;
    const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
    const t = [];
    for (let v = lo; v <= hi + step / 2; v += step) t.push(Math.round(v * 100) / 100);
    return t;
  }

  const el = (tag, attrs, parent) => {
    const n = document.createElementNS(NS, tag);
    Object.keys(attrs).forEach((k) => n.setAttribute(k, attrs[k]));
    if (parent) parent.appendChild(n);
    return n;
  };

  /**
   * Lijngrafiek. pts: [{label, v, tip}] (v mag null zijn)
   * opts: {ref: getal voor stippellijn, refLabel, yFmt}
   */
  function lineChart(box, pts, opts) {
    const readout = box.querySelector(".readout");
    const holder = box.querySelector(".plot");
    function draw() {
      holder.innerHTML = "";
      const W = Math.max(260, holder.clientWidth), H = 190;
      const P = { l: 40, r: 14, t: 14, b: 28 };
      const vals = pts.map((p) => p.v).filter((v) => v != null);
      if (!vals.length) { holder.innerHTML = `<p class="nodata">${t("noData")}</p>`; readout.textContent = ""; return; }
      let lo = Math.min(...vals), hi = Math.max(...vals);
      if (opts.ref != null) { lo = Math.min(lo, opts.ref); hi = Math.max(hi, opts.ref); }
      const pad = (hi - lo) * 0.12 || Math.max(1, hi * 0.05);
      const ticks = niceTicks(lo - pad, hi + pad, 4);
      const y0 = ticks[0], y1 = ticks[ticks.length - 1];
      const pw = W - P.l - P.r, ph = H - P.t - P.b;
      const step = pts.length > 1 ? pw / (pts.length - 1) : 0;
      const X = (i) => P.l + (pts.length > 1 ? i * step : pw / 2);
      const Y = (v) => P.t + ph - ((v - y0) / (y1 - y0)) * ph;

      const svg = el("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": opts.label || "" }, holder);
      ticks.forEach((t) => {
        el("line", { x1: P.l, x2: W - P.r, y1: Y(t), y2: Y(t), class: "grid" }, svg);
        el("text", { x: P.l - 6, y: Y(t) + 3.5, class: "ax", "text-anchor": "end" }, svg).textContent = (opts.yFmt || fmt1)(t);
      });
      if (opts.ref != null) {
        el("line", { x1: P.l, x2: W - P.r, y1: Y(opts.ref), y2: Y(opts.ref), class: "ref" }, svg);
        if (opts.refLabel) el("text", { x: W - P.r, y: Y(opts.ref) - 5, class: "ax", "text-anchor": "end" }, svg).textContent = opts.refLabel;
      }
      const every = Math.max(1, Math.ceil(pts.length / Math.floor(pw / 38)));
      pts.forEach((p, i) => {
        if ((pts.length - 1 - i) % every === 0) {
          const anchor = pts.length > 1 && i === pts.length - 1 ? "end" : pts.length > 1 && i === 0 ? "start" : "middle";
          el("text", { x: X(i) + (anchor === "end" ? 4 : anchor === "start" ? -4 : 0), y: H - 8, class: "ax", "text-anchor": anchor }, svg).textContent = p.label;
        }
      });

      // lijn + vlak (onderbroken bij ontbrekende waarden)
      let d = "", area = "", seg = [];
      const flush = () => {
        if (seg.length) {
          d += "M" + seg.map((s) => s.join(",")).join("L");
          area += `M${seg[0][0]},${P.t + ph}L` + seg.map((s) => s.join(",")).join("L") + `L${seg[seg.length - 1][0]},${P.t + ph}Z`;
        }
        seg = [];
      };
      pts.forEach((p, i) => { if (p.v == null) flush(); else seg.push([X(i).toFixed(1), Y(p.v).toFixed(1)]); });
      flush();
      el("path", { d: area, class: "area" }, svg);
      el("path", { d, class: "line" }, svg);

      const last = pts.map((p) => p.v).lastIndexOf(vals[vals.length - 1]);
      pts.forEach((p, i) => { if (p.v != null) el("circle", { cx: X(i), cy: Y(p.v), r: i === last ? 5 : 3.5, class: i === last ? "dot end" : "dot" }, svg); });

      // hover / tik
      const cross = el("line", { y1: P.t, y2: P.t + ph, class: "cross", visibility: "hidden" }, svg);
      const hi2 = el("circle", { r: 6, class: "dot hl", visibility: "hidden" }, svg);
      const hit = el("rect", { x: P.l - 10, y: 0, width: pw + 20, height: H, class: "hit" }, svg);
      const show = (i) => {
        const p = pts[i];
        if (!p) return;
        cross.setAttribute("x1", X(i)); cross.setAttribute("x2", X(i)); cross.setAttribute("visibility", "visible");
        if (p.v != null) { hi2.setAttribute("cx", X(i)); hi2.setAttribute("cy", Y(p.v)); hi2.setAttribute("visibility", "visible"); }
        else hi2.setAttribute("visibility", "hidden");
        readout.innerHTML = p.tip;
      };
      const at = (ev) => {
        const r = svg.getBoundingClientRect();
        const x = ev.clientX - r.left;
        return Math.max(0, Math.min(pts.length - 1, Math.round(pts.length > 1 ? (x - P.l) / step : 0)));
      };
      hit.addEventListener("pointerdown", (ev) => show(at(ev)));
      hit.addEventListener("pointermove", (ev) => show(at(ev)));
      readout.innerHTML = pts[last].tip;
    }
    charts.push({ draw });
    draw();
  }

  /** Staafgrafiek. items: [{label, v, tip}] */
  function barChart(box, items, opts) {
    const readout = box.querySelector(".readout");
    const holder = box.querySelector(".plot");
    function draw() {
      holder.innerHTML = "";
      const W = Math.max(260, holder.clientWidth), H = 180;
      const P = { l: 40, r: 8, t: 12, b: 28 };
      const max = Math.max(...items.map((i) => i.v), 0);
      const ticks = niceTicks(0, max || 1, 4);
      const top = ticks[ticks.length - 1];
      const pw = W - P.l - P.r, ph = H - P.t - P.b;
      const slot = pw / items.length;
      const bw = Math.min(36, slot - 6);
      const Y = (v) => P.t + ph - (v / top) * ph;
      const svg = el("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": opts.label || "" }, holder);
      ticks.forEach((t) => {
        el("line", { x1: P.l, x2: W - P.r, y1: Y(t), y2: Y(t), class: t === 0 ? "base" : "grid" }, svg);
        el("text", { x: P.l - 6, y: Y(t) + 3.5, class: "ax", "text-anchor": "end" }, svg).textContent = (opts.yFmt || fmt1)(t);
      });
      const bars = items.map((it, i) => {
        const x = P.l + slot * i + (slot - bw) / 2;
        const h = Math.max(0, (it.v / top) * ph);
        const r = Math.min(4, h);
        const y = P.t + ph - h;
        // afgeronde bovenkant, vlak op de basislijn
        const b = el("path", { d: h > 0 ? `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + bw - r}Q${x + bw},${y} ${x + bw},${y + r}V${y + h}Z` : "", class: "barf" }, svg);
        el("text", { x: x + bw / 2, y: H - 8, class: "ax", "text-anchor": "middle" }, svg).textContent = it.label;
        return b;
      });
      const hit = el("rect", { x: P.l, y: 0, width: pw, height: H, class: "hit" }, svg);
      const show = (i) => { bars.forEach((b, j) => b.classList.toggle("dim", j !== i)); readout.innerHTML = items[i].tip; };
      const at = (ev) => { const r = svg.getBoundingClientRect(); return Math.max(0, Math.min(items.length - 1, Math.floor((ev.clientX - r.left - P.l) / slot))); };
      hit.addEventListener("pointerdown", (ev) => show(at(ev)));
      hit.addEventListener("pointermove", (ev) => show(at(ev)));
      readout.innerHTML = items[items.length - 1].tip;
    }
    charts.push({ draw });
    draw();
  }

  const chartBox = (id, title, sub) => `<section class="st" id="${id}">
      <div class="st-head"><h3>${title}</h3>${sub ? `<p>${sub}</p>` : ""}</div>
      <p class="readout" aria-live="polite"></p>
      <div class="plot"></div>
    </section>`;

  const wLabel = (w) => "W" + S.isoWeek(S.parseYmd(w));
  const dLabel = (d) => S.parseYmd(d).toLocaleDateString(I18N.locale, { day: "numeric", month: "short" });

  /* =======================================================
     Pagina
     ======================================================= */
  function render(container) {
    root = container;
    charts = [];
    const log = demo || S.log;
    const D = build(log);

    if (!D.hasData) {
      container.innerHTML = `
        <div class="empty">
          <h2>${t("emptyTitle")}</h2>
          <p>${t("emptyText")}</p>
          <button type="button" class="btn-main" data-act="demo">${t("demoBtn")}</button>
        </div>
        ${dataTools()}`;
      return;
    }

    const exIds = Object.keys(S.catalog).filter((id) => S.catalog[id].logged && D.sessions[id] && D.sessions[id].some((s) => s.top > 0));
    if (!selEx || !exIds.includes(selEx)) selEx = exIds.slice().sort((a, b) => D.sessions[b].length - D.sessions[a].length)[0] || null;

    const idx = D.curIndex;
    const volDiff = D.vPrev.v > 0 ? ((D.vNow.v - D.vPrev.v) / D.vPrev.v) * 100 : null;
    const mon = S.mondayOf(new Date());
    const planned = [0, 1, 2, 3, 4, 5, 6].filter((i) => S.plannedFor(S.ymd(S.addDays(mon, i))) > 0).length;

    let h = "";
    if (demo) h += `<div class="demo-bar"><p>${t("demoBar")}</p><button type="button" data-act="mine">${t("backMine")}</button></div>`;

    h += `<div class="dayhead"><div class="kicker">${t("lastWeeks", { n: WEEKS })}</div><h2>${t("progress")}</h2></div>
      <div class="tiles">
        <div class="tile"><span class="t-lab">${t("strength")}</span><b class="t-num">${idx != null ? pct(idx - 100) : "–"}</b><span class="t-sub">${t("sinceStart")}</span></div>
        <div class="tile"><span class="t-lab">${t("volume")}</span><b class="t-num">${fmt1(D.vNow.v / 1000)}<small> t</small></b><span class="t-sub">${volDiff != null ? t("vsSamePoint", { p: pct(volDiff) }) : t("thisWeek")}</span></div>
        <div class="tile"><span class="t-lab">${t("sessions")}</span><b class="t-num">${D.vNow.trainings}<small>/${planned}</small></b><span class="t-sub">${t("thisWeek")}</span></div>
        <div class="tile"><span class="t-lab">${t("prs")}</span><b class="t-num">${D.prs}</b><span class="t-sub">${t("last30")}</span></div>
      </div>`;

    h += chartBox("c-strength", t("overall"), t("overallSub"));
    h += chartBox("c-volume", t("volTitle"), t("volSub"));

    // spiergroepen
    const gg = D.groups.filter((g) => g.gain != null);
    const gmax = Math.max(5, ...gg.map((g) => Math.abs(g.gain)));
    const smax = Math.max(1, ...D.groups.map((g) => Math.max(g.cur, g.prev)));
    h += `<section class="st"><div class="st-head"><h3>${t("perGroup")}</h3><p>${t("groupSub")}</p></div>
      <div class="hbars">${gg.length ? gg.sort((a, b) => b.gain - a.gain).map((g) => `
        <div class="hb"><span class="hb-name">${esc(g.name)}</span><span class="hb-track"><i class="${g.gain < 0 ? "neg" : ""}" style="width:${(Math.abs(g.gain) / gmax) * 100}%"></i></span><span class="hb-val">${pct(g.gain)}</span></div>`).join("")
        : `<p class="nodata">${t("groupEmpty")}</p>`}</div>
      <div class="st-head sub"><h4>${t("setsThisWeek")}</h4><p><span class="key cur"></span>${t("thisWeek")} <span class="key prev"></span>${t("lastWeek")}</p></div>
      <div class="hbars">${D.groups.filter((g) => g.cur || g.prev).map((g) => `
        <div class="hb"><span class="hb-name">${esc(g.name)}</span><span class="hb-track"><i style="width:${(g.cur / smax) * 100}%"></i><em style="left:${(g.prev / smax) * 100}%"></em></span><span class="hb-val">${g.cur}<small> / ${g.prev}</small></span></div>`).join("") || `<p class="nodata">${t("noSets")}</p>`}</div>
    </section>`;

    // aanwezigheid
    const dnames = WEEK.map((d) => L(d.short));
    h += `<section class="st"><div class="st-head"><h3>${t("attendance")}</h3><p>${t("attSub")}</p></div>
      <div class="heat" role="table" aria-label="${t("attendance")}">
        <span class="hh" role="columnheader"></span>${dnames.map((n) => `<span class="hh" role="columnheader">${esc(n)}</span>`).join("")}
        ${D.weeks.map((w) => {
          return `<span class="hw" role="rowheader">${wLabel(w)}</span>` + dnames.map((n, i) => {
            const d = S.ymd(S.addDays(S.parseYmd(w), i));
            const a = D.activity[d] || 0;
            const plan = S.plannedFor(d);
            const ratio = a ? (plan ? Math.min(1, a / plan) : 1) : 0;
            const lvl = ratio === 0 ? 0 : ratio < 0.34 ? 1 : ratio < 0.67 ? 2 : ratio < 0.95 ? 3 : 4;
            const future = d > D.today;
            return `<span class="hc l${lvl}${future ? " fut" : ""}${d === D.today ? " now" : ""}" role="cell" title="${esc(t("attCell", { d: dLabel(d), n: a }))}"></span>`;
          }).join("");
        }).join("")}
      </div>
      <p class="legend-heat"><span class="hc l0"></span>${t("none")} <span class="hc l2"></span>${t("partly")} <span class="hc l4"></span>${t("all")}</p>
    </section>`;

    // per oefening
    if (selEx) {
      const opts = WEEK.filter((d) => d.blocks).map((d) => {
        const ids = [...new Set(exIds.filter((id) => S.catalog[id].days[0] === WEEK.indexOf(d)))];
        return ids.length ? `<optgroup label="${esc(L(d.title))}">${ids.map((id) => `<option value="${id}"${id === selEx ? " selected" : ""}>${esc(S.catalog[id].name)}</option>`).join("")}</optgroup>` : "";
      }).join("");
      const ses = D.sessions[selEx].filter((s) => s.top > 0);
      const cat = S.catalog[selEx];
      const timed = !cat.reps.some((r) => S.numReps(r));
      const first = ses[0], last = ses[ses.length - 1];
      const best = Math.max(...ses.map((s) => s.top));
      const bestStr = Math.max(...ses.map((s) => s.str));
      h += `<section class="st"><div class="st-head"><h3>${t("perEx")}</h3></div>
        <label class="pick" for="ex-pick"><span>${t("exercise")}</span>
          <select id="ex-pick">${opts}</select>
        </label>
        <div class="tiles three">
          <div class="tile"><span class="t-lab">${t("heaviest")}</span><b class="t-num">${fmt1(best)}<small> kg</small></b></div>
          <div class="tile"><span class="t-lab">${timed ? t("latest") : t("e1rm")}</span><b class="t-num">${fmt1(timed ? last.top : bestStr)}<small> kg</small></b></div>
          <div class="tile"><span class="t-lab">${t("sinceStart")}</span><b class="t-num">${ses.length > 1 ? pct((last.str / first.str - 1) * 100) : "–"}</b></div>
        </div>
        <div id="c-ex"><p class="readout" aria-live="polite"></p><div class="plot"></div></div>
        <div class="tbl-wrap"><table class="tbl">
          <thead><tr><th>${t("date")}</th><th>${t("setsKg")}</th><th class="num">${timed ? t("top") : t("oneRm")}</th></tr></thead>
          <tbody>${ses.slice(-8).reverse().map((s) => `<tr><td>${dLabel(s.date)}</td><td>${s.kg.filter((v) => v != null).map(fmt1).join(" · ")}</td><td class="num">${fmt1(timed ? s.top : s.str)}${s.top === best ? ' <i class="pr">PR</i>' : ""}</td></tr>`).join("")}</tbody>
        </table></div>
      </section>`;
    }

    h += dataTools();
    container.innerHTML = h;

    // grafieken tekenen
    lineChart(container.querySelector("#c-strength"),
      D.strengthWeeks.map((p) => ({ label: wLabel(p.w), v: p.v, tip: p.v != null ? `<b>${wLabel(p.w)}</b> ${t("index")} ${fmt1(p.v)} <span>(${pct(p.v - 100)})</span>` : `<b>${wLabel(p.w)}</b> ${t("noDataWeek")}` })),
      { ref: 100, refLabel: t("start"), yFmt: (v) => Math.round(v), label: t("chartStrength") });

    barChart(container.querySelector("#c-volume"),
      D.volWeeks.map((p) => ({ label: wLabel(p.w), v: p.v / 1000, tip: `<b>${wLabel(p.w)}</b> ${fmt1(p.v / 1000)} t · ${p.trainings} ${p.trainings === 1 ? t("session1") : t("sessionN")}` })),
      { yFmt: (v) => fmt1(v), label: t("chartVolume") });

    if (selEx) {
      const ses = D.sessions[selEx].filter((s) => s.top > 0);
      const timed = !S.catalog[selEx].reps.some((r) => S.numReps(r));
      lineChart(container.querySelector("#c-ex"),
        ses.map((s) => ({ label: dLabel(s.date).replace(".", ""), v: timed ? s.top : s.str, tip: `<b>${dLabel(s.date)}</b> ${timed ? t("top") : t("oneRm")} ${fmt1(timed ? s.top : s.str)} kg <span>· ${t("set").toLowerCase()}s ${s.kg.filter((v) => v != null).map(fmt1).join(" · ")}</span>` })),
        { yFmt: (v) => fmt1(v), label: S.catalog[selEx].name });
    }
  }

  function dataTools() {
    const share = typeof Sync !== "undefined" && Sync.enabled ? `<div class="st-head sub"><h4>${t("syncTitle")}</h4></div><div id="sync-box">${Sync.statusHtml()}</div>` : "";
    return `<section class="st tools">${share}<div class="st-head${share ? " sub" : ""}"><h3>${t("dataTitle")}</h3><p>${t("dataSub")}</p></div>
      <div class="tool-row">
        <button type="button" data-act="export">${t("exportBtn")}</button>
        <label class="filebtn" for="import-file">${t("importBtn")}</label>
        <input type="file" id="import-file" accept="application/json,.json" hidden>
      </div>
    </section>`;
  }

  /* =======================================================
     Voorbeelddata (alleen in geheugen, wordt nooit opgeslagen)
     ======================================================= */
  function makeDemo() {
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const base = {
      "squat-variation": 80, "rdl-romanian-deadlift": 70, "cossack-squat": 12, "single-leg-calf-raises": 20,
      "barbell-bench-press": 70, "z-press": 35, "chest-supported-row": 22, "ng-pull-up": 5,
      "quarter-split-squat": 60, "landmine-throw": 15, "landmine-sunrises": 15, "single-leg-glute-bridge": 20,
      "db-bb-bicep-curl": 14, "bar-rope-tricep-pushdown": 25, "hammer-curl": 14, "skull-crushers": 25
    };
    const r25 = (v) => Math.round(v / 2.5) * 2.5;
    const log = {};
    const mon = S.mondayOf(new Date());
    const today = S.ymd(new Date());
    for (let w = WEEKS - 1; w >= 0; w--) {
      const wi = WEEKS - 1 - w;
      WEEK.forEach((d, di) => {
        if (!d.blocks) return;
        const date = S.ymd(S.addDays(mon, -7 * w + di));
        if (date > today || rnd() < 0.08) return;
        d.blocks.forEach((b) => {
          const rows = b.type === "sets" ? b.ex : b.items;
          rows.forEach((row) => {
            const id = S.idFor(b, row);
            const arm = b.name === "Arm Farm";
            if (arm && !["db-bb-bicep-curl", "bar-rope-tricep-pushdown", "hammer-curl", "skull-crushers"].includes(id)) return;
            if (arm && (wi % 2 === 0) !== ["db-bb-bicep-curl", "bar-rope-tricep-pushdown"].includes(id)) return;
            const n = b.type === "sets" ? row[1].length : 1;
            const e = { kg: [], reps: [], done: [] };
            for (let i = 0; i < n; i++) {
              e.done[i] = rnd() < 0.93 ? 1 : 0;
              if (base[id]) {
                const k = r25(base[id] * (1 + 0.016 * wi + (rnd() - 0.5) * 0.04) - (i === n - 1 && rnd() < 0.3 ? 2.5 : 0));
                e.kg[i] = Math.max(2.5, k);
                e.reps[i] = b.type === "sets" ? row[1][i] : null;
              }
            }
            (log[id] = log[id] || {})[date] = e;
          });
        });
      });
    }
    return log;
  }

  /* =======================================================
     Interactie
     ======================================================= */
  document.addEventListener("click", (e) => {
    if (!root || root.hidden) return;
    const b = e.target.closest("[data-act]");
    if (!b || !root.contains(b)) return;
    const act = b.dataset.act;
    if (act === "demo") { demo = makeDemo(); render(root); window.scrollTo({ top: 0 }); }
    if (act === "mine") { demo = null; render(root); window.scrollTo({ top: 0 }); }
    if (act === "export") {
      try {
        const blob = new Blob([S.exportJson()], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "casrc-backup-" + S.ymd(new Date()) + ".json";
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        window.showToast && showToast(t("exported"));
      } catch (err) { window.showToast && showToast(t("exportFail")); }
    }
  });

  document.addEventListener("change", (e) => {
    if (!root) return;
    if (e.target.id === "ex-pick") { selEx = e.target.value; const y = window.scrollY; render(root); window.scrollTo({ top: y }); }
    if (e.target.id === "import-file") {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const rd = new FileReader();
      rd.onload = () => {
        try { const n = S.importJson(rd.result); demo = null; render(root); showToast(t("imported", { n })); }
        catch (err) { showToast(err && err.message === "notBackup" ? t("notBackup") : err && err.message === "saveFail" ? t("saveFail") : t("importFail")); }
      };
      rd.readAsText(f);
    }
  });

  let rt;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => { if (root && !root.hidden) charts.forEach((c) => c.draw()); }, 150);
  });

  return { render };
})();
