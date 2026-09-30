// ==UserScript==
// @name         RentalFlowAI test op Rotsvast.nl (alleen lokaal, eigen browser)
// @match        https://www.rotsvast.nl/*
// @match        https://rotsvast.nl/*
// @grant        none
// ==/UserScript==

/*
 * Voegt het RentalFlowAI-widget toe aan een woningpagina, alleen in jouw eigen
 * browser. Er wordt niets aan de site van Rotsvast gewijzigd.
 *
 * Gebruik:
 *  1. Start de app:  npm run dev -- -p 3100
 *  2. Open een woningpagina op rotsvast.nl.
 *  3. Vul hieronder de gegevens van die woning handmatig in (id, huur, adres).
 *
 * Werkt niet als de CSP van de site scripts/iframes van localhost blokkeert.
 * Dan: plak dit stuk in de DevTools-console, of test via demo-host/external.html.
 */
(function () {
  "use strict";

  // ---- handmatig invullen per woning -----------------------------------
  var APP = "http://localhost:3100";
  var TENANT = "rotsvast-test";
  var PROPERTY_ID = "VUL-HIER-HET-WONING-ID-IN";
  var RENT = "1650";
  var ADDRESS = "Adres van de woning";
  // Optioneel: CSS-selector van de bestaande knop "Bekijk brochure", zodat de
  // knop "Aanvraag" er direct achter komt. Leeg = onderaan de pagina.
  var TARGET = "";
  // ----------------------------------------------------------------------

  var s = document.createElement("script");
  s.src = APP + "/widget.js";
  s.async = true;
  s.setAttribute("data-tenant", TENANT);
  s.setAttribute("data-property-id", PROPERTY_ID);
  s.setAttribute("data-rent", RENT);
  s.setAttribute("data-address", ADDRESS);
  if (TARGET) s.setAttribute("data-target", TARGET);
  document.body.appendChild(s);
})();
