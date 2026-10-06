# Stappenplan: uitlegvideo voor de minor

**User story:** Als AI-ontwikkelaar wil ik via verschillende connectors via Claude een uitlegvideo maken over wat ik tot nu toe heb gedaan en gemaakt, zodat ik die voor mijn minor kan laten zien en verschillende leeruitkomsten kan voltooien.

Stand: 6 oktober 2026. Doel: van "connectors koppelen" tot een **MP4-bestand op je laptop** dat je overal kunt afspelen.

## 0. Wat ik heb vastgesteld over jouw laptop en over Claude (belangrijk voor de keuzes)

| Onderdeel | Stand | Gevolg voor het plan |
|---|---|---|
| Verbonden connectors in Claude | **Claude Docs, Google Drive, Notion, Supabase, Vercel, visualize** | Hiermee kan ik documenten schrijven, bestanden bewaren, een draaiboek maken, bewijs uit de database halen en schema's tekenen |
| Niet verbonden | Claude in Chrome (extensie), Figma, Slack e.a. | Niet nodig. Chrome-extensie is optioneel |
| PowerPoint | **Geïnstalleerd** | Kan slides afspelen, je stem opnemen en exporteren naar **MP4** |
| Windows-opname (Xbox Game Bar, `Win+G`) | Standaard in Windows 11 | Schermopnames van de demo zonder extra programma |
| Video-editor | Clipchamp hoort standaard bij Windows 11 (controleren in stap 1.4) | Stukken aan elkaar plakken, ondertitels |
| ffmpeg, OBS, VLC | **Niet geïnstalleerd** (wel te installeren met `winget`, alleen met jouw akkoord) | Niet nodig voor het basisplan |
| Nederlandse computerstem | **Geen** (alleen Engelse stemmen: Zira en David) | Claude kan **geen** goede Nederlandse voice-over genereren. Jij spreekt het zelf in. Dat past ook beter bij een minor-presentatie |
| Microfoon | Aanwezig (Microphone Array) | Een headset of een rustige ruimte geeft een beter resultaat |

**Eerlijk over wat Claude hier wel en niet kan:** Claude schrijft het draaiboek en de slides, verzamelt bewijs en screenshots, tekent schema's en controleert alles. Claude kan zelf geen video renderen of inspreken in deze omgeving. Het opnemen en samenvoegen doe jij met PowerPoint en Windows, volgens stappen die ik je klik voor klik geef.

**Gekozen route (aanbevolen):** *PowerPoint-slides van Claude + korte schermopnames van de demo + jouw eigen stem*, samengevoegd en geëxporteerd als MP4.

---

## Fase 1. Connectors koppelen en testen (ongeveer 30 minuten)

| # | Wie | Stap | Klaar als |
|---|---|---|---|
| 1.1 | Jij | Open in de Claude-app de instellingen voor **Connectors** en controleer dat **Google Drive, Notion, Supabase, Vercel en Claude Docs** op *Verbonden* staan. Verbind wat ontbreekt. | Vijf vinkjes "verbonden" |
| 1.2 | Claude | **Testen per connector** (kleine, onschuldige proef): Supabase (tabellen en migraties ophalen), Google Drive (testbestand uploaden in een nieuwe map `Minor-video`), Notion (testpagina maken), Claude Docs (testdocument), visualize (testschema). | Elke connector geeft een succesmelding; testbestanden weer verwijderd |
| 1.3 | Samen | Bekijk wat de Vercel-koppeling mag. Mijn toegang tot jouw team gaf eerder een 403; als dat zo blijft, laten we Vercel weg en gebruiken we alleen jouw eigen screenshots van de Vercel-site. | Besluit: Vercel wel of niet als bewijs |
| 1.4 | Jij | Controleer of **Clipchamp** (zoek in het Startmenu) en **Xbox Game Bar** (`Win+G`) werken. Test een opname van 10 seconden met `Win+Alt+R`. | Opname staat in *Video's > Captures* en speelt af met geluid |
| 1.5 | Jij | Optioneel: installeer de Claude in Chrome-extensie als je wilt dat ik je echte, ingelogde dashboard kan bedienen tijdens het voorbereiden. | Extensie "verbonden" (mag overgeslagen worden) |

