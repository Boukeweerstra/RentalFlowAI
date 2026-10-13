# RentalFlowAI: beveiliging en wat er getest is

Bron 3 van 5 voor de uitlegvideo. Stand: 8 oktober 2026. Hoort bij de user story: "Als AI-ontwikkelaar wil ik testen of mijn product veilig is en voldoet aan de AVG."

## Lagen van beveiliging

### 1. Toegang tot het dashboard
- Inloggen met e-mail en wachtwoord (Supabase Auth). Aanmelden door vreemden is uitgeschakeld.
- Een ingelogde gebruiker hoort bij precies één kantoor (`members`). Alleen de **eigenaar** mag woningen aanpassen en aanvragen verwijderen; een medewerker niet.
- Dashboardpagina's zijn nooit in een iframe te laden (`X-Frame-Options: DENY`), worden niet gecachet (`Cache-Control: no-store`), sturen geen verwijzer mee buiten de site (`Referrer-Policy: same-origin`) en hebben `X-Content-Type-Options: nosniff`.
- De sessie wordt op de server gecontroleerd; niet-ingelogden gaan naar `/login`.

### 2. Rijafscherming in de database (Row Level Security)
Gecontroleerd op 8 oktober 2026 in de echte Supabase-database: **alle 7 tabellen hebben RLS aan** en minstens één policy.

| Tabel | Wie mag wat (ingelogd) |
|---|---|
| applications | Eigen kantoor lezen en bijwerken; verwijderen alleen door de eigenaar |
| application_events (logboek) | Eigen kantoor lezen |
| ai_outputs | Eigen kantoor lezen (alleen lezen) |
| deletion_log | Eigen kantoor lezen |
| properties | Eigen kantoor lezen; schrijven gaat via de server na een eigenaar-controle |
| organizations, members | Alleen het eigen kantoor, respectievelijk het eigen lidmaatschap |

Anonieme bezoekers hebben geen policies en dus geen toegang. De geheime service-sleutel staat alleen op de server (Vercel, als *Sensitive*) en nooit in de browser.

### 3. Het publieke formulier: elf lagen misbruikbescherming
Een openbaar formulier trekt spam en bots aan. De route doorloopt, goedkoopste controle eerst:
1. Maximale grootte (20 kB). 2. Alleen verzoeken vanuit ons eigen iframe. 3. Honeypot (verborgen veld). 4. Limiet per IP (5 per 10 minuten). 5. Ondertekend formuliertoken en minimale invultijd (8 seconden). 6. Cloudflare Turnstile (optioneel). 7. Validatie tegen de woningconfiguratie. 8. Spam en wegwerpadressen. 9. Limiet per e-mailadres (3 per uur, adres gehasht opgeslagen). 10. Dubbele aanvraag binnen 24 uur. 11. Dagplafond (30 per dag) tegen overbelasting van de workflow en de mailbox.
Het formulier mag alleen in een iframe op de domeinen van de eigen makelaar (`frame-ancestors` per kantoor), tegen clickjacking.

### 4. Gegevens naar derden
- De n8n-workflow (lokaal in Docker) krijgt een ondertekende webhook; succesvolle uitvoeringen worden daar niet bewaard.
- Naar de AI-aanbieder gaan alleen de toelichting en redenencodes, nadat e-mailadressen, links, rekeningnummers, telefoonnummers en de naam zijn gewist. De AI heeft geen tools en kan niets uitvoeren.
- Een dagplafond voor AI-aanroepen (standaard 20) en een lage bestedingslimiet bij de aanbieder.

### 5. Bewaren en verwijderen
- Automatisch verwijderen na 6 maanden (nachtelijke taak). Eerder verwijderen met één knop.
- Het verwijderlogboek bevat geen persoonsgegevens.

## Wat is er daadwerkelijk getest?
| Test | Uitkomst |
|---|---|
| Supabase security advisor (8 okt 2026) | **1 waarschuwing:** "Leaked password protection" staat uit. Verder geen bevindingen (geen tabel zonder RLS). |
| RLS-controle in de database | Alle 7 tabellen RLS aan, policies zoals hierboven |
| AI-laag: 73 tests | Alle geslaagd: kapotte JSON, beoordelende taal, gevoelige woorden, gelekte contactgegevens en prompt-injectie worden tegengehouden of gewist |
| Misbruikbescherming: 29 situaties | Eerder geslaagd (te snel, vervalst token, token van andere woning, wegwerpadres, links, honeypot, te grote body, dubbele aanvraag, limieten, storing teller, dagplafond). Vandaag niet opnieuw gedraaid |
| Echte AI-proef (6 okt) | 5 toelichtingen incl. een prompt-injectie ("negeer alle instructies"): model volgde de injectie niet. Eerste promptversie herhaalde een gezondheidsreden; tweede versie niet, plus een vangnet in de code |
| Dashboard online, inloggen, realtime, verwijderen | Door de student zelf geprobeerd en gelukt |
| Toegankelijkheid (axe-core) | Eerder gecontroleerd op de hoofdpagina's |

## Wat is NIET getest of nog open
- Geen onafhankelijke penetratietest; alle tests zijn door de ontwikkelaar zelf gedaan.
- Leaked password protection staat uit (open punt A9; vereist een betaald Supabase-plan of een alternatieve instelling, nog uit te zoeken).
- Geen verwerkersovereenkomsten met Supabase, Vercel, Google, Upstash en OpenAI; doorgifte buiten de EER niet formeel geregeld.
- Wachtwoord-vergeten-mail: de standaard Supabase-mail kan niet worden aangepast zonder eigen mailserver.
- Opruimen van de Google Sheet en mailbox is een handmatige afspraak, nog niet geautomatiseerd.
- Prompt-injectie is op een kleine steekproef getest (5 gevallen); de echte bescherming is dat de AI niets kan beslissen of versturen.

## Conclusie voor de user story
De technische basis is degelijk voor een prototype: rijafscherming per kantoor, inlog, elf lagen tegen misbruik, minimale gegevens en een begrensde AI. Het product is **nog niet klaar voor echte aanvragen** zolang de organisatorische punten (verwerkersovereenkomsten, juridische toets privacyverklaring, wachtwoordinstelling) open staan.
