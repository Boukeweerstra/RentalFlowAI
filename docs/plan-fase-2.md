# Plan fase 2: dashboard voor de makelaar, daarna AI

Status: **plan, nog niets gebouwd.** Besluiten van de eigenaar staan onder "Besluiten".

## 1. Waarom en wat

**Nu:** een aanvraag komt als rij in een Google Sheet en als mail bij de makelaar. Hij moet zelf in de Sheet filteren op
`precheckStatus` en contactgegevens opzoeken.

**Straks:** een beveiligde pagina in dezelfde app, alleen voor de makelaar. Elke binnenkomende aanvraag staat automatisch
onder de koppen **Suitable**, **Review** en **Unsuitable**, met alle gegevens erbij en **mail en telefoonnummer meteen
zichtbaar**, zodat hij direct kan bellen of mailen. Hij kan de groep en de behandelstatus aanpassen en een notitie maken.

Daarna (tweede helft van fase 2) komt de AI, en laat het dashboard haar uitkomst zien. Voor een mens blijft de eindbeslissing.

**Wat de makelaar niet meer hoeft:** zoeken in de Sheet. De Sheet blijft bestaan als back-up.

## 2. Besluiten

| Onderwerp | Besluit |
|---|---|
| Opslag | Aanvragen komen ook in **Supabase** (EU, Ierland). Het dashboard leest daaruit. Make blijft de mail en de Sheet doen. |
| Database | **Schoon beginnen** met een klein eigen ontwerp. De bestaande tabellen in het project `RentalFlowAI` (een groter ontwerp voor e-mail, afspraken en herinneringen) worden niet gebruikt. |
| Inloggen | **Eén login per makelaarskantoor** nu. Het ontwerp gebruikt al kantoren en leden, zodat meerdere medewerkers later zonder ombouw kunnen. |
| Acties | Groep verplaatsen, behandelstatus aanpassen, notitie, "benaderd". Geen mail versturen vanuit het dashboard. |
| Behandelstatus | `nieuw`, `benaderd`, `bezichtiging gepland`, `afgerond` |
| Bewaartermijn | **6 maanden**, daarna worden aanvragen automatisch verwijderd |
| Beveiligingswaarschuwingen | Worden opgelost bij het opruimen van het oude schema |
| Mens beslist | Blijft zo: er gaat nooit automatisch een afwijzing de deur uit |

## 3. Hoe het in elkaar zit

```
Woningzoeker -> formulier -> /api/aanvraag (alle beveiligingslagen)
                                |-- 1. opslaan in Supabase   (bron van waarheid)
                                |-- 2. naar Make -> Sheet + mail aan makelaar
                                v
Makelaar -> /login -> /dashboard (leest uit Supabase, alleen eigen kantoor)
```

- **Volgorde bij het indienen:** eerst opslaan, dan Make. Mislukt één van de twee, dan gaat de aanvraag toch door via de andere
  (en wordt de fout gelogd). Pas als **beide** mislukken krijgt de woningzoeker een foutmelding en worden de gereserveerde
  plekken van de misbruikcontrole teruggegeven.
- **Het dashboard gebruikt nooit de geheime sleutel.** Het leest met de inlog van de makelaar, en de database dwingt zelf af
  welke rijen hij mag zien (rijafscherming). De geheime sleutel gebruikt alleen de server, om een aanvraag op te slaan.
- **Mail aan de makelaar** krijgt een link "Open in dashboard" naar die aanvraag.
- **Live bijwerken:** nieuwe aanvragen verschijnen vanzelf (Supabase Realtime, met dezelfde rijafscherming), met verversen als terugval.

## 4. Datamodel (schoon, drie tabellen en een logboek)

| Tabel | Doel | Belangrijkste kolommen |
|---|---|---|
| `organizations` | Een makelaarskantoor | `id`, `tenant_key` (bijv. `demo`), `name`, `notify_email`, `retention_months` (standaard 6) |
| `members` | Wie bij welk kantoor hoort | `user_id` (Supabase Auth), `organization_id`, `role` (`owner` of `staff`) |
| `applications` | Een aanvraag | zie hieronder |
| `application_events` | Logboek: wie deed wat en wanneer | `application_id`, `actor` (leeg = systeem), `action`, `from_value`, `to_value`, `created_at` |

