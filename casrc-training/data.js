/* =========================================================
   HET SCHEMA — pas hier oefeningen, sets en reps aan.

   Sets-blok:  [naam, [reps per set], notitie, "YouTube-zoekterm", [spiergroepen]]
   Lijst-blok: [naam, dosering, "YouTube-zoekterm", [spiergroepen], loggen?]
               loggen = true geeft een kg-vakje (bijv. Arm Farm)

   Teksten in twee talen schrijf je als { nl: "...", en: "..." }.
   Oefeningsnamen blijven Engels (zoals in TeamBuildr).

   rest      = rusttimer in seconden die start na een afgetikte set
   superset  = true: na de eerste oefening géén timer (direct door),
               na de laatste oefening van de ronde wel.

   De eerste spiergroep is de hoofdgroep (telt mee voor sets per spiergroep).
   Een oefening met dezelfde naam deelt dezelfde geschiedenis,
   dus wijzig namen niet als je je stats wilt houden.
   ========================================================= */

const SCHEMA_WEEK = { nl: "week van 12 okt 2026", en: "week of 12 Oct 2026" };

const GROUPS = {
  benen:     { nl: "Benen", en: "Legs" },
  achter:    { nl: "Hamstrings & billen", en: "Hamstrings & glutes" },
  borst:     { nl: "Borst", en: "Chest" },
  rug:       { nl: "Rug", en: "Back" },
  schouders: { nl: "Schouders", en: "Shoulders" },
  armen:     { nl: "Armen", en: "Arms" },
  kuiten:    { nl: "Kuiten & enkels", en: "Calves & ankles" },
  core:      { nl: "Core & rotatie", en: "Core & rotation" },
  power:     { nl: "Explosief", en: "Power" }
};

/* veelgebruikte teksten */
const each = (s) => ({ nl: s + " per kant", en: s + " each side" });
const B_POWER = { nl: "Explosief", en: "Power" };
const B_MAIN = { nl: "Hoofdoefening", en: "Main lift" };
const sub = (nl, en) => ({ nl, en });

const ARM_FARM = {
  type: "list", letter: "+", name: "Arm Farm", sub: sub("3 sets biceps / triceps", "3 sets biceps / triceps"),
  intro: {
    nl: "Kies 1 biceps- en 1 triceps-oefening, 3 sets. Vul je zwaarste set in. Bij dips: extra gewicht (0 = lichaamsgewicht).",
    en: "Pick 1 biceps and 1 triceps exercise, 3 sets. Log your heaviest set. For dips: added weight (0 = bodyweight)."
  },
  items: [
    ["DB / BB Bicep Curl", "", "bicep curl dumbbell barbell technique", ["armen"], true],
    ["Hammer Curl", "", "hammer curl technique", ["armen"], true],
    ["Preacher Curl", "", "preacher curl technique", ["armen"], true],
    ["Bar / Rope Tricep Pushdown", "", "rope tricep pushdown technique", ["armen"], true],
    ["Skull Crushers", "", "skull crusher exercise technique", ["armen"], true],
    ["Dips", "", "tricep dips technique", ["armen", "borst"], true]
  ]
};

