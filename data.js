/* =========================================================
   HET SCHEMA — pas hier oefeningen, sets en reps aan.
   Sets-blok:  [naam, [reps per set], "notitie", "YouTube-zoekterm"]
   Lijst-blok: [naam, "dosering", "YouTube-zoekterm"]
   ========================================================= */

const SCHEMA_WEEK = "week van 12 okt 2026";

const ARM_FARM = {
  type: "list", letter: "+", name: "Arm Farm", sub: "3 sets biceps / triceps",
  intro: "Kies zelf: 3 sets biceps en 3 sets triceps.",
  items: [
    ["DB / BB Bicep Curl", "", "bicep curl dumbbell barbell technique"],
    ["Hammer Curl", "", "hammer curl technique"],
    ["Preacher Curl", "", "preacher curl technique"],
    ["Bar / Rope Tricep Pushdown", "", "rope tricep pushdown technique"],
    ["Skull Crushers", "", "skull crusher exercise technique"],
    ["Dips", "", "tricep dips technique"]
  ]
};

const WEEK = [
  {
    key: "ma", short: "Ma", long: "Maandag", title: "Lower Body", tag: "Lower",
    blocks: [
      { type: "list", letter: "W", name: "Lower Body Prehab C", sub: "Warming-up", items: [
        ["Hip / Hamstring mobility & foamroll", "5 min", "hip hamstring mobility foam roll routine"],
        ["Split Squat ISO hold", "2 × 30 sec", "split squat isometric hold"],
        ["Kang Squat", "2 × 8", "kang squat exercise"],
        ["Cossack Squat", "2 × 6 per kant", "cossack squat technique"]
      ]},
      { type: "sets", letter: "P", name: "Explosief", sub: "Power · 2 sets", ex: [
        ["Seated CMJ", [5, 5], "", "seated countermovement jump box jump"],
        ["Banded Knee Switch", [5, 5], "Focus op techniek, snelle switch, tenen omhoog", "banded knee switch drill"]
      ]},
      { type: "sets", letter: "A", name: "Hoofdoefening", sub: "Kracht · 3 sets", ex: [
        ["Squat Variation", [6, 5, 5], "Back / Front / Trapbar", "back squat technique"]
      ]},
      { type: "sets", letter: "B", name: "Superset B", sub: "Wissel af · 3 rondes", ex: [
        ["RDL (Romanian Deadlift)", [6, 6, 6], "", "romanian deadlift technique"],
        ["Cossack Squat", [6, 6, 6], "", "cossack squat technique"]
      ]},
      { type: "sets", letter: "C", name: "Superset C", sub: "Wissel af · 3 rondes", ex: [
        ["Copenhagen Plank", ["20s", "20s", "20s"], "", "copenhagen plank technique"],
        ["Single Leg Calf Raises", [10, 10, 10], "", "single leg calf raise technique"]
      ]},
      { type: "list", letter: "+", name: "Lower Top Ups", sub: "Afsluiter", items: [
        ["Clamshells", "2 × 12", "clamshell exercise band"],
        ["Tibia raises", "2 × 12", "tibialis raise exercise"]
      ]}
    ]
  },
  {
    key: "di", short: "Di", long: "Dinsdag", title: "Upper Body", tag: "Upper",
    blocks: [
      { type: "list", letter: "W", name: "Upper Body Prehab C", sub: "Warming-up", items: [
        ["Banded pull aparts", "2 × 15", "band pull apart technique"],
        ["Upside down kettlebell press", "2 × 8 per kant", "bottoms up kettlebell press"],
        ["Press up rotations", "2 × 5 per kant", "push up with rotation T push up"],
        ["Ab rollouts", "2 × 10", "ab wheel rollout technique"]
      ]},
      { type: "sets", letter: "P", name: "Explosief", sub: "Power · 2 sets", ex: [
        ["MB Rotation Slam", [4, 4], "", "medicine ball rotational slam"],
        ["Plyo Push Up", [5, 5], "", "plyometric push up technique"]
      ]},
      { type: "sets", letter: "A", name: "Hoofdoefening", sub: "Kracht · 3 sets", ex: [
        ["Barbell Bench Press", [6, 6, 5], "", "barbell bench press technique"]
      ]},
      { type: "sets", letter: "B", name: "Superset B", sub: "Wissel af · 3 rondes", ex: [
        ["Z-Press", [6, 6, 6], "", "z press technique"],
        ["Chest Supported Row", [8, 8, 8], "", "chest supported row technique"]
      ]},
      { type: "sets", letter: "C", name: "Superset C", sub: "Wissel af · 3 rondes", ex: [
        ["NG Pull-up", [8, 8, 6], "", "neutral grip pull up technique"],
        ["Banded Chops", [8, 8, 8], "Zware band: explosief roteren, langzaam terug", "banded wood chop exercise"]
      ]},
      ARM_FARM
    ]
  },
  {
    key: "wo", short: "Wo", long: "Woensdag", title: "Rust", tag: "Rust", rest: true,
    text: "Rustdag. Herstel is ook training.",
    tips: ["Licht wandelen of fietsen", "Foamrollen en mobility", "Goed eten en slapen"]
  },
  {
    key: "do", short: "Do", long: "Donderdag", title: "Full Body", tag: "Full",
    blocks: [
      { type: "list", letter: "W", name: "Full Body Prehab B", sub: "Warming-up", items: [
        ["Hip / Hamstring mobility & foam roll", "5 min", "hip hamstring mobility foam roll routine"],
        ["Single Leg Calf ISO Hold", "2 × 30 sec per kant", "single leg calf isometric hold"],
        ["Tibia raise", "2 × 10", "tibialis raise exercise"],
        ["Spanish Squat", "2 × 10", "spanish squat exercise"],
        ["Cuban Press", "2 × 10", "cuban press technique"]
      ]},
      { type: "sets", letter: "P", name: "Explosief", sub: "Power · 2 sets", ex: [
        ["Broad Jump", [3, 3], "", "broad jump technique"],
        ["Skater Jumps", [5, 5], "", "skater jumps exercise"]
      ]},
      { type: "sets", letter: "A", name: "Hoofdoefening", sub: "Kracht · 3 sets", ex: [
        ["Quarter Split Squat", [5, 5, 5], "", "quarter split squat"]
      ]},
      { type: "sets", letter: "B", name: "Superset B", sub: "Wissel af · 3 rondes", ex: [
        ["Landmine Throw", [6, 6, 6], "", "landmine rotational throw"],
        ["Landmine Sunrises", [6, 6, 6], "", "landmine sunrise exercise"]
      ]},
      { type: "sets", letter: "C", name: "Superset C", sub: "Wissel af · 3 rondes", ex: [
        ["Hamstring Iso Hold", ["15s", "15s", "15s"], "", "hamstring isometric hold"],
        ["Single Leg Glute Bridge", [8, 8, 8], "", "single leg glute bridge technique"]
      ]},
      ARM_FARM
    ]
  },
  {
    key: "vr", short: "Vr", long: "Vrijdag", title: "Primer", tag: "Primer", rest: true, active: true,
    text: "Primer session. Interesse? Stuur je trainer een berichtje.",
    tips: ["Kort en explosief, geen zware volumes", "Fris blijven voor zaterdag"]
  },
  {
    key: "za", short: "Za", long: "Zaterdag", title: "Gameday", tag: "Game", rest: true, active: true,
    text: "Wedstrijddag. Geen wedstrijd? Doe een korte top-up of pump sessie.",
    tips: ["Top-up: prehab van deze week", "Pump: Arm Farm, 3 sets biceps / triceps"]
  },
  {
    key: "zo", short: "Zo", long: "Zondag", title: "Rust", tag: "Rust", rest: true,
    text: "Rustdag. Herstellen van de wedstrijd.",
    tips: ["Wandelen, zwemmen of fietsen", "Stretchen en foamrollen"]
  }
];
