# Draaiboek voor Vyond: uitlegvideo RentalFlowAI

Doel: een video van ongeveer **3 minuten 45** voor de minor, met een AI-stem, die de leeruitkomsten **LU 2, 3, 4** aantoont en **LU 5** kort raakt.
Gebruik: werk de scènes van boven naar beneden af. Per scène staat de **voorleestekst** (plak die in de tekst-naar-spraak van Vyond), wat er **in beeld** komt, en welke **afbeelding** je nodig hebt.

> **Eerlijk over wat hierin staat:** elke bewering is gecontroleerd tegen het project (testset van 40 gevallen: 78% naar 85%; 63, 73, 12, 11 en 11 geautomatiseerde controles; zes maanden bewaartermijn; verwijderknop met logboek zonder persoonsgegevens). Wat nog **niet** gedaan is, staat er niet als gedaan: validatie met een echte makelaar en de analyse van de Europese AI-verordening. Voor die analyse staat in scène 7 een optionele zin tussen haakjes; gebruik die pas nadat stap 2.4 van `docs/stappenplan-video.md` is gedaan.

## 0. Instellingen in Vyond (eenmalig)

1. Nieuwe video, formaat **16:9**.
2. **Stijl:** kies een rustige, zakelijke stijl (bijvoorbeeld *Business Friendly* of *Contemporary*; de namen kunnen in jouw account iets anders zijn).
3. **Stem:** kies bij tekst-naar-spraak een **Nederlandse** stem als die er is. Luister één zin. Staat er geen goede Nederlandse stem bij, gebruik dan Clipchamp voor de stem (zie het stappenplan).
4. **Eigen afbeeldingen:** je kunt schermafbeeldingen uploaden (*Media > Uploaden*). Vyond tekent geen echte schermen; die komen van jou (lijst onderaan).
5. **Controleer** of je abonnement exporteren en de lengte toestaat voordat je veel tijd investeert.
6. **Vyond Go (optioneel):** als je abonnement een functie heeft om een video uit een tekst te laten maken, plak dan de tekst onder "Startprompt" en pas het resultaat per scène aan met dit draaiboek.

### Startprompt (optioneel, voor een eerste concept)
```
Maak een uitlegvideo van ongeveer 4 minuten in het Nederlands, zakelijke stijl, voor studenten en docenten. Onderwerp: RentalFlowAI, een hulpmiddel waarmee verhuurmakelaars huuraanvragen krijgen die al volledig en voorgesorteerd zijn. Een woningzoeker klikt op een knop Aanvraag, vult alleen de vragen in die bij de woning horen, en een eerste check met vaste regels sorteert de aanvraag in drie groepen: geschikt, zelf beoordelen, niet passend. De computer wijst nooit af, de makelaar beslist. Toon daarna kort de techniek (regels, workflow, database, AI alleen voor tekst), een meting (testset van 40 aanvragen: 78 naar 85 procent), en ethiek en privacy (AVG, bewaartermijn, verwijderen). Eindig met een korte reflectie en het volgende stap: een gesprek met een echte makelaar.
```

## 1. Scènes

Totaal ongeveer 500 woorden voorleestekst. Een AI-stem leest ongeveer 140 tot 160 woorden per minuut.

### Scène 1. Doel en probleem (0:00 tot 0:20) · LU 5
**In beeld (Vyond):** kantoor- of studieruimte, een student aan een laptop. Titeltekst groot in beeld: **RentalFlowAI**. Kleinere tekst eronder: "Minor AI · 2026 · Stem: AI-gegenereerd". Rustige start, langzame inzoom.
**Voorleestekst:**
```
Hallo, ik ben [jouw naam], student bij de minor AI. In deze video laat ik zien wat ik tot nu toe heb gemaakt: RentalFlowAI, een hulpmiddel voor verhuurmakelaars. De stem in deze video is gemaakt door AI.
```

### Scène 2. Het probleem (0:20 tot 0:40) · LU 2
**In beeld (Vyond):** een makelaar achter een bureau, mailtjes en formulieren stapelen zich op (props: enveloppen, telefoon, klok). Pictogram van een vinkje en een kruisje boven de stapel.
**Tekst op scherm:** "Veel aanvragen. Handmatig nalopen."
**Voorleestekst:**
```
Een makelaar krijgt veel aanvragen voor één woning, per mail en per telefoon. Elke aanvraag moet worden nagelopen op inkomen, proeftijd, huisdieren en aantal bewoners. Dat kost tijd, en veel aanvragen voldoen niet aan de eisen.
```

### Scène 3. De oplossing in actie (0:40 tot 1:10) · LU 2
**In beeld:** schermafbeeldingen met een zachte overgang: **S1** demosite met de knop Aanvraag, **S2** het formulier met het blok "Wat er voor deze woning nodig is", **S3** het dashboard met de drie groepen. Een pijl of cirkel markeert elke keer het belangrijkste (de knop, het eisenblok, de groep Review).
**Tekst op scherm:** "Aanvraag-knop → eisen → eerste check → dashboard".
**Voorleestekst:**
```
Mijn oplossing is een knop Aanvraag op de woningpagina. De woningzoeker ziet eerst de eisen van de woning, en vult alleen de vragen in die erbij horen. Een eerste check met vaste regels sorteert de aanvraag in drie groepen: geschikt, zelf beoordelen, of niet passend. De computer wijst nooit iemand af. De makelaar beslist.
```

