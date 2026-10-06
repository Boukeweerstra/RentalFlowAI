# RentalFlowAI: universele "Aanvraag"-knop voor huurwoningen

> **Hoofdplan voor alles wat nog volgt, met eindchecklist: [docs/stappenplan.md](docs/stappenplan.md).**

> Status: **v1.0 (definitief voor start fase 1)**. Besluiten: geen Supabase in fase 1, Make.com → eigen Gmail + Google Sheet als ontvangst, config in JSON achter een vervangbare laag, woninggegevens handmatig via `data-*`, leeftijd als bevestiging, inkomen per persoon met gezamenlijk totaal, universeel widget (testsite Rotsvast.nl), alleen makelaar beheert, NL + EN, OpenAI + Gemini in fase 2, productnaam RentalFlowAI.

## 1. Doel

Op woningpagina's van makelaarswebsites komt naast "Contact" en "Bekijk brochure" een derde knop: **"Aanvraag"**. De woningzoeker ziet direct welke informatie en documenten voor *die* woning nodig zijn en dient de aanvraag gestructureerd in.

**Waarom:** van ~100 aanvragen is vaak maar ~4 geschikt voor bezichtiging. Complete, gestructureerde aanvragen (fase 1) en daarna automatische sortering (fase 2) laten de makelaar alleen de kansrijke kandidaten beoordelen.

**Kernflow fase 1 (dit moet werken en testbaar zijn):**
woningpagina → knop "Aanvraag" → woning-specifieke vragen → aanvraag versturen → ontvangst bij de makelaar (Make.com → e-mail en/of Google Sheets).

**Succescriteria prototype**
- Zoeker dient zonder account in < 3 minuten een aanvraag in.
- De vragen passen zich aan de woning aan (andere criteria = ander formulier).
- Makelaar ontvangt een leesbare mail en/of een sheet-rij met alle antwoorden gestructureerd.
- Het widget draait op meerdere sites met alleen een scriptregel (universeel, niet aan één makelaar gebonden).

**Harde grenzen:** geen eigen makelaarssysteem, geen zware hosting, geen hoge maandkosten, geen handmatige controle van elke aanvraag, geen ingewikkeld proces voor de zoeker, geen onnodige persoonsgegevens.

## 2. Fasering

### Fase 1 — Kernflow (geen database)
Scope: **huurwoningen**, geen Supabase.
1. **Embedbaar widget** (`widget.js`): één scriptregel op de woningpagina, toont knop "Aanvraag" en opent formulier in modal (iframe naar onze app).
2. **Universeel/multi-tenant:** elke makelaar krijgt een `tenantId`; woning = `tenantId` + `propertyId`.
3. **Woning-specifieke vragen** op basis van de criteria/configuratie van die woning.
4. **Indienen:** onze server-route valideert en stuurt één gestructureerde JSON naar een **Make.com-webhook** → e-mail naar makelaar + rij in Google Sheets.
5. **Demo-hostpagina** (nabootsing woningpagina met drie knoppen) voor testen en demonstreren.
6. **Tweetalig (NL + EN)** vanaf het begin.

Bewust uit scope: eigen inbox/dashboard, login, Supabase, AI.

### Fase 2 — Dashboard voor de makelaar, daarna AI

Volledig plan: [docs/plan-fase-2.md](docs/plan-fase-2.md).

1. **Dashboard** (beveiligde pagina in dezelfde app): aanvragen staan automatisch onder Suitable, Review en Unsuitable, met mail en telefoonnummer meteen zichtbaar, filter per woning, en de mogelijkheid om groep, behandelstatus en notitie aan te passen.
2. **Opslag in Supabase** (EU, schone nieuwe tabellen, rijafscherming, logboek, bewaartermijn van 6 maanden). Make blijft de mail en de Sheet doen; de Sheet wordt back-up.
3. **AI** waar regels tekortschieten (samenvatting van de toelichting, conceptmail), en meten wat dat toevoegt ten opzichte van de regels. De mens beslist.

### Fase 3 — Later
Meerdere medewerkers per kantoor met rollen, documenten uitlezen, koppeling met CRM- of makelaarssoftware, woningconfiguratie beheerd door de makelaar.

## 3. Architectuur

