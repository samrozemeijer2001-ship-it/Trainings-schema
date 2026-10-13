/* =========================================================
   Cas RC Trainingsweek — Google Sheet koppeling
   Plak dit hele bestand in Extensies > Apps Script.
   Zie STAPPENPLAN.md voor de stappen.

   Tabbladen (worden door setup() aangemaakt):
   - Spelers   : de namen waaruit spelers kiezen. Pas gerust aan.
                 Zet in kolom D "nee" om iemand te verbergen.
                 Kolom E (E-mail) wordt gevuld bij de eerste inlog.
   - Sessies   : elk ingelogd apparaat. Regel verwijderen = afmelden.
   - Log       : één regel per set. Wordt bijgewerkt, niet verdubbeld.
   - Overzicht : per speler: laatste training, aantal trainingen,
                 en wie de app nog niet gebruikt.
   - Progressie: per speler per oefening: eerste en laatste keer,
                 gewichten, geschatte 1RM en groei.
   Overzicht en Progressie worden elk kwartier automatisch opnieuw
   berekend (als er iets nieuws binnen is); niet met de hand aanpassen.
   Direct bijwerken: kies de functie refreshAll en klik Uitvoeren.
   ========================================================= */

/** Wachtwoord van de app. Spelers vullen dit één keer in. */
const TEAM_CODE = "VERANDER-MIJ";

/** Aparte code voor de coach-/stafpagina (alleen voor staf!).
    Zolang deze met "VERANDER" begint, staat het ophalen van alle data uit. */
const STAFF_CODE = "VERANDER-MIJ-STAF";

const LOG_HEADERS = ["Sleutel", "Bijgewerkt", "Speler ID", "Speler", "Toestel", "Datum", "Training", "Oefening ID", "Oefening", "Set", "Reps", "Kg", "Afgevinkt"];
const PLAYER_HEADERS = ["ID", "Naam", "Categorie", "Actief", "E-mail"];
const OVERVIEW_HEADERS = ["Speler", "Categorie", "Laatste training", "Trainingen totaal", "Laatste 7 dagen", "Laatste 28 dagen", "Sets gelogd", "Status"];
const PROGRESS_HEADERS = ["Speler ID", "Speler", "Oefening ID", "Oefening", "Sessies",
  "Eerste datum", "Eerste top kg", "Eerste 1RM",
  "Laatste datum", "Laatste top kg", "Laatste sets kg", "Laatste 1RM",
  "Beste kg", "Beste datum", "Beste 1RM", "Groei 1RM %", "Verschil vorige keer kg"];

/* ---------------- Eenmalig: tabbladen aanmaken ---------------- */
function setup() {
  const ss = SpreadsheetApp.getActive();
  const sp = sheet_(ss, "Spelers", PLAYER_HEADERS);
  if (sp.getLastRow() < 2) {
    const rows = START_SPELERS.map((p) => [p[0], p[1], p[2], "ja"]);
    sp.getRange(2, 1, rows.length, 4).setValues(rows);
  }
  // kolom E = e-mail (oudere versies gebruikten hem voor een toestelcode: die worden gewist)
  const e1 = sp.getRange(1, 5).getValues()[0][0];
  if (e1 !== "E-mail") {
    if (e1 === "Toestel" && sp.getLastRow() > 1) sp.getRange(2, 5, sp.getLastRow() - 1, 1).clearContent();
    sp.getRange(1, 5).setValues([["E-mail"]]).setFontWeight("bold");
  }
  sheet_(ss, "Sessies", SESSION_HEADERS);
  sheet_(ss, "Log", LOG_HEADERS);
  sheet_(ss, "Overzicht", OVERVIEW_HEADERS);
  sheet_(ss, "Progressie", PROGRESS_HEADERS);
  installTrigger_();
  refreshAll_();
}

/** elk kwartier Overzicht + Progressie bijwerken (maar één keer aanmaken) */
function installTrigger_() {
  const has = ScriptApp.getProjectTriggers().some((t) => t.getHandlerFunction() === "refreshIfChanged");
  if (!has) ScriptApp.newTrigger("refreshIfChanged").timeBased().everyMinutes(15).create();
}

/** door de kwartier-trigger aangeroepen: alleen rekenen als er iets nieuws is */
function refreshIfChanged() {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty("dirty") !== "1") return;
  props.setProperty("dirty", "0");
  refreshAll_();
}

