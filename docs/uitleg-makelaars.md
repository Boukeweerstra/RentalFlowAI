# RentalFlowAI uitleggen aan makelaars

Doel van dit document: je kunt het product in 30 seconden, in 5 minuten en in een uur uitleggen, en je weet wat je wel en niet mag beloven.
Stand: 6 oktober 2026. De uitlegpagina in de app (`/`) volgt dezelfde lijn.

## 1. In 30 seconden

> "Op de woningpagina van uw website komt een knop **Aanvraag**. De woningzoeker vult een formulier in dat alleen de vragen stelt die bij déze woning horen, en ziet vooraf wat de eisen zijn.
> Een eerste check met vaste regels sorteert elke aanvraag in drie groepen: geschikt, zelf beoordelen, of niet passend. U ziet het in één overzicht, met telefoon en e-mail direct bij de hand.
> De computer wijst nooit iemand af. U beslist."

Drie dingen die de makelaar moet onthouden: **één knop**, **drie groepen**, **u beslist**.

## 2. Voor wie en welk probleem

- Verhuurmakelaars en verhuurbeheerders met veel aanvragen per woning.
- Nu: aanvragen per mail, telefoon of verschillend formulier; elke keer handmatig nalopen op inkomen, proeftijd, huisdieren, bewoners; veel aanvragen die de eisen niet halen.
- Met RentalFlowAI: vaste, volledige aanvragen; de eerste check gebeurt vooraf; de makelaar begint bij de aanvragen die aandacht verdienen.

## 3. Wat de woningzoeker ziet en wat de makelaar ziet

| De woningzoeker | De makelaar |
|---|---|
| Een knop **Aanvraag** op de woningpagina | Een melding per mail met een link naar de aanvraag |
| Eerst de eisen van de woning, in gewone taal | Een dashboard met drie groepen: Suitable, Review, Unsuitable |
| Alleen de vragen die bij de woning horen (geen huisdiervraag als huisdieren mogen) | Telefoon en e-mail groot bovenaan, met bel-, mail- en kopieerknop |
| Een waarschuwing vooraf als het niet lijkt te passen, maar hij mag altijd versturen | De redenen waarom een aanvraag in een groep staat, en een voorgestelde volgende stap |
| Een neutrale bevestiging: "u hoort van ons" | Status (nieuw, benaderd, bezichtiging gepland, afgerond), notities, een logboek, zoeken en filteren |

## 4. Demo van 5 minuten

### Voorbereiding (10 minuten van tevoren)
1. Start de app: open PowerShell en plak `cd C:\dev\rentalflowai`, daarna `npm.cmd run dev -- -p 3100`. Wacht tot er "Ready" staat.
2. Open in venster 1 `http://localhost:3100/` (de uitlegpagina).
3. Open in venster 2 `http://localhost:3100/login` en **log vooraf in** (zodat u het wachtwoord niet voor het publiek typt). Laat het dashboard open staan.
4. Open in venster 3 `http://localhost:3100/demo-host.html` (de nagebootste makelaarssite).
5. Controleer dat Make aan staat: een testaanvraag stuurt een mail naar het adres uit de demo-instelling (uw eigen mailbox).
6. **Noodplan:** gaat iets mis (internet, Make), gebruik dan `http://localhost:3100/dashboard/preview`: hetzelfde dashboard met verzonnen gegevens, zonder inloggen. Het werkt alleen op uw eigen computer.

### Het verhaal (met tijden)