| Onderdeel | Keuze | Reden |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript + Tailwind** | Widget-iframe-pagina's en API-routes in één project; keys blijven server-side. |
| Hosting | Vercel (gratis tier) | Geen complexe hosting, geen kosten. |
| Ontvangst | **Make.com webhook → Gmail/Outlook + Google Sheets** | Snel werkend, geen database nodig. |
| Config per woning (fase 1) | JSON-bestanden per tenant in de repo, gelezen via een **`ConfigProvider`-interface** | Geen DB nodig. Later vervang je alleen de provider (Google Sheet of Supabase); formulier, validatie en beoordeling blijven ongewijzigd. |
| Data (later) | Supabase (Postgres, Storage, RLS, EU-regio) | Zoals gewenst, pas als opslag structureel nodig is. |
| AI (fase 2) | Provider-agnostische laag (OpenAI + Gemini) | Kiezen/vergelijken op kwaliteit en kosten zonder herbouw. |

### Widget (iframe + klein script)
```html
<script src="https://<onze-app>/widget.js"
        data-tenant="rotsvast-demo"
        data-property-id="12345"
        data-address="Voorbeeldstraat 1, Amsterdam"
        data-rent="1450"
        data-lang="auto" async></script>
```
- Het script rendert de knop (of koppelt aan een bestaand element) en opent een modal met een iframe naar `/embed/aanvraag/[tenant]/[propertyId]`.
- Iframe = CSS-isolatie en alle logica/keys blijven bij ons.
- Beveiliging: `frame-ancestors` per tenant beperkt tot toegestane domeinen, `postMessage` met origin-check, geen secrets in het script.
- Knopstijl configureerbaar via `data-*` (kleur, tekst).

### Config-laag
```ts
interface ConfigProvider {
  getProperty(tenantId: string, propertyId: string): Promise<PropertyConfig | null>;
}
// fase 1: JsonConfigProvider  (data/tenants/<tenantId>.json)
// later:  GoogleSheetConfigProvider / SupabaseConfigProvider
```
Het JSON-formaat is gelijk aan het `PropertyConfig`-type (§4), dus een sheet-kolom of DB-kolom = een veld.

### Waar komen woninggegevens vandaan?
**Fase 1 (besloten):** handmatig via `data-*` attributen in de scriptregel (id, adres, huurprijs). Geen automatisch uitlezen van de Rotsvast-pagina. De huurprijs uit de scriptregel wordt server-side vergeleken met de config, zodat een gemanipuleerde `data-rent` het resultaat niet vervalst (de config is leidend, `data-rent` is alleen fallback/weergave).
**Later:** uitlezen van de pagina (JSON-LD/OpenGraph) of feed/koppeling met makelaarssoftware.

De **criteria** zelf horen bij de makelaar (per tenant, evt. per woning), niet bij de pagina.

### Testen op Rotsvast.nl
We kunnen geen scriptregel op rotsvast.nl plaatsen zonder hun medewerking. Voor testen op een échte woningpagina: lokale **userscript (Tampermonkey)** of bookmarklet in je eigen browser die het widget injecteert. Zo zie je het in de echte omgeving zonder iets aan hun site te wijzigen. Het is een test/prototype en geen officiële Rotsvast-functie; we gebruiken hun naam/logo niet in het product.

## 4. Datamodel (gestructureerd vanaf dag 1)

Alle antwoorden worden opgeslagen als **taalonafhankelijke keys en enums** (niet als vertaalde tekst), met een `schemaVersion`. Dan is de latere Supabase-tabel een directe kopie en werkt AI-beoordeling betrouwbaar.

**Property / config (per tenant + woning)**
```ts
type PropertyConfig = {
  tenantId: string; propertyId: string;
  rent: number; availableFrom?: string;            // ISO-datum
  criteria: {
    minAge?: 18 | 21;
    allowedIncomeTypes: IncomeType[];               // employment | self_employed | pension | student_finance | benefits | other
    minIncomeFactor?: number;                       // bijv. 3 (x kale huur)
    incomeBasis: 'primary_applicant' | 'household'; // telt partner/medebewoner mee?
    maxApplicants?: number;                         // max. personen dat mee kan aanvragen
    probationAllowed: boolean;                      // false = niet in proeftijd
    minEmploymentMonths?: number;
    startDateFrom?: string;                         // uiterlijk/vroegste ingangsdatum
    guarantor: 'not_allowed' | 'allowed' | 'required';
    minLeaseMonths?: number;
    housematesAllowed: boolean;                     // woningdelers
    studentsAllowed: boolean;
    depositGuarantee: 'not_needed' | 'allowed' | 'required';   // borgstelling
    residencePermitRequired: boolean;               // geldige verblijfstitel ja/nee
    // (uitbreidbaar: max bewoners, huisdieren, roken)
  };
  documentsLater: DocumentType[];                   // pas opgevraagd bij "geschikt"
};
```