function sheet_(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
    sh.setFrozenRows(1);
  }
  return sh;
}

/* ---------------- Lezen: spelerslijst ---------------- */
function doGet(e) {
  const p = (e && e.parameter) || {};
  // coach-/stafpagina: alle data (alleen met de stafcode)
  if (p.action === "data") {
    if (/^VERANDER/.test(STAFF_CODE) || p.staff !== STAFF_CODE) return json_({ ok: false, error: "staff" });
    return json_({ ok: true, players: players_(), overview: table_("Overzicht"), progress: table_("Progressie"), log: table_("Log") });
  }
  if (p.code !== TEAM_CODE) return json_({ ok: false, error: "code" });
  if (p.action === "players") return json_({ ok: true, players: players_() });
  return json_({ ok: true });
}

/** alle sets van één speler, om de app op een nieuwe/gewiste telefoon te herstellen */
function mine_(pid) {
  const sh = SpreadsheetApp.getActive().getSheetByName("Log");
  if (!sh || sh.getLastRow() < 2) return [];
  const tz = Session.getScriptTimeZone();
  return sh.getRange(2, 1, sh.getLastRow() - 1, LOG_HEADERS.length).getValues()
    .filter((r) => String(r[2]) === pid)
    .map((r) => ({
      date: r[5] instanceof Date ? Utilities.formatDate(r[5], tz, "yyyy-MM-dd") : String(r[5]).slice(0, 10),
      exId: String(r[7]), set: Number(r[9]) || 1,
      reps: r[10] === "" ? null : r[10],
      kg: r[11] === "" ? null : Number(r[11]),
      done: r[12] === "ja" ? 1 : 0
    }));
}

/** tabblad als lijst objecten (kolomkop = sleutel); datums als JJJJ-MM-DD */
function table_(name) {
  const sh = SpreadsheetApp.getActive().getSheetByName(name);
  if (!sh || sh.getLastRow() < 2) return [];
  const last = sh.getLastRow();
  const width = sh.getRange(1, 1, 1, 30).getValues()[0].filter((h) => h !== "").length;
  const rows = sh.getRange(1, 1, last, width).getValues();
  const head = rows.shift();
  const tz = Session.getScriptTimeZone();
  return rows.map((r) => {
    const o = {};
    head.forEach((h, i) => { o[h] = r[i] instanceof Date ? Utilities.formatDate(r[i], tz, "yyyy-MM-dd") : r[i]; });
    return o;
  });
}

function players_() {
  const sh = SpreadsheetApp.getActive().getSheetByName("Spelers");
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, 5).getValues()
    .filter((r) => r[0] && r[1] && String(r[3]).trim().toLowerCase() !== "nee")
    .map((r) => ({ id: String(r[0]), name: String(r[1]), group: String(r[2] || "") }));
}

/* ---------------- Inloggen met e-mailcode ----------------
   1. Speler kiest naam → script mailt een code van 6 cijfers.
      De eerste keer vult de speler zijn e-mail in; daarna hoort dat
      adres bij zijn naam (kolom E van Spelers).
   2. Code klopt → het apparaat krijgt een geheime sleutel en blijft
      ingelogd. Elk apparaat staat als regel in het tabblad Sessies.
   3. Insturen en ophalen kan alleen met zo'n sleutel.
   Apparaat afmelden: verwijder de regel in Sessies.
   Ander e-mailadres: pas kolom E in Spelers aan (of maak leeg).   */
const CODE_MINUTES = 10;   // code geldig
const CODE_TRIES = 5;      // pogingen per code
const CODE_WAIT_SEC = 60;  // minimaal tussen twee codes
const SESSION_HEADERS = ["Sleutel (versleuteld)", "Speler ID", "Speler", "E-mail", "Apparaat", "Ingelogd op", "Laatst gebruikt"];

function playerRows_() {
  const sh = SpreadsheetApp.getActive().getSheetByName("Spelers");
  const rows = sh && sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 5).getValues() : [];
  return { sh: sh, rows: rows };
}

function hash_(s) {
  return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(s), Utilities.Charset.UTF_8));
}
const email_ = (e) => String(e || "").trim().toLowerCase();
const validEmail_ = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
function mask_(e) { const p = e.split("@"); return p[0].slice(0, 1) + "•••@" + p[1]; }

