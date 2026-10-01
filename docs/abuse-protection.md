# Bescherming tegen misbruik

Doel: voorkomen dat een openbaar formulier misbruikt wordt om jouw Make-quota leeg te trekken, je Sheet vol te
schrijven of via jouw Gmail mails te laten versturen. Alles hieronder is gebouwd en getest (zie "Testen").

## De lagen, in volgorde

Elke aanvraag (`POST /api/aanvraag`) doorloopt deze lagen. Goedkope controles eerst; er wordt pas iets geteld of
verstuurd als alle controles zijn geslaagd.

| # | Laag | Wat het doet | Antwoord bij falen |
|---|---|---|---|
| 1 | Maximale grootte | Body groter dan 20 kB wordt geweigerd | `413` |
| 2 | Same-origin | Alleen verzoeken vanuit ons eigen iframe | `403` |
| 3 | Honeypot | Verborgen veld dat bots invullen; nep-succes, niets verstuurd of geteld | `200` (nep) |
| 4 | Rate limit per IP | Standaard 5 per 10 minuten | `429` |
| 5 | Formuliertoken + invultijd | Server-ondertekend token; minder dan 8 s ingevuld = bot; verlopen of vervalst token wordt geweigerd | `400 too_fast` / `session_invalid` / `session_expired` |
| 6 | Turnstile (optioneel) | Cloudflare-botcontrole, server-side geverifieerd | `400 captcha_failed`, `503 captcha_unavailable` |
| 7 | Validatie | Alles tegen de woningconfig; onbekende woning geeft 404 | `400` / `404` |
| 8 | Spam en wegwerp-e-mail | Wegwerpdomeinen (mailinator, yopmail, …), naam met link, meer dan 1 link in de toelichting | `400` met veldfout |
| 9 | Rate limit per e-mailadres | Standaard 3 per uur (adres gehasht opgeslagen) | `429` |
| 10 | Dubbele aanvraag | Zelfde persoon + zelfde woning binnen 24 uur | `409 duplicate` |
| 11 | Dagplafond | Standaard 30 aanvragen per dag voor de hele app | `503 busy` |

Plekken die in stap 10 en 11 gereserveerd zijn, worden teruggegeven als de aflevering aan Make mislukt. Wie het dan
opnieuw probeert, krijgt dus geen `409`. Elke blokkade staat in de logs als `[abuse] geblokkeerd: …` (zonder
persoonsgegevens).

## Instellingen (omgevingsvariabelen)

Alles is optioneel; zonder variabele gelden de standaardwaarden. Zie ook `.env.example`.