**Application (verstuurd naar Make.com)**
```ts
type Application = {
  schemaVersion: 1; id: string; submittedAt: string; lang: 'nl' | 'en';
  tenantId: string; propertyId: string;
  applicant: { name, email, phone, ageConfirmed: true };   // "Ik ben 21 jaar of ouder", geen geboortedatum
  persons: Array<{                                          // 1 = hoofdaanvrager; extra personen alleen als de woning dat toelaat
    role: 'primary' | 'partner' | 'housemate';
    incomeType: IncomeType; monthlyIncome: number;          // in euro, per maand
    employmentMonths?: number; inProbation?: boolean;       // alleen bij loondienst
    isStudent?: boolean;
  }>;
  household: { occupants: number; totalMonthlyIncome: number };   // server-side berekend uit persons[], nooit van de client
  situation: { hasHousemates: boolean };
  lease: { desiredStartDate, desiredLeaseMonths, guarantorAvailable?, depositGuaranteeOk? };
  residence: { hasValidPermit? };                   // alleen gevraagd als relevant
  motivation?: string;
  consent: { privacyAccepted: true, version: string, at: string };
};
```
Later toegevoegd (fase 2): `Assessment { applicationId, category, reasons[], missingInfo[], draftMail, reviewedBy }`.

## 5. Criteria: hoe ze in het formulier en de beoordeling werken

| Criterium | Type check | Formuliervraag |
|---|---|---|
| Minimale leeftijd (18+/21+) | Harde regel | Bevestiging leeftijd (of geboortejaar, zie AVG) |
| Type inkomen | Harde regel (toegestane lijst) | Keuzelijst |
| Inkomen t.o.v. huur | Harde regel (factor × huur) | Netto/bruto maandinkomen |
| Minimale duur dienstverband / proeftijd | Harde regel | Maanden in dienst + "proeftijd ja/nee" (alleen bij loondienst) |
| Ingangsdatum | Harde regel | Gewenste ingangsdatum |
| Garantsteller (mogelijk/verplicht) | Regel + AI bij twijfel | "Garantsteller beschikbaar?" alleen tonen als relevant |
| Minimale huurduur | Harde regel | Gewenste huurperiode |
| Woningdelers toegestaan | Harde regel | "Deelt u de woning met anderen?" |
| Studenten toegestaan | Harde regel | "Bent u student?" |
| Borgstelling | Regel | Akkoord/mogelijk ja/nee |
| Verblijfsstatus | Regel | Alleen "geldige verblijfstitel ja/nee" (geen nationaliteit) |

**Slim formulier:** vragen die voor een woning niet relevant zijn (bijv. "student?" bij een woning waar dat niet uitmaakt) worden niet getoond. Dat houdt het formulier kort en voldoet aan dataminimalisatie.

**Let op discriminatie/AWGB:** criteria moeten objectief en geldig zijn. Verblijfsstatus vragen we alleen als geldige verblijfstitel; nooit op nationaliteit of herkomst sturen. Dit leggen we ook vast in de AI-prompts van fase 2 (geen gevoelige kenmerken als beoordelingsgrond).

## 6. AI in fase 2 (OpenAI + Gemini)

