# Stappenplan: uitlegvideo voor de minor (versie 2)

**User story:** Als AI-ontwikkelaar wil ik via verschillende connectors via Claude een uitlegvideo maken over wat ik tot nu toe heb gedaan en gemaakt, zodat ik die voor mijn minor kan laten zien en verschillende leeruitkomsten kan voltooien.

**Keuzes van Bouke (6 oktober):** video van **3 tot 4 minuten**, **niet alle leeruitkomsten**, met een **AI-stem**.
Doel: van "connectors koppelen" tot een **MP4-bestand op je laptop** dat je overal kunt afspelen.

**Voorstel voor acceptatiecriteria bij de user story** (nodig voor LU 5, zie hieronder):
1. De video is 3 tot 4 minuten lang en speelt als MP4 af op mijn laptop, zonder internet.
2. De video toont minstens drie leeruitkomsten, elk met zichtbaar bewijs uit het project.
3. Bij elke bewering over resultaten noem ik de beperking (kleine steekproef, eigen labels, nog niet met een echte makelaar getest).
4. Er staat niets gevoeligs in beeld of in het geluid (sleutels, wachtwoorden, echte gegevens van anderen).
5. De video vermeldt dat de stem AI-gegenereerd is.
6. Er is een lijst met tijdcodes per leeruitkomst voor mijn docent.

---

## 0. Welke leeruitkomsten kiezen we?

| LU | Past bij dit project? | Bewijs dat er al is | Wat er nog mist | Advies |
|---|---|---|---|---|
| **LU 1** AI-impact op beroepsrol | Zwak | Alleen indirect | Gesprekken met professionals en een analyse van veranderende taken | **Overslaan** voor deze video |
| **LU 2** Praktijkgerichte AI-oplossing ontwerpen, realiseren en valideren | Sterk, maar **gedeeltelijk** | Werkende oplossing voor een echt werkproces; 170+ tests; testset en meting (78% naar 85% bij 40 gevallen); AI-proef met echt model; kosten per aanroep (ongeveer 330 tokens in, 50 uit) | **Validatie met gebruikers of een opdrachtgever.** Dat heb je nog niet gedaan. Ook de tijdswinst ("efficiëntie") is nog niet gemeten | **Kiezen, eerlijk presenteren** en eerst één korte validatie (zie stap 2.5) |
| **LU 3** Verantwoord AI-gebruik toetsen aan ethiek en regelgeving | Zeer sterk | Verwerkingsregister, DPIA, bewaartermijn, verwijderen met logboek, geen persoonsgegevens naar de AI, bewaker tegen gevoelige onderwerpen, "de computer wijst nooit af", test op prompt-injectie | **Een expliciete analyse van de Europese AI-verordening.** Die staat nog niet in het project (alleen de AVG). Ook een korte lijst aanbevelingen | **Kiezen.** Eerst de analyse laten maken (stap 2.4) |
| **LU 4** AI-tools en -technieken toepassen | Zeer sterk | Prompting (versie 1 naar 2 met gemeten verbetering), workflowautomatisering (Make.com), regels tegenover een taalmodel, bouwen met Claude en connectors, beperkingen (hallucinaties, injectie, harde grenzen) | Niets belangrijks | **Kiezen** |
| **LU 5** Regie over je eigen leerproces | Redelijk | De user story van deze video zelf, het stappenplan met besluiten (bijvoorbeeld koerswijziging naar "eerst goed en uitlegbaar"), wat je wel en niet aan AI overliet, feedback en bijsturing | Een korte, eerlijke reflectie; "Show & Grow"-moment | **Kort meenemen** (20 tot 30 seconden reflectie) |

**Voorstel: LU 2, 3 en 4 met een korte reflectie voor LU 5. LU 1 laten we weg.**

## 1. De opbouw van de video (ongeveer 3 minuten 45)

