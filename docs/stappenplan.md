# Stappenplan RentalFlowAI: alles wat nog volgt

Opgesteld op 1 oktober 2026. Dit is het hoofdplan voor de rest van het project, met aan het einde een **eindchecklist** om af te vinken.
Achtergrond en eerdere keuzes: [plan-fase-2.md](plan-fase-2.md), [dashboard.md](dashboard.md), [abuse-protection.md](abuse-protection.md),
[make-setup.md](make-setup.md), [deploy-vercel.md](deploy-vercel.md).

## 0. Hoe je dit plan leest

- **Wie:** **Jij** = alleen jij kunt dit doen (accounts, wachtwoorden, geheimen, instellingen in andermans dashboards). **Claude** = ik bouw of test het.
  **Samen** = jij doet een deel, ik controleer het resultaat.
- **Grootte:** **S** klein (minder dan een uur), **M** middel (een paar uur), **L** groot (een dag of meer).
- **Klaar als:** de controle waarmee je kunt zien dat de stap echt af is.
- **Harde regels die altijd gelden:** geheimen gaan nooit in de chat, in git of in de browser; wachtwoorden en sleutels typ of plak ik nooit zelf;
  de beslissing over een aanvrager blijft bij de mens; geen automatische afwijzing; bouwen, testen en pas dan online.

## 1. Stand nu

| Onderdeel | Stand |
|---|---|
| Formulier en widget (NL/EN, voorwaarden per woning, eerste check, waarschuwing) | Klaar en getest |
| Make: webhook met API-sleutel, Google Sheet, mail aan de makelaar | Klaar en met echte Make getest |
| Misbruikbescherming (11 lagen) | Klaar; 29 controles tegen nep-diensten. Upstash en Turnstile nog niet ingesteld |
| Supabase: schoon schema, afscherming, logboek, bewaartaak 6 maanden | Klaar en getest. Oud schema staat in `archive_prototype` |
| Opslaan van aanvragen bij het indienen | Klaar; 23 controles. Nog niet met de echte sleutel |
| Inloggen, dashboard, acties, live bijwerken | Gebouwd; getest op voorbeeldgegevens. Echte inlog en live nog niet getest |
| Vercel | Project bestaat, productie `b9c4745`, achter login. **Loopt achter op de code** |
| Git | Lokaal commit `5e78882`. **Dashboard en opslaan zijn nog niet gecommit** en niet naar GitHub gepusht |
| AI | Nog niet begonnen |

## 2. Fase A: Vastleggen en het dashboard echt laten werken

Doel: de nieuwe code staat veilig in git, draait op Vercel, en je kunt inloggen en een echte aanvraag zien.

| # | Wie | Stap | Klaar als | Gr. |
|---|---|---|---|---|
| A1 | Claude (na jouw ja) | **Alles committen** (dashboard, opslaan, migraties, docs, tests). Eerst typecheck, lint en een productiebuild. Niet pushen. | `git status` is schoon; commit bevat geen `.env.local` of geheimen | S |
| A2 | Jij | **Pushen naar GitHub** (`git push`) vanuit `C:\dev\rentalflowai`. | Nieuwe commit zichtbaar op GitHub; geen `.env.local` in de repo | S |
| A3 | Jij | **Secret key ophalen:** Supabase > *Project Settings* > *API Keys* > secret key (`sb_secret_…`). | Je hebt de sleutel op je klembord, nergens gedeeld | S |
| A4 | Jij | **Sleutel in `.env.local`:** `SUPABASE_SECRET_KEY=...`. Zet ook `NEXT_PUBLIC_APP_URL=http://localhost:3100` (nu staat daar `3000`). | App lokaal herstarten; een testaanvraag verschijnt in de tabel `applications` | S |
| A5 | Jij | **Sleutels in Vercel** (*Settings > Environment Variables*): `SUPABASE_SECRET_KEY` (**Sensitive**), `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_APP_URL` (= de Vercel-URL). Productie en Preview. | Vier variabelen zichtbaar in de lijst (geheim verborgen) | S |
| A6 | Jij | **Opnieuw deployen** (`NEXT_PUBLIC_…` wordt bij het bouwen vastgelegd). Controleer dat de deployment *Ready* is. | Claude kan de build in Vercel nalezen (alleen lezen) | S |
| A7 | Jij | **Inlog aanmaken of herstellen:** bestaand account (`boukeweerstra@gmail.com`) als je het wachtwoord weet; anders in Supabase *Authentication > Users > Add user* met eigen wachtwoord en *Auto Confirm User*. Geef mij alleen het e-mailadres. | Je kunt inloggen op `/login` | S |
| A8 | Claude | **Nieuwe gebruiker koppelen** aan de kantoren `demo` en `rotsvast-test` (SQL), indien A7 een nieuw adres opleverde. | `members` bevat de koppeling; dashboard toont geen "niet gekoppeld" | S |
| A9 | Jij | **Supabase Auth instellen:** *URL Configuration* > Site URL = app-URL; openbare aanmelding **uit**; sterk-wachtwoordbeleid aan; bescherming tegen gelekte wachtwoorden aan (als je plan dat toestaat). | Beveiligingscontrole van Supabase toont geen waarschuwingen (of alleen de plan-beperking) | S |
| A10 | Samen | **Eerste echte test op Vercel** (klaar 6 okt: inloggen en dashboard online getest; aanvraag via het formulier online nog niet, wel lokaal) (achter de Vercel-login): aanvraag via de demo-hostpagina, inloggen, aanvraag onder de juiste kop, mail en telefoon klikbaar. Daarna de checklist uit [dashboard.md](dashboard.md). | Alle zes punten van de checklist afgevinkt | M |
| A11 | Samen | **Live bijwerken testen** (klaar 6 okt: testrij via de database verscheen live in het dashboard, daarna verwijderd met de knop; indienen via het formulier online nog niet): dashboard open, tweede aanvraag indienen, verschijnt vanzelf; rechtsboven "Live bijgewerkt". Als dat niet verbindt: Realtime en de publicatie controleren. | Aanvraag verschijnt zonder verversen | S |
| A12 | Claude | **Migratieversies gelijktrekken:** de repo-bestanden (`20261001100000_…`) en de versies die Supabase bij `apply_migration` vastlegde verschillen. Controleren met `list_migrations` en de namen in de repo aanpassen. | Repo en database hebben dezelfde lijst migraties | S |

