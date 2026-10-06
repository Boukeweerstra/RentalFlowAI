# Basismeting: de regelmotor zonder AI

Gemaakt met `scripts/eval/run-rules.mjs` op 40 verzonnen aanvragen (`scripts/eval/cases.mjs`), tegen de woningen 1001 tot 1005 van de demo-tenant.
Rapport is reproduceerbaar: dezelfde invoer geeft hetzelfde rapport.

**Let op bij het lezen:**
- De verwachte uitkomsten zijn bepaald door de ontwikkelaar (met Claude), niet door een echte makelaar. Ze moeten nog worden nagekeken.
- "Duidelijke gevallen" volgen uit de eisen van de woning. "Inschattingsgevallen" zijn gevallen waarin een mens redelijkerwijs anders kan kiezen of informatie gebruikt die de regels niet zien. De testset is bewust niet representatief voor de praktijk: hij bevat verhoudingsgewijs veel lastige gevallen.
- **Circulair deel:** de duidelijke gevallen zijn afgeleid uit dezelfde eisen die de regels gebruiken, dus 100% daar bewijst alleen dat de regels de eisen correct uitrekenen (geen rekenfouten). De inschattingsgevallen zijn bewust bedacht op plekken waar regels tekort kunnen schieten, dus een lage score daar is deels ingebouwd. Een eerlijke meting vraagt om labels van een onafhankelijke persoon (echte makelaar) op aanvragen die niet door ons zijn bedacht.
- Veertig gevallen zijn te weinig voor harde percentages. Gebruik dit als richting en voor het vinden van patronen, niet als bewijs.

## Resultaat

| Groep gevallen | Regels zitten goed |
|---|---|
| Alle gevallen | 31/40 (78%) |
| Duidelijke gevallen | 31/31 (100%) |
| Inschattingsgevallen | 0/9 (0%) |

Verwarringstabel, alle gevallen:

| verwacht \ regels | Suitable | Review | Unsuitable |
|---|---|---|---|
| Suitable | 11 | 0 | 0 |
| Review | 1 | 7 | 8 |
| Unsuitable | 0 | 0 | 13 |

- **Onterecht "Unsuitable"** (de regels zeggen niet passend, een mens zou het wel bekijken of geschikt vinden): 8 van 40.
  Dit is het meest schadelijke soort fout, want de woningzoeker komt in de onderste groep terecht. c05, c10, c15, c21, c23, c29, c37, c40.
- **Onterecht "Suitable"** (de regels zeggen geschikt, een mens wil het toch beoordelen): 1 van 40. c08.

## Alle afwijkingen

| Geval | Woning | Verwacht | Regels | Soort | Reden (mens) | Redenen (regels) |
|---|---|---|---|---|---|---|
| c05 | 1001 | Review | Unsuitable | inschatting | Samen 5.540, € 10 onder de grens: een mens kijkt even | income_too_low |
| c08 | 1001 | Review | Suitable | inschatting | Zzp'er pas 8 maanden bezig: stabiliteit onzeker (de regels controleren dit alleen bij loondienst) | - |
| c10 | 1001 | Review | Unsuitable | inschatting | Student met een fulltime baan: de woning sluit studenten uit, maar het inkomen is stevig | student_not_allowed |
| c15 | 1001 | Review | Unsuitable | inschatting | Pensioen 6.000: inkomen ruim voldoende, alleen de bronlijst sluit het uit | income_type_not_allowed |
| c21 | 1002 | Review | Unsuitable | inschatting, toelichting beslist | Formulier zegt geen garantsteller, de toelichting zegt dat ouders garant willen staan | income_too_low, guarantor_required |
| c23 | 1002 | Review | Unsuitable | inschatting | Zzp'er met 3.000 en 24 maanden: type staat niet op de lijst maar profiel is prima | income_type_not_allowed |
| c29 | 1003 | Review | Unsuitable | inschatting, toelichting beslist | € 50 onder de grens, maar de toelichting kondigt een loonsverhoging aan | income_too_low |
| c37 | 1004 | Review | Unsuitable | inschatting | € 10 onder de grens | income_too_low |
| c40 | 1005 | Review | Unsuitable | inschatting, toelichting beslist | Hoofdaanvrager 2.000, maar de toelichting noemt een partner met extra inkomen (beleid telt alleen de hoofdaanvrager) | income_too_low |

## Wat dit betekent voor AI (fase E)

- Gevallen waarin de vrije toelichting het oordeel beslist: 3 (c21, c29, c40). Hiervan staan de regels fout bij 3.
  Dit is waar een samenvatting van de toelichting de makelaar kan helpen: zij maakt zichtbaar dat er informatie staat die de regels niet zien. De AI mag de uitkomst **niet zelf** wijzigen.
- Afwijkingen die geen toelichting nodig hebben (grensgevallen, bronlijsten): daar helpt AI niet; dat zijn beleidskeuzes in de woningconfiguratie (bijvoorbeeld een marge, of meer criteria op "review" zetten).
- De regels zijn bij duidelijke gevallen 31/31 (100%) goed. Dat is de bovengrens van wat AI hier nog kan verbeteren.

## Wat opvalt (ontwerpvragen, geen AI-vragen)

- Bijna alle afwijkingen zijn van het soort "de regels zeggen **Unsuitable**, een mens zou **Review** kiezen" (8 van 9). Dat komt doordat een harde grens (inkomen, bronnenlijst, studenten) niets "bijna" kent.
  Dat is precies de fout waar de woningzoeker het meest onder lijdt, ook al beslist een mens altijd.
- Mogelijke ontwerpkeuzes om te bespreken met een makelaar, zonder AI: een marge van enkele procenten onder de inkomensgrens als **Review** (c05, c37); studenten of bijzondere inkomensbronnen met een stevig inkomen als **Review** in plaats van **Unsuitable** (c10, c15, c23). Een marge onder de inkomensgrens bestaat nu niet als instelling en zou nieuw gebouwd moeten worden.
- Dit zijn beleidskeuzes van de makelaar (per woning in te stellen via `criteria.severity`), niet iets wat de ontwikkelaar of AI voor hen beslist.
