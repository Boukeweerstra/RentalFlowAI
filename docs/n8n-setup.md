# n8n-koppeling: Webhook → Google Sheets → Gmail

Stand: 13 oktober 2026. Dit vervangt de eerdere koppeling met Make.com. De app stuurt per aanvraag één JSON-bericht (POST) naar een
n8n-webhook die lokaal in Docker draait. De workflow:

```
Webhook (Header Auth) → Sheet-rij maken → Google Sheets: Append Row → Gmail: melding makelaar → IF bevestiging aan → Gmail: bevestiging aanvrager
```

De mailteksten maakt de app zelf (per status en taal, zie `src/lib/mail-texts.ts`). n8n geeft ze alleen door.
Voorbeeldbericht: [sample-payload.json](sample-payload.json). Workflow-bestand: [n8n/rentalflowai-workflow.json](../n8n/rentalflowai-workflow.json).

## Waarom n8n lokaal
- Gegevens van aanvragen gaan niet naar een extra externe partij (wel nog naar Google voor Sheets en Gmail).
- Geen limiet op het aantal operaties.
- Zelf beheerbaar en uit te breiden (leerdoel van de minor).
- Nadeel: de laptop (of server) met Docker moet aan staan, en een online app (Vercel) kan een lokale n8n niet bereiken zonder tunnel of een server.

## 1. n8n starten (Docker)

1. Installeer Docker Desktop (docker.com) en laat hem draaien (groen label *Engine running*).
2. Start n8n in de map `n8n`:

```bash
cd n8n
docker compose up -d
```

3. Open <http://localhost:5678> en maak een eigenaar-account (blijft op je eigen laptop).
4. Gegevens (workflows, koppelingen) staan in het Docker-volume `n8n_n8n_data` en blijven bewaard. Uitvoeringsgeschiedenis wordt na 7 dagen gewist en succesvolle uitvoeringen worden niet bewaard (`docker-compose.yml`, `rentalflowai-workflow.json`).

## 2. Google Sheet voorbereiden

1. Maak een Sheet en kies een tabblad (naam vrij, kies hem later in n8n **From list**).
2. Plak in cel **A1** deze rij (tab-gescheiden):

```
submittedAt	id	tenantId	propertyId	address	rent	propertySource	name	email	phone	applicants	occupants	p1_incomeType	p1_monthlyIncome	p2_role	p2_monthlyIncome	totalMonthlyIncome	incomeRequired	hasPets	hasHousemates	guarantorAvailable	desiredStartDate	desiredLeaseMonths	precheckStatus	precheckReasons	precheckReasonsText	motivation
```

De namen komen uit `SHEET_COLUMNS` in `src/lib/workflow-payload.ts`. Voeg je daar een kolom toe, voeg dan dezelfde kolom toe in de Sheet.

## 3. Google koppelen (eenmalig)

n8n lokaal heeft een eigen "OAuth-client" nodig:

1. Google Cloud (console.cloud.google.com): nieuw project `RentalFlowAI`.
2. **Google Sheets API** en **Gmail API** inschakelen (*Enable*).
3. **Google Auth Platform**: *Get started*, app-naam `RentalFlowAI`, doelgroep *External*, je eigen e-mailadres als contact. Onder *Audience* voeg je je Gmail-adres toe als **testgebruiker**.
4. **Clients > Create OAuth client**: type *Web application*, omleidings-URI exact `http://localhost:5678/rest/oauth2-credential/callback`.
5. Plak Client ID en Client secret in de n8n-koppelingen (Google Sheets en beide Gmail-blokken, dezelfde sleutels) en klik *Sign in with Google*. Bij "Google hasn't verified this app" kies je *Advanced* en *Go to RentalFlowAI (unsafe)*: het is je eigen app.

Let op: staat de Google-app op *Testing*, dan verloopt de koppeling na 7 dagen en moet je opnieuw op *Sign in with Google* klikken.

## 4. Workflow importeren

1. In n8n: *Create workflow*, drie puntjes (⋯) > *Import from file* > `n8n/rentalflowai-workflow.json`.
2. **Aanvraag ontvangen:** *Create new credential* (Header Auth): **Name** `x-make-apikey`, **Value** = je geheim. Plak dit alleen in n8n en `.env.local`, nooit in een chat of bestand dat in git komt. (De headernaam is zo gebleven zodat de app niet hoefde te veranderen.)
3. **Google Sheet:** koppeling kiezen, *Document* = link van je Sheet (*By URL*), *Sheet* = *From list*, *Operation* = *Append Row*.
4. **Gmail: melding makelaar:** koppeling kiezen en bij *To* je eigen adres invullen (wordt gebruikt als de aanvraag geen ontvanger meegeeft).
5. **Gmail: bevestiging aanvrager:** koppeling kiezen.
6. *Save* en **Publish**. (In n8n 2.x heet "activeren" Publish.) De productie-URL is `http://localhost:5678/webhook/rentalflowai`; de *test-URL* (`/webhook-test/...`) werkt alleen als je op *Listen for test event* klikt.

## 5. De app instellen

Zet in `.env.local` (komt nooit in git):

```
WORKFLOW_WEBHOOK_URL=http://localhost:5678/webhook/rentalflowai
WORKFLOW_WEBHOOK_SECRET=<hetzelfde geheim als in n8n>
```

De oude namen `MAKE_WEBHOOK_URL` en `MAKE_WEBHOOK_SECRET` werken nog. Herstart de app.

## 6. Testen

```bash
npm run dev -- -p 3100
node scripts/e2e.mjs suitable   jouw-adres@gmail.com
node scripts/e2e.mjs review     jouw-adres@gmail.com en
node scripts/e2e.mjs unsuitable jouw-adres@gmail.com
```

Het script meldt `mode=workflow` als het bericht naar de workflow is gegaan (`dev-log` = `WORKFLOW_WEBHOOK_URL` ontbreekt). Maximaal 5 aanvragen per 10 minuten per IP; herstart de app om te resetten.

Controleer: nieuwe rij in de Sheet, melding in je inbox met `[Aanvraag: GESCHIKT|BEOORDELEN|ONGESCHIKT]` in de onderwerpregel en, als `sendApplicantMail` voor de tenant aan staat, een bevestiging naar het opgegeven adres. De demo- en testkantoren hebben `sendApplicantMail: false`, zodat testaanvragen geen echte woningzoekers mailen. Zet het alleen tijdelijk op `true` voor een test met je eigen adres.

Getest op 13 oktober 2026: webhook met geheim, Sheet-rij, melding aan de makelaar en de filter op de bevestiging.

## Problemen

| Wat je ziet | Oorzaak en oplossing |
|---|---|
| `Sheet with name … not found` | Tabbladnaam klopt niet. Kies het tabblad in n8n *From list* |
| 403 van de webhook | Geheim in n8n en in `.env.local` zijn verschillend |
| `redirect_uri_mismatch` bij Google | Omleidings-URI exact `http://localhost:5678/rest/oauth2-credential/callback`, zonder slash of spatie |
| `access_denied` | Je Gmail-adres staat niet bij *Audience > Test users* |
| Geen mail na een week | Google-koppeling verlopen (testmodus): opnieuw *Sign in with Google* |
| Rode velden in Gmail-blokken | Normaal zolang het webhook-blok nog geen data heeft ontvangen |

## Privacy

n8n lokaal bewaart geen succesvolle uitvoeringen en wist fouten na 7 dagen. De Sheet en de mailbox blijven handmatig op te ruimen (zie `docs/procedures-privacy.md`). Google (Sheets, Gmail) blijft verwerker.