| Tijd | Hoofdstuk | Wat in beeld | LU |
|---|---|---|---|
| 0:00 tot 0:20 | Doel en probleem. "Deze stem is AI-gegenereerd." | Titelslide, het probleem van aanvragen per mail en spreadsheet | 5 |
| 0:20 tot 1:10 | **De oplossing in actie** | Schermopname: demosite, formulier (demoknop), dashboard met de aanvraag onder Review, eisenscherm met de inkomenstest | 2 |
| 1:10 tot 2:00 | **Hoe het werkt en welke AI-technieken** | Schema (regels, Make, Supabase, AI-laag); prompt-versie 1 en 2 naast elkaar; "gebouwd met Claude en connectors" | 4 |
| 2:00 tot 2:50 | **Meten en valideren** | Grafiek: regels 78% naar 85%; AI-proef; kosten per aanroep; eerlijke beperkingen (eigen labels, 40 gevallen, nog geen makelaar) | 2, 4 |
| 2:50 tot 3:30 | **Verantwoord gebruik** | AVG en AI-verordening, de computer wijst nooit af, privacy by design, bias, vijf aanbevelingen | 3 |
| 3:30 tot 3:50 | **Reflectie en vervolg** | Wat ik aan Claude overliet en wat niet; volgende stap: proefgesprek met een makelaar | 5 |

Ongeveer **500 woorden** voor de stem (een AI-stem leest rond 140 tot 160 woorden per minuut).

## 2. Fase 1. Connectors koppelen en testen (ongeveer 30 minuten)

| # | Wie | Stap | Klaar als |
|---|---|---|---|
| 1.1 | Jij | Controleer in de Claude-app bij **Connectors** dat Google Drive, Notion, Supabase, Vercel en Claude Docs op *Verbonden* staan. | Vijf keer "verbonden" |
| 1.2 | Claude | Test elke connector met een kleine, onschuldige proef: Supabase (tabellen en migraties lezen), Google Drive (map `Minor-video` met een testbestand), Notion (testpagina), Claude Docs (testdocument), visualize (testschema). Testresten worden opgeruimd. | Alle vijf slagen |
| 1.3 | Samen | Vercel: mijn toegang tot jouw team gaf eerder een 403. Blijft dat zo, dan gebruiken we Vercel niet als bewijs. | Besluit genoteerd |
| 1.4 | **Jij** | **De AI-stem testen.** Open **Clipchamp** (Startmenu), maak een nieuwe video, kies *Opnemen en maken* > **Tekst naar spraak** en kijk of er **Nederlandse** stemmen zijn. Kies er één, laat hem één zin voorlezen, luister. Stuur me de naam van de stem en zeg of hij prettig klinkt. | Nederlandse stem gekozen |
| 1.5 | Jij | Test `Win+Alt+R` (Game Bar) voor een opname van 10 seconden. | Opname staat in *Video's > Captures* |

**Waarom Clipchamp voor de stem:** mijn controle liet zien dat je laptop alleen Engelse computerstemmen heeft. Clipchamp heeft een ingebouwde functie die tekst met een AI-stem voorleest en die ook Nederlands kan. Daar hoeft niets voor te worden gedownload. Mocht Clipchamp geen goede Nederlandse stem hebben, dan zoeken we samen een alternatief (bijvoorbeeld een gratis online dienst; de tekst bevat geen geheimen). Claude kan zelf geen audio maken.

## 3. Fase 2. Bewijs, onderbouwing en validatie (ongeveer 2 uur, vooral Claude)