## 3. Fase B: Misbruikbescherming live en de site openbaar maken

Doel: pas als dit klaar is, mag Deployment Protection uit en kan een externe site het formulier laden.

| # | Wie | Stap | Klaar als | Gr. |
|---|---|---|---|---|
| B1 | Jij | **Upstash Redis** aanmaken (gratis, regio Europa); `UPSTASH_REDIS_REST_URL` en `UPSTASH_REDIS_REST_TOKEN` in Vercel (Sensitive) en `.env.local`. Stappen: [abuse-protection.md](abuse-protection.md). | Variabelen gezet; opnieuw gedeployd | S |
| B2 | Claude | **Upstash echt testen** (alleen met jouw sleutels lokaal): `scripts/test-abuse.mjs` tegen de echte Upstash. Dit is nu alleen tegen een nepversie getest. | 29 van 29 geslaagd tegen echte Upstash; geen `GEEN gedeelde teller`-logregel | M |
| B3 | Jij | **Cloudflare Turnstile**: widget voor `rentalflowai.vercel.app` (en `localhost`), site key en secret key in Vercel (secret als Sensitive). | Vakje "Verificatie" zichtbaar in het formulier | S |
| B4 | Claude | **Turnstile testen** met echte sleutels in de browser (verbergt het vakje niet in een iframe op een andere origin?). | Aanvraag lukt met geldig token; zonder token `captcha_failed` | S |
| B5 | Jij | **Vercel Firewall:** rate-limit-regel op `/api/aanvraag` (bijvoorbeeld 10 per minuut per IP), als je plan dat toestaat. | Regel actief; testverzoek boven de limiet krijgt `429` | S |
| B6 | Samen | **Make-quota bewaken:** dagplafond (`MAX_APPLICATIONS_PER_DAY`, nu 30) afstemmen op je plan; in Make een melding bij fouten of bijna-limiet aanzetten. | Dagplafond bewust gekozen; Make mailt bij fouten | S |
| B7 | Jij | **Deployment Protection uit** voor productie (pas na B1 tot en met B5). Eerst met `sendApplicantMail: false` laten staan. | Site is zonder Vercel-login bereikbaar; formulier werkt vanaf een externe origin | S |
| B8 | Claude | **Externe-origin test:** widget op een pagina op een andere origin (`demo-host/external.html`, of via de Vercel-URL) met de echte site. | Modal opent, aanvraag komt aan, geen CSP-fout | S |
| B9 | Samen | **Geheimen vernieuwen vóór echt gebruik:** `MAKE_WEBHOOK_SECRET` opnieuw (let op: delen ervan stonden eerder in de chat), Make-sleutel mee veranderen; Supabase secret key niet delen. | Nieuwe sleutels in `.env.local`, Vercel en Make; e2e-test slaagt | S |

## 4. Fase C: Wat er nog ontbreekt aan het product

Prioriteit: **P1** = nodig voordat een echte makelaar het gebruikt; **P2** = belangrijk voor een goed product; **P3** = later.