| Variabele | Standaard | Betekenis |
|---|---|---|
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | — | Gedeelde teller. **Nodig voor echte bescherming op Vercel.** |
| `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | — | Botcontrole. Zet beide of geen van beide. |
| `FORM_TOKEN_SECRET` | afgeleid van `MAKE_WEBHOOK_SECRET` | Geheim voor het formuliertoken |
| `RL_IP_MAX` / `RL_IP_WINDOW_SECONDS` | 5 / 600 | Aanvragen per IP |
| `RL_EMAIL_MAX` / `RL_EMAIL_WINDOW_SECONDS` | 3 / 3600 | Aanvragen per e-mailadres |
| `DUPLICATE_WINDOW_SECONDS` | 86400 | Blokkade zelfde persoon + woning |
| `MAX_APPLICATIONS_PER_DAY` | 30 | Dagplafond (beschermt de Make-quota) |
| `FORM_MIN_SECONDS` / `FORM_MAX_SECONDS` | 8 / 7200 | Minimale en maximale invultijd |

**Make-quota:** elke aanvraag kost ongeveer 3 tot 5 operaties (webhook, Sheet, 1 of 2 mails). Het gratis plan heeft
1.000 operaties per maand, dus rond de 200 tot 300 aanvragen. Het standaard dagplafond van 30 beschermt daartegen;
pas het aan op je verwachte drukte.

## Instellen voor productie (stap voor stap)

De app werkt zonder deze twee diensten, maar dan gelden de limieten per serverinstantie en zijn ze zwak. Doe beide
voordat je Deployment Protection uitzet.

### A. Gedeelde teller: Upstash Redis (gratis plan)
1. Ga naar [console.upstash.com](https://console.upstash.com) en maak een account.
2. Klik op **Create Database**, kies een naam (`rentalflowai`) en een regio in **Europa** (bijvoorbeeld Frankfurt), en maak hem aan.
3. Open de database en zoek het tabblad **REST API**. Daar staan `UPSTASH_REDIS_REST_URL` en `UPSTASH_REDIS_REST_TOKEN`.
4. Zet beide in Vercel (Project → Settings → Environment Variables, voor Production en Preview, het token als *Sensitive*).
5. Deploy opnieuw.

Alternatief: in Vercel via *Storage / Marketplace* de Upstash-integratie koppelen. Die zet `KV_REST_API_URL` en
`KV_REST_API_TOKEN`; de app leest ook die namen.

### B. Botcontrole: Cloudflare Turnstile (gratis)
1. Ga naar [dash.cloudflare.com](https://dash.cloudflare.com), maak een account en open **Turnstile**.
2. Klik op **Add widget**. Naam: `rentalflowai`. Bij **Hostname** voeg je de hostnamen toe waarop **ons formulier** draait
   (niet de site van de makelaar, want het vakje staat in ons iframe): bijvoorbeeld `rentalflowai.vercel.app` en later je eigen domein.
   Voeg voor lokaal testen `localhost` toe. Widget mode: **Managed**.
3. Je krijgt een **Site Key** en een **Secret Key**.
4. Zet in Vercel `TURNSTILE_SITE_KEY` (de site key) en `TURNSTILE_SECRET_KEY` (de secret key, als *Sensitive*).
5. Deploy opnieuw. Het formulier toont nu het vakje "Verificatie".

Lokaal testen zonder account kan met de testsleutels van Cloudflare: site key `1x00000000000000000000AA` en secret
`1x0000000000000000000000000000000AA` (altijd geslaagd), of `2x00000000000000000000AB` en
`2x0000000000000000000000000000000AA` (altijd mislukt).

### C. Extra laag in Vercel: Firewall rate limit
Voeg in het Vercel-dashboard onder **Firewall** een rate-limit-regel toe op het pad `/api/aanvraag` (bijvoorbeeld
10 verzoeken per minuut per IP). Die werkt vóórdat de app draait en is een tweede vangnet naast de limieten hierboven.
De beschikbare limieten hangen af van je plan; controleer dat in het dashboard.

## Testen

Alle lagen zijn te testen zonder echte accounts, met nep-diensten voor Make en Upstash:

```bash
node scripts/mock-services.mjs          # nep-Make op :4000, nep-Upstash op :4001
```

Start de app in een tweede terminal met testlimieten (na `npm.cmd run build`):

```powershell
$env:MAKE_WEBHOOK_URL="http://localhost:4000/hook"; $env:MAKE_WEBHOOK_SECRET="test-secret"
$env:UPSTASH_REDIS_REST_URL="http://localhost:4001"; $env:UPSTASH_REDIS_REST_TOKEN="tok"
$env:FORM_MIN_SECONDS="2"; $env:RL_IP_MAX="8"; $env:RL_EMAIL_MAX="3"; $env:MAX_APPLICATIONS_PER_DAY="14"
npm.cmd run start -- -p 3100
```

En dan:

```bash
node scripts/test-abuse.mjs
```

Dat script controleert 29 situaties: te snel, vervalst token, token van een andere woning, wegwerp-e-mail, naam met link,
te veel links, honeypot, te grote body, dubbele aanvraag, teruggeven van de plek bij een fout in Make, limiet per
e-mailadres, limiet per IP, storing van de gedeelde teller en het dagplafond. Herstart de app en de nep-diensten
tussen twee volledige runs, want de tellers blijven staan.

## Wat dit wel en niet oplost

**Wel:** eenvoudige en semi-slimme bots, snelle scripts, dubbele aanvragen, wegwerpadressen, spam met links,
een leeggelopen Make-quota (dagplafond), en misbruik van je Gmail voor mails naar willekeurige adressen (die staan
bovendien uit voor de test-tenants).

**Niet volledig:**
- Een aanvaller met veel wisselende IP-adressen, echte browsers en opgeloste captcha's. Turnstile maakt dat duur, maar niet onmogelijk.
- Bezoekers die bewust valse gegevens invullen (het formulier controleert de vorm, niet de waarheid).
- Zonder Upstash zijn de limieten per serverinstantie; de app logt daarvoor één keer `[abuse] GEEN gedeelde teller ingesteld`.
- Het formuliertoken wordt bij elke paginaweergave opnieuw gemaakt en is niet eenmalig; de bescherming tegen herhaling komt van de teller, de dubbelcontrole en Turnstile.

## Afwegingen

- **Dubbele aanvraag:** dezelfde persoon kan binnen 24 uur niet twee keer voor dezelfde woning aanvragen. Wie een fout maakte, moet dus contact opnemen of een dag wachten. Pas `DUPLICATE_WINDOW_SECONDS` aan als dat te streng is.
- **Fail-closed voor Turnstile:** is Cloudflare onbereikbaar, dan geeft de app `503` in plaats van aanvragen ongecontroleerd door te laten.
- **Fail-open voor de teller:** valt Upstash uit, dan gaat de app verder met de geheugenteller (met een logregel), zodat een storing het formulier niet platlegt.
- **Testscripts:** `scripts/e2e.mjs` haalt zelf een token op en voegt `+e2e…` aan je e-mailadres toe zodat de dubbelcontrole je tests niet blokkeert.