`applications` bevat:
- **Woning:** `property_id`, `property_address`, `rent`, `property_source`
- **Contact:** `name`, `email`, `phone` (voor snel contact)
- **Huishouden en inkomen:** `applicants`, `occupants`, `total_income`, `income_required`
- **Eerste check (onveranderlijk):** `precheck_status` (`suitable`, `review`, `unsuitable`) en `precheck_reasons` (lijst met codes)
- **De keuze van de makelaar:** `group_current` (begint gelijk aan `precheck_status`, kan hij verplaatsen), `handling_status`, `contacted_at`, `note`
- **Alles:** `payload` (de volledige gestructureerde aanvraag als JSON) en `lang`
- **Tijd:** `created_at`, `updated_at`

Het verschil tussen `precheck_status` en `group_current` is bewust: je ziet altijd wat de computer voorstelde, en wat de
makelaar uiteindelijk koos.

**Rijafscherming (RLS)**
- Een ingelogde gebruiker ziet en wijzigt alleen rijen van **zijn eigen kantoor**.
- Hij mag alleen vier kolommen wijzigen: `group_current`, `handling_status`, `contacted_at`, `note`. Alles anders (contact, inkomen, eerste check) is
  alleen te lezen. Dit wordt met kolomrechten afgedwongen, niet alleen in de app.
- Niet-ingelogde bezoekers (`anon`) hebben **geen** toegang tot deze tabellen. Aanvragen toevoegen kan alleen de server.
- Elke wijziging van groep, status of notitie wordt door een database-trigger in `application_events` gelogd.

