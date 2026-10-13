# RentalFlowAI: AI-verordening, bias, transparantie en aanbevelingen

Bron 5 van 5 voor de uitlegvideo. Stand: 8 oktober 2026. **Eigen analyse van een student, geen juridisch advies.** De tijdlijnen van de AI-verordening (Verordening (EU) 2024/1689) zijn in beweging; controleer de actuele data voordat je er iets op baseert.

## 1. Welke AI zit er in het product?
| Onderdeel | Is het AI? | Toelichting |
|---|---|---|
| Eerste check (drie groepen) | Waarschijnlijk **niet** | Vaste, door mensen geschreven regels (if-then). Eenvoudige regelgebaseerde systemen vallen volgens de Europese richtsnoeren buiten de definitie van een AI-systeem. Dit is een interpretatie, geen zekerheid |
| Samenvatting van de toelichting | **Ja** | Taalmodel (OpenAI `gpt-4o-mini`), standaard uit |
| Conceptmail | **Ja** | Zelfde taalmodel, alleen op klik van de makelaar |
| Code gebouwd met Claude | Hulpmiddel bij het bouwen | Geen onderdeel van het product zelf |

## 2. Risicoklasse volgens de AI-verordening
- **Verboden praktijken (art. 5):** niet van toepassing. Geen sociale scoring, geen manipulatie, geen biometrie, geen emotieherkenning.
- **Hoog risico (bijlage III):** de lijst noemt onder meer het beoordelen van **kredietwaardigheid** van natuurlijke personen en toegang tot essentiële diensten. Een huurwoning-selectie staat er niet met naam in, maar een systeem dat inkomen toetst grenst eraan. Omdat de **regels geen AI zijn** en de AI alleen tekst samenvat en de uitkomst **nooit kan wijzigen**, is mijn inschatting dat het product niet onder hoog risico valt. Dit moet een jurist bevestigen, zeker als de AI later wél meebeslist.
- **Transparantie (art. 50):** bij AI die met mensen communiceert of tekst genereert moet dat kenbaar zijn. In het product staat bij elke samenvatting het label "AI-hulpmiddel, kan fouten bevatten" en een conceptmail wordt door een mens gelezen en zelf verstuurd.
- **AI-geletterdheid (art. 4):** gebruikers van AI (hier: de makelaar) moeten voldoende kennis hebben. Het product legt uit wat de AI doet en niet doet (uitlegdocument voor makelaars, label in het dashboard).
- **Rollen:** OpenAI is aanbieder van het model; het kantoor is gebruiker (deployer); de student/ontwikkelaar is aanbieder van de toepassing eromheen. Contractafspraken over die rollen ontbreken nog.

## 3. Bias en eerlijkheid
Wat is gecontroleerd en wat niet.

| Onderwerp | Bevinding |
|---|---|
| Kenmerken in de regels | Alleen woningeisen: inkomen, soort inkomen, proeftijd, huisdieren, aantal bewoners, garantsteller, student ja/nee, verblijfsvergunning. Geen naam, geslacht, afkomst of religie. Leeftijd wordt alleen als 18+ bevestiging gevraagd |
| Naam naar de AI | Wordt vooraf gewist; de AI kan dus niet op een naam reageren |
| **Risicopunten (indirecte discriminatie)** | **Student niet toegestaan** treft jongeren; **soort inkomen niet toegestaan** (bijvoorbeeld uitkering, zzp) kan mensen met een kwetsbare positie raken; **verblijfsvergunning** raakt mensen met een andere nationaliteit en is gevoelig (de Algemene wet gelijke behandeling kent verboden onderscheid op o.a. nationaliteit en leeftijd; sommige eisen zijn wettelijk verplicht, andere niet). Deze eisen zijn een keuze van de makelaar, niet van de software |
| Maatregel in het ontwerp | De computer wijst nooit af; "niet passend" is een indicatie; per eis kiest de makelaar "past niet" of "zelf bekijken"; de marge voorkomt onterecht afvallen net onder de grens |
| Meting | Zonder marge klopten de regels bij 78% van 40 testaanvragen, met marge 85%. Onterecht "Unsuitable": van 8 naar 5 aanvragen. Duidelijke gevallen 31/31 goed |
| Wat dat niet bewijst | Het zijn 40 **verzonnen** gevallen met labels van de student zelf. Er is **geen** onderzoek gedaan naar uitkomsten per groep (bijvoorbeeld studenten, mensen met verschillende inkomenssoorten) en geen echte makelaar heeft de labels nagekeken |
| AI en bias | De AI-uitvoer is getest op gevoelige onderwerpen: een eerste promptversie herhaalde een gezondheidsreden; de tweede niet, en een controle in de code houdt zulke woorden tegen. Steekproef: 5 gevallen |

## 4. Transparantie
- De woningzoeker ziet vooraf de eisen en ontvangt een neutrale bevestiging.
- De makelaar ziet bij elke aanvraag de **redenen** achter de groep.
- Elke AI-tekst is gelabeld, staat naast de originele tekst, en bevat modelnaam en promptversie in de database.
- Elke wijziging van een groep of status staat in een logboek.

## 5. Aanbevelingen voor verantwoord AI-gebruik
1. **Houd een mens verantwoordelijk.** Laat de computer nooit afwijzen; leg vast dat een medewerker elke aanvraag bekijkt (afspraak per kantoor).
2. **Gebruik AI alleen als hulpmiddel voor tekst**, nooit voor de beslissing, en houd de regels uitlegbaar en los van de AI.
3. **Minimaliseer gegevens** naar de AI: wis naam en contactgegevens, stuur geen toelichting als die leeg is, en bewaar niets langer dan nodig.
4. **Test op bias met een echte controle:** laat een makelaar de 40 testgevallen nalabelen, vergelijk uitkomsten voor groepen (studenten, inkomenssoorten, vergunningen) en herhaal dat bij elke regelwijziging.
5. **Beperk eisen die indirect discrimineren.** Geef makelaars in het eisenscherm een korte uitleg per gevoelige eis (student, inkomenssoort, verblijfsvergunning) en laat de standaardkeuze "zelf bekijken" zijn in plaats van "past niet".
6. **Wees open:** label AI-tekst, leg in de privacyverklaring uit dat er AI wordt gebruikt en op welk deel van de gegevens, en geef een contactadres voor vragen.
7. **Regel de privacy-basis voor echt gebruik:** verwerkersovereenkomsten, doorgifte buiten de EER, juridische toets van de privacyverklaring, grondslag "stappen voor een overeenkomst" in plaats van alleen toestemming, en een waarschuwing bij het veld Toelichting.
8. **Test tegen misbruik van de AI:** blijf prompt-injectie en gevoelige-woorden controleren met een grotere en wisselende testset, en houd een dagplafond en een kostenlimiet aan.
9. **Herzie bij verandering:** een nieuwe gegevenssoort, een nieuw model of een AI die meebeslist betekent een nieuwe DPIA en een nieuwe risicoklasse-toets.
10. **Maak AI-geletterdheid onderdeel van de uitrol:** leg makelaars uit wat de AI kan, niet kan, en dat samenvattingen fout kunnen zijn.

## 6. Eerlijke slotsom
Het product is bewust zo ontworpen dat de riskante keuzes bij een mens blijven. Dat verkleint de risico's, maar vervangt geen echte validatie. Wat nog ontbreekt: een jurist, een echte makelaar die de testset nalabelt, een bias-onderzoek per groep, verwerkersovereenkomsten en een formele toets van de risicoklasse.