| Min | Wat u doet | Wat u zegt |
|---|---|---|
| 0:00 | Venster 1: de uitlegpagina, blijf bovenaan | "Dit is RentalFlowAI in één zin: een aanvraagknop op uw woningpagina die de aanvragen voorsorteert. De computer wijst nooit af, u beslist." |
| 0:30 | Scroll naar **Zo werkt het** | "Vier stappen: een knop, alleen de nodige vragen, een eerste check, en u beslist." |
| 1:00 | Venster 3: de demosite, kies woning 1001 | "Dit is een nagebootste makelaarssite. Bij de woning staat naast de gewone knoppen de knop Aanvraag. Die komt uit één regel code." |
| 1:30 | Klik **Aanvraag** | "Het formulier opent op de pagina zelf. Bovenaan staan de eisen van déze woning. Zo weet de woningzoeker vooraf waar hij aan toe is." |
| 2:00 | Klik **Twijfelgeval** (het blauwe demoblok) en daarna onderaan **Aanvraag versturen** (wacht eerst 10 seconden: dat is de bescherming tegen bots) | "Voor de demo vul ik een verzonnen aanvraag in. Dit is iemand die nog in de proeftijd zit en net onder de inkomensgrens zit; in de toelichting staat dat het contract daarna vast wordt. Bij een woning waar een garantsteller mag, zegt de toelichting dat de ouders garant willen staan." |
| 3:00 | Venster 2: het dashboard. De nieuwe aanvraag verschijnt vanzelf onder **Review** | "Zonder verversen staat de aanvraag er. Ze staat onder Review: zelf beoordelen. U ziet welk punt: proeftijd en kort dienstverband." |
| 3:30 | Klik **Details en acties**; wijs naar de samenvatting (als AI aan staat) en de volgende stap | "De computer stelt de volgende stap voor: vraag een werkgeversverklaring. Als AI aan staat ziet u hier ook een samenvatting van de toelichting. Dat is een hulpmiddel; de originele tekst staat erboven." |
| 4:00 | Klik **Concept maken met AI** (alleen als AI aan staat) | "Wilt u informatie opvragen, dan schrijft de AI een concept. Er is geen verzendknop: u leest het, past aan en verstuurt zelf." |
| 4:30 | Vink **Benaderd** aan; wijs op de status | "Heeft u gebeld, dan vinkt u het aan. De status volgt, en het staat in het logboek." |
| 5:00 | Terug naar de uitlegpagina, sectie **De drie groepen** | "En u bepaalt hoe streng: per eis hard of zelf bekijken. Vragen?" |

Tip: laat bij een tweede demo ook **Past niet** zien. De woningzoeker krijgt dan vooraf een waarschuwing, maar mag toch versturen. De aanvraag komt dan onder Unsuitable, en u ziet waarom.

Na de demo: verwijder de testaanvragen in het dashboard (**Details en acties** > **Aanvraag verwijderen**) en de rijen in de Google Sheet.

## 5. Uitleg per onderdeel, in gewone taal

**De drie groepen**
- *Suitable*: alle eisen van de woning zijn gehaald.
- *Review*: een punt wil de makelaar zelf bekijken, bijvoorbeeld proeftijd, garantsteller, inkomen net onder de grens.
- *Unsuitable*: een harde eis wordt niet gehaald. Het is een indicatie; de makelaar kan de groep altijd wijzigen.

**Hoe streng**: per woning en per eis wordt vastgelegd of het hard is of een punt om zelf te bekijken. Ook een marge onder de inkomensgrens is mogelijk. Nu zetten wij dat voor de makelaar klaar; een scherm om het zelf te wijzigen is er nog niet.

**AI**: alleen voor tekst, standaard uit. Samenvatting van de toelichting van de woningzoeker en een conceptmail bij ontbrekende informatie. De AI krijgt geen naam, mail of telefoon, beslist niets en verstuurt niets.

**Privacy en beveiliging**: geen ID-kopie of BSN; standaard zes maanden bewaren; verwijderen met één knop; inloggen verplicht; een kantoor ziet alleen zijn eigen aanvragen; geen cookies op het formulier.

## 6. Lastige vragen en eerlijke antwoorden