function requestCode_(player, email) {
  const P = playerRows_();
  const idx = P.rows.findIndex((r) => String(r[0]) === player.id);
  const bound = idx >= 0 ? email_(P.rows[idx][4]) : "";
  let to = bound;
  if (!to) {
    const e = email_(email);
    if (!e) return { ok: false, error: "needEmail" };
    if (!validEmail_(e)) return { ok: false, error: "badEmail" };
    if (P.rows.some((r, i) => i !== idx && email_(r[4]) === e)) return { ok: false, error: "emailUsed" };
    to = e;
  }
  const props = PropertiesService.getScriptProperties();
  const key = "otp:" + player.id;
  const prev = JSON.parse(props.getProperty(key) || "null");
  const now = Date.now();
  if (prev && prev.email === to && now - prev.sent < CODE_WAIT_SEC * 1000) return { ok: true, masked: mask_(to), isNew: !bound, resent: false };
  const code = String(parseInt(Utilities.getUuid().replace(/-/g, "").slice(0, 12), 16) % 1000000).padStart(6, "0");
  props.setProperty(key, JSON.stringify({ h: hash_(player.id + "|" + code), email: to, exp: now + CODE_MINUTES * 60000, tries: 0, sent: now }));
  const name = idx >= 0 ? String(P.rows[idx][1]) : player.name;
  MailApp.sendEmail({
    to: to, name: "Cas RC Training",
    subject: code + " is je inlogcode voor Cas RC Training",
    body: "Hoi " + name.split(" ")[0] + ",\n\nJe inlogcode is: " + code + "\n\nDeze code is " + CODE_MINUTES + " minuten geldig. Heb je dit niet aangevraagd? Dan kun je deze mail negeren.\n\nCas RC Training",
    htmlBody: '<div style="font-family:Arial,sans-serif;max-width:420px">' +
      '<p>Hoi ' + name.split(" ")[0] + ',</p><p>Je inlogcode voor Cas RC Training:</p>' +
      '<p style="font-size:34px;font-weight:bold;letter-spacing:6px;background:#0d0d0b;color:#f5c518;padding:14px 18px;display:inline-block">' + code + '</p>' +
      '<p style="color:#555">Deze code is ' + CODE_MINUTES + ' minuten geldig. Heb je dit niet aangevraagd? Dan kun je deze mail negeren.</p></div>'
  });
  return { ok: true, masked: mask_(to), isNew: !bound, resent: true };
}

function verify_(player, otp, deviceName) {
  const props = PropertiesService.getScriptProperties();
  const key = "otp:" + player.id;
  const st = JSON.parse(props.getProperty(key) || "null");
  if (!st) return { ok: false, error: "noCode" };
  if (Date.now() > st.exp) { props.deleteProperty(key); return { ok: false, error: "expired" }; }
  if (st.tries >= CODE_TRIES) { props.deleteProperty(key); return { ok: false, error: "tooMany" }; }
  if (hash_(player.id + "|" + String(otp || "").replace(/\D/g, "")) !== st.h) {
    st.tries++;
    if (st.tries >= CODE_TRIES) props.deleteProperty(key); else props.setProperty(key, JSON.stringify(st));
    return { ok: false, error: st.tries >= CODE_TRIES ? "tooMany" : "wrong", left: CODE_TRIES - st.tries };
  }
  props.deleteProperty(key);

  // e-mail aan de naam koppelen (eerste keer) en de officiële naam gebruiken
  const P = playerRows_();
  const sh = P.sh || sheet_(SpreadsheetApp.getActive(), "Spelers", PLAYER_HEADERS);
  const idx = P.rows.findIndex((r) => String(r[0]) === player.id);
  let name = player.name;
  if (idx >= 0) {
    name = String(P.rows[idx][1]);
    if (!email_(P.rows[idx][4])) sh.getRange(idx + 2, 5).setValues([[st.email]]);
  } else {
    sh.getRange(P.rows.length + 2, 1, 1, 5).setValues([[player.id, player.name, "niet in lijst", "ja", st.email]]);
  }

  const token = Utilities.getUuid() + Utilities.getUuid();
  const ses = SpreadsheetApp.getActive().getSheetByName("Sessies") || sheet_(SpreadsheetApp.getActive(), "Sessies", SESSION_HEADERS);
  const now = new Date();
  ses.getRange(ses.getLastRow() + 1, 1, 1, SESSION_HEADERS.length).setValues([[hash_(token), player.id, name, st.email, String(deviceName || "").slice(0, 60), now, now]]);
  return { ok: true, token: token, player: { id: player.id, name: name } };
}

