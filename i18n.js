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
      flashText: "Tik om verder te gaan", flashWord: "DONE",
      onbWelcome: "Welkom bij de Cas RC trainingsapp",
      onbCodeText: "Vul het wachtwoord in dat in de groepsapp staat. Je hoeft dit maar één keer te doen.",
      onbCode: "Wachtwoord", onbNext: "Verder", onbChecking: "Even kijken…",
      onbWrongCode: "Dit wachtwoord klopt niet. Check de groepsapp.",
      onbOffline: "Geen verbinding. Probeer het opnieuw zodra je internet hebt.",
      onbLater: "Later", onbLocal: "Niet delen, alleen op deze telefoon",
      onbRetry: "Opnieuw proberen", onbSetupErr: "De namenlijst kon niet geladen worden. Laat het even weten in de groepsapp.",
      onbWho: "Wie ben jij?", onbWhoText: "Kies één keer je naam. Je trainingen worden dan gedeeld met de trainers van Cas RC, zodat zij je progressie kunnen volgen.",
      onbSearch: "Zoek je naam", onbNoMatch: "Geen naam gevonden.",
      onbNotListed: "Sta je er niet bij?", onbYourName: "Je voor- en achternaam", onbUseName: "Gebruik deze naam",
      onbConfirm: "Ben jij {name}?", onbYes: "Ja, dat ben ik", onbBack: "Terug",
      onbWelcomeName: "Welkom, {name}!",
      syncTitle: "Delen met trainers", syncAs: "Je bent {name}",
      syncOk: "Alles verstuurd · {time}", syncPending: "{n} nog te versturen",
      syncNever: "Nog niets verstuurd", syncError: "Versturen lukte niet, wordt later opnieuw geprobeerd",
      syncCodeErr: "Het wachtwoord is veranderd. Vul het nieuwe wachtwoord in.",
      syncNow: "Nu versturen", syncSwitch: "Andere speler kiezen", syncSwitchConfirm: "Tik nog een keer om te wisselen",
      syncLocal: "Je trainingen blijven alleen op deze telefoon.", syncJoin: "Toch delen met trainers",
      syncSent: "Verstuurd naar de trainers.", 
      syncRestore: "Haal mijn trainingen op", syncRestored: "{n} sets teruggehaald uit de sheet.", syncRestoreNone: "Alles stond al op deze telefoon.", 
      swap: "Wissel training", sheetTitle: "Training op {day}",
      scopeOnce: "Alleen {date}", scopeWeek: "Elke {day}",
      coachOn: "Trainer: {days}", current: "Gekozen",
      resetPlan: "Terug naar schema trainer", resetDone: "Schema van de trainer hersteld.",
      planSaved: "{day}: {workout}", planOnce: "{date}: {workout}",
      ownPlan: "Eigen keuze", ownPlanOnce: "Alleen deze dag", close: "Sluiten",
      clearDay: "Wis vinkjes van {day}", clearConfirm: "Tik nog een keer. Gewichten blijven bewaard",
      cleared: "Vinkjes van {day} gewist.",
      saveFail: "Opslaan lukt niet in deze browser (privémodus?). Je gegevens verdwijnen na herladen.",
      footer: "Schema TeamBuildr · {week}<br>Maak af en toe een back-up via Stats.",
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
      dataTitle: "Je gegevens", dataSub: "Je trainingen staan op deze telefoon. Een back-up kun je op een nieuwe telefoon weer inladen.",
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
      flashText: "Tap to continue", flashWord: "DONE",
      onbWelcome: "Welcome to the Cas RC training app",
      onbCodeText: "Enter the password from the group chat. You only need to do this once.",
      onbCode: "Password", onbNext: "Next", onbChecking: "Checking…",
      onbWrongCode: "That password isn't right. Check the group chat.",
      onbOffline: "No connection. Try again once you're online.",
      onbLater: "Later", onbLocal: "Don't share, keep it on this phone",
      onbRetry: "Try again", onbSetupErr: "The name list couldn't be loaded. Let us know in the group chat.",
      onbWho: "Who are you?", onbWhoText: "Pick your name once. Your sessions are then shared with the Cas RC coaches so they can follow your progress.",
      onbSearch: "Search your name", onbNoMatch: "No name found.",
      onbNotListed: "Not on the list?", onbYourName: "Your first and last name", onbUseName: "Use this name",
      onbConfirm: "Are you {name}?", onbYes: "Yes, that's me", onbBack: "Back",
      onbWelcomeName: "Welcome, {name}!",
      syncTitle: "Shared with coaches", syncAs: "You are {name}",
      syncOk: "All sent · {time}", syncPending: "{n} still to send",
      syncNever: "Nothing sent yet", syncError: "Sending failed, will retry later",
      syncCodeErr: "The password has changed. Enter the new password.",
      syncNow: "Send now", syncSwitch: "Pick another player", syncSwitchConfirm: "Tap again to switch",
      syncLocal: "Your sessions stay on this phone only.", syncJoin: "Share with coaches after all",
      syncSent: "Sent to the coaches.", 
      syncRestore: "Get my sessions back", syncRestored: "{n} sets restored from the sheet.", syncRestoreNone: "Everything was already on this phone.", 
      swap: "Change workout", sheetTitle: "Workout on {day}",
      scopeOnce: "Only {date}", scopeWeek: "Every {day}",
      coachOn: "Coach: {days}", current: "Selected",
      resetPlan: "Back to coach's plan", resetDone: "Coach's plan restored.",
      planSaved: "{day}: {workout}", planOnce: "{date}: {workout}",
      ownPlan: "Your choice", ownPlanOnce: "This day only", close: "Close",
      clearDay: "Clear ticks for {day}", clearConfirm: "Tap again. Weights are kept",
      cleared: "Ticks for {day} cleared.",
      saveFail: "Saving doesn't work in this browser (private mode?). Your data will be lost on reload.",
      footer: "Programme from TeamBuildr · {week}<br>Make a backup now and then via Stats.",
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
      dataTitle: "Your data", dataSub: "Your sessions are stored on this phone. You can load a backup on a new phone.",
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
