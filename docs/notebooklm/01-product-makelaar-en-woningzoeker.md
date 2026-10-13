# RentalFlowAI: wat het product doet (voor de makelaar en de woningzoeker)

Bron 1 van 5 voor de uitlegvideo. Stand: 8 oktober 2026. Auteur: Bouke Weerstra, student minor AI. Het product is een prototype, getest met verzonnen gegevens.

## Het idee in drie zinnen
RentalFlowAI zet een knop **Aanvraag** op de woningpagina van een verhuurmakelaar. Een woningzoeker vult een formulier in dat alleen de vragen stelt die bij die woning horen. Een eerste check met vaste regels sorteert de aanvraag in drie groepen; **de computer wijst nooit af, de makelaar beslist.**

## Het probleem
Een verhuurmakelaar krijgt veel aanvragen voor één woning, per mail, telefoon of in wisselende formulieren. Elke aanvraag moet handmatig worden nagelopen op inkomen, proeftijd, huisdieren en aantal bewoners. Een groot deel voldoet niet aan de eisen. Dat kost tijd.

## Wat de woningzoeker ziet
1. Een knop **Aanvraag** op de woningpagina (de makelaar plakt één regel code op de site).
2. Het formulier opent op de pagina zelf. Bovenaan staan de **eisen van die woning** in gewone taal, zodat de woningzoeker vooraf weet waar hij aan toe is.
3. Alleen de vragen die bij de woning horen. Mogen er huisdieren, dan komt er geen huisdiervraag. Een verblijfsvergunning wordt alleen gevraagd als de woning dat eist.
4. Vooraf een waarschuwing als het niet lijkt te passen, maar hij mag altijd versturen.
5. Toestemming voor de verwerking (vinkje, met link naar de privacyverklaring) en een vrije toelichting (niet verplicht).
6. Een neutrale bevestiging: "u hoort van ons". Er komt nooit een automatische afwijzing.
7. Niet gevraagd: kopie identiteitsbewijs, BSN, bankgegevens.

## De eerste check: drie groepen
| Groep | Betekenis |
|---|---|
| Suitable (geschikt) | Alle eisen van de woning zijn gehaald |
| Review (zelf beoordelen) | Een punt wil de makelaar zelf bekijken: proeftijd, garantsteller, inkomen net onder de grens |
| Unsuitable (niet passend) | Een harde eis wordt niet gehaald. Dit is een **indicatie**; de makelaar kan de groep altijd wijzigen |

De regels gebruiken alleen de eisen die de makelaar zelf aan de woning stelt: huur en inkomen, soort inkomen, proeftijd, huisdieren, aantal bewoners, garantsteller, studenten toegestaan of niet, verblijfsvergunning. Per eis stelt de makelaar in of het **hard** is (past niet) of **zelf bekijken**. Er is ook een **marge** (0 tot 10 procent): een inkomen net onder de grens komt dan onder Review in plaats van Unsuitable.

## Wat de makelaar ziet
- Een melding per mail met link naar de aanvraag.
- Een beveiligd **dashboard** (inloggen verplicht) met de drie groepen. Nieuwe aanvragen verschijnen vanzelf, zonder verversen.
- Telefoon en e-mail groot bovenaan, met bel-, mail- en kopieerknop.
- De redenen waarom een aanvraag in een groep staat en een voorgestelde volgende stap (bijvoorbeeld: vraag een werkgeversverklaring).
- Status (nieuw, benaderd, bezichtiging gepland, afgerond), notities, zoeken en filteren, en een logboek van wijzigingen.
- Een scherm **Woningen** (alleen voor de eigenaar van het kantoor) om woningen en eisen zelf in te stellen. Rechts staat wat de woningzoeker straks ziet, en met "Probeer een inkomen" test de makelaar direct in welke groep iemand komt.
- Een aanvraag verwijderen met één knop (alleen de eigenaar). In het logboek komt een regel zonder persoonsgegevens.

## De rol van AI (klein en begrensd)
AI staat standaard uit en doet alleen tekst:
- Een **samenvatting** van de vrije toelichting, met maximaal vier aandachtspunten, onder de originele tekst en met het label "AI-hulpmiddel, kan fouten bevatten".
- Een **conceptmail** om ontbrekende informatie op te vragen, alleen als de makelaar op een knop klikt. Er is geen verzendknop; de makelaar leest, past aan en verstuurt zelf.
De AI beslist niets en kan de groep van een aanvraag nooit veranderen. De AI krijgt geen naam, e-mailadres of telefoonnummer.

## Eerlijke grenzen van het prototype
- Getest met verzonnen aanvragen, nog niet met een echte makelaar (validatie volgt).
- Geen koppeling met woningbeheersystemen, geen documenten uploaden, nog één rol per kantoor (eigenaar of medewerker).
- Privacyverklaring en verwerkersafspraken zijn concepten, nog niet juridisch getoetst.

## Hoe het is gemaakt
Ontworpen en gebouwd door een student met prompting en met Claude als ontwikkelpartner: plannen, laten bouwen, testen en zelf de keuzes maken (bijvoorbeeld wat bewust niet aan AI wordt overgelaten).