/** sleutel → speler (of null). Werkt "laatst gebruikt" hooguit eens per 6 uur bij. */
function session_(token) {
  if (!token) return null;
  const sh = SpreadsheetApp.getActive().getSheetByName("Sessies");
  if (!sh || sh.getLastRow() < 2) return null;
  const h = hash_(token);
  const rows = sh.getRange(2, 1, sh.getLastRow() - 1, SESSION_HEADERS.length).getValues();
  const i = rows.findIndex((r) => r[0] === h);
  if (i < 0) return null;
  const last = rows[i][6] instanceof Date ? rows[i][6].getTime() : 0;
  if (Date.now() - last > 6 * 3600 * 1000) sh.getRange(i + 2, 7).setValues([[new Date()]]);
  return { id: String(rows[i][1]), name: String(rows[i][2]), row: i + 2, sh: sh };
}

/* ---------------- Schrijven: inloggen + trainingsregels ---------------- */
function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: "json" }); }
  if (!body) return json_({ ok: false, error: "json" });
  const action = String(body.action || "rows");

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    // inloggen: alleen met het teamwachtwoord
    if (action === "requestCode" || action === "verify") {
      if (body.code !== TEAM_CODE) return json_({ ok: false, error: "code" });
      const p = body.player || {};
      if (!p.id || !p.name) return json_({ ok: false, error: "data" });
      const player = { id: String(p.id), name: String(p.name) };
      return json_(action === "requestCode" ? requestCode_(player, body.email) : verify_(player, body.otp, body.deviceName));
    }

    // alles hierna alleen met een geldige sessie
    const s = session_(body.token);
    if (!s) return json_({ ok: false, error: "auth" });
    if (action === "logout") { s.sh.deleteRow(s.row); return json_({ ok: true }); }
    if (action === "mine") return json_({ ok: true, rows: mine_(s.id) });
    if (!Array.isArray(body.rows)) return json_({ ok: false, error: "data" });
    const n = upsert_({ id: s.id, name: s.name }, String(body.deviceName || "").slice(0, 60), body.rows.slice(0, 2000));
    // Overzicht + Progressie: gebeurt elk kwartier via de trigger (zie setup)
    PropertiesService.getScriptProperties().setProperty("dirty", "1");
    return json_({ ok: true, saved: n });
  } finally {
    lock.releaseLock();
  }
}

function upsert_(player, device, rows) {
  const sh = SpreadsheetApp.getActive().getSheetByName("Log") || sheet_(SpreadsheetApp.getActive(), "Log", LOG_HEADERS);
  const last = sh.getLastRow();
  const keys = last > 1 ? sh.getRange(2, 1, last - 1, 1).getValues().map((r) => String(r[0])) : [];
  const index = {};
  keys.forEach((k, i) => { index[k] = i + 2; });

  const now = new Date();
  const append = [];
  let n = 0;
  // zelfde set twee keer in één verzending: alleen de laatste telt
  const latest = {};
  rows.forEach((r) => { if (r && r.date && r.exId) latest[[r.date, r.exId, Number(r.set) || 1].join("|")] = r; });
  Object.keys(latest).map((k) => latest[k]).forEach((r) => {
    if (!r || !/^\d{4}-\d{2}-\d{2}$/.test(r.date) || !r.exId) return;
    const set = Number(r.set) || 1;
    const key = [player.id, r.date, r.exId, set].join("|");
    const d = r.date.split("-").map(Number);
    const kg = typeof r.kg === "number" && isFinite(r.kg) ? r.kg : "";
    const reps = r.reps == null ? "" : r.reps;
    const values = [key, now, player.id, player.name, device, new Date(d[0], d[1] - 1, d[2]),
      String(r.workout || ""), String(r.exId), String(r.exName || ""), set, reps, kg, r.done ? "ja" : "nee"];
    if (index[key]) sh.getRange(index[key], 1, 1, values.length).setValues([values]);
    else append.push(values);
    n++;
  });
  if (append.length) sh.getRange(last + 1, 1, append.length, LOG_HEADERS.length).setValues(append);
  return n;
}