| # | Prio | Wie | Onderdeel | Wat er mist en wat te doen | Klaar als | Gr. |
|---|---|---|---|---|---|---|
| C1 | P1 | Claude | **Doorsturen na inloggen** (klaar 6 okt, na-login-gedrag nog met echte login te testen) | De link "Open in dashboard" (`/dashboard?application=…`) gaat na inloggen naar `/dashboard` en verliest de aanvraag. Voeg een `next`-parameter toe aan `/login` en gebruik die na een geslaagde login (alleen relatieve paden toestaan, tegen open redirects). | Link uit de mail opent na inloggen direct de juiste aanvraag | S |
| C2 | P1 | Claude | **Wachtwoord vergeten** (klaar 6 okt: /wachtwoord-vergeten, /auth/callback, /wachtwoord-nieuw; /auth/bevestig gebouwd, de mailtemplate omzetten kan pas met een eigen SMTP-server (nu niet mogelijk), zie docs/dashboard.md; eigen mailserver hoort bij fase D/F) | Was: geen herstelpagina. Bouw `/login/herstel` (mail aanvragen) en `/login/nieuw-wachtwoord` (token uit de link), met Supabase Auth; algemene meldingen zonder te verklappen of een adres bestaat. | Een gebruiker kan zijn wachtwoord zelf herstellen | M |
| C3 | P1 | Claude | **Foutpagina's** (klaar 6 okt: 404, fout, global-error getest) | Eigen 404- en foutpagina (Nederlands), ook voor `/dashboard` zonder kantoor en bij een Supabase-storing. | Geen kale Next.js-fouten voor gebruikers | S |
| C4 | P1 | Claude | **Dashboard bij veel aanvragen** (klaar 6 okt: zoeken, status, sorteren, "toon meer"; logica getest met 2.000 stuks, alles blijft client-side tot 500 geladen) | Nu maximaal 500 aanvragen, zonder zoeken of sorteren. Voeg zoeken (naam, e-mail), sorteren (nieuwste, inkomen), "alleen nieuw" en paginering of "meer laden" toe. | Soepel met 2.000 verzonnen aanvragen (testset) | M |
| C5 | P1 | Claude | **Verwijderen op verzoek (AVG)** (klaar 6 okt: knop + deletion_log + procedure in docs/dashboard.md; RLS 12 checks; knop getest op voorbeeldpagina, met echte login nog niet) | Een makelaar kan nu niets verwijderen. Maak een beheerprocedure: een beveiligde actie "verwijder aanvraag" (logt wie en wanneer, zonder gegevens) en een SQL-procedure voor jou. | Een aanvraag is aantoonbaar volledig verwijderd (database, logboek; Sheet en mail handmatig) | M |
| C6 | P1 | Claude | **Privacyverklaring koppelen** (klaar 6 okt als CONCEPT: /privacy/[tenant], NL+EN, link in formulier; jurist moet nog toetsen, zie D) | In `data/tenants/*.json` ontbreekt `privacyPolicyUrl`; het formulier toont nu "geen privacyverklaring gekoppeld". Schrijf een concept en toon de link in het formulier. | Link in het formulier werkt; tekst noemt bewaartermijn, verwerkers en rechten | M |
| C7 | P1 | Claude | **Kantoor-onboarding** (klaar 6 okt: docs/nieuwe-makelaar.md met SQL-sjablonen en acceptatietest; "< 30 min" nog niet met een echt kantoor beproefd) | Een nieuwe makelaar toevoegen vraagt nu handwerk op vijf plekken (tenant-JSON, `organizations`, `members`, `allowedOrigins`, Make). Schrijf één checklist en een SQL-sjabloon. | Nieuwe tenant in minder dan 30 minuten volgens het document | M |
| C8 | P2 | Claude | **Tenant in productiemodus** (klaar 6 okt: voorbeeld-productie + scripts/test-production-mode.mjs, 11/11) | `demo` en `rotsvast-test` staan op `mode: test`. Maak een voorbeeld-tenant met `mode: production` (vaste woningen, geen hints) en test dat hints genegeerd worden. | Test slaagt; een onbekende woning geeft 404 | S |
| C9 | P2 | Claude | **E-mail naar de aanvrager** | `sendApplicantMail` staat uit. Besluit wanneer aan (na B-fase), controleer de tekst ("definitieve reactie volgt"), en test de filter in Make. | Bevestigingsmail komt alleen aan als de tenant dat aan heeft | S |
| C10 | P2 | Claude | **Meer medewerkers** | De database ondersteunt het; er is geen scherm. Uitnodigen, rollen `owner` en `staff`, en wie mag wat. | Een collega kan met eigen login dezelfde aanvragen zien en wijzigen | L |
| C11 | P2 | Claude | **Instellingen per kantoor** | `notify_email`, bewaartermijn en kantoornaam alleen via SQL aan te passen. Maak een eenvoudig instellingenscherm voor de eigenaar. | Eigenaar past bewaartermijn aan; de nachtelijke taak gebruikt die waarde | M |
| C12 | P2 | Claude | **Woningconfiguratie beheren** | Criteria staan in JSON-bestanden in de repo. Verplaats naar Supabase of een Sheet achter `ConfigProvider`, met een scherm voor de makelaar. | Makelaar wijzigt een criterium zonder code en het formulier past zich aan | L |
| C13 | P2 | Claude | **Documenten (gefaseerd)** | Documenten worden nu alleen benoemd, niet opgevraagd. Bouw uploaden pas bij "geschikt", in een privé-opslag met korte links en een eigen bewaartermijn. | Een documentverzoek en een upload werken beveiligd | L |
| C14 | P2 | Claude | **Toegankelijkheid van de nieuwe pagina's** | Axe op `/login` en `/dashboard` met echte gegevens, toetsenbordtest, schermlezer (NVDA of VoiceOver) en een echte telefoon. | Geen overtredingen; handmatige test genoteerd | M |
| C15 | P2 | Claude | **Tweetalig dashboard (optioneel)** | Nu alleen Nederlands (jouw keuze). Alleen oppakken als een kantoor dat vraagt. | n.v.t. tot het gevraagd wordt | M |
| C16 | P3 | Claude | **Export** | Export van aanvragen (CSV) voor de makelaar. | Download klopt met het scherm | S |
| C17 | P3 | Claude | **Koppeling met makelaarssoftware/CRM** | Pas na het eerste echte gebruik; vraagt eigen onderzoek per pakket. | Besluit en plan per pakket | L |

