# Deploy op Vercel (stap 10)

Status: voorbereid, **nog niet uitgevoerd**. Een deploy zet de app openbaar op internet, gekoppeld aan jouw
Make-scenario en Gmail. Lees eerst "Risico's van een openbare test".

## Besluiten (30 september)

- **Eerst lokaal controleren**, daarna GitHub en Vercel (dat doet de eigenaar zelf).
- **`sendApplicantMail: false`** staat aan voor de test-tenants (`demo`, `rotsvast-test`): alleen de makelaar krijgt een melding, geen
  bevestigingsmail naar willekeurige aanvragers. Het Make-filter `mail.applicant.enabled = true` blokkeert de tweede mail dan.
- **Deployment Protection blijft aan** zolang er intern getest wordt.
- **`MAKE_WEBHOOK_URL` en `MAKE_WEBHOOK_SECRET`** zet de eigenaar zelf in Vercel.
- **Nieuw sterk `MAKE_WEBHOOK_SECRET`** (64 tekens, alleen hex) staat in `.env.local`; dezelfde waarde moet als API key in de Make-webhook
  staan **vóór** er gedeployed of getest wordt (zie "Geheim vervangen in Make" hieronder).
- **Vóór de echte openbare test:** de bescherming tegen misbruik is gebouwd (zie [abuse-protection.md](abuse-protection.md)). Stel eerst Upstash
  (gedeelde teller) en Turnstile (botcontrole) in en zet de sleutels in Vercel. **Daarna pas** de koppeling met een externe (Rotsvast-)site.

## Geheim vervangen in Make

1. Open het bestand `.env.local` en kopieer de waarde achter `MAKE_WEBHOOK_SECRET=` (deel deze waarde niet in de chat).
2. Open in Make het scenario en klik op de **Webhook-bol**.
3. Kies bij **Webhook** de **Edit**-optie (of het potloodje) en zoek onder **API keys** de key `RentalFlowAI`.
4. Vervang de oude waarde door de nieuwe, sla de key op en sla het scenario op (**Save**).
5. Test met `node scripts/e2e.mjs suitable jouw-adres@gmail.com`. Bij `502` klopt de key in Make niet met `.env.local`.

## Wat al klaar is

- `vercel.json`: functies draaien in **Frankfurt (`fra1`)** in plaats van de standaardregio in de VS (past bij AVG), en
  `widget.js` heeft een korte cachetijd (5 min) zodat aanpassingen snel doorkomen.
- Geheimen alleen server-side (`MAKE_WEBHOOK_URL`, `MAKE_WEBHOOK_SECRET`), niet in de bundel (gecontroleerd met een build).
- `frame-ancestors` per tenant via `src/proxy.ts`.
- Demo-hostpagina `/demo-host.html` staat mee in `public/` en draait dan op dezelfde origin als de app.

## Stappen (jij, in het Vercel-dashboard)

1. **Code op GitHub zetten.** Er is nog geen commit. Maak een privé-repo, commit en push (of laat me de commit voorbereiden; pushen doe jij).
   `.env.local` staat in `.gitignore` en gaat niet mee.
2. **Vercel-project maken:** vercel.com → Add New → Project → kies de repo. Framework: Next.js (automatisch). Nog niet deployen.
3. **Environment Variables** (Project → Settings → Environment Variables), voor *Production* (en *Preview* als je die gebruikt):
   - `MAKE_WEBHOOK_URL` = het webadres uit Make
   - `MAKE_WEBHOOK_SECRET` = de API key uit Make (zet **Sensitive** aan)

   Plak deze waarden zelf in het dashboard; deel ze niet in de chat.
4. **Deploy.** Noteer de productie-URL, bijvoorbeeld `https://rentalflowai.vercel.app`.
5. **Origins bijwerken.** Voor een test vanaf een andere site (bijvoorbeeld Rotsvast via de userscript) moet die site in
   `allowedOrigins` van de tenant staan. `rotsvast-test` bevat al `https://www.rotsvast.nl`. Pas daarna opnieuw deployen.
6. **Testen vanaf een andere origin:** open een externe pagina met
   `<script src="https://<jouw-project>.vercel.app/widget.js" data-tenant="rotsvast-test" data-property-id="TEST-1" data-rent="1650" data-address="Teststraat 1" async></script>`
   (zie `demo-host/external.html`, pas de `src` aan en host die pagina ergens anders, of gebruik de userscript).
7. **Controleren:** aanvraag indienen, rij in de Sheet, twee mails, en in Vercel → Logs geen fouten.

## Risico's van een openbare test

| Risico | Waarom | Maatregel |
|---|---|---|
| **Mail-misbruik via jouw Gmail** | Het e-mailadres van de aanvrager bepaalt waar de bevestiging heen gaat. Iedereen kan het formulier invullen met een willekeurig adres. | Zet `sendApplicantMail: false` in de tenant-JSON van test-tenants zolang de app openbaar is. Dan ontvangt alleen jij mails. |
| **Make-quota leegtrekken** | Elke aanvraag kost operaties (gratis plan: 1.000 per maand). Een bot kan het scenario laten stilvallen. | Zwakke limiter nu (5 per 10 min per IP, per instantie). Zie "Toekomstige verbeteringen" in PLAN.md; voor nu: Vercel Firewall rate limiting en/of Deployment Protection. |
| **Testdata met echte persoonsgegevens** | Bezoekers kunnen echte gegevens invullen. | Zet op de testpagina duidelijk "testomgeving, gebruik nepdata"; verwijder testrijen uit de Sheet. |
| **Ongecontroleerde huurprijs** | `test`-tenants vertrouwen `data-rent`. | Alleen voor test. Productie-tenants gebruiken `mode: "production"` met een vaste config. |
| **Afwijzing zonder mens** | Zou AVG art. 22 raken. | Al geregeld: neutrale bevestiging, geen automatische afwijzing. |

## Vercel Deployment Protection

Vercel kan een deployment achter een login zetten. Dat beschermt tegen bots, maar dan kan ook de externe site het
widget niet laden. Kies dus bewust:
- **Alleen zelf testen:** protection aan en de demo-pagina op dezelfde deployment gebruiken (ingelogd in Vercel).
- **Externe site testen:** protection uit, en dan `sendApplicantMail: false` plus een rate limit (zie hierboven).