## Fase 2. Leeruitkomsten en verhaal (ongeveer 45 minuten)

| # | Wie | Stap | Klaar als |
|---|---|---|---|
| 2.1 | **Jij** | Stuur me de **officiële lijst leeruitkomsten** van je minor (tekst of foto van je planning). Ik heb die lijst niet, dus ik ga niets raden. Zet erbij welke je met deze video wilt afronden. | Lijst bij mij |
| 2.2 | Claude | Maak een **tabel: leeruitkomst, bewijs in het project, waar in de video**. Voorbeelden van bewijs dat al bestaat: testset en meting (`docs/rapport-regels-basis.md`), AI-vergelijking en prompt-iteraties (`docs/ai.md`), ethiek en privacy (`docs/dpia.md`, `docs/verwerkingsregister.md`), veiligheidstests (73 AI-tests), de database en afscherming. | Tabel in Notion en in `docs/`; elke uitkomst heeft minstens één bewijs |
| 2.3 | Claude | Stel het **verhaal** voor (zie hieronder), met tijden en per hoofdstuk wat getoond wordt. | Jij hebt het goedgekeurd of aangepast |
| 2.4 | Jij | Kies de **lengte** (voorstel: 8 tot 10 minuten) en de **doelgroep** (docenten en medestudenten). | Besluit genoteerd |

**Voorgestelde opbouw (ongeveer 10 minuten):**
1. Probleem en doel (1:00)
2. De oplossing in beeld: demo van woningzoeker en dashboard (2:00)
3. Woningen en eisen zelf instellen (1:00)
4. De techniek en de connectors: Supabase, Make, Vercel, OpenAI, en hoe ik met Claude heb gebouwd (1:30)
5. AI waar het helpt: samenvatting en conceptmail, prompt-versies en wat ik leerde (1:30)
6. Meten in plaats van geloven: testset, regels tegen AI, de beperkingen van mijn meting (1:30)
7. Ethiek en privacy: de computer wijst nooit af, AVG, DPIA, gevoelige onderwerpen (1:00)
8. Terugblik, beperkingen en volgende stappen (0:30)

## Fase 3. Bewijs en beeldmateriaal verzamelen (ongeveer 1 uur, grotendeels Claude)