- **Provider-abstractie:** één functie `assess(application, config)` met twee adapters (OpenAI, Gemini); kiezen via env-variabele, eenvoudig A/B-vergelijken op dezelfde testset.
- **Hybride aanpak:** regels doen de harde checks (leeftijd, inkomen, ingangsdatum, ...); AI alleen voor wat regels niet kunnen: vrije toelichting, documenten lezen, conceptmail schrijven. Dat is goedkoper en uitlegbaar.
- **Gestructureerde output** (JSON-schema) met categorie, redenen en ontbrekende info; nooit vrije tekst parsen.
- **Kleine/goedkope modelvarianten** eerst; pas opschalen als kwaliteit tekortschiet.
- **Testset:** 30-50 verzonnen aanvragen met verwachte uitkomst om kwaliteit te meten voordat iets live gaat.
- **Menselijke controle:** afwijzingen en mails gaan niet automatisch de deur uit zonder goedkeuring of duidelijke uitleg (AVG art. 22).

## 7. AVG / privacy

- **Dataminimalisatie:** alleen relevante vragen; leeftijd bij voorkeur als "ik ben 21+"-bevestiging in plaats van geboortedatum.
- **Gefaseerde documenten (besloten):** eerst zelfverklaring; documenten pas bij "Geschikt". In het formulier staat wel welke documenten later nodig zijn.
- **Toestemming + doel + bewaartermijn** zichtbaar in het formulier; privacyverklaring per tenant.
- **Make.com/Google/e-mail zijn verwerkers:** verwerkersovereenkomst en dataregio checken; Google Sheets bevat persoonsgegevens, dus beperkte toegang, geen openbare links, en periodiek opschonen.
- **Geen persoonsgegevens in logs** van onze app; we bewaren in fase 1 zelf niets (stateless doorsturen).
- **Geen BSN**, geen documenten in deze fase.

## 8. Beveiliging & keys

- Webhook-URL, OpenAI- en Gemini-keys alleen in `.env.local` / Vercel env vars, nooit in de browser of git.
- Onze API-route roept Make.com aan (server-to-server) met een gedeeld geheim in een header, zodat niemand de webhook direct kan misbruiken.
- Spamcheck (honeypot + rate limit, evt. Cloudflare Turnstile) en serverside validatie met Zod.
- Deel keys nooit in de chat; ik gebruik alleen de variabelenamen.

## 9. Stappenplan fase 1

1. Project opzetten: Next.js + TS + Tailwind + Zod + i18n (NL/EN); `.env.example`.
2. Datamodel en Zod-schema's (config + application) in één gedeeld bestand.
3. Tenant-config als JSON (1 demo-tenant met 4-6 woningen met verschillende criteria).
4. Dynamisch formulier op `/embed/aanvraag/[tenant]/[propertyId]` (conditionele vragen, validatie, consent, bevestiging, NL/EN).
5. API-route `/api/aanvraag`: valideren → gestructureerde JSON → Make.com webhook.
6. Make.com-scenario: webhook → Gmail (leesbare samenvatting) + Google Sheets (één rij per aanvraag, kolommen = keys).
7. `widget.js`: knop + modal + iframe + postMessage + `frame-ancestors`.
8. Demo-hostpagina + Tampermonkey-userscript om op een echte Rotsvast-woningpagina te testen.
9. Polish: mobiel, focus-trap/toetsenbord, WCAG 2.1 AA, foutmeldingen.
10. Deploy op Vercel en test vanaf een externe origin.

## 9b. Wijzigingen v1.1 (stap 2–4 uitgevoerd)

- **Huisdieren:** `criteria.petsAllowed`; niet ingesteld = geen vraag. `false` = de zoeker krijgt "Heeft u huisdieren?" en `pets_not_allowed` volgt bij ja.
- **Aanvragers versus bewoners:** `maxApplicants` (wie mee aanvraagt) en `maxOccupants` (wie er gaat wonen, incl. kinderen). In de aanvraag: `household.applicants` en `household.occupants`. De bewonersvraag verschijnt alleen als `maxOccupants` is ingesteld; bewoners kunnen niet lager zijn dan aanvragers.
- **Bruto maandinkomen** is de standaard in formulier en precheck.
- **Ernst per criterium:** `criteria.severity` (`hard` of `review`) per reden, met `DEFAULT_SEVERITY` als standaard. `hard` = `unsuitable`, `review` = `review`. Een inkomenstekort met beschikbare garantsteller is altijd `review`.
- **Altijd versturen:** bij `unsuitable` toont het formulier eerst een waarschuwing met de redenen (velden vergrendeld), met "Gegevens aanpassen" of "Toch versturen". De server weigert alleen onmogelijke of onvolledige invoer, nooit op basis van de precheck.
- **Tenant `rotsvast-test`:** `propertyDefaults` + hints (`data-rent`, `data-address`) voor woningen zonder vaste config; alleen voor test-tenants. Zonder huurprijs-hint geen woning.
- **Widget (`public/widget.js`):** knop + modal + iframe; tenant en woning uit de scriptregel; `data-target`, `data-class`, `data-lang`; focus terug naar de knop, Escape sluit, rest van de pagina `inert`, `postMessage` met origin-check.
- **Testen:** `public/demo-host.html` (zelfde origin), `demo-host/external.html` (andere origin), `demo-host/rotsvast-test.user.js` (Tampermonkey).

