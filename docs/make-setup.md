# Make.com koppeling: Webhook → Google Sheets → Gmail

De app stuurt per aanvraag één JSON-bericht (POST) naar een Make-webhook. Het scenario:

```
Custom webhook (met API key) → Google Sheets: Add a Row → Gmail: melding makelaar → [filter: enabled] → Gmail: bevestiging aanvrager
```

Het geheim wordt door Make zelf gecontroleerd (webhook-instelling *API Key authentication*): berichten zonder de juiste
key worden geweigerd, er is dus geen apart filter nodig.

De mailteksten worden door de app gemaakt (per status en taal, zie `src/lib/mail-texts.ts`). In Make hoef je
alleen te "doorgeven"; een Router per status is niet nodig.

Voorbeeldbericht: [sample-payload.json](sample-payload.json)

## 1. Google Sheet voorbereiden

1. Maak een nieuwe Sheet, tabblad `Aanvragen`.
2. Plak in cel **A1** deze rij (tab-gescheiden; Sheets verdeelt dit vanzelf over de kolommen):

```
submittedAt	id	tenantId	propertyId	address	rent	propertySource	name	email	phone	applicants	occupants	p1_incomeType	p1_monthlyIncome	p2_role	p2_monthlyIncome	totalMonthlyIncome	incomeRequired	hasPets	hasHousemates	guarantorAvailable	desiredStartDate	desiredLeaseMonths	precheckStatus	precheckReasons	precheckReasonsText	motivation
```

De namen komen uit `SHEET_COLUMNS` in `src/lib/make-payload.ts`. Voeg je daar een kolom toe, voeg dan dezelfde kolom toe in de Sheet en in Make.

| Wat je wilde terugzien | Kolommen |
|---|---|
| Woning | `propertyId`, `address`, `rent`, `propertySource` |
| Contactgegevens | `name`, `email`, `phone` |
| Bruto inkomen | `p1_monthlyIncome`, `p2_monthlyIncome`, `totalMonthlyIncome`, `incomeRequired` |
| Huishoudsamenstelling | `applicants`, `occupants`, `p2_role`, `hasPets`, `hasHousemates` |
| Precheck | `precheckStatus`, `precheckReasons`, `precheckReasonsText` |

Tip: kies in de Sheet een voorwaardelijke opmaak op `precheckStatus` (groen = suitable, oranje = review, rood = unsuitable).

## 2. Geheim en webhook-URL

1. Verzin een lang geheim zonder spaties (of genereer er een, niet in de chat plakken):
   ```bash
   node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
   ```
2. Zet in `.env.local` (dit bestand staat in `.gitignore` en komt nooit in de browser):
   ```
   MAKE_WEBHOOK_URL=<komt uit stap 3>
   MAKE_WEBHOOK_SECRET=<het geheim uit stap 1>
   ```
3. Zet dezelfde twee variabelen later in Vercel (Project → Settings → Environment Variables, alleen voor Production/Preview, niet als "public").

## 3. Scenario bouwen in Make

**Module 1: Webhooks → Custom webhook**
- Add → naam `RentalFlowAI`.
- Onder **API Key authentication** → **+ Add API key**: geef de key een naam (bijvoorbeeld `RentalFlowAI`) en plak als
  waarde je geheim (exact dezelfde tekst als `MAKE_WEBHOOK_SECRET` in `.env.local`). → Save.
- Kopieer de URL naar `MAKE_WEBHOOK_URL` in `.env.local`.
- De app stuurt het geheim mee in de header `x-make-apikey`; Make weigert berichten zonder een geldige key.
- Laat Make de structuur leren: klik **Run once**, zet de app aan en stuur een testaanvraag:
  ```bash
  node scripts/e2e.mjs suitable jouw-adres@gmail.com
  ```
  Make toont nu de velden `flat`, `mail` en `application`.

**Module 2: Google Sheets → Add a Row** (koppel je Google-account, geef toestemming in het Google-venster)
- Spreadsheet en tabblad kiezen, *Table contains headers*: **Yes**.
- Koppel elke kolom aan het veld met dezelfde naam onder **flat** (bijvoorbeeld kolom `address` ← `flat → address`).

**Module 3: Gmail → Send an Email** (melding aan de makelaar)
- To: `mail → notify → to`, of als dat leeg is een vast adres. Formule: `{{ifempty(1.mail.notify.to; "jouw-adres@gmail.com")}}`
- Subject: `mail → notify → subject`
- Content type: **HTML**; Content: `mail → notify → html`

**Filter (tussen module 3 en 4), label `Bevestiging aan aanvrager aan`**
- `mail → applicant → enabled` **Equal to** `true` (boolean).

**Module 4: Gmail → Send an Email** (bevestiging aan de woningzoeker)
- To: `mail → applicant → to`
- Subject: `mail → applicant → subject`
- Content type: **HTML**; Content: `mail → applicant → html`