| Vraag | Antwoord |
|---|---|
| Wijst het systeem mensen af? | Nee. Het sorteert voor en laat de redenen zien. Een medewerker beslist altijd; de woningzoeker krijgt geen afwijzing van de computer. |
| Is dit niet discriminerend? | De regels gebruiken alleen de eisen die de makelaar zelf aan de woning stelt (inkomen, proeftijd, huisdieren, bewoners). Er worden geen kenmerken als afkomst of geslacht gebruikt en de AI beslist niet. Maar ook eisen kunnen onredelijk zijn: dat blijft de verantwoordelijkheid van de makelaar. |
| Wat als de AI iets verkeerds zegt? | Daarom staat de originele tekst ernaast, kan de AI nooit een groep wijzigen of iets versturen, en wordt een tekst met een oordeel of gevoelige onderwerpen automatisch tegengehouden. We hebben dit op vijandige teksten getest, met een kleine steekproef. |
| Is het AVG-proof? | Het is ontworpen met de AVG in gedachten (minimaal vragen, bewaartermijn, verwijderen, logboek), maar het is **nog niet juridisch getoetst**. De privacyverklaring en de verwerkersafspraken zijn concepten. Voor echte aanvragen moet dat eerst gebeuren. |
| Waar staan de gegevens? | In een database in Europa (Ierland). Hosting, database, doorsturen van de mail en AI zijn verwerkers; die afspraken worden vastgelegd vóór echt gebruik. Een deel van die partijen kan buiten de EU verwerken, met de gebruikelijke waarborgen. |
| Werkt het met ons woningbeheersysteem? | Nog niet. Er is geen koppeling met pakketten zoals Realworks; dat vraagt eigen onderzoek per pakket. Nu komt de aanvraag per mail en in het dashboard, met een Google Sheet als back-up. |
| Wat kost het? | Dat is nog niet bepaald. We willen eerst horen wat het waard is. |
| Kunnen we de eisen zelf aanpassen? | Nu zetten wij ze voor u klaar, per woning. Zelf aanpassen in een scherm komt later. |
| Hoe krijgen we de knop op onze site? | Eén regel code op de woningpagina, met het woning-id. Het formulier laadt alleen op uw eigen domein. |
| Wat als het systeem uitvalt? | Een aanvraag wordt eerst opgeslagen en daarna pas verstuurd; lukt de ene route niet, dan staat de aanvraag er via de andere nog. Er is nog geen formele garantie of monitoring: het is een prototype. |
| Kunnen woningzoekers documenten uploaden? | Nog niet. Het formulier noemt welke documenten later nodig zijn; uploaden is nog niet gebouwd. |
| Kan de woningzoeker meerdere woningen aanvragen? | Ja, per woning een eigen aanvraag. Dubbele aanvragen voor dezelfde woning door dezelfde persoon binnen 24 uur worden tegengehouden. |

## 7. Wat u wel en niet mag beloven

| Wel zeggen | Niet beloven |
|---|---|
| Eén knop, drie groepen, u beslist | Dat het AVG-proof is of door een jurist is goedgekeurd |
| De computer wijst nooit af | Een prijs, een leverdatum of beschikbaarheid |
| AI is een standaard-uit hulpmiddel zonder beslissing | Dat de AI altijd klopt |
| Het werkt in een demo en is getest op een testset van 40 verzonnen gevallen | Dat het op echte aanvragen al zo goed werkt |
| Wij zetten de eisen per woning voor u klaar | Zelf wijzigen van eisen in een scherm (nog niet gebouwd) |
| De data worden niet langer bewaard dan nodig, en u kunt verwijderen | Koppelingen met woningbeheersystemen, documenten uploaden, meerdere medewerkers per kantoor |

## 8. Vragen aan de makelaar (voor uw onderzoek)

1. Hoeveel aanvragen krijgt u gemiddeld per woning, en hoeveel daarvan voldoen niet aan de eisen?
2. Hoe lang doet u over het nalopen van een aanvraag nu? Wat kost u het meeste tijd?
3. Welke eisen stelt u per woning, en welke zijn echt hard? Zijn er eisen die u vaak met een uitzondering toestaat?
4. Wat zou u onterecht vinden als de computer dat als "niet passend" aanmerkte? (Bijvoorbeeld net onder de inkomensgrens.)
5. Met welk systeem werkt u nu voor woningen en aanvragen? Wat moet er gekoppeld worden?
6. Wie in uw kantoor kijkt naar aanvragen, en wie moet ze mogen zien?
7. Zou u een AI-samenvatting of een conceptmail gebruiken? Onder welke voorwaarden?
8. Wat moet er zeker in het dashboard staan wat er nu niet staat?

Noteer de antwoorden in een document zonder persoonsgegevens; gebruik ze voor de keuzes in het projectverslag.

## 9. Woordenlijst

| Woord | Betekenis |
|---|---|
| Tenant | Een kantoor (klant) in het systeem |
| Widget | Het stukje code dat de Aanvraag-knop op de site zet |
| Precheck, eerste check | De vaste regels die een aanvraag voorsorteren |
| Suitable, Review, Unsuitable | De drie groepen van de eerste check |
| Dashboard | Het beveiligde overzicht voor de makelaar |
| Verwerker | Een partij die gegevens verwerkt in opdracht van de verantwoordelijke (bijv. hosting) |
| Prompt-injectie | Een tekst die een AI probeert te laten doen wat de schrijver wil ("negeer alle regels") |
