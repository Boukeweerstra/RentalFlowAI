# Verwerkingsregister RentalFlowAI

Stand: 6 oktober 2026. **Concept, niet juridisch getoetst.** Bedoeld om te kunnen aantonen wat er met welke gegevens gebeurt (AVG art. 30).
Rolverdeling: het **kantoor (makelaar)** is verwerkingsverantwoordelijke; **RentalFlowAI** is verwerker. Voor het prototype is de eigenaar
van het project (Bouke Weerstra) beide; dat verandert zodra een echt kantoor het gebruikt (dan: verwerkersovereenkomst, zie D2 in het stappenplan).

## Verwerking 1: huuraanvraag ontvangen en beoordelen

| Onderdeel | Invulling |
|---|---|
| Doel | Een woningaanvraag beoordelen en contact opnemen met de aanvrager |
| Grondslag | Toestemming (vinkje in het formulier, versie per aanvraag vastgelegd) en stappen op verzoek vóór een huurovereenkomst (art. 6 lid 1 sub a en b) |
| Betrokkenen | Woningzoekers (en hun partner of medeaanvrager) |
| Gegevens | Naam, e-mail, telefoon, leeftijd, inkomenstype en bedrag, duur dienstverband, proeftijd, student ja/nee, woonsituatie (aantal bewoners, huisdieren, medebewoners), gewenste ingangsdatum en huurperiode, garantsteller ja/nee, verblijfsstatus (alleen als de woning dat vraagt), vrije toelichting |
| Niet gevraagd | Kopie identiteitsbewijs, BSN, bankgegevens, gezondheidsgegevens (de toelichting kan ze per ongeluk bevatten, zie DPIA) |
| Ontvangers | Medewerkers van het kantoor (dashboard, e-mail, Google Sheet) |
| Verwerkers | Supabase (database, regio eu-west-1), Vercel (hosting, regio fra1), Make.com (doorsturen), Google (Sheets, Gmail), Upstash (alleen gehashte sleutels voor rate-limiting), Cloudflare Turnstile (indien aan) |
| Doorgifte buiten de EER | Mogelijk bij Vercel, Make, Google, Upstash en Cloudflare; te regelen met standaardcontractbepalingen/DPF (taak D2) |
| Bewaartermijn | 6 maanden in de database (nachtelijke taak, per kantoor instelbaar); Sheet en mails: handmatige regel (taak D1) |
| Beveiliging | Zie "Maatregelen" |

## Verwerking 2: eerste check met regels

| Onderdeel | Invulling |
|---|---|
| Doel | Aanvragen voorsorteren in *geschikt*, *zelf beoordelen* en *niet passend*, zodat de makelaar sneller kan werken |
| Soort | Eenvoudige geautomatiseerde regels (geen profilering van persoonlijke kenmerken; alleen de eisen van de woning) |
| Besluit | **Geen** geautomatiseerd besluit met rechtsgevolg: de computer wijst niemand af en stuurt geen afwijzing. Een medewerker beslist altijd (art. 22 AVG is daardoor niet van toepassing, maar de makelaar moet dit zo blijven doen) |
| Gegevens | Dezelfde als hierboven; de uitkomst en de redenen (codes) worden bewaard |
| Aanpasbaar | De makelaar kan de groep van een aanvraag handmatig wijzigen; elke wijziging staat in het logboek |

## Verwerking 3: logboek en misbruikbescherming

| Onderdeel | Invulling |
|---|---|
| Doel | Aantonen wie wat deed (logboek), en spam en misbruik van het formulier tegengaan |
| Gegevens | Logboek: wie, wat, wanneer (geen tekst van notities). Misbruik: IP-adres en een hash van het e-mailadres, kortdurend (minuten tot een dag) in de rate-limiter |
| Bewaartermijn | Logboek volgt de aanvraag; rate-limit-sleutels verlopen automatisch |

## Verwerking 4: verwijderen en bewijs daarvan

| Onderdeel | Invulling |
|---|---|
| Doel | Verwijderen op verzoek en na de bewaartermijn aantonen |
| Gegevens | `deletion_log`: interne id, kantoor, wie (of "systeem") en wanneer; **geen** persoonsgegevens |
| Bewaartermijn | Zolang het kantoor bestaat |

## Verwerking 5 (in test, standaard uit): AI-ondersteuning

Zie fase E van het stappenplan en de DPIA. Alleen de toelichting en redenencodes gaan naar de AI-aanbieder, nooit naam, mail of telefoon. Dit register wordt aangevuld zodra een aanbieder is gekozen (E1).

## Maatregelen (technisch en organisatorisch)

- Toegang: inloggen met e-mail en wachtwoord (Supabase Auth); rijafscherming per kantoor in de database; aanmelden uitgeschakeld; alleen de eigenaar mag verwijderen.
- Het formulier en het dashboard draaien over HTTPS; het dashboard laat zich niet insluiten en wordt niet gecachet.
- Geheimen alleen server-side (Vercel *Sensitive*), de geheime databasesleutel is nooit in de browser.
- Misbruikbescherming in lagen (formulier-token, rate-limits, honeypot, duplicaatcontrole, dagplafond).
- Logboek van wijzigingen; bewaartaak; verwijderprocedure (zie `docs/dashboard.md`).
- Organisatorisch (nog te regelen): verwerkersovereenkomsten, een vaste contactpersoon voor verzoeken van betrokkenen, een procedure bij een datalek (melden binnen 72 uur bij de Autoriteit Persoonsgegevens).

## Open punten

Zie het stappenplan, fase D: D1 (opruiming Sheet en mails), D2 (verwerkers en doorgifte), D4 (verzoeken van betrokkenen), D5 en D6 (plannen en back-ups).