**Bewaartermijn:** een dagelijkse taak (`pg_cron`) verwijdert aanvragen die ouder zijn dan `retention_months` van hun kantoor
(standaard 6 maanden). Let op: dit raakt **niet** de Google Sheet en de mails. Daar moet apart worden opgeruimd (zie risico's).

## 5. Het dashboard

**Overzicht**
- Drie kopjes met teller: **Suitable** (geschikt voor bezichtiging), **Review** (zelf beoordelen) en **Unsuitable** (volgens de regels niet passend).
- Filter per woning, nieuwste bovenaan.
- **Elke aanvraag toont direct, zonder klikken:** naam, woning, hoe lang geleden, inkomen naast de eis, de redenen, de volgende stap,
  en **het e-mailadres en telefoonnummer in leesbare, grote tekst** met de knoppen *Mail*, *Bel* en *Kopieer*.
  (`mailto:` en `tel:`-links, ook handig op een telefoon.)
- Klik voor details: huishouden, gewenste startdatum, toelichting, notitie en logboek.

**Volgende stap** wordt met vaste regels uit de redenen afgeleid, bijvoorbeeld:
`suitable` -> "Plan een bezichtiging", `guarantor_required` -> "Vraag gegevens van de garantsteller op",
`probation_not_allowed` -> "Controleer het dienstverband, vraag een werkgeversverklaring", `unsuitable` -> "Jij beslist; er wordt niets automatisch verstuurd".

**Acties:** groep verplaatsen, behandelstatus kiezen (nieuw, benaderd, bezichtiging gepland, afgerond), "benaderd"-vinkje (zet `contacted_at`), notitie.

**Kwaliteit:** Nederlands, werkt op telefoon, toegankelijk (toetsenbord, focus, contrast, zoals het formulier), duidelijke lege toestand en foutmeldingen.

## 6. Beveiliging en privacy

- **Inloggen met Supabase Auth.** Sessies in beveiligde cookies. Beveiligde routes controleren de sessie op de server. Bescherming
  tegen gelekte wachtwoorden aan. Later optioneel tweestapsverificatie.
- **De pagina's `/login` en `/dashboard` mogen niet in een iframe** (`frame-ancestors 'none'`), anders dan het formulier.
- **Geheime sleutel alleen op de server** (`server-only`, in Vercel als *Sensitive*), en alleen gebruikt om een aanvraag op te slaan.
- **Geen toegang voor `anon`**, geen schrijfrechten voor ingelogde gebruikers behalve de vier kolommen.
- **Geen persoonsgegevens in logs.**
- **Bewaartermijn van 6 maanden** met automatisch verwijderen, en een logboek van wijzigingen.
- **Regio:** de database staat in Ierland (EU). Vercel draait in Frankfurt.
- **Verwerkers:** Supabase, Vercel, Make en Google verwerken persoonsgegevens. Voor echt gebruik zijn verwerkersovereenkomsten nodig (niet voor het prototype).

## 7. Opruimen van het oude schema (eerst doen)

Het project `RentalFlowAI` bevat 17 tabellen van een eerder, groter ontwerp, zonder echte gegevens. Daarmee beginnen we niet. Om niets onomkeerbaars te doen:
1. Alle oude tabellen, typen en functies **verplaatsen naar een schema `archive_prototype`**. Dat is omkeerbaar en haalt ze uit de openbare API. Niets wordt verwijderd.
2. Controleren dat de **5 beveiligingswaarschuwingen** daarmee verdwijnen (een functie die zonder inloggen uitvoerbaar is, drie rolfuncties en een functie zonder vast zoekpad). Blijft er iets over, dan lossen we dat apart op.
3. **Bescherming tegen gelekte wachtwoorden** aanzetten (dat is een instelling in het Supabase-dashboard, geen SQL).
4. Na een proefperiode kan het archief definitief weg. Dat besluit de eigenaar later.

## 8. Stappen

Elke stap heeft een "klaar als"-controle. Grootte: **S** (klein), **M** (middel), **L** (groot).

| # | Stap | Klaar als | Grootte |
|---|---|---|---|
| 0 | **Voorbereiding:** oud schema naar `archive_prototype`, waarschuwingen weg, `pg_cron` aan, gelekt-wachtwoord-controle aan | De beveiligingscontrole van Supabase toont geen waarschuwingen meer; geen tabel verloren | S |
| 1 | **Database:** migraties in de repo (tabellen, rijafscherming, kolomrechten, trigger voor het logboek, bewaartaak), kantoor `demo` aanmaken | RLS-tests slagen: kantoor A ziet B niet, `anon` ziet niets, ingelogde gebruiker kan niets toevoegen of verwijderen en alleen 4 kolommen wijzigen | M |
| 2 | **Opslaan bij indienen:** de API slaat op in Supabase, daarna Make; storingen netjes afgehandeld; mail met "Open in dashboard" | Aanvraag staat in database én Sheet; bij uitval van één kant gaat de ander door; de bestaande 29 misbruiktests blijven slagen | M |
| 3 | **Inloggen en beveiligde routes** | Zonder inlog geen toegang tot `/dashboard`; verkeerde gegevens geven een nette melding; geen iframe mogelijk | M |
| 4 | **Dashboard overzicht** (drie koppen, filter, gegevens, mail en telefoon groot zichtbaar, volgende stap) | Een nieuwe aanvraag verschijnt onder de goede kop met alle gegevens; mail en telefoon zijn met één klik te gebruiken | L |
| 5 | **Acties en live bijwerken:** groep, behandelstatus, benaderd, notitie, logboek, realtime | Wijziging blijft staan na verversen, staat in het logboek, en een tweede venster ziet nieuwe aanvragen vanzelf | M |
| 6 | **Afronden:** toegankelijkheid en mobiel, beveiligingsheaders, bewaartaak getest, documentatie | Axe-controle schoon, 6-maandentaak werkt in een proef, README en handleiding bijgewerkt | S |
| 7 | **AI deel 1:** samenvatting van de vrije toelichting, zichtbaar in het dashboard | Samenvatting bij aanvragen met toelichting, geen AI-aanroep zonder toelichting, storing van de AI breekt niets | M |
| 8 | **AI deel 2:** conceptmail voor "meer informatie nodig" als **concept** in het dashboard | Concept staat klaar en wordt nooit automatisch verstuurd; geen gevoelige kenmerken als reden | M |
| 9 | **Meten wat AI toevoegt** ten opzichte van de regels | Rapport met nauwkeurigheid, kosten en fouten van regels, AI en beide samen, op een testset | M |

Stap 0 tot en met 6 maken het dashboard. Daarna kun je het systeem al laten zien en gebruiken.

## 9. Wat blijft regels, en wat wordt AI

Het systeem is nu vooral een slimme regelmotor: cijfers, keuzelijsten en ja/nee-vragen (inkomen, leeftijd, huisdieren, proeftijd,
datums). Regels zijn daar sneller, gratis en juridisch uitlegbaar, dus **dat blijft regels**. AI komt alleen waar regels niet werken:
- de vrije toelichting samenvatten en opvallende punten markeren (stap 7);
- een conceptmail schrijven als er informatie ontbreekt (stap 8);
- later: documenten zoals loonstroken controleren.

**Grenzen voor de AI:** alleen de toelichting gaat naar de AI (geen naam, e-mailadres of telefoonnummer); de AI adviseert en vat
samen, de makelaar beslist; geen gevoelige kenmerken (nationaliteit, herkomst) als reden; bij een storing van de AI werkt alles gewoon door.
In stap 9 meten we de AI tegen de regels op een testset van 30 tot 50 verzonnen aanvragen, voor OpenAI en Gemini.

## 10. Risico's en wat we eraan doen

| Risico | Maatregel |
|---|---|
| **Eén Supabase-omgeving** (geen aparte test) | Testgegevens herkenbaar maken en na elke test opruimen; migraties altijd in de repo; geen echte persoonsgegevens vóór de beveiliging rond is |
| **Gratis Supabase-project pauzeert** na een week zonder gebruik | Controleren welk plan het is; bij pauze eerst "hervatten" voor een demo |
| **Sheet en mails bewaren gegevens langer dan 6 maanden** | De bewaartaak raakt alleen de database. Voor de Sheet en mail een aparte, handmatige of geplande opruiming afspreken (in Make) |
| **Dubbele bron** (database en Sheet) kan uit de pas lopen | De database is de bron van waarheid; de Sheet is back-up en wordt niet meer als overzicht gebruikt |
| **Geheime sleutel lekt** | Alleen op de server, als *Sensitive* in Vercel; nooit in de browser of in git; bij verdenking direct vervangen |
| **Make-quota** | Het dagplafond uit de misbruikcontrole blijft gelden |
| **Realtime laat te veel zien** | Realtime volgt dezelfde rijafscherming; apart getest met twee kantoren |

## 11. Wat jij moet doen (en ik niet kan)

- **Een inlog aanmaken voor de makelaar:** in het Supabase-dashboard onder *Authentication* een gebruiker toevoegen met jouw eigen e-mailadres en
  wachtwoord. Wachtwoorden zet ik nooit zelf; daarna koppel ik die gebruiker aan het kantoor.
- **De sleutels in Vercel zetten** (Supabase-URL, de publieke sleutel en de geheime sleutel), zoals bij de Make-geheimen.
- **Upstash en Turnstile instellen** (zie [abuse-protection.md](abuse-protection.md)) voordat Deployment Protection uitgaat.
- Akkoord geven bij elke stap die de database aanpast (ik pas niets aan zonder dat).

## 12. Nog open

1. **Inloggen:** e-mail met wachtwoord, of een magische link per mail? Ik raad wachtwoord plus de controle op gelekte wachtwoorden aan (en later tweestapsverificatie).
2. **Taal van het dashboard:** alleen Nederlands, of ook Engels?
3. **Welk e-mailadres** moet de makelaar als inlog gebruiken?
4. **Welke AI-aanbieder** eerst (OpenAI of Gemini)? Dat besluiten we pas bij stap 7.
5. **Planning:** hoeveel tijd heb je voor fase 2 binnen je minor? Dan bepalen we of stap 7 tot en met 9 erin passen.