/* ---------------- Overzicht + Progressie opnieuw berekenen ---------------- */
function refreshAll_() {
  const log = SpreadsheetApp.getActive().getSheetByName("Log");
  const rows = log && log.getLastRow() > 1 ? log.getRange(2, 1, log.getLastRow() - 1, LOG_HEADERS.length).getValues() : [];
  refreshOverview_(rows);
  refreshProgress_(rows);
}

/** handmatig: Uitvoeren > refreshAll om Overzicht + Progressie meteen bij te werken */
function refreshAll() { refreshAll_(); }

/* ---------------- Overzicht per speler ---------------- */
function refreshOverview_(logRows) {
  const ss = SpreadsheetApp.getActive();
  const ov = ss.getSheetByName("Overzicht") || sheet_(ss, "Overzicht", OVERVIEW_HEADERS);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const day = 864e5;

  const stats = {};
  {
    (logRows || []).forEach((r) => {
      const used = r[12] === "ja" || r[11] !== "";
      if (!used) return;
      const id = String(r[2]);
      const s = stats[id] || (stats[id] = { name: String(r[3]), dates: {}, sets: 0, last: null });
      const dt = r[5] instanceof Date ? r[5] : new Date(r[5]);
      const k = Utilities.formatDate(dt, Session.getScriptTimeZone(), "yyyy-MM-dd");
      s.dates[k] = dt;
      s.sets++;
      if (!s.last || dt > s.last) s.last = dt;
    });
  }

  const out = [];
  const seen = {};
  players_().forEach((p) => {
    seen[p.id] = true;
    out.push(row_(p.name, p.group, stats[p.id], today, day));
  });
  Object.keys(stats).forEach((id) => { if (!seen[id]) out.push(row_(stats[id].name, "niet in lijst", stats[id], today, day)); });
  out.sort((a, b) => (b[2] ? b[2].getTime() : 0) - (a[2] ? a[2].getTime() : 0) || String(a[0]).localeCompare(String(b[0])));

  if (ov.getLastRow() > 1) ov.getRange(2, 1, ov.getLastRow() - 1, OVERVIEW_HEADERS.length).clearContent();
  if (out.length) ov.getRange(2, 1, out.length, OVERVIEW_HEADERS.length).setValues(out);
  ov.getRange(2, 3, Math.max(out.length, 1), 1).setNumberFormat("dd-mm-yyyy");
}

function row_(name, group, s, today, day) {
  if (!s) return [name, group, "", 0, 0, 0, 0, "nog niet gebruikt"];
  const dates = Object.keys(s.dates).map((k) => s.dates[k]);
  const within = (n) => dates.filter((d) => today - d < n * day && d <= new Date(today.getTime() + day)).length;
  const w1 = within(7), w4 = within(28);
  const status = w1 > 0 ? "actief" : w4 > 0 ? "deze maand" : "inactief";
  return [name, group, s.last, dates.length, w1, w4, s.sets, status];
}

/* ---------------- Progressie per speler per oefening ----------------
   Geschatte 1RM = kg × (1 + reps / 30) (Epley). Bij tijd-oefeningen
   (reps zoals "20s") of zonder reps: het gewicht zelf.               */
