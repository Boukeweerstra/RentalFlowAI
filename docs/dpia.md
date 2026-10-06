# Korte DPIA: RentalFlowAI

Stand: 6 oktober 2026. **Concept van een student-ontwikkelaar, niet getoetst door een jurist of functionaris gegevensbescherming.**
Doel: vooraf de risico's voor woningzoekers benoemen en laten zien welke maatregelen genomen zijn. Past bij `docs/verwerkingsregister.md`.

## 1. Beschrijving

RentalFlowAI is een formulier op de site van een verhuurmakelaar. Een woningzoeker vult gegevens in; regels geven een eerste indicatie; de makelaar ziet
de aanvraag in een dashboard en beslist zelf. Later (fase E) kan AI de vrije toelichting samenvatten en een conceptmail voorstellen.

## 2. Noodzaak en evenredigheid

| Vraag | Antwoord |
|---|---|
| Is elke gevraagde gegevenssoort nodig? | Per woning vraagt het formulier alleen wat bij de eisen van die woning hoort (bijvoorbeeld verblijfsstatus alleen als de woning dat vereist). Geen ID, BSN of bankgegevens |
| Kan het met minder? | Documenten worden pas later en alleen bij een passende aanvraag opgevraagd; de toelichting is vrijwillig |
| Bewaartermijn | 6 maanden, daarna automatisch weg; eerder verwijderen kan op verzoek |
| Transparantie | Privacyverklaring per kantoor in het formulier (concept); duidelijke uitleg dat een mens beslist |

## 3. Risico's en maatregelen

| # | Risico | Kans | Impact | Maatregel | Restrisico |
|---|---|---|---|---|---|
| 1 | Onterecht afgewezen worden door een regel (bijvoorbeeld inkomen net onder de grens) | Gemiddeld | Hoog | De computer wijst nooit af; "niet passend" is een indicatie; de aanvraag is altijd zichtbaar en de makelaar kan de groep wijzigen; neutrale ontvangstbevestiging ("definitieve reactie volgt") | Laag, mits de makelaar de lijst echt bekijkt (afspraak met het kantoor) |
| 2 | Discriminatie via de regels of straks via AI | Laag | Hoog | Regels gebruiken alleen woningeisen (inkomen, proeftijd, huisdieren, bewoners); geen kenmerken als afkomst, geslacht of religie; AI krijgt geen naam, en zijn uitvoer wordt getest op gevoelige kenmerken (E6); de AI kan de uitkomst van de regels niet veranderen | Laag |
| 3 | Onbevoegde toegang tot aanvragen | Laag | Hoog | Inlog verplicht, rijafscherming per kantoor in de database, aanmelden uit, sessies server-side gecontroleerd, geheime sleutel alleen op de server | Laag; wachtwoordkwaliteit en gelekte-wachtwoordcontrole nog te regelen (A9) |
| 4 | Gevoelige gegevens in de vrije toelichting (bijvoorbeeld gezondheid) | Gemiddeld | Gemiddeld | Waarschuwing alleen in de privacyverklaring (bij het veld zelf nog niet: toevoegen), toelichting niet verplicht, bewaartermijn, verwijderfunctie; niet naar de AI als er niets in staat | Gemiddeld tot de waarschuwing bij het veld in het formulier staat (open punt) |
| 5 | Datalek bij een verwerker | Laag | Hoog | Alleen gerenommeerde verwerkers, EU-regio waar mogelijk, verwerkersovereenkomsten (D2), minimale gegevens naar derden, procedure voor melding binnen 72 uur | Gemiddeld tot de DPA's zijn geregeld |
| 6 | Gegevens blijven te lang staan in Sheet of mail | Hoog | Gemiddeld | Procedure D1 (periodieke opruiming) en verwijderprocedure in `docs/dashboard.md` | Gemiddeld tot D1 is vastgelegd en wordt uitgevoerd |
| 7 | Misbruik van het formulier (spam, vervalste aanvragen, uitputten van capaciteit) | Hoog | Laag tot gemiddeld | Elf lagen misbruikbescherming (`docs/abuse-protection.md`); dagplafond | Laag |
| 8 | Prompt-injectie via de toelichting (straks) | Gemiddeld | Gemiddeld | Toelichting is data, geen instructie; geen tools; strikt uitvoerschema; AI kan de regels niet overrulen; tests (E6) | Laag na E6 |
| 9 | Verkeerd vertrouwen in een AI-samenvatting | Gemiddeld | Gemiddeld | Samenvatting duidelijk als hulpmiddel gelabeld met de originele tekst ernaast; conceptmails worden nooit automatisch verstuurd | Laag |
| 10 | Doorgifte buiten de EER | Gemiddeld | Gemiddeld | Standaardcontractbepalingen of DPF-certificering per verwerker nagaan (D2); vermelden in de privacyverklaring | Gemiddeld tot D2 klaar is |

## 4. Beslissing en vervolg

- Voor demo's en tests met verzonnen gegevens is het restrisico acceptabel.
- **Voor echte aanvragen moeten eerst klaar zijn:** D1, D2 (verwerkersovereenkomsten), juridische toets van de privacyverklaring (C6), A9 (wachtwoordinstellingen), afspraak met het kantoor dat een mens elke aanvraag beoordeelt, en een procedure voor verzoeken van betrokkenen (D4).
- Herzie dit document zodra AI wordt toegevoegd (fase E) en bij elke nieuwe gegevenssoort.
