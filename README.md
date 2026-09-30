# RentalFlowAI

Universele "Aanvraag"-knop voor huurwoningen. Zie [PLAN.md](PLAN.md) voor het volledige plan.

## Lokaal draaien

```bash
cp .env.example .env.local     # vul MAKE_WEBHOOK_URL en MAKE_WEBHOOK_SECRET in (optioneel voor lokaal)
npm run dev -- -p 3100         # app + widget.js
npx serve demo-host -l 3200    # externe testpagina op een andere origin
```

- Demo-woningpagina (zelfde origin): <http://localhost:3100/demo-host.html> (kies woning met `?p=1001…1004`)
- Externe testpagina (andere origin): <http://localhost:3200/external>
- Formulier direct: <http://localhost:3100/embed/aanvraag/demo/1001?lang=nl>

Zonder `MAKE_WEBHOOK_URL` logt de server de aanvraag alleen in de console (dev-modus, mokdata).

## Widget op een site plaatsen

```html
<script src="https://<app>/widget.js"
        data-tenant="demo"
        data-property-id="1001"
        data-rent="1850"
        data-address="Keizersgracht 100, Amsterdam"
        data-target="#brochure-knop"
        data-class="btn btn-primary"
        async></script>
```

Alleen `data-tenant` en `data-property-id` zijn verplicht. `data-rent` en `data-address` zijn nodig voor
tenants zonder vaste woningconfig (`rotsvast-test`). De site moet in `allowedOrigins` van de tenant staan.

## Make.com (Google Sheets + Gmail)

Stap-voor-stap in [docs/make-setup.md](docs/make-setup.md). `MAKE_WEBHOOK_URL` en `MAKE_WEBHOOK_SECRET`
staan alleen in `.env.local` (en later Vercel), nooit in code, git of de browser.

Ketentest zonder formulier: `node scripts/e2e.mjs <suitable|review|unsuitable> <jouw-emailadres> [nl|en]`.

## Nieuwe tenant of woning

- Woning: voeg toe aan `properties` in `data/tenants/<tenant>.json`.
- Tenant: nieuw JSON-bestand in `data/tenants/` en één regel in `data/tenants/index.ts`.
- Per criterium is de ernst instelbaar met `criteria.severity` (`hard` of `review`), zie `DEFAULT_SEVERITY` in `src/lib/schema.ts`.