**Scenario aanzetten**
- Onderaan links: **Scheduling** op *Immediately as data arrives* en zet de schakelaar op **ON**.
- Zet in Scenario settings *Sequential processing* aan als je wilt dat rijen in volgorde binnenkomen.

## 4. Testen

**Snelle ketentest zonder formulier** (app draait met `.env.local`, jouw eigen adres als aanvrager):

```bash
npm run dev -- -p 3100
node scripts/e2e.mjs suitable   jouw-adres@gmail.com
node scripts/e2e.mjs review     jouw-adres@gmail.com en
node scripts/e2e.mjs unsuitable jouw-adres@gmail.com
```

Het script meldt `mode=make` als het bericht echt naar Make is gestuurd (`dev-log` = `MAKE_WEBHOOK_URL` ontbreekt).
Let op: maximaal 5 aanvragen per 10 minuten; herstart de dev-server om te resetten.

**Via het formulier:**

1. `npm run dev -- -p 3100` en open <http://localhost:3100/demo-host.html?p=1001>.
2. Klik **Aanvraag**, vul het formulier in met je eigen e-mailadres, verstuur.
3. Controleer: nieuwe rij in de Sheet, melding in je inbox met `[Aanvraag: GESCHIKT|BEOORDELEN|ONGESCHIKT]` in de onderwerpregel, bevestiging naar het opgegeven adres.
4. Test alle drie de statussen. Voorbeelden voor woning 1001 (huur € 1.850, inkomenseis € 5.550, gezamenlijk):
   - **suitable**: twee personen, samen € 6.000, geen proeftijd, ≥ 6 maanden in dienst, geen huisdieren.
   - **review**: alleen proeftijd of kort dienstverband (bij 1001 zijn dat `review`-criteria).
   - **unsuitable**: inkomen € 2.000 of huisdieren "ja".
   - Garantsteller-regel: woning **1005** (`guarantorCompensatesIncome: false`): inkomen onder de eis + garantsteller "ja" blijft `unsuitable`; bij woning **1003** (standaard `true`) wordt hetzelfde `review`.

## Mailgedrag (bewust simpel)

Flow: precheck (`suitable` / `review` / `unsuitable`) → makelaar beoordeelt → makelaar beslist. De precheck sorteert
alleen voor; RentalFlowAI verstuurt zelf geen definitieve afwijzing.

| Status | Melding naar makelaar | Mail naar woningzoeker |
|---|---|---|
| `suitable` | onderwerp `[Aanvraag: GESCHIKT] …` + samenvatting | ontvangen, lijkt te passen, na beoordeling volgt een definitieve reactie; lijst met documenten die mogelijk later nodig zijn |
| `review` | onderwerp `[Aanvraag: BEOORDELEN] …` | ontvangen, makelaar neemt contact op als er meer informatie nodig is, daarna een definitieve reactie |
| `unsuitable` | onderwerp `[Aanvraag: ONGESCHIKT] …` | ontvangen, alle aanvragen worden beoordeeld, daarna een definitieve reactie (**geen afwijzing**) |

De redenen (`precheckReasons`) gaan alleen naar de makelaar en de Sheet, niet naar de woningzoeker. Een definitieve
afwijzingsmail komt later pas na goedkeuring door de makelaar (fase 2/3).

**Let op:** de test-tenants (`demo`, `rotsvast-test`) hebben `sendApplicantMail: false`. De tweede Gmail-stap wordt daarom
door het filter (`mail.applicant.enabled = true`) tegengehouden en de aanvrager krijgt géén bevestiging; alleen de makelaar
krijgt de melding. Wil je de bevestigingsmail testen, zet dan tijdelijk `sendApplicantMail` op `true` in de tenant-JSON.

## Ontvanger van de melding: `notifyEmail`

De melding gaat naar `mail.notify.to`, dat uit `notifyEmail` in de tenant-config (`data/tenants/<tenant>.json`) komt.
Ontbreekt die, dan is `mail.notify.to` leeg en gebruikt Make het vaste fallback-adres uit de formule
`{{ifempty(1.mail.notify.to; "jouw-adres@gmail.com")}}`. Zo kan iedere tenant later een eigen ontvanger krijgen zonder
het Make-scenario aan te passen. In de repo staat bewust geen echt e-mailadres; voor je eigen test volstaat het fallback-adres in Make.

## Problemen oplossen

- **Formulier geeft "Er ging iets mis" (502)**: de webhook antwoordde niet met 2xx. Staat het scenario op ON en klopt `MAKE_WEBHOOK_URL`? Bij *Run once* moet Make eerst luisteren.
- **Formulier geeft 500**: `MAKE_WEBHOOK_URL` ontbreekt in productie.
- **Antwoord 502 en niets in Make**: Make weigert het bericht. Is de API key in de webhook exact gelijk aan `MAKE_WEBHOOK_SECRET` in `.env.local`? Herstart daarna de app.
- **Nieuwe kolom in de payload**: eerst in `SHEET_COLUMNS`, dan de Sheet-kop, dan de Make-koppeling; daarna in Make de webhook opnieuw laten leren (*Redetermine data structure*).