| # | Wie | Stap | Klaar als |
|---|---|---|---|
| 3.1 | Claude | **Bewijs uit Supabase** via de connector: lijst van tabellen, de afschermingsregels (RLS), de migraties, de advieslijst (security advisor). Alles zonder persoonsgegevens. | Een overzicht in `video/bewijs/` en in Notion |
| 3.2 | Claude | **Kerngetallen** uit de repo: aantal commits, bestanden, tests (63 + 73 + 12 + 11 + 11), documenten, migraties. | Een pagina met getallen en de commando's waarmee ze zijn berekend |
| 3.3 | Claude | **Screenshots** met de ingebouwde browser, alleen van verzonnen gegevens: startpagina, demosite, formulier (drie scenario's), dashboard (voorbeeld), eisenscherm, inkomenstest. | Map `video/schermen/` met genummerde PNG's |
| 3.4 | Claude | **Schema's** met de visualize-connector: architectuur (widget, formulier, regels, Supabase, Make, dashboard, AI) en de route van een aanvraag. | Twee à drie duidelijke schema's als afbeelding |
| 3.5 | Claude | **Meetresultaten** als grafiek of tabel: regels 78% naar 85%, AI-proef (v1 tegenover v2 van de prompt), de vondsten van de tests (een bug die de tests vonden, de gezondheidsvermelding die de eerste prompt liet doorgaan). | Eén "lessons learned"-pagina met bewijs |
| 3.6 | Jij | **Reset de demo-omgeving:** verwijder testaanvragen, controleer dat de app draait (`http://localhost:3100`) en dat je ingelogd bent in het dashboard. Ik lever hiervoor een controlescript (zie 5.1). | Script meldt "klaar voor opname" |

## Fase 4. Draaiboek en slides (ongeveer 1,5 uur, Claude met jouw feedback)

| # | Wie | Stap | Klaar als |
|---|---|---|---|
| 4.1 | Claude | **Draaiboek** per hoofdstuk: wat je zegt (spreektaal, ongeveer 130 woorden per minuut), wat er op het scherm staat, welke tijd. Opgeslagen als Claude Docs-document en in Notion. | Jij hebt het gelezen en aangepast |
| 4.2 | Claude | **Slides** (PowerPoint, 16:9, grote lettertypen, geen lange tekst) met de schema's en screenshots, en de sprekerstekst in de notities. | `.pptx` gedownload naar je laptop en een kopie op Google Drive |
| 4.3 | Jij | Lees het draaiboek **hardop** voor met een stopwatch. Streep weg wat te lang is. | Past binnen de gekozen lengte |
| 4.4 | Claude | Verwerk jouw aanpassingen; maak de definitieve versie. | Versie "definitief" in Drive en op de laptop |

## Fase 5. Opnemen (ongeveer 1,5 uur, jij met mijn stappenlijst)

| # | Wie | Stap | Klaar als |
|---|---|---|---|
| 5.1 | Claude | Een **controlescript** (`scripts/video-preflight.mjs`) dat checkt: app draait, database bereikbaar, geen testaanvragen over, demo-woningen aanwezig, AI aan of uit zoals gewenst. Plus een lijst om af te vinken. | Script draait en geeft groen |
| 5.2 | Jij | **Voorbereiding:** zet meldingen uit (Windows *Niet storen*), sluit privé-tabbladen, zoom de browser op 125%, zet de lichte weergave aan, leg een glas water klaar, sluit Gmail en andere programma's. | Schoon bureaublad |
| 5.3 | Jij | **Opnemen met PowerPoint:** *Diavoorstelling > Opnemen* (Record). Per hoofdstuk één opname van 1 tot 2 minuten, zodat een foutje alleen dat stuk kost. Spreek de tekst uit het draaiboek. | Alle slides hebben jouw stem en timing |
| 5.4 | Jij | **Opnemen van de demo** met `Win+Alt+R` (Game Bar): formulier invullen met de demoknoppen, dashboard met de nieuwe aanvraag, eisenscherm met de inkomenstest. Elke scène 30 tot 90 seconden. | Vijf à zes korte clips met geluid uit (of met je uitleg) |
| 5.5 | Jij | Luister elke opname terug. Overdoen wat onduidelijk, te snel of te zacht is. | Alle stukken goedgekeurd |

## Fase 6. Monteren en exporteren (ongeveer 1 uur)

| # | Wie | Stap | Klaar als |
|---|---|---|---|
| 6.1 | Jij | Voeg de demo-clips in de slides in (PowerPoint: *Invoegen > Video*) of zet alles in **Clipchamp** op een tijdlijn. | Alles in de juiste volgorde |
| 6.2 | Jij | **Ondertitels** (optioneel): Clipchamp kan automatisch Nederlandse ondertitels maken; controleer ze. | Ondertitels kloppen |
| 6.3 | Jij | **Exporteren als MP4, 1080p:** PowerPoint *Bestand > Exporteren > Video maken > Full HD*, of in Clipchamp *Exporteren > 1080p*. | `Uitlegvideo-RentalFlowAI.mp4` op je laptop |
| 6.4 | Samen | **Veiligheidscontrole voor het publiceren:** kijk de video helemaal door en let op beeld van sleutels, `.env.local`, wachtwoorden, echte e-mailadressen of telefoonnummers van anderen, Supabase-keys, mails in je Gmail. Alleen verzonnen gegevens. | Niets gevoeligs in beeld |

## Fase 7. Controleren en opleveren (ongeveer 30 minuten)

| # | Wie | Stap | Klaar als |
|---|---|---|---|
| 7.1 | Jij | Speel de MP4 af in de standaard Windows-speler (*Films en tv* of *Media Player*), **zonder internet**, met de speakers of een koptelefoon. Geluid, beeld en tijd kloppen. | Speelt foutloos van begin tot eind |
| 7.2 | Claude | **Tijdcodes per leeruitkomst** (`00:00` tot `10:00`): bij welk moment in de video welke uitkomst wordt aangetoond. Op één pagina, ook als PDF. | Pagina klaar voor je docent |
| 7.3 | Jij | **Back-ups:** kopie op Google Drive (de map `Minor-video`), op een USB-stick en op de laptop zelf. | Drie kopieën |
| 7.4 | Claude | **Noodplan:** slides als PDF, de uitlegpagina en het voorbeeld-dashboard lokaal; als de video niet afspeelt, kun je het live laten zien of de PDF doorlopen. | Noodplan in je tas en in Drive |
| 7.5 | Jij | **Vragenronde oefenen** met de lijst "Lastige vragen" uit `docs/uitleg-makelaars.md` en de eerlijke beperkingen (circulaire meting, kleine steekproef, niet juridisch getoetst, niet getest met een echte makelaar). | Je kunt elke vraag in 30 seconden beantwoorden |

---

## Eindchecklist

- [ ] Alle connectors verbonden en getest (Drive, Notion, Supabase, Docs, visualize; Vercel optioneel)
- [ ] Lijst leeruitkomsten ontvangen en gekoppeld aan bewijs
- [ ] Lengte en verhaal goedgekeurd
- [ ] Bewijs verzameld (database, tests, getallen, screenshots, schema's)
- [ ] Draaiboek hardop gelezen en op tijd
- [ ] Slides definitief, sprekerstekst in de notities
- [ ] Demo-omgeving gereset en controlescript groen
- [ ] Alle stukken opgenomen en teruggeluisterd
- [ ] Video geëxporteerd als MP4 in 1080p
- [ ] Veiligheidscontrole: niets gevoeligs in beeld of in het geluid
- [ ] Afgespeeld zonder internet in de standaard Windows-speler
- [ ] Tijdcodes per leeruitkomst gemaakt
- [ ] Drie kopieën (laptop, Drive, USB)
- [ ] Noodplan klaar (PDF van de slides)
- [ ] Vragen geoefend, beperkingen eerlijk benoemd

## Risico's

| Risico | Kans | Aanpak |
|---|---|---|
| Geen Nederlandse stem voor een computerverteller | Zeker | Je spreekt zelf in; ook beter voor de minor |
| Live demo gaat mis tijdens het opnemen | Gemiddeld | Opnemen in korte stukken; terugvallen op `/dashboard/preview` met verzonnen gegevens |
| Gevoelige gegevens in beeld (sleutel, mail, wachtwoord) | Gemiddeld, ernstig | Controlescript, schoon bureaublad, volledige doorkijkronde (stap 6.4) |
| Resultaten overdrijven (bijv. "85% goed") | Gemiddeld | Altijd de beperkingen noemen: labels door mijzelf, deels circulaire meting, 40 gevallen |
| Te lang of te druk | Hoog | Draaiboek hardop lezen met stopwatch; één boodschap per slide |
| Leeruitkomsten niet gedekt | Gemiddeld | Stap 2.2: eerst de tabel, pas daarna het draaiboek |
| Bestand speelt niet af op de presentatiecomputer | Laag, hinderlijk | MP4 + USB + Drive + PDF van de slides |

## Tijdsinschatting

Ongeveer **6 tot 8 uur** in totaal, te verdelen over meerdere dagen. Het meeste werk van Claude zit in fase 3 en 4; het meeste werk van jou zit in fase 5 en 6.

## Beslissingen die ik van je nodig heb

1. De lijst met **leeruitkomsten** (stap 2.1).
2. **Lengte**: 8, 10 of 12 minuten?
3. **Voice-over**: je eigen stem (aanbevolen), of liever geen stem met alleen tekst op de slides en ondertitels?
4. Mag ik **Clipchamp en Game Bar** gebruiken zoals beschreven? Dan hoeft er niets te worden gedownload.
