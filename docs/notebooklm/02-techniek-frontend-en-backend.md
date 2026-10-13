# RentalFlowAI: techniek (front-end en back-end)

Bron 2 van 5 voor de uitlegvideo. Stand: 8 oktober 2026. Bedoeld voor een publiek van docenten en medestudenten, in gewone taal.

## Overzicht in één schema
Woningzoeker (formulier) → Regels (eerste check) → Database (Supabase) → Dashboard (makelaar) → Workflow (n8n in Docker: mail en Google Sheet) → AI (alleen tekst, daarna).

## Front-end (wat je ziet)
- **Next.js 16 (App Router), React 19, TypeScript, Tailwind 4.** Eén app bevat zowel de formulierpagina's als het dashboard.
- **Widget:** een klein script (`widget.js`) op de site van de makelaar zet de knop Aanvraag neer en opent het formulier in een **iframe** vanaf onze eigen domeinnaam. Het formulier laadt alleen op de toegestane domeinen van die makelaar.
- **Formulier:** meertalig (Nederlands en Engels), toont de eisen van de woning, en stelt alleen relevante vragen (afgeleid uit de woningconfiguratie). Validatie met **zod** aan beide kanten.
- **Dashboard:** beveiligde pagina's voor de makelaar. Drie kolommen (Suitable, Review, Unsuitable), details per aanvraag, realtime updates, scherm Woningen met een live voorbeeld van wat de woningzoeker ziet. Inloggen, wachtwoord vergeten en wachtwoord wijzigen zijn eigen pagina's.
- **Uitlegpagina** (`/`) voor makelaars en een demo-makelaarssite (`demo-host.html`) om de knop in actie te laten zien.

## Back-end (wat je niet ziet)
- **Route `POST /api/aanvraag`:** ontvangt het formulier, doorloopt de misbruikbescherming, valideert tegen de woningconfiguratie, draait de regels, slaat op in de database, stuurt door naar de n8n-workflow, en pas daarna (met `after()`) draait eventueel de AI. Een trage AI kan het formulier dus nooit vertragen.
- **Regels (`precheck`):** vaste, uitlegbare code in TypeScript. Geen AI. Per reden is ingesteld of die "hard" of "zelf bekijken" is.
- **Configuratie:** kantoren (tenants) staan in bestanden; **woningen staan in de database** en de makelaar past ze zelf aan. Een inactieve of ongeldige woning sluit het formulier direct (geen terugval).
- **Database: Supabase (PostgreSQL, regio eu-west-1, Ierland).** Tabellen: `organizations`, `members`, `applications`, `application_events` (logboek), `deletion_log`, `ai_outputs`, `properties`. Een nachtelijke taak (`pg_cron`) verwijdert aanvragen ouder dan 6 maanden.
- **Inloggen:** Supabase Auth met `@supabase/ssr`; de sessie wordt op de server gecontroleerd.
- **Workflow: n8n, lokaal in Docker** (sinds sprint 4, eerder Make.com): krijgt een ondertekende webhook (Header Auth) en stuurt een melding per Gmail en schrijft een rij in een Google Sheet (back-up).
- **Hosting: Vercel** (regio Frankfurt), met Deployment Protection aan zolang de site niet openbaar is.
- **AI-laag:** een eigen koppelvlak met aanbieder OpenAI (`gpt-4o-mini`) of een nepaanbieder voor tests. Zie bron 5.

## Testen die in het project zitten
| Wat | Hoe | Resultaat (8 okt 2026) |
|---|---|---|
| Regels op 40 verzonnen testaanvragen | `run-rules` | 34 van 40 goed (85%); duidelijke gevallen 31 van 31 |
| Marge onder de inkomensgrens | `test-margin` | 12 van 12 |
| Eisen instellen (formulier naar regels en terug) | `test-requirements` | 63 van 63 |
| AI-laag met nep-, kapotte en kwaadaardige antwoorden | `test-ai` | 73 van 73 |
| Misbruikbescherming (29 situaties) | `test-abuse` met nep-diensten | eerder geslaagd; vandaag niet opnieuw gedraaid |
| Productiebouw en databasetest woningen | `test-production-mode`, `test-properties-db` | eerder geslaagd |

Belangrijk: 100% op de duidelijke gevallen, maar maar **3 van 9** op de twijfelgevallen. Dat past bij het uitgangspunt: twijfelgevallen zijn voor de mens. De labels zijn door de student zelf bedacht (40 gevallen), dus dit is een indicatie, geen bewijs.

## Waarom deze keuzes
- **Regels voor cijfers, AI alleen voor tekst:** regels zijn voorspelbaar en uit te leggen; AI is dat niet.
- **Eerst opslaan, dan versturen, dan AI:** een storing in één onderdeel verliest geen aanvraag.
- **Rijafscherming per kantoor in de database** in plaats van alleen in de code: ook bij een fout in de app ziet een kantoor niets van een ander.
