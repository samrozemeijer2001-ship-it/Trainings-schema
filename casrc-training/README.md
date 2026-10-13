# Cas RC Trainingsweek

Mobiele trainingsapp voor het weekschema (Lower / Upper / Full Body) in Cas RC geel-zwart.
Sets aftikken, kg invullen met je vorige gewicht ernaast, rusttimer, uitlegvideo per oefening
en een Stats-pagina met je progressie.

## Taal en rusttimer

- Rechtsboven wissel je tussen **NL** en **EN**. De keuze wordt onthouden; nieuwe gebruikers krijgen de taal van hun telefoon.
- Na een afgetikte set start de rusttimer vanzelf: 1 min bij Power (P), 2 min bij de hoofdoefening (A), en bij supersets pas na de laatste oefening van de ronde (na B1 staat er "Nu B2"). Je kunt altijd zelf 30s, 60s, 90s of 2m kiezen.
- Deze rusttijden zijn standaardwaarden; pas ze aan in `data.js` (`rest: 90`).

## Bestanden

| Bestand | Wat |
|---|---|
| `index.html` | De pagina |
| `style.css` | Alle opmaak (mobile first) |
| `i18n.js` | Alle teksten in het Nederlands en Engels |
| `data.js` | **Het schema.** Oefeningen, sets, reps, rusttijden en spiergroepen |
| `store.js` | Opslag van je gewichten en vinkjes + rekenwerk |
| `stats.js` | De Stats-pagina en grafieken |
| `config.js` | **Instellingen:** de URL van je Google-script (`SYNC_URL`). Eén keer invullen, daarna niet meer overschrijven |
| `sync.js` | Delen met de trainers via de Google Sheet |
| `app.js` | Schema-weergave, navigatie en rusttimer |
| `sw.js` | Zorgt dat de app offline opent na het eerste bezoek |
| `manifest.webmanifest` + `icons/` | Nodig voor "Zet op beginscherm" |

## Online zetten met GitHub Pages

1. Maak op github.com een nieuwe repository, bijvoorbeeld `casrc-training` (Public).
2. Pak de zip uit en **open de map** `casrc-training`.
3. Selecteer **alles wat erin staat** (ook de map `icons`) en sleep dat in GitHub via **Add file → Upload files**. Klik **Commit changes**.
   Sleep dus niet de map `casrc-training` zelf, anders komt alles in een submap en ziet de site het niet.
4. Ga naar **Settings → Pages**. Kies bij *Source* **Deploy from a branch**, branch **main**, map **/ (root)**, en klik **Save**.
5. Na 1 à 2 minuten staat de app op `https://<jouw-gebruikersnaam>.github.io/casrc-training/`.

In de repository moet het er zo uitzien (index.html in de hoofdmap):

```
index.html   style.css   app.js   data.js   i18n.js   store.js   stats.js
sw.js   manifest.webmanifest   README.md
icons/  (logo.svg, icon-192.png, icon-512.png, icon-512-maskable.png, apple-touch-icon.png)
```

**Updaten:** sleep alles opnieuw op dezelfde manier; GitHub overschrijft de oude bestanden.
Zie je de nieuwe versie niet meteen? GitHub Pages heeft tot ~10 minuten nodig. Sluit de app daarna helemaal af en open hem opnieuw.
Het icoon op je beginscherm ververst pas als je de app verwijdert en opnieuw toevoegt.

## Op het beginscherm zetten

- **iPhone (Safari):** open de link → deelknop → **Zet op beginscherm**.
- **Android (Chrome):** open de link → menu (⋮) → **Toevoegen aan startscherm** / **App installeren**.

## Zelf je week indelen

Iedereen traint op andere dagen. Tik op een dag op **Wissel training** en kies Lower, Upper, Full, Primer, Gameday of Rust.
- **Elke [dag]**: geldt vanaf nu iedere week.
- **Alleen [datum]**: geldt voor die ene dag.

Een gewijzigde dag krijgt een geel stipje in de dagstrook. Met **Terug naar schema trainer** zet je alles terug.
Je gewichten en stats horen bij de oefening en de datum, dus wisselen maakt niets kapot.
Je planning gaat mee in de back-up.

## Delen met de trainers (Google Sheet)

Met `SYNC_URL` in `config.js` ingevuld gaat elke gelogde set automatisch naar een Google Sheet.
Bij de eerste keer openen vult een speler het wachtwoord in (gecontroleerd door het script) en kiest hij één keer zijn naam.
Zonder wachtwoord kom je de app niet in.
Offline gelogd? Dan wordt het later verstuurd. Zie `STAPPENPLAN.md` in de map `google-sheet`.
Laat je `SYNC_URL` leeg, dan werkt de app alleen lokaal, zoals voorheen.

## Vorige keer en PR

Onder elk kg-vakje staat wat je de vorige keer bij die set deed. Tik erop om dat gewicht over te nemen.
Na invullen zie je het verschil (+2,5 / gelijk / −2,5) en **PR** als het je zwaarste gewicht ooit is voor die oefening.

## Stats

- **Algemene kracht:** per oefening wordt je geschatte 1RM (Epley: kg × (1 + reps/30)) vergeleken met je eerste keer. Het gemiddelde daarvan is je krachtindex: 100 = start, 110 = 10% sterker.
- **Volume per week:** kg × reps van alle sets met gewicht.
- **Per spiergroep:** krachtgroei per spiergroep, en aantal sets deze week vs vorige week.
- **Aanwezigheid:** de laatste 8 weken, hoe voller het vakje hoe meer je hebt afgetikt.
- **Per oefening:** grafiek, zwaarste gewicht, geschatte 1RM, groei sinds start en je laatste sessies.

Nog geen gegevens? Kies **Bekijk met voorbeelddata** om te zien hoe het eruitziet. Voorbeelddata wordt nooit opgeslagen.

Let op: reps komen uit het schema. Doe je meer of minder reps, dan klopt de geschatte 1RM iets minder precies.
Oefeningen zonder gewicht (sprongen, band) tellen mee voor sets en aanwezigheid, niet voor kracht.

## Opslag en back-up

- Alles staat alleen op je eigen telefoon (localStorage). Geen account, geen synchronisatie; teamgenoten zien elkaars cijfers niet.
- Vinkjes horen bij een datum, dus elke week begin je met een leeg schema; je gewichten en geschiedenis blijven bewaard.
- Via **Stats → Back-up opslaan** krijg je een `.json`-bestand. Op een nieuwe telefoon laad je dat in met **Back-up inladen**.
- Browsergegevens wissen = je geschiedenis kwijt. Maak dus af en toe een back-up.

## Offline

Na één keer openen met internet werkt alles ook zonder bereik, behalve de "Uitleg"-knoppen (YouTube).

## Nieuw schema?

Pas `data.js` aan. Houd de **namen** van oefeningen gelijk als je hun geschiedenis wilt behouden.
Verhoog daarna het versienummer, zodat telefoons de nieuwe versie ophalen:
- in `sw.js`: `const VERSION = "v10";` en de `?v=10` achter de bestanden,
- in `index.html` en `manifest.webmanifest`: elke `?v=10`.

Tip: zoek-en-vervang `v=10` door `v=11` in die drie bestanden en zet `VERSION` op `"v11"`.

## Lokaal testen

```
python3 -m http.server 8000
```

en open `http://localhost:8000`.