### Scène 4. Eisen zelf instellen (1:10 tot 1:30) · LU 2, 4
**In beeld:** **S4** het eisenscherm, daarna **S5** de inkomenstest met de uitkomst Review. Markeer de marge en het resultaat.
**Tekst op scherm:** "Hard of zelf bekijken · marge · direct testen".
**Voorleestekst:**
```
De makelaar stelt zijn eisen zelf in, per woning. Bij elke eis kiest hij: past niet, of zelf bekijken. Met een marge komt een inkomen net onder de grens onder zelf beoordelen terecht, en niet onder niet passend. En met een voorbeeldinkomen test hij meteen wat er gebeurt.
```

### Scène 5. Techniek en AI-technieken (1:30 tot 2:10) · LU 4
**In beeld:** **S6** schema met vijf blokken en pijlen: Formulier → Regels → Database → Dashboard, en Workflow (melding per mail) en AI-laag (alleen tekst). Laat de blokken één voor één verschijnen terwijl ze genoemd worden.
**Tekst op scherm:** "Regels: voorspelbaar · AI: alleen tekst · Mens beslist".
**Voorleestekst:**
```
Cijfers en ja-nee-vragen laat ik door vaste regels doen, want die zijn voorspelbaar en uit te leggen. Een workflow in Make verstuurt de melding, en de database bewaart de gegevens, afgeschermd per kantoor. AI gebruik ik alleen voor tekst: een samenvatting van de toelichting, en een concept-mail die de makelaar zelf leest en verstuurt. Ik heb dit gebouwd met prompting en met Claude als ontwikkelpartner. De AI krijgt geen naam, mailadres of telefoonnummer, en kan nooit de groep van een aanvraag veranderen.
```

### Scène 6. Meten en leren (2:10 tot 2:50) · LU 2, 4
**In beeld:** **S7** een eenvoudige grafiek of twee grote getallen: **78%** daarna **85%** (testset 40 gevallen). Daarna **S8** twee tekstkaarten naast elkaar: "Prompt versie 1: herhaalde de gezondheidsreden" en "Prompt versie 2: noemt alleen de woonwens". Onderaan een duidelijke, kleine regel: "Eigen labels · 40 gevallen · nog niet getest met een echte makelaar".
**Tekst op scherm:** "78% → 85% · Prompt v1 → v2 · Eerlijk over de grenzen".
**Voorleestekst:**
```
Ik heb mijn werk gemeten. Bij een testset van veertig verzonnen aanvragen klopten de regels eerst bij 78 procent. Na het toevoegen van een instelbare marge werd dat 85 procent. De eerste versie van mijn prompt liet bij een toelichting over een ziekte die ziekte herhalen, en dat is gevoelige informatie. In de tweede versie gebeurt dat niet meer, en een tweede controle in de code houdt zulke teksten tegen. Let op: de labels heb ik zelf gemaakt, het zijn maar veertig gevallen, en echte validatie met een makelaar volgt nog.
```

### Scène 7. Verantwoord gebruik (2:50 tot 3:30) · LU 3
**In beeld:** een schild- of slotpictogram. Vier korte tekstpunten die één voor één verschijnen: "De computer wijst nooit af", "Zo min mogelijk gegevens", "Maximaal 6 maanden bewaren, verwijderen met één knop", "Mens houdt toezicht". Eventueel **S9** een stukje van het verwerkingsregister of de verwijderknop (zonder echte gegevens).
**Tekst op scherm:** "AVG · transparantie · menselijk toezicht".
**Voorleestekst:**
```
Verantwoord gebruik was voor mij een ontwerpkeuze. De computer wijst nooit af, en elke aanvraag blijft zichtbaar. Ik vraag zo min mogelijk gegevens, bewaar ze maximaal zes maanden, en een makelaar kan een aanvraag met één knop verwijderen, waarbij het logboek geen persoonsgegevens bevat. Voor de AVG heb ik een verwerkingsregister en een korte risicoanalyse geschreven. [OPTIONEEL, ALLEEN NA STAP 2.4: Voor de Europese AI-verordening heb ik beoordeeld in welke risicoklasse dit valt, en daarom blijft menselijk toezicht verplicht.] Mijn aanbeveling: gebruik AI alleen als hulpmiddel, leg altijd uit wat het doet, en test op oneerlijke uitkomsten.
```

