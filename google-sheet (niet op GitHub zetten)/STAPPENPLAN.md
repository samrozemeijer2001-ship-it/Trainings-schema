# Google Sheet koppelen (ongeveer 10 minuten)

Hiermee komen de trainingen van alle spelers automatisch in één Google Sheet,
zodat je kunt zien wie de app gebruikt en hoe iedereen vooruitgaat.

## 1. Sheet en script

1. Ga naar sheets.google.com en maak een **lege spreadsheet**. Noem hem bijvoorbeeld *Cas RC Trainingen*.
2. Klik **Extensies → Apps Script**. Er opent een nieuw tabblad met een leeg bestand `Code.gs`.
3. Verwijder wat er staat en plak de **volledige inhoud** van `Code.gs` uit deze map.
4. Kies bovenin het **wachtwoord** voor de app, bijvoorbeeld:
   `const TEAM_CODE = "Fazant2026";`
   Spelers vullen dit één keer in bij het eerste openen. Wie het niet heeft (bijv. vrienden van spelers), komt de app niet in.
5. Klik op het **opslaan**-icoontje.

## 2. Tabbladen aanmaken

1. Kies bovenin de functie **setup** in het keuzemenu naast "Uitvoeren" en klik **Uitvoeren**.
2. Google vraagt om toestemming: kies je account → **Geavanceerd** → **Ga naar (naam project)** → **Toestaan**.
   Dat is normaal bij een eigen script. Het script vraagt om deze sheet te bewerken, om
   een tijdschema te maken (elk kwartier Overzicht en Progressie bijwerken) en om **e-mail te versturen**
   (de inlogcodes; die gaan vanaf jouw Gmail-adres met als naam "Cas RC Training").
3. In je sheet staan nu vijf tabbladen: **Spelers**, **Log**, **Overzicht**, **Progressie** en **Sessies**.
   Spelers is gevuld met de 1e jaars senioren, Onder 23 en Senioren uit de ledenlijst.

## 3. Publiceren als webapp

1. Klik rechtsboven **Implementeren → Nieuwe implementatie**.
2. Klik op het tandwiel bij "Type selecteren" en kies **Web-app**.
3. Vul in:
   - Uitvoeren als: **Ik**
   - Wie heeft toegang: **Iedereen**
4. Klik **Implementeren** en kopieer de **Web-app-URL** (eindigt op `/exec`).

"Iedereen" is nodig zodat spelers zonder Google-account kunnen insturen.
Spelers loggen nergens in en zien de sheet nooit. Alleen jij (en wie jij uitnodigt) kan de sheet openen.

## 4. URL in de app zetten

1. Open `config.js` in de app-map.
2. Plak de URL op de regel:
   `const SYNC_URL = "https://script.google.com/macros/s/..../exec";`
   Het wachtwoord zet je hier **niet** neer; dat controleert het script.
3. Upload alles naar GitHub.

Bij latere updates van de app upload je `config.js` **niet** opnieuw, dan blijft je URL staan.

## 5. Delen in de groepsapp

Stuur de link en het wachtwoord in de groepsapp. Per apparaat logt een speler één keer in:
1. wachtwoord invullen,
2. zijn naam kiezen,
3. de allereerste keer zijn e-mailadres invullen (dat wordt aan zijn naam gekoppeld),
4. de code van 6 cijfers uit de mail invullen (eventueel in de spam kijken).

Daarna blijft dat apparaat ingelogd. Op een tweede apparaat (bijv. laptop) gaat het net zo, maar hoeft hij
zijn e-mail niet meer in te vullen: de code gaat naar het gekoppelde adres, en al zijn trainingen komen mee.

**Wachtwoord gelekt?** Verander `TEAM_CODE` in het script en publiceer een nieuwe versie (zie "Script aanpassen?").
Iedereen moet dan het nieuwe wachtwoord invullen; hun naam en trainingen blijven bewaard.

## Wat je in de sheet ziet

- **Overzicht**: per speler de laatste training, het aantal trainingen (totaal, laatste 7 en 28 dagen),
  het aantal sets en een status: *actief*, *deze maand*, *inactief* of *nog niet gebruikt*.