function refreshProgress_(logRows) {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName("Progressie") || sheet_(ss, "Progressie", PROGRESS_HEADERS);
  const tz = Session.getScriptTimeZone();
  const groups = {}; // speler|oefening -> { meta, sessions: { datum: {date, kgs:[], top, e1rm} } }

  (logRows || []).forEach((r) => {
    const kg = typeof r[11] === "number" ? r[11] : parseFloat(String(r[11]).replace(",", "."));
    if (!(kg > 0)) return;
    const dt = r[5] instanceof Date ? r[5] : new Date(r[5]);
    const dk = Utilities.formatDate(dt, tz, "yyyy-MM-dd");
    const g = groups[r[2] + "|" + r[7]] || (groups[r[2] + "|" + r[7]] = { pid: String(r[2]), pname: String(r[3]), exId: String(r[7]), exName: String(r[8]), sessions: {} });
    const s = g.sessions[dk] || (g.sessions[dk] = { date: dt, sets: [], top: 0, e1rm: 0 });
    const reps = Number(r[10]);
    const est = reps > 0 ? kg * (1 + reps / 30) : kg;
    s.sets[(Number(r[9]) || 1) - 1] = kg;
    s.top = Math.max(s.top, kg);
    s.e1rm = Math.max(s.e1rm, est);
  });

  const r1 = (n) => Math.round(n * 10) / 10;
  const out = Object.keys(groups).map((k) => {
    const g = groups[k];
    const ses = Object.keys(g.sessions).sort().map((d) => g.sessions[d]);
    const first = ses[0], last = ses[ses.length - 1], prev = ses.length > 1 ? ses[ses.length - 2] : null;
    let best = ses[0];
    ses.forEach((s) => { if (s.top > best.top) best = s; });
    const bestE = Math.max.apply(null, ses.map((s) => s.e1rm));
    return [g.pid, g.pname, g.exId, g.exName, ses.length,
      first.date, first.top, r1(first.e1rm),
      last.date, last.top, last.sets.filter((x) => x > 0).join("; "), r1(last.e1rm),
      best.top, best.date, r1(bestE),
      ses.length > 1 ? r1((last.e1rm / first.e1rm - 1) * 100) : "",
      prev ? r1(last.top - prev.top) : ""];
  });
  out.sort((a, b) => String(a[1]).localeCompare(String(b[1])) || String(a[3]).localeCompare(String(b[3])));

  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, PROGRESS_HEADERS.length).clearContent();
  if (out.length) {
    sh.getRange(2, 1, out.length, PROGRESS_HEADERS.length).setValues(out);
    [6, 9, 14].forEach((c) => sh.getRange(2, c, out.length, 1).setNumberFormat("dd-mm-yyyy"));
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* ---------------- Startlijst (alleen gebruikt door setup) ----------------
   1e jaars senioren, Onder 23 en Senioren uit de ledenlijst.
   Na setup() pas je de lijst aan in het tabblad Spelers.                */
const START_SPELERS = [
  ["alwin-valenbreder", "Alwin Valenbreder", "Senioren"],
  ["anouk-veerkamp", "Anouk Veerkamp", "Senioren"],
  ["arjan-talens", "Arjan Talens", "Senioren"],
  ["arwin-westenberg", "Arwin Westenberg", "Senioren"],
  ["bart-de-bruijne", "Bart de Bruijne", "Senioren"],
  ["bart-kooning", "Bart Kooning", "Senioren"],
  ["bart-schermer", "Bart Schermer", "Senioren"],
  ["bas-roodenburg", "Bas Roodenburg", "Senioren"],
  ["ber-de-wit", "Ber de Wit", "Senioren"],
  ["bjorn-staub", "Bjôrn Staub", "Senioren"],
  ["bob-van-riet", "Bob van Riet", "Senioren"],
  ["brim-adrichem", "Brim Adrichem", "Senioren"],
  ["bryan-de-jong", "Bryan de Jong", "Senioren"],
  ["callan-ris", "Callan Ris", "Senioren"],
  ["clayton-kiwara", "Clayton Kiwara", "Senioren"],
  ["daan-van-de-laarschot", "Daan van de Laarschot", "Senioren"],
  ["daily-limmen", "Daily Limmen", "Senioren"],
  ["danar-amin", "Danar Amin", "Senioren"],
  ["darren-ixer", "Darren Ixer", "Senioren"],
  ["dave-koelman", "Dave Koelman", "Senioren"],
  ["dedrick-antonie", "Dedrick Antonie", "Senioren"],
  ["dirk-bruil", "Dirk Bruil", "Senioren"],
  ["dirk-wierenga", "Dirk Wierenga", "Senioren"],
  ["don-marcker", "Don Marcker", "Senioren"],
  ["elke-ross", "Elke Ross", "Senioren"],
  ["erica-zeeman", "Erica Zeeman", "Senioren"],
  ["fabio-filippi", "Fabio Filippi", "Senioren"],
  ["fiona-kalf", "Fiona Kalf", "Senioren"],
  ["floris-beltman", "Floris Beltman", "Senioren"],
  ["francesco-paolo-ricci", "Francesco Paolo Ricci", "Senioren"],
  ["gareth-jenkinson", "Gareth Jenkinson", "Senioren"],
  ["gert-jan-nieuwenhuizen", "Gert Jan Nieuwenhuizen", "Senioren"],
  ["gielijn-janssen", "Gielijn Janssen", "Senioren"],
  ["hendrik-jan-knoop", "Hendrik Jan Knoop", "Senioren"],
  ["hiske-blom", "Hiske Blom", "Senioren"],
  ["ijsbrandt-overmaat", "IJsbrandt Overmaat", "Senioren"],
  ["jacco-beitler", "Jacco Beitler", "Senioren"],
  ["jakko-wijgman", "Jakko Wijgman", "Senioren"],
  ["jamie-bartels", "Jamie Bartels", "Senioren"],
  ["jeroen-van-zelst", "Jeroen van Zelst", "Senioren"],
  ["job-wierenga", "Job Wierenga", "Senioren"],
  ["joeri-goedhart", "Joeri Goedhart", "Senioren"],
  ["joeri-peperkamp", "Joeri Peperkamp", "Senioren"],
  ["joost-kramer", "Joost Kramer", "Senioren"],
  ["jort-doornenbal", "Jort Doornenbal", "Senioren"],
  ["kees-beentjes", "Kees Beentjes", "Senioren"],
  ["kevin-heideman", "Kevin Heideman", "Senioren"],
  ["kim-dekker", "Kim Dekker", "Senioren"],
  ["lars-kramer", "Lars Kramer", "Senioren"],
  ["litan-klooster", "Litan Klooster", "Senioren"],
  ["lorenzo-van-riet", "Lorenzo van Riet", "Senioren"],
  ["lotte-ranzijn", "Lotte Ranzijn", "Senioren"],
  ["luke-louw", "Luke Louw", "Senioren"],
  ["luuk-de-geest", "Luuk de Geest", "Senioren"],
  ["marieke-buschman", "Marieke Buschman", "Senioren"],
  ["marijn-daniel-kramer", "Marijn Daniël Kramer", "Senioren"],
  ["mark-jonker", "Mark Jonker", "Senioren"],
  ["mark-wokke", "Mark Wokke", "Senioren"],
  ["martijn-smit", "Martijn Smit", "Senioren"],
  ["martijn-zeeman", "Martijn Zeeman", "Senioren"],
  ["matthew-eelman", "Matthew Eelman", "Senioren"],
  ["max-heemskerk", "Max Heemskerk", "Senioren"],
  ["mees-mantje", "Mees Mantje", "Senioren"],
  ["melle-haanstra", "Melle Haanstra", "Senioren"],
  ["michael-bezuidenhout", "Michael Bezuidenhout", "Senioren"],
  ["mike-stuifbergen", "Mike Stuifbergen", "Senioren"],
  ["mikel-mac-mootry", "Mikel Mac Mootry", "Senioren"],
  ["mila-arnold", "Mila Arnold", "Senioren"],
  ["nicolaas-robert-westland", "Nicolaas Robert Westland", "Senioren"],
  ["paul-slangen", "Paul Slangen", "Senioren"],
  ["peter-marcker", "Peter Marcker", "Senioren"],
  ["pieter-bob-wierenga", "Pieter-Bob Wierenga", "Senioren"],
  ["raymon-markus", "Raymon Markus", "Senioren"],
  ["raymond-wentink", "Raymond Wentink", "Senioren"],
  ["reinier-de-boer", "Reinier de Boer", "Senioren"],
  ["ricardo-schneider", "Ricardo Schneider", "Senioren"],
  ["rob-van-der-velden", "Rob van der Velden", "Senioren"],
  ["robbin-vis", "Robbin Vis", "Senioren"],
  ["robert-bollemeijer", "Robert Bollemeijer", "Senioren"],
  ["robin-heydeman", "Robin Heydeman", "Senioren"],
  ["robin-lagrand", "Robin Lagrand", "Senioren"],
  ["roderick-eeltink", "Roderick Eeltink", "Senioren"],
  ["roel-haazelager", "Roel Haazelager", "Senioren"],
  ["rolf-de-graaf", "Rolf De Graaf", "Senioren"],
  ["roy-schermer", "Roy Schermer", "Senioren"],
  ["ruben-van-der-laan", "Ruben van der Laan", "Senioren"],
  ["sam-rozemeijer", "Sam Rozemeijer", "Senioren"],
  ["sissy-dillmann", "Sissy Dillmann", "Senioren"],
  ["sophie-touber", "Sophie Touber", "Senioren"],
  ["sven-berg", "Sven Berg", "Senioren"],
  ["sydney-kalf", "Sydney Kalf", "Senioren"],
  ["tausinga-kautai", "Tausinga Kautai", "Senioren"],
  ["tessa-van-den-brink", "Tessa van den Brink", "Senioren"],
  ["thomas-mous", "Thomas Mous", "Senioren"],
  ["tim-dam", "Tim Dam", "Senioren"],
  ["tim-jan-beentjes", "Tim Jan Beentjes", "Senioren"],
  ["toby-armstrong-twigg", "Toby Armstrong Twigg", "Senioren"],
  ["tom-hiddleston", "Tom Hiddleston", "Senioren"],
  ["tom-scheerman", "Tom Scheerman", "Senioren"],
  ["tony-hoogenboom", "Tony Hoogenboom", "Senioren"],
  ["viliamu-julious-ice-dahya", "Viliamu Julious Ice Dahya", "Senioren"],
  ["walter-min", "Walter Min", "Senioren"],
  ["wiet-van-duin", "Wiet van Duin", "Senioren"],
  ["aicha-willems", "Aïcha Willems", "Onder 23"],
  ["bas-menzies", "Bas Menzies", "Onder 23"],
  ["brodie-alexander-haugh", "Brodie Alexander Haugh", "Onder 23"],
  ["christunuvea-taloaina-fuli", "Christunuvea Taloaina Fuli", "Onder 23"],
  ["conor-hillecamp", "Conor Hillecamp", "Onder 23"],
  ["dirk-koek", "Dirk Koek", "Onder 23"],
  ["gabriel-smekens", "Gabriel Smekens", "Onder 23"],
  ["ilan-vaasen", "Ilan Vaasen", "Onder 23"],
  ["jarno-kamphuis", "Jarno Kamphuis", "Onder 23"],
  ["jon-komen", "Jon Komen", "Onder 23"],
  ["jonas-van-kilsdonk", "Jonas van Kilsdonk", "Onder 23"],
  ["joost-broeke", "Joost Broeke", "Onder 23"],
  ["jules-blokhuis", "Jules Blokhuis", "Onder 23"],
  ["justin-dam", "Justin Dam", "Onder 23"],
  ["kiki-sneekes", "Kiki Sneekes", "Onder 23"],
  ["kiyan-groen", "Kiyan Groen", "Onder 23"],
  ["kris-baltus", "Kris Baltus", "Onder 23"],
  ["lars-bos", "Lars Bos", "Onder 23"],
  ["lars-petiet", "Lars Petiet", "Onder 23"],
  ["loek-groot", "Loek Groot", "Onder 23"],
  ["morris-jan-vis", "Morris jan Vis", "Onder 23"],
  ["niek-doornenbal", "Niek Doornenbal", "Onder 23"],
  ["nils-willems", "Nils Willems", "Onder 23"],
  ["rick-van-schagen", "Rick van Schagen", "Onder 23"],
  ["rinke-wentink", "Rinke Wentink", "Onder 23"],
  ["sem-de-mooij", "Sem de Mooij", "Onder 23"],
  ["sky-mac-mootry", "Sky Mac Mootry", "Onder 23"],
  ["stijn-wilbrink", "Stijn Wilbrink", "Onder 23"],
  ["teun-van-de-heijden", "Teun van de Heijden", "Onder 23"],
  ["tijn-maas", "Tijn Maas", "Onder 23"],
  ["widian-el-mokhtari", "Widian El-Mokhtari", "Onder 23"],
  ["willie-martin-fisaga-mataitai", "Willie Martin Fisaga Mataitai", "Onder 23"],
  ["wout-zuurbier", "Wout Zuurbier", "Onder 23"],
  ["ymke-stuifbergen", "Ymke Stuifbergen", "Onder 23"],
  ["kick-liefting", "Kick Liefting", "1e Jaars Senioren"],
  ["lars-krijt", "Lars Krijt", "1e Jaars Senioren"],
  ["merel-dijkstra", "Merel Dijkstra", "1e Jaars Senioren"],
  ["petter-van-der-geest", "Petter van der Geest", "1e Jaars Senioren"],
  ["quinten-kuik", "Quinten Kuik", "1e Jaars Senioren"],
  ["robert-verkerk", "Robert Verkerk", "1e Jaars Senioren"]
];
