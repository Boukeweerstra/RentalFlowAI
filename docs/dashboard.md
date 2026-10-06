# Dashboard voor de makelaar

Een beveiligde pagina in dezelfde app: `/login` en `/dashboard`. Aanvragen staan automatisch onder **Suitable**, **Review** en
**Unsuitable**, met mail en telefoonnummer groot zichtbaar. Achtergrond en keuzes: [plan-fase-2.md](plan-fase-2.md).

## Wat er is gebouwd

- **Opslaan bij het indienen:** de API schrijft elke aanvraag naar Supabase en daarna naar Make (mail en Sheet). Lukt één van de twee,
  dan is de aanvraag niet verloren. Mislukken beide, dan krijgt de woningzoeker een foutmelding.
- **Database** (`supabase/migrations/`): kantoren, leden, aanvragen en een logboek, met rijafscherming per kantoor. Een ingelogde makelaar kan
  alleen vier kolommen wijzigen: groep, behandelstatus, "benaderd" en notitie. Wie wat deed komt automatisch in het logboek.
- **Bewaartermijn:** elke nacht worden aanvragen ouder dan 6 maanden verwijderd (per kantoor in te stellen).
- **Inloggen** met e-mail en wachtwoord (Supabase Auth). Elke pagina en elke serveractie controleert zelf de gebruiker.
- **Dashboard:** de drie groepen, filter per woning, per aanvraag direct mail en telefoon (met knoppen om te mailen, bellen en te kopiëren),
  de redenen, een voorgestelde volgende stap, en bij "Details en acties" alle gegevens, de acties en het logboek.
- **Live bijwerken:** nieuwe aanvragen verschijnen vanzelf (met verversen elke minuut als terugval).
- **Mail aan de makelaar** bevat een link "Open in dashboard" naar de aanvraag.

## Eenmalig instellen

### 1. De geheime Supabase-sleutel
De app heeft die nodig om een aanvraag op te slaan. Zonder deze sleutel wordt er niets opgeslagen (de app logt dat) en blijft het dashboard leeg.
1. Supabase-dashboard, project **RentalFlowAI** > *Project Settings* > *API Keys*.
2. Maak of kopieer de **secret key** (begint met `sb_secret_`).
3. Zet hem in `.env.local` als `SUPABASE_SECRET_KEY=...` en in Vercel (Environment Variables) als **Sensitive**. Deel hem nooit in de chat.

### 2. De publieke gegevens (staan al in `.env.local`)
`NEXT_PUBLIC_SUPABASE_URL` en `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` zijn bedoeld voor de browser. Zet ze ook in Vercel (niet *Sensitive*) en
**deploy daarna opnieuw**: `NEXT_PUBLIC_…`-variabelen worden bij het bouwen vastgelegd.

Zet in Vercel ook `NEXT_PUBLIC_APP_URL` (bijvoorbeeld `https://rentalflowai.vercel.app`), voor de link in de mail.

### 3. Een inlog voor de makelaar
Er bestaat al een Supabase-gebruiker met `boukeweerstra@gmail.com`, gekoppeld aan de kantoren `demo` en `rotsvast-test`.
- **Weet je het wachtwoord van die gebruiker?** Dan kun je meteen inloggen.
- **Zo niet,** maak een nieuwe aan: Supabase-dashboard > *Authentication* > *Users* > *Add user* > *Create new user*. Vul een e-mailadres en
  **een eigen, sterk wachtwoord** in en kies *Auto Confirm User*. Je kunt een variant van je adres gebruiken, bijvoorbeeld
  `jouwnaam+makelaar@gmail.com`. Laat het adres aan mij weten (het wachtwoord nooit); dan koppel ik die gebruiker aan de kantoren.

Wachtwoorden zet ik nooit zelf.

### 4. Instellingen in Supabase Auth
- *Authentication* > *URL Configuration*: zet **Site URL** op het adres van de app.
- *Authentication* > *Sign In / Providers*: zet het sterk-wachtwoord-beleid aan en, als je plan het toestaat, **bescherming tegen gelekte
  wachtwoorden** (dat laatste is nu de enige openstaande waarschuwing in de beveiligingscontrole van Supabase).
- Schakel openbare aanmelding uit (*Allow new users to sign up*), zodat alleen aangemaakte gebruikers kunnen inloggen.