## 9c. Wijzigingen v1.2 (stap 5–6: Make.com)

- **Vertrouwensmodel voor woninggegevens:** tenant heeft `mode` (`test` | `production`, standaard `production`). Alleen bij `test` worden `data-rent`/`data-address` en `propertyDefaults` gebruikt; de schema-validatie weigert `propertyDefaults` bij `production`. In productie komen huur, adres en criteria uitsluitend uit `properties` op basis van het woning-id, en een onbekende woning geeft 404. Elke woning heeft `source` (`config` | `widget_hints`); die staat als `propertySource` in de Sheet, zodat een ongecontroleerde huurprijs direct zichtbaar is.
- **Geheim server-side:** `MAKE_WEBHOOK_URL` en `MAKE_WEBHOOK_SECRET` zonder `NEXT_PUBLIC_`, gebruikt in `src/lib/make-client.ts` met `import "server-only"` (importeren vanuit een client-component laat de build falen). Gecontroleerd: een productiebuild met herkenbare nep-waarden bevat die niet in `.next/static`.
- **Garantsteller configureerbaar:** `criteria.guarantorCompensatesIncome` (standaard `true`): een inkomenstekort met beschikbare garantsteller wordt `review`; op `false` blijft het een gewoon tekort volgens `severity`.
- **Sheet-kolommen** vast in `SHEET_COLUMNS` (`src/lib/make-payload.ts`); payload bevat `flat` (Sheet), `mail` (kant-en-klare onderwerp/tekst/HTML voor makelaar en zoeker) en `application` (volledig, voor later).
- **Mails per status** (`src/lib/mail-texts.ts`): melding naar makelaar met status in de onderwerpregel; naar de woningzoeker altijd een ontvangstbevestiging (bij `unsuitable` een neutrale tekst, geen automatische afwijzing, AVG art. 22). Per tenant `notifyEmail` (optioneel) en `sendApplicantMail` (standaard aan).
- **Handleiding:** [docs/make-setup.md](docs/make-setup.md), voorbeeldbericht [docs/sample-payload.json](docs/sample-payload.json).

### Besluiten na test v1.2

- **Flow:** precheck → `suitable` / `review` / `unsuitable` → makelaar beoordeelt → makelaar beslist. De precheck is voorsorterend en ondersteunend. RentalFlowAI verstuurt geen definitieve afwijzing; die komt later pas na goedkeuring door de makelaar.
- **Ontvangstbevestiging** (alle statussen): aanvraag ontvangen, na beoordeling volgt een definitieve reactie.
- **Ontvanger melding:** `notifyEmail` in de tenant-config; in Make één fallback-adres via `ifempty(...)`.
- **Getest:** `guarantorCompensatesIncome: false` (woning 1005): inkomenstekort + garantsteller = `unsuitable`; controle met standaard (woning 1003) = `review`. `notifyEmail` komt door in `mail.notify.to`.
- **Volgorde:** eerst de volledige keten testen met echte Make/Sheets/Gmail (`scripts/e2e.mjs`, [docs/make-setup.md](docs/make-setup.md)); geen nieuwe functionaliteit tot die keten werkt. Daarna stap 9 (toegankelijkheid/mobiel) en stap 10 (Vercel-deploy + externe origin), daarna fase 2.

### Status na stap 9 (toegankelijkheid en mobiel)

