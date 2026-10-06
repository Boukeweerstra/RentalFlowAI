# Procedures: opruimen, verzoeken van betrokkenen, datalek, cookies

Stand: 6 oktober 2026. **Concept, niet juridisch getoetst.** Hoort bij `docs/verwerkingsregister.md` en `docs/dpia.md`. Verwijst naar stappenplan D1, D4 en D9.

## 1. Opruimen buiten de database (D1)

De bewaartaak in de database ruimt alleen `applications` op (na 6 maanden). Persoonsgegevens staan ook in de Google Sheet, in de mailbox van het kantoor
en in de uitvoergeschiedenis van Make. Zonder afspraak blijven die staan. **Regel: elke maandag opruimen wat ouder is dan 6 maanden.**

| Waar | Wat | Hoe | Wie |
|---|---|---|---|
| Google Sheet | Rijen met `submittedAt` ouder dan 6 maanden | Sorteer op kolom `submittedAt`, selecteer de oude rijen, *Rijen verwijderen*. Alternatief: een kopie van de Sheet per kwartaal en de oude verwijderen | Kantoor of beheerder |
| Mailbox (Gmail) | Meldingen "Nieuwe aanvraag" ouder dan 6 maanden | Zoek op `older_than:6m subject:"Nieuwe aanvraag"`, selecteer alles, verwijderen, daarna ook de prullenbak legen | Kantoor |
| Make.com | Uitvoergeschiedenis met de payload | Controleer in *Scenario > History* hoelang Make bewaart (hangt van het abonnement af) en wis oude uitvoeringen; zet waar mogelijk "Data is confidential" aan zodat inhoud niet wordt bewaard | Beheerder |
| Supabase | Aanvragen | Gebeurt automatisch (`delete_expired_applications`); controle: `select count(*) from public.applications where created_at < now() - interval '6 months';` moet 0 zijn | Beheerder |

Een geplande taak in Make die oude Sheet-rijen verwijdert is een mogelijke verbetering; wacht tot er echt gebruik is. Leg bij elke controle de datum vast (een regel in een eigen logboekdocument zonder persoonsgegevens).

## 2. Verzoeken van betrokkenen (D4)

Een woningzoeker kan vragen om inzage, correctie, verwijdering, beperking of bezwaar. **Doorlooptijd: binnen één maand antwoorden** (AVG art. 12).

1. **Ontvangen** bij het contactadres uit de privacyverklaring. Noteer in een eigen register (zonder de inhoud van de gegevens): datum ontvangst, soort verzoek, deadline, wie het behandelt, datum afhandeling.
2. **Identiteit controleren:** laat de aanvrager vanaf het e-mailadres schrijven waarmee de aanvraag is gedaan, of vraag een bevestiging met een detail dat alleen de aanvrager kent (woning en indiendatum). Vraag **geen** kopie van een identiteitsbewijs, dat is meer gegevens dan nodig.
3. **Per soort verzoek:**

| Soort | Doen |
|---|---|
| Inzage | De beheerder haalt de gegevens op (zie SQL hieronder) en stuurt ze via een beveiligd kanaal naar de aanvrager. Vergeet de Sheet en de mails niet |
| Correctie | Pas de gegevens aan in de database via SQL (de makelaar kan alleen groep, status, benaderd en notitie wijzigen) en in de Sheet; leg uit dat de eerste check niet opnieuw wordt gedaan tenzij de makelaar de groep wijzigt |
| Verwijdering | Volg *Verwijderen op verzoek* in `docs/dashboard.md` (dashboard-knop, Sheet, mailbox, Make). Bevestig daarna zonder de gegevens te herhalen |
| Beperking of bezwaar | Zet de behandelstatus op *Afgerond*, voeg een notitie toe "niet verder verwerken" en verwijder bij een bezwaar tegen de verwerking de aanvraag zodra de wet dat vraagt |
| Intrekken van toestemming | Behandel als verwijdering |

4. **Afsluiten:** antwoord binnen de maand, noteer de afhandelingsdatum. Kan het niet binnen een maand, laat de aanvrager dat binnen die maand weten met de reden (verlenging kan met maximaal twee maanden).
5. **Klacht:** wijs op het recht om een klacht in te dienen bij de Autoriteit Persoonsgegevens.

Inzage ophalen (SQL-editor van Supabase, vervang het e-mailadres; levert de gegevens als tekst):

```sql
select to_jsonb(a) - 'organization_id' as aanvraag
from public.applications a
where lower(a.email) = lower('<e-mailadres van de aanvrager>');
```

Voorbeeldantwoord (Nederlands): *"Beste [naam], wij hebben uw verzoek van [datum] ontvangen. Hierbij ontvangt u [de gegevens die wij van u hebben / de bevestiging dat uw gegevens zijn verwijderd]. Heeft u vragen, dan horen wij het graag. U kunt ook een klacht indienen bij de Autoriteit Persoonsgegevens. Met vriendelijke groet, [kantoor]."*

## 3. Bij een vermoeden van een datalek

Voorbeelden: een gestolen laptop met het dashboard ingelogd, een verkeerde ontvanger van een mail met aanvragen, een gelekte sleutel (secret key, API-sleutel), een onbevoegde die toegang had tot het dashboard.

1. **Direct stoppen:** wijzig het wachtwoord, trek de gelekte sleutel in en maak een nieuwe (Supabase *API Keys*, Make, Vercel, OpenAI), zet zo nodig de site tijdelijk offline (Vercel *Pause*).
2. **Vastleggen** (datum, wat er gebeurd is, welke gegevens, hoeveel mensen). Geen persoonsgegevens in het logboek zelf.
3. **Beoordelen of er risico is** voor de betrokkenen. Zo ja: **melden bij de Autoriteit Persoonsgegevens binnen 72 uur** nadat het bekend is (het kantoor als verantwoordelijke; als verwerker meld je het zonder onredelijke vertraging aan het kantoor).
4. Is het risico **hoog**: ook de betrokkenen informeren.
5. **Leren:** wat ging mis, wat veranderen we. Pas het verwerkingsregister en de DPIA aan.

## 4. Cookies en lokale opslag (D9)

Onderzocht op 6 oktober 2026 (lokale controle van de antwoorden en een zoektocht in de code):

| Onderdeel | Cookies of lokale opslag | Nodig? |
|---|---|---|
| Formulier (`/embed/...`), `/api/form-token`, `widget.js`, privacyverklaring | **Geen** (geen `Set-Cookie`, geen `localStorage`, `sessionStorage` of `document.cookie` in de code) | n.v.t. |
| Inloggen en dashboard | Inlogcookies van Supabase (sessie van de ingelogde makelaar) | Ja, strikt noodzakelijk om in te loggen |
| Cloudflare Turnstile (alleen als aangezet) | Cloudflare kan voor de botcontrole eigen cookies of opslag gebruiken | Controleer bij het aanzetten (fase B) wat Turnstile zet en pas deze tabel en de privacyverklaring aan |

Daarom is **geen cookiebanner** nodig voor het formulier zolang dit zo blijft. Verandert dit (bijvoorbeeld analytics of marketing), dan eerst toestemming regelen en dit document en de privacyverklaring aanpassen.