## Gebruiken

- Open `/dashboard` (of de link uit de mail). Zonder inlog word je naar `/login` gestuurd.
- Klik bij een aanvraag op **Details en acties** voor de acties: groep (Suitable, Review, Unsuitable), behandelstatus (nieuw, benaderd,
  bezichtiging gepland, afgerond), "benaderd"-vinkje en een notitie. De uitkomst van de regels blijft zichtbaar naast jouw keuze.
- "Volgende stap" is een suggestie uit vaste regels, geen AI. De makelaar beslist.

## Testen

| Wat | Hoe |
|---|---|
| Uiterlijk, zonder inlog | Lokaal `/dashboard/preview` (verzonnen gegevens, alleen buiten productie) |
| Opslaan en uitvalscenario's | `node scripts/mock-services.mjs` en `node scripts/test-store.mjs` (zie de kop van dat script voor de app-omgeving) |
| Misbruikbescherming | `node scripts/test-abuse.mjs` |
| Database en afscherming | De migraties in `supabase/migrations/`; de afscherming is getest met twee verzonnen kantoren (zie plan, stap 1) |

## Wat nog niet is getest of nog ontbreekt

- **Inloggen en live bijwerken met een echte gebruiker** zijn niet door mij getest, omdat ik geen wachtwoord invoer. Zie de checklist hieronder.
- **Wachtwoord vergeten:** er is nog geen pagina om een wachtwoord te herstellen. Een beheerder kan dat in het Supabase-dashboard doen.
- **Meerdere medewerkers per kantoor:** de database ondersteunt het al, maar er is nog geen scherm om medewerkers uit te nodigen.
- **De Sheet en de mails** bewaren gegevens langer dan 6 maanden en worden niet door de bewaartaak opgeruimd.

## Checklist: eerste keer inloggen

1. Secret key in `.env.local` en Vercel gezet, opnieuw gedeployd.
2. Een testaanvraag via het formulier ingediend (bijvoorbeeld met `node scripts/e2e.mjs suitable jouw-adres@gmail.com` lokaal).
3. Ingelogd op `/login`; de aanvraag staat onder de juiste kop, met mail en telefoon.
4. Een tweede testaanvraag ingediend terwijl het dashboard open staat: verschijnt die vanzelf? Staat rechtsboven "Live bijgewerkt"?
5. Groep verplaatst, notitie gemaakt; na verversen staat het er nog, en het staat in het logboek.
6. Uitgelogd en `/dashboard` geprobeerd: je wordt naar `/login` gestuurd.

## Verwijderen op verzoek (AVG)

Een aanvrager kan vragen zijn gegevens te laten verwijderen. Doe dan dit, in deze volgorde:

1. **Dashboard:** open de aanvraag, klik op *Details en acties*, daarna *Aanvraag verwijderen…* en bevestig. Alleen de eigenaar van het kantoor kan dit. De aanvraag en het bijbehorende logboek zijn dan uit de database.
2. **Google Sheet:** zoek de rij (op e-mailadres of tijdstip) en verwijder die. Het dashboard kan dit niet voor je doen.
3. **Mailbox van het kantoor:** verwijder de melding "Nieuwe aanvraag" van deze persoon, ook uit de prullenbak.
4. **Make.com:** uitvoergeschiedenis bewaart de gegevens een beperkte tijd; controleer de bewaartermijn van je Make-abonnement en wis zo nodig de uitvoering (Scenario → History).
5. **Bevestig aan de aanvrager** dat het is gebeurd, zonder de verwijderde gegevens te herhalen.

Wat de database vastlegt: een regel in `deletion_log` met alleen de interne id, het kantoor, wie het deed en wanneer (geen naam, mail of telefoon). De nachtelijke bewaartaak (na 6 maanden) schrijft dezelfde regels met `method = systeem`.

Controleren dat het gelukt is (SQL-editor, vervang de id):

```sql
select count(*) from public.applications where id = '<id>';           -- 0
select count(*) from public.application_events where application_id = '<id>';  -- 0
select * from public.deletion_log where application_id = '<id>';      -- 1 regel
```

## Herstelmail bestendig maken tegen linkscans (pas mogelijk met een eigen mailserver)