| # | Wie | Stap | Klaar als |
|---|---|---|---|
| 2.1 | Claude | **Tabel "leeruitkomst, bewijs, moment in de video"** voor LU 2, 3, 4 en 5, in Notion en in `docs/`. | Elke gekozen LU heeft minstens twee bewijsstukken |
| 2.2 | Claude | **Bewijs uit Supabase** via de connector (tabellen, afscherming, migraties, advieslijst) en de **kerngetallen** uit de repo (commits, tests, documenten). Geen persoonsgegevens. | Een bewijspagina met de commando's erbij |
| 2.3 | Claude | **Meetresultaten** als één duidelijke grafiek en een "wat ik leerde"-pagina: regels 78% naar 85%, de bug die de tests vonden, de gezondheidsvermelding in prompt-versie 1 en de oplossing in versie 2. | Pagina klaar |
| 2.4 | Claude | **Analyse Europese AI-verordening** (`docs/ai-verordening.md`): is dit systeem hoog-risico (vooral door het beoordelen van huurders), wat geldt voor transparantie, menselijk toezicht en AI-geletterdheid, wat voor de AI-leverancier; plus **vijf aanbevelingen voor verantwoord gebruik** en een bias-controle van de regels. Duidelijk gemarkeerd als eigen analyse, geen juridisch advies. | Document en een slide |
| 2.5 | **Jij en een ander** | **Eén korte validatie** (30 minuten) met iemand die de opdrachtgever speelt: een docent, een mentor, een medestudent met kennis van het vak, of een echte makelaar. Doe de demo (vijf minuten) en stel de vragen uit `docs/uitleg-makelaars.md` sectie 8. Schrijf 5 bevindingen op. Zonder dit is LU 2 maar half aangetoond. | Notities met bevindingen |
| 2.6 | Claude | **Screenshots** met de ingebouwde browser (alleen verzonnen gegevens) en **schema's** met de visualize-connector. | Map `video/` met genummerde afbeeldingen |

## 4. Fase 3. Draaiboek en beeldmateriaal (ongeveer 1 uur)

| # | Wie | Stap | Klaar als |
|---|---|---|---|
| 3.1 | Claude | **Draaiboek** met per hoofdstuk de voorleestekst (korte zinnen, geschreven om te beluisteren, geen afkortingen die een stem verkeerd uitspreekt) en wat in beeld staat. Opgeslagen in Claude Docs en Notion. | Jij hebt het gelezen en aangepast |
| 3.2 | Claude | **Slides** als PowerPoint (16:9, grote letters, één boodschap per slide) met sprekersnotities. | `.pptx` op je laptop en op Drive |
| 3.3 | Jij | Lees de tekst **hardop** met een stopwatch. Zet twijfelachtige woorden (zoals "Supabase", "Make", "RLS") in het draaiboek fonetisch, zodat de AI-stem ze goed zegt. | Tekst past binnen 4 minuten |
| 3.4 | Claude | **Controlescript voor de opname** (`scripts/video-preflight.mjs`): app draait, database bereikbaar, geen testaanvragen over, demo-woningen aanwezig. | Script meldt "klaar voor opname" |

## 5. Fase 4. Opnemen en monteren in Clipchamp (ongeveer 1,5 uur, jij met mijn stappen)

| # | Wie | Stap | Klaar als |
|---|---|---|---|
| 4.1 | Jij | **Schoon bureaublad:** meldingen uit (*Niet storen*), privé-tabbladen dicht, browserzoom 125%, lichte weergave, Gmail dicht. | Rustig scherm |
| 4.2 | Jij | **Demo opnemen** met `Win+Alt+R`: formulier met de demoknop *Twijfelgeval*, aanvraag verschijnt in het dashboard, eisenscherm met de inkomenstest. Drie clips van 15 tot 30 seconden, **zonder je eigen stem** (de AI-stem komt erover). | Drie clips |
| 4.3 | Jij | **Slides exporteren als afbeeldingen:** PowerPoint, *Bestand > Exporteren > Bestandstype wijzigen > PNG > Alle dia's*. | Een PNG per slide |
| 4.4 | Jij | **In Clipchamp:** importeer PNG's en clips. Per hoofdstuk: zet de afbeelding of clip op de tijdlijn; maak met *Tekst naar spraak* de stem van dat hoofdstuk (plak de tekst, kies de gekozen stem) en zet die eronder. Trek de afbeelding zo lang als de stem. | Tijdlijn van begin tot eind |
| 4.5 | Jij | **Ondertitels:** *Ondertitels > Automatisch* en lees ze na. Ze helpen als de zaal geluid mist. | Ondertitels kloppen |
| 4.6 | Jij | **Exporteren als MP4 in 1080p** met *Exporteren*. Naam: `RentalFlowAI-uitleg.mp4`. | MP4 op je laptop |
| 4.7 | **Samen** | **Veiligheidscontrole:** kijk alles door op sleutels, `.env.local`, wachtwoorden, echte e-mailadressen of telefoonnummers van anderen. Alleen verzonnen gegevens. | Niets gevoeligs in beeld |

