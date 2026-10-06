# Een nieuwe makelaar toevoegen

Doel: een nieuw kantoor in ongeveer 30 minuten live, zonder iets te vergeten. Loop de stappen in volgorde af en vink af.
Voorbeeldnaam in dit document: kantoor **Voorbeeld Makelaars**, sleutel (`tenantId`) **`voorbeeld-makelaars`**.

> De `tenantId` is overal dezelfde sleutel: in het JSON-bestand, in `organizations.tenant_key` in de database, in de widget (`data-tenant`) en in de URL van het formulier. Gebruik kleine letters, cijfers en streepjes.

## 0. Verzamel eerst

| Wat | Waarom |
|---|---|
| Officiële naam van het kantoor | Titel, mails, privacyverklaring |
| E-mailadres waar aanvragen binnenkomen (`notifyEmail`) | Ontvanger van de melding, en tevens het login-adres |
| De website(s) waarop de knop komt (bijv. `https://www.voorbeeld.nl`) | `allowedOrigins`: alleen daar laadt het formulier |
| Per woning: id uit hun systeem, adres, huurprijs, beschikbaar vanaf, de eisen | Config in `properties` |
| Eigen privacyverklaring? (adres) | Anders gebruiken we `/privacy/<tenantId>` (concept) |
| Mag de woningzoeker een bevestigingsmail krijgen? | `sendApplicantMail` |
| Bewaartermijn (standaard 6 maanden) | `organizations.retention_months` |

## 1. Tenantbestand maken (Claude of jij)

1. Kopieer `data/tenants/demo.json` naar `data/tenants/voorbeeld-makelaars.json`.
2. Pas aan:
   - `tenantId`, `name`, `notifyEmail`, `allowedOrigins` (volledige adressen, zonder pad)
   - `"mode": "production"`: de huur en het adres komen dan **alleen** uit `properties` en `data-*` van de widget wordt genegeerd
   - **verwijder** `propertyDefaults` (die zijn alleen voor test-tenants)
   - `privacyPolicyUrl`: eigen adres, of `/privacy/voorbeeld-makelaars`
   - `sendApplicantMail`: `false` tot de eerste echte test geslaagd is
   - `incomeMarginPercent` (optioneel, 0 tot 10, per woning in `criteria`): een inkomen tot zoveel procent onder de eis wordt **Review** in plaats van **Unsuitable**. Laat het weg voor geen marge. Dit is een keuze van de makelaar, spreek het af.
   - `properties`: één blok per woning met `propertyId`, `address`, `rent`, `availableFrom` en `criteria`
3. Registreer het bestand in `data/tenants/index.ts` (één import en één regel in `tenantFiles`).
4. Controleer: `npx tsc --noEmit`, `npm run lint`, en open `http://localhost:3100/embed/aanvraag/voorbeeld-makelaars/<propertyId>`.
   Een onbekende woning moet "niet gevonden" tonen.

## 2. Kantoor en login in de database

Voer dit uit in de Supabase SQL-editor (vervang de waarden):

```sql
insert into public.organizations (tenant_key, name, notify_email, retention_months)
values ('voorbeeld-makelaars', 'Voorbeeld Makelaars', 'aanvragen@voorbeeld.nl', 6);
```

Maak daarna de gebruiker aan: Supabase > *Authentication* > *Users* > *Add user* > *Create new user*, vul het e-mailadres en een tijdelijk
wachtwoord in en zet **Auto Confirm User** aan. De gebruiker kiest zelf een nieuw wachtwoord via `/wachtwoord-vergeten`.
Koppel hem dan aan het kantoor:

```sql
insert into public.members (user_id, organization_id, role)
select u.id, o.id, 'owner'
from auth.users u, public.organizations o
where u.email = 'aanvragen@voorbeeld.nl' and o.tenant_key = 'voorbeeld-makelaars';
```

Controle: `select o.tenant_key, m.role, u.email from public.members m join public.organizations o on o.id = m.organization_id join auth.users u on u.id = m.user_id;`

Alleen de rol `owner` kan aanvragen verwijderen; `staff` kan lezen en bijwerken.

## 3. Make.com en Google

- Het scenario is gedeeld: de `notifyEmail` uit de tenant bepaalt de ontvanger. Controleer in het scenario dat het adres in de payload
  (`mail.notify.to`) wordt gebruikt en dat de terugvalmail klopt.
- De Google Sheet is gedeeld: elke rij heeft een kolom met de tenant. Spreek af wie de Sheet mag zien (er staan persoonsgegevens van meerdere kantoren in).
  Overweeg per kantoor een eigen Sheet als dat een eis is.
- `sendApplicantMail`: zet pas op `true` als de bevestigingstekst is goedgekeurd (zie `docs/make-setup.md`).

## 4. Uitrollen

1. Commit en push de wijzigingen. Controleer in Vercel dat de uitrol **Ready** is.
2. Zet het domein van de makelaar in Cloudflare Turnstile (als Turnstile aan staat) en controleer `allowedOrigins`.
3. Geef de makelaar dit stukje code voor zijn site (per woning een andere `data-property-id`):

```html
<script src="https://rentalflowai.vercel.app/widget.js"
        data-tenant="voorbeeld-makelaars"
        data-property-id="<id van de woning>"
        async></script>
```

## 5. Acceptatietest (altijd doen)

- [ ] Formulier opent via de knop op de site van de makelaar, en **niet** op een ander domein.
- [ ] Een testaanvraag per groep (geschikt, zelf beoordelen, niet passend): `node scripts/e2e.mjs <groep> <jouw-mail>` (alleen lokaal of op een omgeving zonder Vercel-login).
- [ ] De aanvraag staat in het dashboard bij het juiste kantoor, in de juiste groep, met werkende mail- en belknop.
- [ ] De mail aan de makelaar bevat de link "Open in dashboard" en die opent de juiste aanvraag na inloggen.
- [ ] Een tweede kantoor ziet deze aanvraag **niet** (inloggen met een ander account of controle in SQL).
- [ ] Inloggen en uitloggen werken, en "wachtwoord vergeten" levert een werkende mail.
- [ ] De privacyverklaring opent vanuit het formulier.
- [ ] Verwijder de testaanvragen (dashboard > *Aanvraag verwijderen*) en de testrijen in de Sheet.

## 6. Uitschrijven van een kantoor

1. Zet de widget van de site (de makelaar haalt het script weg) en verwijder het tenantbestand en de regel in `index.ts`.
2. Verwijder de aanvragen volgens de procedure in `docs/dashboard.md` of laat de bewaartaak ze opruimen.
3. Verwijder de leden en het kantoor: `delete from public.organizations where tenant_key = '...';` (aanvragen en logboek volgen vanzelf).
4. Verwijder de gebruiker in Supabase > *Authentication* > *Users*, en de rijen in de Sheet en de mails.
