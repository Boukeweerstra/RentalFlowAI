# RentalFlowAI: toets aan de AVG

Bron 4 van 5 voor de uitlegvideo. Stand: 8 oktober 2026. **Eigen toets van een student, geen juridisch advies.** Gebaseerd op het verwerkingsregister, de korte DPIA en de procedures in het project.

## Rollen
- Het **kantoor (makelaar)** is verwerkingsverantwoordelijke. **RentalFlowAI** is verwerker. In het prototype is de student beide.
- Verwerkers/subverwerkers: Supabase (database, Ierland), Vercel (hosting, Frankfurt), Google (Sheets en Gmail), Upstash (alleen gehashte sleutels voor limieten), Cloudflare Turnstile (indien aan), OpenAI (alleen als AI aan staat).

## Toets per AVG-onderdeel
| Onderdeel | Wat er is gedaan | Status |
|---|---|---|
| Doelbinding en grondslag (art. 5, 6) | Doel: aanvraag beoordelen en contact opnemen. Grondslag: toestemming (vinkje, privacyversie per aanvraag vastgelegd) en stappen vóór een huurovereenkomst | Werkt, maar zie aanbeveling 1 |
| Dataminimalisatie (art. 5) | Per woning alleen de nodige vragen; geen ID-kopie, BSN of bankgegevens; toelichting vrijwillig | Goed |
| Opslagbeperking (art. 5) | 6 maanden, automatisch weg; verwijderen met één knop | Database goed; Sheet en mail handmatig |
| Transparantie (art. 12, 13) | Privacyverklaring per kantoor in het formulier (NL en EN) met uitleg dat een mens beslist | Concept, niet juridisch getoetst |
| Geautomatiseerde besluiten (art. 22) | De computer wijst nooit af en stuurt geen afwijzing; een medewerker beslist; elke wijziging staat in het logboek | Ontwerp voldoet, mits het kantoor zo blijft werken |
| Privacy door ontwerp (art. 25) | Minimale gegevens, rijafscherming, AI zonder naam en contactgegevens, standaard uit | Goed |
| Verwerkingsregister (art. 30) | Geschreven (5 verwerkingen) | Concept |
| Beveiliging (art. 32) | Zie bron 3 | Goed voor een prototype; één waarschuwing open |
| Datalek (art. 33, 34) | Procedure: stoppen, vastleggen, melden binnen 72 uur bij de Autoriteit Persoonsgegevens, betrokkenen informeren bij hoog risico | Beschreven, niet beproefd |
| DPIA (art. 35) | Korte DPIA met 10 risico's, kans, impact, maatregel en restrisico | Concept; herzien bij nieuwe gegevens of AI |
| Rechten van betrokkenen (art. 15 tot 21) | Procedure: binnen één maand, identiteit controleren zonder ID-kopie, SQL voor inzage, verwijderstappen | Beschreven |
| Verwerkers (art. 28) en doorgifte (hoofdstuk V) | Verwerkers benoemd | **Open:** geen verwerkersovereenkomsten, doorgifte buiten de EER niet geregeld |
| Cookies | Formulier plaatst geen cookies of lokale opslag; alleen strikt noodzakelijke inlogcookies in het dashboard | Geen banner nodig, zolang dit zo blijft |

## Risico's uit de DPIA (samengevat)
Onterechte afwijzing door een regel, discriminatie via regels of AI, onbevoegde toegang, gevoelige gegevens in de vrije toelichting, datalek bij een verwerker, te lang bewaren in Sheet of mail, misbruik van het formulier, prompt-injectie, te veel vertrouwen in een AI-samenvatting en doorgifte buiten de EER. Voor elk is een maatregel en restrisico benoemd. Meeste restrisico's zijn laag; "gemiddeld" blijft staan voor verwerkersovereenkomsten, doorgifte, opruiming van Sheet en mail, en de waarschuwing bij het toelichtingsveld.

## Beslissing uit de DPIA
Voor demo's met verzonnen gegevens is het restrisico acceptabel. **Voor echte aanvragen eerst:** opruimprocedure Sheet en mail, verwerkersovereenkomsten, juridische toets van de privacyverklaring, wachtwoordinstellingen, afspraak met het kantoor dat een mens elke aanvraag beoordeelt, en een werkende procedure voor verzoeken van betrokkenen.

## Nieuwe bevindingen van deze toets (8 oktober 2026)
1. **Toestemming is een wankele grondslag** bij een huuraanvraag: de woningzoeker heeft weinig keus (machtsverschil) en kan toestemming niet "vrij" weigeren. Beter is de grondslag "noodzakelijk voor stappen vóór het sluiten van een overeenkomst" (art. 6 lid 1 sub b), met toestemming alleen voor de optionele onderdelen (bijvoorbeeld AI-samenvatting).
2. **Leeftijd:** het formulier vraagt alleen een bevestiging dat de aanvrager 18 jaar of ouder is, geen geboortedatum. Dat is goed voor dataminimalisatie. Het verwerkingsregister en de privacyverklaring spreken van "leeftijd"; die tekst moet daarmee in overeenstemming worden gebracht.
3. **De waarschuwing "geen gezondheidsgegevens" staat nog niet bij het veld Toelichting** zelf, alleen in de privacyverklaring.
4. **Verblijfsvergunning** is bijzonder gevoelig (zie bron 5, bias).
