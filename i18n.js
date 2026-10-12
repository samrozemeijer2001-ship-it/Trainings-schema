/* =========================================================
   Talen: Nederlands / English
   t("sleutel", {variabelen}) geeft de tekst in de gekozen taal.
   L(waarde) pakt uit data.js de juiste taal ({nl, en} of gewone tekst).
   ========================================================= */
const I18N = (function () {
  "use strict";
  const KEY = "casrc-lang";

  const dict = {
    nl: {
      title: "Trainings\u00ADweek",
      tabSchema: "Schema", tabStats: "Stats",
      daysAria: "Dagen van de week", viewAria: "Weergave", langAria: "Taal",
      rest: "Rust", stop: "Stop",
      today: "vandaag", howto: "Uitleg", set: "Set",
      prev: "vorig", same: "gelijk", vs: "vs", first: "eerste keer",
      restTag: "rust {t}", restAfter: "rust {t} na {code}", nextUp: "Nu {code}",
      clearDay: "Wis vinkjes van {day}", clearConfirm: "Tik nog een keer. Gewichten blijven bewaard",
      cleared: "Vinkjes van {day} gewist.",
      saveFail: "Opslaan lukt niet in deze browser (privémodus?). Je gegevens verdwijnen na herladen.",
      footer: "Schema TeamBuildr · {week}<br>Je gegevens staan alleen op dit toestel. Maak af en toe een back-up via Stats.",
      ariaTick: "{name} afvinken", ariaSet: "Set {n} van {name}: {reps}", ariaKg: "Gewicht set {n} {name}",
      ariaTop: "Zwaarste set {name} in kg", ariaFill: "Neem vorige keer over: {kg} kg",
      noscript: "Zet JavaScript aan om het schema te zien.",

      lastWeeks: "Laatste {n} weken", progress: "Progressie",
      strength: "Kracht", sinceStart: "sinds je start",
      volume: "Volume", vsSamePoint: "{p} vs zelfde punt vorige week", thisWeek: "deze week",
      sessions: "Trainingen", prs: "PR's", last30: "laatste 30 dagen",
      overall: "Algemene kracht",
      overallSub: "Gemiddelde van al je oefeningen. Per oefening vergelijken we je beste geschatte 1RM met je eerste keer. 100 = start.",
      volTitle: "Volume per week", volSub: "Totaal kg × reps van alle sets met gewicht.",
      perGroup: "Per spiergroep", groupSub: "Krachtgroei sinds je eerste keer, gemiddeld over de oefeningen voor die spiergroep.",
      groupEmpty: "Na twee trainingen met gewicht per oefening verschijnt hier je groei.",
      setsThisWeek: "Sets deze week", lastWeek: "vorige week", noSets: "Nog geen sets deze of vorige week.",
      attendance: "Aanwezigheid", attSub: "Hoe voller het vakje, hoe meer van de training je hebt afgetikt.",
      attCell: "{d}: {n} afgetikt", none: "niets", partly: "deels", all: "alles",
      perEx: "Per oefening", exercise: "Oefening", heaviest: "Zwaarste", e1rm: "Geschat 1RM", latest: "Laatste",
      date: "Datum", setsKg: "Sets (kg)", top: "Top", oneRm: "1RM",
      noData: "Nog geen gegevens.", noDataWeek: "nog geen data", index: "index",
      session1: "training", sessionN: "trainingen",
      emptyTitle: "Nog geen stats",
      emptyText: "Vul tijdens het trainen je kg in bij elke set. Na een paar trainingen zie je hier je krachtgroei, volume per week, spiergroepen en verloop per oefening.",
      demoBtn: "Bekijk met voorbeelddata", demoBar: "<b>Voorbeelddata.</b> Dit zijn niet jouw cijfers.", backMine: "Terug naar mijn data",
      dataTitle: "Je gegevens", dataSub: "Alles staat alleen op deze telefoon. Een back-up kun je op een nieuwe telefoon weer inladen.",
      exportBtn: "Back-up opslaan", importBtn: "Back-up inladen",
      exported: "Back-up opgeslagen in je downloads.", exportFail: "Back-up maken lukt niet in deze browser.",
      imported: "{n} trainingsregels ingeladen.", importFail: "Inladen mislukt. Kies een Cas RC back-up (.json).",
      notBackup: "Dit is geen Cas RC back-up.",
      chartStrength: "Krachtindex per week", chartVolume: "Volume per week in ton", start: "start"
    },
    en: {
      title: "Training Week",
      tabSchema: "Programme", tabStats: "Stats",
      daysAria: "Days of the week", viewAria: "View", langAria: "Language",
      rest: "Rest", stop: "Stop",
      today: "today", howto: "How-to", set: "Set",
      prev: "last", same: "same", vs: "vs", first: "first time",
      restTag: "rest {t}", restAfter: "rest {t} after {code}", nextUp: "Now {code}",
      clearDay: "Clear ticks for {day}", clearConfirm: "Tap again. Weights are kept",
      cleared: "Ticks for {day} cleared.",
      saveFail: "Saving doesn't work in this browser (private mode?). Your data will be lost on reload.",
      footer: "Programme from TeamBuildr · {week}<br>Your data only lives on this phone. Make a backup now and then via Stats.",
      ariaTick: "Tick off {name}", ariaSet: "Set {n} of {name}: {reps}", ariaKg: "Weight set {n} {name}",
      ariaTop: "Heaviest set {name} in kg", ariaFill: "Use last time: {kg} kg",
      noscript: "Turn on JavaScript to see the programme.",

      lastWeeks: "Last {n} weeks", progress: "Progress",
      strength: "Strength", sinceStart: "since you started",
      volume: "Volume", vsSamePoint: "{p} vs same point last week", thisWeek: "this week",
      sessions: "Sessions", prs: "PRs", last30: "last 30 days",
      overall: "Overall strength",
      overallSub: "Average of all your lifts. For each exercise we compare your best estimated 1RM with your first time. 100 = start.",
      volTitle: "Volume per week", volSub: "Total kg × reps of all sets with a weight.",
      perGroup: "Per muscle group", groupSub: "Strength gain since your first session, averaged over the exercises for that muscle group.",
      groupEmpty: "Your gains show up here after two weighted sessions per exercise.",
      setsThisWeek: "Sets this week", lastWeek: "last week", noSets: "No sets this week or last week yet.",
      attendance: "Attendance", attSub: "The fuller the square, the more of the session you ticked off.",
      attCell: "{d}: {n} ticked", none: "none", partly: "some", all: "all",
      perEx: "Per exercise", exercise: "Exercise", heaviest: "Heaviest", e1rm: "Est. 1RM", latest: "Latest",
      date: "Date", setsKg: "Sets (kg)", top: "Top", oneRm: "1RM",
      noData: "No data yet.", noDataWeek: "no data yet", index: "index",
      session1: "session", sessionN: "sessions",
      emptyTitle: "No stats yet",
      emptyText: "Log your kg for each set while you train. After a few sessions you'll see your strength gains, weekly volume, muscle groups and progress per exercise here.",
      demoBtn: "Show example data", demoBar: "<b>Example data.</b> These aren't your numbers.", backMine: "Back to my data",
      dataTitle: "Your data", dataSub: "Everything is stored on this phone only. You can load a backup on a new phone.",
      exportBtn: "Save backup", importBtn: "Load backup",
      exported: "Backup saved to your downloads.", exportFail: "Can't make a backup in this browser.",
      imported: "{n} entries loaded.", importFail: "Loading failed. Pick a Cas RC backup (.json).",
      notBackup: "This isn't a Cas RC backup.",
      chartStrength: "Strength index per week", chartVolume: "Volume per week in tonnes", start: "start"
    }
  };

  let lang = "nl";
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "nl" || saved === "en") lang = saved;
    else lang = (navigator.language || "nl").toLowerCase().startsWith("nl") ? "nl" : "en";
  } catch (e) {}
  document.documentElement.lang = lang;

  function t(key, vars) {
    let s = (dict[lang] && dict[lang][key]) || dict.nl[key] || key;
    if (vars) Object.keys(vars).forEach((k) => { s = s.split("{" + k + "}").join(vars[k]); });
    return s;
  }

  const L = (v) => (v == null ? "" : typeof v === "object" && !Array.isArray(v) ? (v[lang] || v.nl || "") : v);

  return {
    t, L,
    get lang() { return lang; },
    get locale() { return lang === "nl" ? "nl-NL" : "en-GB"; },
    set(l) {
      if (l !== "nl" && l !== "en") return;
      lang = l;
      document.documentElement.lang = l;
      try { localStorage.setItem(KEY, l); } catch (e) {}
    }
  };
})();
const t = I18N.t, L = I18N.L;
