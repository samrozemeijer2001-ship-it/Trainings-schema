# Checklist: live zetten vóór de presentatie

Reken op ongeveer 20 minuten. Doe het minstens een uur van tevoren, dan heb je tijd om te testen.

## A. Google-script vervangen (±5 min)

1. Open je sheet → **Extensies → Apps Script**.
2. Selecteer alles in `Code.gs`, verwijder het en plak de **nieuwe** `Code.gs` uit de map *google-sheet*.
3. Zet bovenin je eigen wachtwoord terug: `const TEAM_CODE = "...";` en klik op **opslaan**.
4. Kies de functie **setup** en klik **Uitvoeren**. Google vraagt opnieuw om toestemming
   (nu ook voor het kwartier-schema): **Geavanceerd → Ga naar … → Toestaan**.
5. **Implementeren → Implementaties beheren → potloodje → Versie: Nieuwe versie → Implementeren.**
   Let op: *niet* "Nieuwe implementatie", anders verandert de URL.
6. Controle: links in Apps Script → **Triggers** (wekkertje). Daar staat nu `refreshIfChanged`, elke 15 minuten.

## B. App op GitHub zetten (±5 min)

1. Pak de zip uit en open de map **casrc-training**.
2. Open `config.js` en plak je script-URL (dezelfde die nu in je oude `sync.js` op GitHub staat):
   `const SYNC_URL = "https://script.google.com/macros/s/..../exec";`
3. Ga naar je repository op GitHub → **Add file → Upload files**.
4. Sleep **alles wat in de map casrc-training staat** erin (ook de map `icons`), en **niet** de map google-sheet.
5. **Commit changes.** Wacht daarna 3 tot 5 minuten.

Bij volgende updates upload je `config.js` niet meer opnieuw; dan blijft je URL staan.

## C. Testen (±5 min)

1. Open de app-link in een **privévenster** (of op een telefoon die hem nog nooit heeft geopend).
2. Je krijgt het **wachtwoordscherm** → vul het in → **Wie ben jij?** → kies je naam → **Stuur mij een code**
   → vul je e-mail in → vul de code uit je mail in (kijk ook in je spam).
3. Log een set met gewicht, tik hem af.
4. Ga naar **Stats → Nu versturen** (of sluit de app). Kijk in de sheet bij **Log**: je regel staat erin.
5. Wil je Overzicht en Progressie meteen zien? In Apps Script: functie **refreshAll** → **Uitvoeren**.
   Anders gebeurt het vanzelf binnen een kwartier.
6. Open de app nog eens normaal op je eigen telefoon. Vraagt hij nog niet om het wachtwoord, sluit hem dan
   helemaal af en open opnieuw (de oude versie zit nog even in het geheugen).

Gaat er iets mis? Kijk in Stats bij *Delen met trainers*: daar staat of er nog iets wacht of dat versturen mislukte.

## D. Wat je het team vertelt

- **Link + wachtwoord** komen in de groepsapp. Eén keer invullen, daarna nooit meer.
- **Per apparaat één keer inloggen:** naam kiezen, de eerste keer je e-mail invullen, code uit de mail invullen.
  Daarna blijf je ingelogd. Alleen jij kunt bij je eigen trainingen.
- **Op het beginscherm zetten:** iPhone → Deel → Zet op beginscherm. Android → ⋮ → Toevoegen aan startscherm.
- **Wat er gedeeld wordt:** je trainingen (datum, oefening, sets, reps, kg) gaan naar een sheet die alleen
  de trainers/staf kunnen zien. Wie dat niet wil, kiest "Niet delen, alleen op deze telefoon".
- **Nieuwe telefoon of ook op je laptop?** Gewoon opnieuw inloggen met een code: al je trainingen komen mee.
- **Feedback:** het is een eerste versie, fouten of wensen graag melden.

## Als het tijdens de presentatie niet lukt

De app werkt ook zonder internet of als de sheet even niet bereikbaar is: spelers kunnen gewoon trainen
en loggen, en alles wordt later alsnog verstuurd. Je kunt de demo dus altijd laten zien.