const WEEK = [
  {
    key: "ma", short: { nl: "Ma", en: "Mo" }, long: { nl: "Maandag", en: "Monday" },
    title: "Lower Body", tag: "Lower",
    blocks: [
      { type: "list", letter: "W", name: "Lower Body Prehab C", sub: sub("Warming-up", "Warm-up"), items: [
        ["Hip / Hamstring mobility & foamroll", "5 min", "hip hamstring mobility foam roll routine"],
        ["Split Squat ISO hold", "2 × 30 sec", "split squat isometric hold"],
        ["Kang Squat", "2 × 8", "kang squat exercise"],
        ["Cossack Squat", each("2 × 6"), "cossack squat technique"]
      ]},
      { type: "sets", letter: "P", name: B_POWER, sub: sub("2 sets", "2 sets"), rest: 60, ex: [
        ["Seated CMJ", [5, 5], "", "seated countermovement jump box jump", ["power", "benen"]],
        ["Banded Knee Switch", [5, 5], { nl: "Focus op techniek, snelle switch, tenen omhoog", en: "Focus on technique, quick switch, toes up" }, "banded knee switch drill", ["power"]]
      ]},
      { type: "sets", letter: "A", name: B_MAIN, sub: sub("3 sets", "3 sets"), rest: 120, ex: [
        ["Squat Variation", [6, 5, 5], "Back / Front / Trapbar", "back squat technique", ["benen", "achter"]]
      ]},
      { type: "sets", letter: "B", name: "Superset B", sub: sub("3 rondes", "3 rounds"), rest: 90, superset: true, ex: [
        ["RDL (Romanian Deadlift)", [6, 6, 6], "", "romanian deadlift technique", ["achter", "rug"]],
        ["Cossack Squat", [6, 6, 6], "", "cossack squat technique", ["benen"]]
      ]},
      { type: "sets", letter: "C", name: "Superset C", sub: sub("3 rondes", "3 rounds"), rest: 60, superset: true, ex: [
        ["Copenhagen Plank", ["20s", "20s", "20s"], "", "copenhagen plank technique", ["core"]],
        ["Single Leg Calf Raises", [10, 10, 10], "", "single leg calf raise technique", ["kuiten"]]
      ]},
      { type: "list", letter: "+", name: "Lower Top Ups", sub: sub("Afsluiter", "Finisher"), items: [
        ["Clamshells", "2 × 12", "clamshell exercise band"],
        ["Tibia raises", "2 × 12", "tibialis raise exercise"]
      ]}
    ]
  },
  {
    key: "di", short: { nl: "Di", en: "Tu" }, long: { nl: "Dinsdag", en: "Tuesday" },
    title: "Upper Body", tag: "Upper",
    blocks: [
      { type: "list", letter: "W", name: "Upper Body Prehab C", sub: sub("Warming-up", "Warm-up"), items: [
        ["Banded pull aparts", "2 × 15", "band pull apart technique"],
        ["Upside down kettlebell press", each("2 × 8"), "bottoms up kettlebell press"],
        ["Press up rotations", each("2 × 5"), "push up with rotation T push up"],
        ["Ab rollouts", "2 × 10", "ab wheel rollout technique"]
      ]},
      { type: "sets", letter: "P", name: B_POWER, sub: sub("2 sets", "2 sets"), rest: 60, ex: [
        ["MB Rotation Slam", [4, 4], "", "medicine ball rotational slam", ["power", "core"]],
        ["Plyo Push Up", [5, 5], "", "plyometric push up technique", ["power", "borst"]]
      ]},
      { type: "sets", letter: "A", name: B_MAIN, sub: sub("3 sets", "3 sets"), rest: 120, ex: [
        ["Barbell Bench Press", [6, 6, 5], "", "barbell bench press technique", ["borst", "schouders", "armen"]]
      ]},
      { type: "sets", letter: "B", name: "Superset B", sub: sub("3 rondes", "3 rounds"), rest: 90, superset: true, ex: [
        ["Z-Press", [6, 6, 6], "", "z press technique", ["schouders", "core"]],
        ["Chest Supported Row", [8, 8, 8], "", "chest supported row technique", ["rug", "armen"]]
      ]},
      { type: "sets", letter: "C", name: "Superset C", sub: sub("3 rondes", "3 rounds"), rest: 90, superset: true, ex: [
        ["NG Pull-up", [8, 8, 6], { nl: "Vul extra gewicht in (0 = lichaamsgewicht)", en: "Log added weight (0 = bodyweight)" }, "neutral grip pull up technique", ["rug", "armen"]],
        ["Banded Chops", [8, 8, 8], { nl: "Zware band: explosief roteren, langzaam terug", en: "Heavy band: explosive rotation, slow on the return" }, "banded wood chop exercise", ["core"]]
      ]},
      ARM_FARM
    ]
  },
  {
    key: "wo", short: { nl: "Wo", en: "We" }, long: { nl: "Woensdag", en: "Wednesday" },
    title: { nl: "Rust", en: "Rest" }, tag: { nl: "Rust", en: "Rest" }, rest: true,
    text: { nl: "Rustdag. Herstel is ook training.", en: "Rest day. Recovery is training too." },
    tips: [
      { nl: "Licht wandelen of fietsen", en: "Easy walk or bike" },
      { nl: "Foamrollen en mobility", en: "Foam rolling and mobility" },
      { nl: "Goed eten en slapen", en: "Eat well and sleep" }
    ]
  },
  {
    key: "do", short: { nl: "Do", en: "Th" }, long: { nl: "Donderdag", en: "Thursday" },
    title: "Full Body", tag: "Full",
    blocks: [
      { type: "list", letter: "W", name: "Full Body Prehab B", sub: sub("Warming-up", "Warm-up"), items: [
        ["Hip / Hamstring mobility & foam roll", "5 min", "hip hamstring mobility foam roll routine"],
        ["Single Leg Calf ISO Hold", each("2 × 30 sec"), "single leg calf isometric hold"],
        ["Tibia raise", "2 × 10", "tibialis raise exercise"],
        ["Spanish Squat", "2 × 10", "spanish squat exercise"],
        ["Cuban Press", "2 × 10", "cuban press technique"]
      ]},
      { type: "sets", letter: "P", name: B_POWER, sub: sub("2 sets", "2 sets"), rest: 60, ex: [
        ["Broad Jump", [3, 3], "", "broad jump technique", ["power", "benen"]],
        ["Skater Jumps", [5, 5], "", "skater jumps exercise", ["power", "benen"]]
      ]},
      { type: "sets", letter: "A", name: B_MAIN, sub: sub("3 sets", "3 sets"), rest: 120, ex: [
        ["Quarter Split Squat", [5, 5, 5], "", "quarter split squat", ["benen"]]
      ]},
      { type: "sets", letter: "B", name: "Superset B", sub: sub("3 rondes", "3 rounds"), rest: 90, superset: true, ex: [
        ["Landmine Throw", [6, 6, 6], "", "landmine rotational throw", ["power", "core", "schouders"]],
        ["Landmine Sunrises", [6, 6, 6], "", "landmine sunrise exercise", ["core", "schouders"]]
      ]},
      { type: "sets", letter: "C", name: "Superset C", sub: sub("3 rondes", "3 rounds"), rest: 60, superset: true, ex: [
        ["Hamstring Iso Hold", ["15s", "15s", "15s"], "", "hamstring isometric hold", ["achter"]],
        ["Single Leg Glute Bridge", [8, 8, 8], "", "single leg glute bridge technique", ["achter"]]
      ]},
      ARM_FARM
    ]
  },
  {
    key: "vr", short: { nl: "Vr", en: "Fr" }, long: { nl: "Vrijdag", en: "Friday" },
    title: "Primer", tag: "Primer", rest: true, active: true,
    text: { nl: "Primer session. Interesse? Stuur je trainer een berichtje.", en: "Primer session. Interested? Text your coach." },
    tips: [
      { nl: "Kort en explosief, geen zware volumes", en: "Short and explosive, no heavy volume" },
      { nl: "Fris blijven voor zaterdag", en: "Stay fresh for Saturday" }
    ]
  },
  {
    key: "za", short: { nl: "Za", en: "Sa" }, long: { nl: "Zaterdag", en: "Saturday" },
    title: "Gameday", tag: "Game", rest: true, active: true,
    text: { nl: "Wedstrijddag. Geen wedstrijd? Doe een korte top-up of pump sessie.", en: "Game day. No game? Do a short top-up or pump session." },
    tips: [
      { nl: "Top-up: prehab van deze week", en: "Top-up: this week's prehab" },
      { nl: "Pump: Arm Farm, 3 sets biceps / triceps", en: "Pump: Arm Farm, 3 sets biceps / triceps" }
    ]
  },
  {
    key: "zo", short: { nl: "Zo", en: "Su" }, long: { nl: "Zondag", en: "Sunday" },
    title: { nl: "Rust", en: "Rest" }, tag: { nl: "Rust", en: "Rest" }, rest: true,
    text: { nl: "Rustdag. Herstellen van de wedstrijd.", en: "Rest day. Recover from the game." },
    tips: [
      { nl: "Wandelen, zwemmen of fietsen", en: "Walk, swim or bike" },
      { nl: "Stretchen en foamrollen", en: "Stretching and foam rolling" }
    ]
  }
];
