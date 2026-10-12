# Cas RC Trainingsweek

Mobiele trainingspagina voor het weekschema (Lower / Upper / Full Body) in Cas RC geel-zwart.
Sets aftikken, kg invullen, rusttimer en een uitlegvideo per oefening.

## Bestanden

| Bestand | Wat |
|---|---|
| `index.html` | De pagina |
| `style.css` | Alle opmaak (mobile first) |
| `data.js` | **Het schema.** Pas hier oefeningen, sets en reps aan |
| `app.js` | Werking: dagen, vinkjes, kg, timer |
| `sw.js` | Zorgt dat de app offline opent na het eerste bezoek |
| `manifest.webmanifest` + `icons/` | Nodig voor "Zet op beginscherm" |

## Online zetten met GitHub Pages

1. Maak op github.com een nieuwe repository, bijvoorbeeld `casrc-training` (Public).
2. Klik **Add file → Upload files** en sleep alle bestanden **én** de map `icons` erin. Klik **Commit changes**.
3. Ga naar **Settings → Pages**. Kies bij *Source* **Deploy from a branch**, branch **main**, map **/ (root)**, en klik **Save**.
4. Na 1 à 2 minuten staat de app op `https://<jouw-gebruikersnaam>.github.io/casrc-training/`.
   Die link stuur je naar je teamgenoten.

## Op het beginscherm zetten

- **iPhone (Safari):** open de link → deelknop → **Zet op beginscherm**.
- **Android (Chrome):** open de link → menu (⋮) → **Toevoegen aan startscherm** / **App installeren**.

De app opent dan schermvullend zonder adresbalk.

## Lokaal testen

Dubbelklikken op `index.html` werkt, maar de offline-functie niet. Voor een echte test:

```
python3 -m http.server 8000
```

en open `http://localhost:8000`.

## Goed om te weten

- **Opslag:** vinkjes en kg staan alleen op je eigen telefoon (localStorage). Er is geen account of synchronisatie; teamgenoten zien elkaars voortgang niet. Elke nieuwe week (maandag) begint alles leeg.
- **Offline:** na één keer openen met internet werkt de app ook zonder bereik in de gym. Alleen de "Uitleg"-knoppen (YouTube) hebben internet nodig.
- **Rusttimer:** start automatisch 90 sec na het aftikken van een set. Het scherm blijft aan zolang de timer loopt (op toestellen die dat ondersteunen). Piep en trilling werken niet op elke telefoon; op iPhone trilt hij niet.
- **Deeplinks:** `.../#ma`, `#di`, `#do` openen direct die dag.

## Nieuw schema?

Pas `data.js` aan, upload het opnieuw naar GitHub, en verhoog in `sw.js` de regel `const VERSION = "v1";` naar `"v2"` zodat telefoons de nieuwe versie ophalen.