## 6. Fase 5. Controleren en opleveren (ongeveer 30 minuten)

| # | Wie | Stap | Klaar als |
|---|---|---|---|
| 5.1 | Jij | Speel de MP4 af **zonder internet** in *Films en tv* of *Media Player*. Geluid, beeld en tijd kloppen. | Speelt foutloos |
| 5.2 | Claude | **Tijdcodes per leeruitkomst** op één pagina (ook als PDF) voor je docent, met een verwijzing naar het bewijs in de repo. | Pagina klaar |
| 5.3 | Jij | **Drie kopieën:** laptop, Google Drive (map `Minor-video`), USB-stick. | Drie kopieën |
| 5.4 | Claude | **Noodplan:** slides als PDF en het voorbeeld-dashboard lokaal. | PDF in Drive en op de laptop |
| 5.5 | Jij | **Vragen oefenen** met de lijst uit `docs/uitleg-makelaars.md` en de beperkingen. | Je kunt elke vraag in 30 seconden beantwoorden |

---

## Eindchecklist

- [ ] Connectors verbonden en getest
- [ ] Nederlandse AI-stem gekozen en beluisterd (stap 1.4)
- [ ] Gekozen leeruitkomsten: LU 2, 3, 4, kort 5 (of afwijkend besluit)
- [ ] Bewijstabel per leeruitkomst klaar
- [ ] Analyse van de AI-verordening en vijf aanbevelingen geschreven
- [ ] Eén validatie met een opdrachtgever gedaan en genoteerd
- [ ] Draaiboek hardop gelezen, past in 4 minuten
- [ ] Demo-omgeving gereset, controlescript groen
- [ ] Demo-clips en slide-afbeeldingen klaar
- [ ] Video gemonteerd, stem en ondertitels gecontroleerd
- [ ] Vermelding "AI-gegenereerde stem" zichtbaar of hoorbaar
- [ ] Geëxporteerd als MP4 in 1080p
- [ ] Veiligheidscontrole: niets gevoeligs
- [ ] Afgespeeld zonder internet
- [ ] Tijdcodes per leeruitkomst gemaakt
- [ ] Drie kopieën (laptop, Drive, USB)
- [ ] Noodplan klaar

## Risico's

| Risico | Kans | Aanpak |
|---|---|---|
| Clipchamp heeft geen goede Nederlandse stem | Gemiddeld | Stap 1.4 test dit als eerste; alternatief: gratis online dienst voor tekst-naar-spraak, of toch zelf inspreken |
| AI-stem spreekt vaktermen verkeerd uit | Hoog | Fonetisch opschrijven in het draaiboek en één keer terugluisteren per hoofdstuk |
| LU 2 lijkt sterker dan het is | Hoog | Eerlijk zeggen dat de validatie met een echte gebruiker nog volgt; stap 2.5 doen als je het kunt |
| LU 3 mist de AI-verordening | Hoog | Stap 2.4 maakt die analyse; zonder dat claim je LU 3 niet volledig |
| Te veel in 4 minuten | Hoog | Eén boodschap per hoofdstuk; liever 3 leeruitkomsten goed dan 5 half |
| Gevoelige gegevens in beeld | Gemiddeld, ernstig | Controlescript, schoon bureaublad, volledige doorkijkronde (4.7) |
| Resultaten overdreven | Gemiddeld | Altijd de beperking erbij (eigen labels, 40 gevallen, geen echte makelaar) |

## Tijdsinschatting

Ongeveer **5 tot 7 uur** in totaal, te verdelen over twee tot drie dagen. De video zelf is kort; het meeste werk zit in het bewijs, de analyse van de AI-verordening en de validatie.

## Wat ik van je nodig heb om te beginnen

1. **Akkoord** met het voorstel LU 2, 3, 4 en kort 5 (of een andere keuze).
2. **Stap 1.4** doen: Clipchamp openen, kijken of er **Nederlandse AI-stemmen** zijn, en me de naam van de stem doorgeven.
3. **Wie kan de opdrachtgever spelen** voor de validatie van 30 minuten (stap 2.5)?