## 5. Fase D: Privacy, juridisch en beheer

| # | Wie | Stap | Klaar als | Gr. |
|---|---|---|---|---|
| D1 | Jij | **Opruiming van de Sheet en de mails** (regel en stappen opgeschreven in docs/procedures-privacy.md, uitvoeren moet jij/het kantoor) (de bewaartaak raakt alleen de database): spreek een regel af, bijvoorbeeld wekelijks rijen ouder dan 6 maanden verwijderen, en schrijf die op. Eventueel een geplande Make-taak. | Regel op papier en een eerste handmatige opruiming gedaan | S |
| D2 | Jij | **Verwerkers inventariseren en regelen:** Supabase, Vercel, Make, Google (Sheet, Gmail), Upstash, Cloudflare, en de AI-aanbieder. Per verwerker: verwerkersovereenkomst/DPA, regio, wat ze verwerken. Voor het prototype alleen noteren; voor echt gebruik tekenen. | Tabel in `docs/` met per verwerker de status | M |
| D3 | Claude | **Verwerkingsregister en een korte DPIA** (klaar 6 okt: docs/verwerkingsregister.md, docs/dpia.md, concept) (doel, grondslag, gegevens, bewaartermijn, risico's, maatregelen), inclusief de beslissing dat de computer niemand afwijst. | Twee documenten in `docs/`, door jou gelezen | M |
| D4 | Samen | **Procedure voor verzoeken van betrokkenen** (klaar 6 okt als tekst in docs/procedures-privacy.md, nog niet beproefd met een verzonnen verzoek) (inzage, correctie, verwijdering) met doorlooptijd en wie wat doet. Gebruik C5. | Procedure getest met een verzonnen verzoek | S |
| D5 | Jij | **Supabase-plan en back-ups:** controleer welk plan het is (het gratis plan pauzeert na een week zonder gebruik en heeft beperkte back-ups); kies voor een demo of echt gebruik. | Plan bewust gekozen; hervatten bij pauze bekend | S |
| D6 | Jij | **Vercel-plan:** Hobby is voor persoonlijk, niet-commercieel gebruik. Voor een echte makelaar is een ander plan nodig. | Besluit vastgelegd | S |
| D7 | Claude | **Oud archief afhandelen:** na een proefperiode `archive_prototype` definitief verwijderen, met jouw akkoord. De oude gebruikersrij verwijst naar `auth.users`; controleer vooraf of dat niets blokkeert. | Archief weg of bewust bewaard; beveiligingscontrole schoon | S |
| D8 | Jij | **Oude OneDrive-map** `versie 2 vastgoedmap` verwijderen als alles klopt (kies in OneDrive *Verwijderen*, niet *Herstellen*). | Map weg; project alleen in `C:\dev\rentalflowai` en GitHub | S |
| D9 | Claude | **Cookies en toestemming controleren** (klaar 6 okt: formulier zet geen cookies, dashboard alleen inlogcookies; in docs/procedures-privacy.md en de privacyverklaring; Turnstile nog te controleren bij fase B): het dashboard gebruikt alleen noodzakelijke inlogcookies; het formulier gebruikt er geen. Leg dat vast; voeg alleen een banner toe als dat verandert. | Notitie in de privacyverklaring | S |

## 6. Fase E: AI (alleen waar regels tekortschieten)

Uitgangspunt: cijfers en ja/nee-vragen blijven regels. AI doet twee dingen: de vrije toelichting samenvatten en een conceptmail
schrijven als informatie ontbreekt. De AI adviseert; de makelaar beslist; er gaat nooit iets automatisch naar de aanvrager.

**Ontwerpkeuzes (vooraf vastleggen):**
- De AI draait **na** het opslaan en **buiten** het formulierantwoord (asynchroon, bijvoorbeeld met `after()` van Next), zodat een trage of falende AI het formulier nooit blokkeert.
- Alleen de toelichting en de redenen (codes) gaan naar de AI. **Nooit** naam, e-mailadres of telefoonnummer.
- De tekst van de aanvrager is **onbetrouwbare invoer** (prompt-injectie): de AI krijgt hem als data, de uitvoer wordt streng gevalideerd met een schema, er zijn geen tools, en een samenvatting kan nooit de uitkomst van de regels veranderen.
- Gestructureerde uitvoer, een vast model en versie per resultaat (traceerbaar), een kostenplafond per dag, en foutafhandeling zonder gegevens in de logs.
- Een resultaat wordt opgeslagen in een eigen tabel `ai_outputs` (alleen lezen voor de makelaar), niet in `applications`.

| # | Wie | Stap | Klaar als | Gr. |
|---|---|---|---|---|
| E1 | Samen | **AI-aanbieder kiezen** (OpenAI of Gemini) en een eigen sleutel met een bestedingslimiet maken. Sleutels alleen jij, in Vercel (Sensitive) en `.env.local`. | Limiet ingesteld; sleutel nergens gedeeld | S |
| E2 | Claude | **Migratie `ai_outputs`** (klaar 6 okt, afscherming getest): `application_id`, `kind` (`summary` of `draft_mail`), `content` (jsonb), `model`, `prompt_version`, `tokens_in/out`, `cost_eur`, `status`, `created_at`. RLS: lezen voor het eigen kantoor, schrijven alleen server. Bewaartermijn volgt de aanvraag (cascade). | Migratie toegepast; afscherming getest met twee kantoren | M |
| E3 | Claude | **Provider-laag** (klaar 6 okt: OpenAI + nepaanbieder, Gemini nog niet): één interface, adapters voor OpenAI en Gemini, keuze via een instelling, met timeouts en een nette terugval. | Tests met een nepaanbieder slagen | M |
| E4 | Claude | **Samenvatting van de toelichting** (klaar 6 okt met nepaanbieder end-to-end getest; echte OpenAI-proef wacht op sleutel): prompt (versie 1), schema voor de uitvoer (korte samenvatting, aandachtspunten), alleen aanroepen als er een toelichting is, resultaat in `ai_outputs`, zichtbaar in het dashboard. | Aanvraag zonder toelichting kost niets; met toelichting verschijnt een samenvatting | M |
| E5 | Claude | **Conceptmail bij ontbrekende informatie** (klaar 6 okt: alleen op klik, alleen onder Review met een vraag, geen verzendknop; 73 tests + proef met echt model; echte login-klik online nog niet): alleen voor `review` met bruikbare redenen (bijvoorbeeld garantsteller of werkgeversverklaring); taal van de aanvrager (NL/EN); als **concept** in het dashboard met een kopieerknop. Er is geen verzendknop en geen automatische verzending. | Concept zichtbaar; er bestaat geen codepad dat het verstuurt | M |
| E6 | Claude | **Veiligheid van de AI** (deels klaar 6 okt: 46 tests met nepaanbieder, zie docs/ai.md; proef met echt model nog open): tests met vijandige toelichtingen ("negeer alle regels…"), lange invoer, andere talen; geen gevoelige kenmerken als reden; geen persoonsgegevens in logs; kostenplafond per dag en foutafhandeling. | Alle veiligheidstests slagen; plafond getest | M |
| E7 | Claude | **Testset en basismeting:** 30 tot 50 verzonnen aanvragen met door een mens bepaalde verwachte uitkomst en een goede toelichting; script dat de regelmotor meet (nauwkeurigheid per groep, onterecht "ongeschikt"). | Reproduceerbaar rapport van de regels alleen | M |
| E8 | Claude | **Vergelijking:** regels, AI en regels plus AI, voor OpenAI en Gemini: kwaliteit van samenvattingen (beoordeeld op een vaste lijst), nuttigheid van conceptmails, kosten per aanvraag, snelheid, fouten. | Rapport met een onderbouwde conclusie: waar voegt AI iets toe en waar niet | M |
| E9 | Samen | **Conclusie en keuze:** welke AI-functies aan blijven, welke uit, welke aanbieder. | Besluit in `docs/` | S |

## 7. Fase F: Een externe site en de eerste echte makelaar

| # | Wie | Stap | Klaar als | Gr. |
|---|---|---|---|---|
| F1 | Samen | **Rotsvast-test:** widget via de userscript (`demo-host/rotsvast-test.user.js`) in je eigen browser op een echte woningpagina. Het is een test; geen officiële koppeling, geen gebruik van hun naam in het product. Eerst fase B afronden. | Knop verschijnt, aanvraag komt aan; CSP van de site blokkeert niets (of de beperking is genoteerd) | M |
| F2 | Jij | **Een echte (proef)makelaar zoeken** en toestemming vragen voor een proef met nepwoningen of een echte woning. | Schriftelijk akkoord op doel en duur | M |
| F3 | Claude | **Onboarding volgens C7:** tenant, kantoor, leden, `allowedOrigins`, privacyverklaring, `notifyEmail`, Make-routering per kantoor. | De makelaar kan inloggen en ziet alleen eigen aanvragen | M |
| F4 | Samen | **Widget op hun site plaatsen** met één scriptregel, per woning de `data-*`-gegevens; test op mobiel en op hun CSP. | Aanvraag van hun site komt in hun dashboard | M |
| F5 | Samen | **Proefperiode met evaluatie:** wat bespaart het de makelaar, wat is verwarrend, wat ontbreekt. | Korte evaluatie met cijfers (tijd per aanvraag, aantal bruikbare aanvragen) | M |

## 8. Fase G: Kwaliteit, beheer en afronding

| # | Wie | Stap | Klaar als | Gr. |
|---|---|---|---|---|
| G1 | Claude | **Automatische controle bij elke push (CI, GitHub Actions):** typecheck, lint, build, en de testscripts tegen nep-diensten. | Groene check op GitHub bij elke push | M |
| G2 | Claude | **Tests voor het dashboard-gedrag:** puur gedrag (volgende stap, omzetting van rijen) met unit tests; routebeveiliging; geen regressie in de misbruiktests. | Tests lopen in CI | M |
| G3 | Claude | **Monitoring en meldingen:** logregels `[abuse] geblokkeerd`, `[db]`, `[delivery]` in Vercel; een melding bij herhaalde fouten; een eenvoudige gezondheidscontrole. | Je krijgt een melding bij een storing of een piek van blokkades | M |
| G4 | Claude | **Afhankelijkheden:** `npm audit`, updates van Next en Supabase-pakketten, en de waarschuwing over `unrs-resolver` (`npm approve-scripts`). | Geen bekende kwetsbaarheden; lockfile bijgewerkt | S |
| G5 | Claude | **OneDrive-valkuil vermijden:** werk alleen in `C:\dev\rentalflowai`; bij vreemd gedrag eerst `.next` verwijderen en opnieuw bouwen. Staat in de README. | Geen `-DESKTOP-`-bestanden in `.next` | S |
| G6 | Claude | **Documentatie bijwerken:** README, `PLAN.md`, handleidingen en dit plan, met wat is gedaan en wat niet. | Een nieuwe lezer kan het project starten en begrijpen | M |
| G7 | Samen | **Kostenoverzicht:** per dienst (Vercel, Supabase, Make, Upstash, Cloudflare, AI) wat gratis is, wanneer het betaald wordt, en de verwachte kosten per 100 aanvragen. | Tabel in `docs/` | S |
| G8 | Claude | **Eindcontrole veiligheid:** een laatste volledige doorloop: afscherming, geheimen, headers, misbruiktests, beveiligingscontrole van Supabase, `npm audit`. | Alle controles groen, uitkomst genoteerd | M |
| G9 | Jij | **Oplevering voor de minor:** presentatie (de tekst van 4 minuten), demo (lokaal of met screenshots), aantoonbare resultaten (testrapporten, AI-vergelijking), en een eerlijke lijst van beperkingen. | Presentatie en bewijs klaar | M |

## 9. Risico's en wat open staat

| Risico of open punt | Gevolg | Wat je eraan doet |
|---|---|---|
| Echte inlog en live bijwerken zijn nog niet getest | Het dashboard kan op het laatste moment niet werken | Doe A7 tot en met A11 zo snel mogelijk |
| Upstash en Turnstile zijn alleen tegen nepversies getest | Echte werking onbekend | B2 en B4 |
| Eén Supabase-project (geen aparte testomgeving) | Testgegevens kunnen met echte gegevens mengen | Testgegevens herkenbaar maken en opruimen; echte gegevens pas na fase B en D |
| Het gratis Supabase-plan pauzeert na een week | Dashboard is leeg of traag tijdens een demo | Voor de demo vooraf hervatten (D5) |
| Make-quota (1.000 operaties per maand gratis) | Scenario valt stil bij een piek | Dagplafond en meldingen (B6) |
| Sheet en mails bewaren langer dan 6 maanden | Strijd met de eigen bewaartermijn | D1 |
| Hobby-plan van Vercel is niet-commercieel | Niet toegestaan voor echt gebruik | D6 |
| De AI kan fouten maken of misbruikt worden via de toelichting | Verkeerde samenvatting of onwenselijke tekst | E5, E6: concept, schema, tests, makelaar beslist |
| Wachtwoord vergeten ontbreekt | Een uitgesloten makelaar kan niet zelf herstellen | C2 |
| Link uit de mail verliest de aanvraag na inloggen | Minder gebruiksgemak | C1 |
| Eerder in de chat getoonde delen van een oud Make-geheim | Mogelijke blootstelling | Al vervangen; B9 doet het nog eens vóór echt gebruik |
| Open vraag: AI-aanbieder (OpenAI of Gemini) | Bepaalt E3 en E4 | Besluit bij E1 |
| Open vraag: eerste echte makelaar | Bepaalt fase F | F2 |

## 10. Volgorde (kritiek pad)

1. **A1 tot en met A12:** vastleggen, online, inloggen, live testen. (Hier hangt alles aan.)
2. **C1 tot en met C3 en C5 tot en met C7:** de P1-onderdelen die een echte makelaar nodig heeft.
3. **B1 tot en met B9:** misbruikbescherming echt aan, dan pas openbaar.
4. **D1 tot en met D6:** privacy en juridisch, parallel aan stap 3.
5. **E1 tot en met E9:** AI, en de meting.
6. **F1 tot en met F5:** externe site en proefmakelaar.
7. **G1 tot en met G9:** kwaliteit en oplevering (G1 en G4 kun je al vroeg doen).

C4, C8 tot en met C13 en C14 vul je in waar ze het meest nodig zijn; ze staan niet op het kritieke pad.

## 11. Eindchecklist

Vink af zodra het echt klopt ("klaar als" gehaald).

**Vastleggen en online (fase A)**
- [ ] A1 Alles gecommit, zonder geheimen
- [ ] A2 Naar GitHub gepusht
- [ ] A3 Supabase secret key opgehaald
- [ ] A4 Sleutel in `.env.local`; lokale testaanvraag staat in `applications`
- [ ] A5 Vier variabelen in Vercel
- [ ] A6 Opnieuw gedeployd, *Ready*
- [ ] A7 Inlog werkt
- [ ] A8 Gebruiker aan de kantoren gekoppeld
- [ ] A9 Supabase Auth ingesteld (Site URL, aanmelding uit, wachtwoordbeleid)
- [ ] A10 Checklist van `dashboard.md` doorlopen
- [ ] A11 Live bijwerken getest
- [ ] A12 Migratieversies gelijk

**Misbruikbescherming en openbaar maken (fase B)**
- [ ] B1 Upstash ingesteld
- [ ] B2 29 controles geslaagd tegen echte Upstash
- [ ] B3 Turnstile ingesteld
- [ ] B4 Turnstile getest met echte sleutels
- [ ] B5 Vercel Firewall-regel actief
- [ ] B6 Dagplafond en Make-meldingen bewust ingesteld
- [ ] B7 Deployment Protection uit, daarna werkt de site extern
- [ ] B8 Externe-origin test geslaagd
- [ ] B9 Geheimen vernieuwd

**Product (fase C)**
- [ ] C1 Doorsturen na inloggen
- [ ] C2 Wachtwoord vergeten
- [ ] C3 Foutpagina's
- [ ] C4 Zoeken, sorteren en paginering
- [ ] C5 Verwijderen op verzoek
- [ ] C6 Privacyverklaring gekoppeld
- [ ] C7 Onboarding-checklist en SQL-sjabloon
- [ ] C8 Tenant in productiemodus getest
- [ ] C9 Aanvragersmail bewust aan of uit
- [ ] C10 Meer medewerkers (indien nodig)
- [ ] C11 Instellingenscherm (indien nodig)
- [ ] C12 Woningconfiguratie beheren (indien nodig)
- [ ] C13 Documenten (indien nodig)
- [ ] C14 Toegankelijkheid van `/login` en `/dashboard` getest, ook handmatig
- [ ] C16 Export (indien nodig)

**Privacy en beheer (fase D)**
- [ ] D1 Opruimregel voor de Sheet en de mails
- [ ] D2 Verwerkers geïnventariseerd en geregeld
- [ ] D3 Verwerkingsregister en DPIA
- [ ] D4 Procedure voor verzoeken van betrokkenen
- [ ] D5 Supabase-plan en back-ups bewust gekozen
- [ ] D6 Vercel-plan bewust gekozen
- [ ] D7 Oud archief afgehandeld
- [ ] D8 Oude OneDrive-map verwijderd
- [ ] D9 Cookies vastgelegd

**AI (fase E)**
- [ ] E1 Aanbieder gekozen en limiet ingesteld
- [ ] E2 `ai_outputs` met afscherming
- [ ] E3 Provider-laag
- [ ] E4 Samenvatting van de toelichting
- [ ] E5 Conceptmail, zonder verzendpad
- [ ] E6 Veiligheidstests en kostenplafond
- [ ] E7 Testset en basismeting
- [ ] E8 Vergelijking regels, AI en beide
- [ ] E9 Conclusie en keuze vastgelegd

**Externe site en eerste makelaar (fase F)**
- [ ] F1 Rotsvast-test geslaagd
- [ ] F2 Proefmakelaar akkoord
- [ ] F3 Onboarding gedaan
- [ ] F4 Widget op hun site
- [ ] F5 Proefperiode geëvalueerd

**Kwaliteit en oplevering (fase G)**
- [ ] G1 CI groen op GitHub
- [ ] G2 Tests voor dashboard-gedrag
- [ ] G3 Monitoring en meldingen
- [ ] G4 Afhankelijkheden up-to-date, geen kwetsbaarheden
- [ ] G5 README bevat de OneDrive-valkuil
- [ ] G6 Documentatie bijgewerkt
- [ ] G7 Kostenoverzicht
- [ ] G8 Eindcontrole veiligheid groen
- [ ] G9 Presentatie en bewijs voor de minor klaar

**Altijd waar aan het einde**
- [ ] Geen geheimen in git, chat of browser
- [ ] Geen automatische afwijzing mogelijk, in code of in Make
- [ ] Beveiligingscontrole van Supabase en `npm audit` zonder open punten (of bewust genoteerd)
- [ ] Alle testscripts slagen (`test-abuse`, `test-store`, en de AI-tests)
- [ ] Eerlijke lijst van wat niet is gedaan of niet is getest

## 12. Koerswijziging van 6 oktober 2026: eerst goed, duidelijk, mooi en uit te leggen

Besluit van Bouke: de site hoeft **nog lang niet online**. Eerst moet hij goed werken, duidelijk zijn, mooier worden, en moet Bouke hem goed aan makelaars kunnen uitleggen. Fase B (Upstash, Turnstile, openbaar maken) en D2, D5, D6 zijn daarom **geparkeerd** tot er een echte makelaar is.

**Gedaan op 6 oktober**
- Merkidentiteit (kleuren, logo, kop en voet): `src/components/brand`, `src/components/marketing`, kleuren in `src/app/globals.css`.
- Uitlegpagina als startpagina (`/`): hoe het werkt, de drie groepen, dashboard, AI, privacy, veelgestelde vragen, eerlijk over de stand van zaken.
- Dashboard opgeknapt: bovenbalk met merk, overzichtstegels (Suitable, Review, Unsuitable, Nog niet benaderd), uitklapbare uitleg "Hoe werkt dit scherm?", kleur per groep, filters in een kaart.
- Inlogschermen met een gedeeld, gemerkt kader (`AuthShell`); alle gewijzigde pagina's: 0 axe-schendingen; telefoonweergave gecontroleerd voor de uitlegpagina.
- Formulier opgeknapt: kaartsecties, eisenblok met vinkjes, merkkleuren.
- Realistische demo-makelaarssite (`public/demo-host.html`) met vijf woningen en lichte weergave vastgezet.
- Demoknoppen in het formulier voor testkantoren: *Sterke aanvraag*, *Twijfelgeval*, *Past niet* (alleen zichtbaar als `mode: test`; getest dat een productietenant ze niet toont).
- `docs/uitleg-makelaars.md`: pitch van 30 seconden, demoscript van 5 minuten, lastige vragen met eerlijke antwoorden, wat je wel en niet mag beloven, vragen voor de makelaar, woordenlijst.
- Teksten voor makelaars consequent met "u".

**Volgende kandidaten (in volgorde van waarde voor het uitleggen)**
| # | Wie | Onderdeel | Waarom |
|---|---|---|---|
| H1 | Claude | Scherm "Eisen per woning" (C12): de makelaar stelt eisen, hard/review en marge zelf in | Maakt "u bepaalt hoe streng" waar; sterkste demo-moment |
| H2 | Claude | Echte screenshots en een korte "zo ziet het eruit"-sectie op de uitlegpagina | Makelaars geloven wat ze zien |
| H3 | Claude | Presentatie (slides) en een A4 met de kern | Voor gesprekken en de eindpresentatie |
| H4 | Claude | Formulier: voortgang, nette bevestigingspagina, mobiele controle van formulier en dashboard | Eerste indruk bij de woningzoeker |
| H5 | Claude | Eén automatische rooktest voor de hele keten (formulier, opslag, dashboard, verwijderen) | Zeker weten dat een demo werkt |
| H6 | Samen | Proefgesprek met één echte makelaar met `docs/uitleg-makelaars.md`, feedback verwerken | Echte labels voor de meting (E8) en echte wensen |