### Scène 8. Reflectie en vervolg (3:30 tot 3:50) · LU 5
**In beeld:** weer de student aan de laptop, nu met een denkwolk of een rij vinkjes: "Plannen · Testen · Zelf kiezen". Daarna de slotslide met de titel en "Bedankt".
**Tekst op scherm:** "Volgende stap: valideren met een echte makelaar".
**Voorleestekst:**
```
Wat heb ik geleerd? Dat ik AI het beste kan inzetten door eerst te plannen, alles te testen, en zelf de keuzes te blijven maken, bijvoorbeeld wat ik juist niet aan AI overlaat. Mijn volgende stap is een gesprek met een echte makelaar, om dit te valideren. Bedankt voor het kijken.
```

## 2. Uitspraak voor de AI-stem

Een Nederlandse stem leest Engelse en vaktermen soms vreemd. Luister elke scène terug. Klinkt een woord fout, vervang het dan **alleen in de voorleestekst** door de spelling hieronder (de tekst op het scherm blijft zoals hij is).

| Woord | Probeer in de voorleestekst |
|---|---|
| RentalFlowAI | Rental Flow A I |
| Make | Meek |
| Supabase | Soepa-bees |
| Claude | Klood |
| AVG | A V G |
| DPIA | D P I A |
| AI | A I |
| prompt, prompting | promt, prompting |

## 3. Afbeeldingen die je nodig hebt

Maak ze met **Windows + Shift + S** (knipprogramma) vanuit de ingebouwde voorbeeldpagina's. Die tonen **alleen verzonnen gegevens**, dus er staat niets gevoeligs op. Zet het browservenster op 100% zoom, lichte weergave, en sla op als PNG in een map `video\schermen\` met de namen hieronder. Start de app eerst (`npm.cmd run dev -- -p 3100` in `C:\dev\rentalflowai`).

| Nr. | Bestandsnaam | Adres | Wat moet zichtbaar zijn |
|---|---|---|---|
| S1 | `s1-demosite.png` | `http://localhost:3100/demo-host.html` | De demo-makelaarssite met de knop **Aanvraag** |
| S2 | `s2-formulier.png` | Op S1 op **Aanvraag** klikken | Het formulier met het groene blok "Wat er voor deze woning nodig is" bovenaan |
| S3 | `s3-dashboard.png` | `http://localhost:3100/dashboard/preview` | De drie groepen met kleur, en de overzichtstegels bovenin |
| S4 | `s4-eisenscherm.png` | `http://localhost:3100/dashboard/preview/woningen/voorbeeld-1001` | Het eisenformulier met rechts het voorbeeld voor de woningzoeker |
| S5 | `s5-inkomenstest.png` | Zelfde pagina: vul bij "Probeer een inkomen" `5400` in | De uitkomst **Review** met de reden "inkomen te laag" |
| S6 | `s6-schema.png` | Maakt Claude (visualize) | Schema: Formulier, Regels, Database, Dashboard, Workflow, AI-laag |
| S7 | `s7-meting.png` | Maakt Claude uit `docs/rapport-regels-basis.md` | Twee grote getallen: 78% en 85% met "40 gevallen" |
| S8 | `s8-prompt.png` | Maakt Claude uit `docs/ai.md` | Prompt v1 tegenover v2, zonder echte gegevens |
| S9 | `s9-privacy.png` | `http://localhost:3100/privacy/demo` | De privacyverklaring (concept) of een stukje van het verwerkingsregister |

Zeg het als je wilt dat ik S6, S7 en S8 nu maak; S1 tot en met S5 en S9 moet jij zelf knippen of kan ik met de ingebouwde browser voor je vastleggen (lagere resolutie).

## 4. Controle voordat je exporteert

- [ ] Totale lengte 3 tot 4 minuten (de stem per scène terugluisteren en tellen)
- [ ] Er staat een duidelijke vermelding dat de stem AI-gegenereerd is (scène 1)
- [ ] De drie beperkingen worden genoemd (eigen labels, 40 gevallen, geen echte makelaar) in scène 6
- [ ] Scène 7: de AI-verordening alleen genoemd als de analyse echt is gedaan
- [ ] Geen sleutels, wachtwoorden of echte persoonsgegevens in beeld
- [ ] Alle afbeeldingen komen van de voorbeeldpagina's (verzonnen gegevens)
- [ ] Geëxporteerd als MP4 en afgespeeld zonder internet
- [ ] Tijdcodes per leeruitkomst genoteerd: LU 2 (scène 2 tot 4 en 6), LU 4 (scène 4 tot 6), LU 3 (scène 7), LU 5 (scène 1 en 8)

## 5. Wat deze video nog niet bewijst

Zeg dit eerlijk als een docent ernaar vraagt:
- **LU 2:** de oplossing is gebouwd en technisch getest, maar nog niet gevalideerd met een gebruiker of opdrachtgever, en tijdswinst is niet gemeten.
- **LU 3:** AVG-onderdelen zijn concepten en niet juridisch getoetst; de analyse van de AI-verordening is nog niet gedaan (stap 2.4).
- **LU 4:** er is geen machine learning gebruikt; de keuze voor vaste regels, een workflowtool en een taalmodel voor tekst is bewust gemaakt en onderbouwd.
- **LU 5:** de reflectie is kort; een uitgebreidere reflectie hoort in je verslag.