> **Stand 6 okt:** niet uitvoerbaar op het huidige Supabase-project. Supabase laat de mailtemplates alleen aanpassen als er een eigen SMTP-server is gekoppeld ("Set up custom SMTP to edit templates"). Voor de demo blijft de standaardmail met de oude route (`/auth/callback`) gelden: klik één keer op de link, in dezelfde browser. Een eigen mailserver (met eigen domein) is sowieso nodig voor echt gebruik: de standaardmail is streng beperkt en komt van een algemeen adres. Doe deze stappen pas dan.

Mailprogramma's en virusscanners openen links automatisch. Met de standaardmail van Supabase verbruikt zo'n scan de eenmalige code, waarna de
echte klik "verlopen of al gebruikt" geeft. De app heeft daarom een tussenpagina `/auth/bevestig` met een knop **Doorgaan**; de code wordt pas
ingewisseld na die klik. Zet hiervoor de mail van Supabase om:

1. Supabase-dashboard > project **RentalFlowAI** > *Authentication* > *Email Templates* > **Reset Password**.
2. Vervang de tekst van het onderwerp door `Nieuw wachtwoord kiezen voor RentalFlowAI` en de inhoud (Message body) door:

```html
<h2>Nieuw wachtwoord kiezen</h2>
<p>Klik op de knop om een nieuw wachtwoord te kiezen voor RentalFlowAI.</p>
<p><a href="{{ .SiteURL }}/auth/bevestig?token_hash={{ .TokenHash }}&type=recovery">Nieuw wachtwoord kiezen</a></p>
<p>Heb je dit niet aangevraagd? Dan kun je deze mail negeren.</p>
```

3. Opslaan. De link gaat nu altijd naar het adres bij *URL Configuration > Site URL* (online). Lokaal testen van herstelmails werkt daarom alleen als je Site URL tijdelijk op `http://localhost:3100` zet; test dit liever online.

Zonder deze wijziging blijft de oude route (`/auth/callback`) gewoon werken.

## Woningen en eisen (scherm "Woningen")

Via **Woningen** in het hoofdmenu beheert de makelaar de woningen van het kantoor en de eisen per woning. Het formulier voor woningzoekers leest daaruit.

- **Wie mag wat:** alle medewerkers kunnen woningen en eisen bekijken; alleen de **eigenaar** van het kantoor kan toevoegen, wijzigen, uitzetten en verwijderen. De database laat de browser niets schrijven; opslaan gaat via de server, die controleert dat de gebruiker eigenaar is en de eisen opnieuw valideert.
- **Woning-id** is het id uit het systeem van de makelaar en komt in de scriptregel op de site (`data-property-id`). Het kan na opslaan niet meer wijzigen.
- **Per eis**: inkomen (factor, gezamenlijk of hoofdaanvrager, marge in procenten, toegestane bronnen), aantal aanvragers, garantsteller, proeftijd, minimale duur dienstverband, leeftijd, huisdieren, aantal bewoners, woningdelers, studenten, huurperiode, ingangsdatum, borgstelling, verblijfsvergunning en documenten die later gevraagd worden. Bij elke eis die ertoe doet kiest de eigenaar: *Past niet* (Unsuitable) of *Zelf bekijken* (Review).
- **Rechts in het scherm:** een direct voorbeeld van het eisenblok dat de woningzoeker ziet, en **Probeer een inkomen**: wat de regelmotor doet met iemand die verder aan alles voldoet.
- **Uitzetten** (Actief uit) sluit het formulier én het versturen direct; bestaande aanvragen blijven staan. **Verwijderen** kan alleen als er geen aanvragen voor de woning zijn.
- **Voorrang:** een woning in de database gaat vóór de woningen in `data/tenants/<tenant>.json`. Een woning die in de database staat maar niet actief of ongeldig is, valt niet terug op het bestand. Woningen die niet in de database staan, komen nog uit het bestand (de oude werkwijze blijft werken). De app onthoudt woningen 10 seconden, dus een wijziging is binnen die tijd zichtbaar in het formulier.
- **Oude aanvragen** veranderen niet: de uitkomst van de eerste check staat per aanvraag vast.
- **Lokaal beproeven zonder opslaan:** `http://localhost:3100/dashboard/preview/woningen` (alleen lokaal, verzonnen gegevens).