- **Log**: één regel per set (datum, speler, training, oefening, set, reps, kg, afgevinkt).
  Past een speler iets aan, dan wordt de bestaande regel bijgewerkt, niet verdubbeld.
- **Progressie**: per speler per oefening één regel met: aantal sessies, eerste en laatste datum,
  topgewicht eerste en laatste keer, alle sets van de laatste keer, beste gewicht (+ datum),
  geschatte 1RM (eerste, laatste, beste), groei in % en het verschil met de vorige keer.
  Filter of sorteer op speler of oefening om te zien hoe iemand vooruitgaat.
- **Spelers**: de namenlijst die spelers in de app te zien krijgen. Voeg namen toe of zet in kolom D **nee** om iemand te verbergen.
  Wijzig de ID's in kolom A niet meer zodra iemand gekozen heeft.
  Kolom E (**E-mail**) wordt gevuld bij de eerste inlog. Een e-mailadres hoort bij één speler.
- **Sessies**: elk ingelogd apparaat (speler, e-mail, soort apparaat, wanneer ingelogd en laatst gebruikt).

**Apparaat afmelden** (bijv. verloren telefoon): verwijder die regel in **Sessies**. Dat apparaat moet dan opnieuw inloggen.
**Ander e-mailadres** (bijv. typfout): pas kolom E in **Spelers** aan, of maak hem leeg; dan vult de speler bij de volgende inlog een nieuw adres in.
**Nieuwe telefoon?** Niets nodig: de speler logt gewoon opnieuw in met een code en krijgt al zijn trainingen terug.

**Daglimiet:** Google laat een gewoon Gmail-account via een script ongeveer 100 mails per dag versturen.
Elke inlog kost één mail; voor een team ruim genoeg.

Spelers die er niet bij staan, kunnen zelf hun naam typen. Die zie je in het overzicht als *niet in lijst*.

**Log** wordt direct gevuld. **Overzicht** en **Progressie** worden elk kwartier opnieuw berekend
(alleen als er iets nieuws binnen is). Pas die twee dus niet met de hand aan.
Meteen bijwerken? Kies in Apps Script de functie **refreshAll** en klik **Uitvoeren**.

**Wanneer komt een training binnen?** De app verstuurt gebundeld: na een minuut zonder nieuwe invoer,
en meteen als een speler de app sluit of wegswipet. Offline wacht het tot er weer internet is.

**Meerdere apparaten:** na inloggen en bij elke keer openen haalt de app op wat er al in de sheet staat,
ook wat op een ander apparaat is gelogd. Handmatig: Stats → *Haal mijn trainingen op*.
Hetzelfde getal tegelijk op twee apparaten aanpassen: wat al op het apparaat stond, blijft staan.

## Script aanpassen of nieuwe versie plakken?

1. Plak de nieuwe `Code.gs` over de oude heen en zet je eigen `TEAM_CODE` er weer in.
2. Draai **setup** nog een keer (veilig: bestaande namen en trainingen blijven staan, ontbrekende tabbladen komen erbij).
3. **Implementeren → Implementaties beheren → potloodje → Versie: Nieuwe versie → Implementeren**.
   De URL blijft dan hetzelfde, dus aan de app hoeft niets te veranderen.

## Stafcode (voor later: coach-pagina)

Bovenin `Code.gs` staat ook `STAFF_CODE`. Daarmee kan een aparte coach-/stafpagina straks alle data ophalen.
Laat hem staan zoals hij is zolang die pagina er nog niet is: zolang hij met "VERANDER" begint, staat het uit.
Kies later een andere code dan het spelerswachtwoord en deel hem alleen met de staf.

## Privacy

Je verzamelt nu trainingsgegevens en e-mailadressen van spelers. De e-mailadressen worden alleen gebruikt om in te loggen. Vertel het team wat je bijhoudt, wie het kan zien
(alleen wie toegang heeft tot de sheet) en waarvoor. Deel de sheet alleen met trainers die het nodig hebben.
Spelers kunnen bij het eerste openen kiezen voor "Niet delen, alleen op deze telefoon".
Zonder wachtwoord krijgt niemand de namenlijst te zien, en zonder inlogcode uit de eigen mailbox kan niemand bij andermans trainingen. Het trainingsschema zelf staat wel in de openbare app-code op GitHub.