- **Keten getest met echte Make/Sheets/Gmail:** aanvraag → Sheet-rij → melding makelaar → bevestiging aanvrager werkt. Make gebruikt de ingebouwde *API Key authentication* (header `x-make-apikey`); een apart filter voor het geheim is niet nodig.
- **Axe-core audit (WCAG 2.2 AA + best practices)** op beginstand, foutstand en waarschuwingsstand: 0 overtredingen. Handmatig aanvullend gevonden en opgelost:
  - focus gaat na een fout naar het eerste foute veld;
  - foutmeldingen zijn gekoppeld aan hun veld (`aria-describedby`, 12 van 12);
  - `lang` op de inhoud (nl/en) in plaats van vast `en`;
  - randen van invoervelden van ±1,5:1 naar 4,8:1 contrast;
  - aanklikbare vlakjes minimaal 44 px;
  - zichtbare focusring overal; bevestiging krijgt focus;
  - `requestAnimationFrame` vervangen door `setTimeout` (draait niet in een verborgen iframe).
- **Mobiel (375 px):** modal beslaat het hele scherm, geen horizontaal scrollen, Escape sluit en herstelt focus en scroll.
- **Niet automatisch beoordeeld:** kleurcontrast van één element dat verborgen lag (Next dev-indicator); schermlezer-test (NVDA/VoiceOver) en echte telefoon zijn handmatig nog te doen.
- **Stap 10 voorbereid, niet uitgevoerd:** zie [docs/deploy-vercel.md](docs/deploy-vercel.md) (`vercel.json` met regio Frankfurt).

### Volgorde tot en met de openbare test

1. **Lokaal** controleren met de productiebuild (`npm.cmd run build`, dan `npm.cmd run start`) en het nieuwe `MAKE_WEBHOOK_SECRET`.
2. **GitHub** (privé-repo) en **Vercel** koppelen door de eigenaar; Deployment Protection aan; env-variabelen zelf zetten.
3. **Bescherming tegen misbruik**: gebouwd; Upstash en Turnstile nog instellen (zie hieronder) vóór de app echt openbaar getest wordt.
4. **Pas daarna** de externe Rotsvast-site (userscript/widget op een andere origin).

### Bescherming tegen misbruik (gebouwd en getest)

Volledige beschrijving, instellingen en installatiestappen: [docs/abuse-protection.md](docs/abuse-protection.md).

- **11 lagen** in vaste volgorde: grootte, same-origin, honeypot, rate limit per IP, ondertekend formuliertoken met minimale invultijd, Turnstile (optioneel), validatie, spam/wegwerp-e-mail, rate limit per e-mailadres (gehasht), dubbele aanvraag (zelfde persoon + woning, 24 uur) en een dagplafond dat de Make-quota beschermt.
- **Gedeelde teller:** Upstash Redis via REST (zonder extra pakket), met terugval op geheugen bij een storing. Zonder Upstash gelden de limieten per serverinstantie; de app logt dat.
- **Teruggeven van plekken:** mislukt de aflevering aan Make, dan worden de dubbel-plek en de dagteller teruggegeven.
- **Getest:** `scripts/test-abuse.mjs` (29 controles, allemaal geslaagd) tegen nep-Make en nep-Upstash; Turnstile server-side tegen Cloudflare met hun testsleutels (geslaagd en geweigerd) en in de browser (vakje, token, versturen, foutmelding bij dubbele aanvraag).
- **Nog te doen door de eigenaar voordat Deployment Protection uitgaat:** Upstash-database en Turnstile-widget aanmaken en de sleutels in Vercel zetten; een Vercel Firewall rate-limit-regel als extra vangnet. Zonder die twee blijft de site achter de login.
- **Blijft een keuze/beperking:** verfijnde aanvallers met wisselende IP's en opgeloste captcha's; het formuliertoken is niet eenmalig (herhaling wordt tegengehouden door teller, dubbelcontrole en Turnstile).

### Fase 2: waar wordt het AI, en waar niet? (voor de minor)

Het systeem is nu inhoudelijk een goede **rules engine**: vaste criteria, expliciete `hard`/`review`-ernst, uitlegbare redenen. Fase 2 voegt daarom alleen AI toe waar regels tekortschieten, en dat moet meetbaar aangetoond worden.

- **Blijft regels:** alles wat een getal, keuzelijst of ja/nee is (inkomen, leeftijd, huisdieren, proeftijd, datums). Regels zijn hier sneller, gratis, deterministisch en juridisch uitlegbaar; AI voegt hier niets toe.
- **Kandidaten voor AI** (waar regels niet werken):
  1. Vrije toelichting (`motivation`) lezen: extra context, tegenstrijdigheden of signalen die de makelaar moet weten, als korte samenvatting.
  2. Documenten uitlezen en controleren tegen de zelfverklaring (loonstrook, werkgeversverklaring), inclusief inconsistenties.
  3. Conceptmail voor "meer informatie nodig" in de juiste toon en taal, ter goedkeuring door de makelaar.
  4. Prioriteren binnen `suitable` (meerdere geschikte kandidaten) op basis van wat de verhuurder belangrijk vindt.
- **Meetbaar maken:** testset van 30–50 verzonnen aanvragen met verwachte uitkomst en een uitkomst van de makelaar als referentie. Vergelijk drie varianten: alleen regels, alleen AI, regels + AI. Meet nauwkeurigheid per categorie, valse "ongeschikt", uitlegbaarheid, tijd en kosten (OpenAI vs. Gemini). Zo laat je zien waar de AI echt waarde toevoegt (bijvoorbeeld vrije tekst en documenten) en waar gewone regels volstaan.
- **Grens:** AI adviseert en vat samen; de makelaar beslist. AI beslist niet zelfstandig over een afwijzing.

### Toekomstige verbeteringen

- **Productiegeschikte rate limiting.** De huidige limiter (5 verzoeken per 10 minuten per IP, in het geheugen van één serverproces) is voldoende voor het prototype, maar op serverless heeft elke instantie een eigen teller en is `x-forwarded-for` te beïnvloeden. Voor productie: gedeelde teller (Upstash Redis / Vercel KV met `@upstash/ratelimit`) en/of Vercel Firewall rate limiting, gecombineerd met Cloudflare Turnstile op het formulier. Limiet per tenant en per e-mailadres/woning overwegen.
- **Hardere webhook-authenticatie:** geheim periodiek roteren; eventueel HMAC-handtekening over de body (met tijdstempel) in plaats van een vast geheim in een header.
- **Betrouwbare aflevering:** wachtrij of retry als Make.com tijdelijk niet bereikbaar is, zodat een aanvraag niet verloren gaat (in fase 3 opgelost door eerst in Supabase op te slaan).
- **Woningconfiguratie beheren door de makelaar** (Google Sheet of Supabase achter `ConfigProvider`), zodat productie-tenants geen JSON-bestand in de repo nodig hebben.

## 10. Besluiten (was: open vragen)

| Onderwerp | Besluit |
|---|---|
| Ontvanger in de test | Eigen Gmail + eigen Google Sheet via Make.com |
| Config per woning | JSON-bestand in fase 1, achter `ConfigProvider` zodat Google Sheet/Supabase later een drop-in vervanging is |
| Woning-id / huurprijs | Handmatig via `data-*` in de scriptregel; config is leidend voor de huurprijs |
| Minimale leeftijd | Alleen bevestiging ("Ik ben 21 jaar of ouder"), geen geboortedatum |
| Partner/medebewoner | Inkomen per persoon; server berekent gezamenlijk totaal; `incomeBasis` per woning bepaalt of dat telt |
| Productnaam | **RentalFlowAI** (bestaat al een Supabase-project met die naam; die kijken we pas in fase 3 na, niet nu aanraken) |

**Formulier-gevolgen van inkomen per persoon:** "Partner/medebewoner toevoegen" verschijnt alleen als `maxApplicants > 1`. Elke extra persoon vult zelf type inkomen en bedrag in (geen persoonsgegevens zoals naam/e-mail nodig van de partner in fase 1 — dataminimalisatie). Totaal en `meetsIncomeRule` worden server-side berekend.

## 11. Nog te regelen vóór of tijdens stap 1 (praktisch)

1. Make.com-account (gratis) en een Google Sheet met kolomkoppen = de keys uit `Application`; Gmail-koppeling in Make autoriseer jij zelf.
2. OpenAI- en Gemini-keys pas nodig in fase 2; nu nog niet aanleveren.
3. Naam van de map/repo: voorstel `rentalflowai` (map nu heet nog "versie 2 vastgoedmap"; hernoemen doe jij, ik werk in de huidige map).
