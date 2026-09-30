/*!
 * RentalFlowAI widget
 *
 * Voeg toe op een woningpagina, op de plek waar de knop moet komen (of gebruik data-target):
 *
 *   <script src="https://<app>/widget.js"
 *           data-tenant="demo"
 *           data-property-id="1001"
 *           data-rent="1850"                 (optioneel; nodig voor test-tenants)
 *           data-address="Straat 1, Plaats"  (optioneel)
 *           data-lang="auto"                 (auto | nl | en)
 *           data-label="Aanvraag"            (optioneel)
 *           data-class="btn btn-secondary"   (optioneel: eigen knopklassen van de site)
 *           data-target="#brochure-knop"     (optioneel: knop komt direct na dit element)
 *           async></script>
 *
 * Programmatisch: window.RentalFlowAI.open() / .close()
 * Event op document na versturen: "rentalflowai:submitted"
 */
(function () {
  "use strict";

  if (window.RentalFlowAI) return;

  var script =
    document.currentScript ||
    document.querySelector('script[src*="widget.js"][data-tenant]');
  if (!script) return;

  var tenant = script.getAttribute("data-tenant");
  var propertyId = script.getAttribute("data-property-id");
  if (!tenant || !propertyId) {
    console.warn("[RentalFlowAI] data-tenant en data-property-id zijn verplicht.");
    return;
  }

  var appOrigin = new URL(script.src, location.href).origin;

  // ---- taal --------------------------------------------------------------
  var langAttr = script.getAttribute("data-lang") || "auto";
  var lang =
    langAttr === "nl" || langAttr === "en"
      ? langAttr
      : String(document.documentElement.lang || navigator.language || "")
          .toLowerCase()
          .indexOf("nl") === 0
        ? "nl"
        : "en";
  var text = {
    nl: { label: "Aanvraag", close: "Sluiten", title: "Woningaanvraag" },
    en: { label: "Apply", close: "Close", title: "Rental application" },
  }[lang];
  var label = script.getAttribute("data-label") || text.label;

  // ---- url van het formulier --------------------------------------------
  function formUrl() {
    var q = ["lang=" + lang];
    var rent = script.getAttribute("data-rent");
    var address = script.getAttribute("data-address");
    if (rent) q.push("rent=" + encodeURIComponent(rent));
    if (address) q.push("address=" + encodeURIComponent(address));
    return (
      appOrigin +
      "/embed/aanvraag/" +
      encodeURIComponent(tenant) +
      "/" +
      encodeURIComponent(propertyId) +
      "?" +
      q.join("&")
    );
  }

  // ---- stijl (alles met rfai- prefix zodat het niet botst met de site) ---
  var css =
    ".rfai-btn{font:inherit;cursor:pointer;padding:.65em 1.1em;border-radius:6px;border:1px solid #111;background:" +
    (script.getAttribute("data-color") || "#111") +
    ";color:" +
    (script.getAttribute("data-text-color") || "#fff") +
    "}" +
    ".rfai-btn:focus-visible,.rfai-close:focus-visible{outline:3px solid #2563eb;outline-offset:2px}" +
    ".rfai-overlay{position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center}" +
    ".rfai-panel{position:relative;background:#fff;width:min(580px,calc(100vw - 24px));height:min(92vh,920px);border-radius:12px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.35)}" +
    ".rfai-frame{width:100%;height:100%;border:0;display:block}" +
    ".rfai-close{position:absolute;top:8px;right:8px;z-index:1;width:40px;height:40px;border-radius:50%;border:0;background:#fff;color:#111;font:24px/1 sans-serif;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,.3)}" +
    "@media(max-width:600px){.rfai-panel{width:100vw;height:100dvh;border-radius:0}}";
  var style = document.createElement("style");
  style.setAttribute("data-rentalflowai", "");
  style.textContent = css;
  document.head.appendChild(style);

  // ---- knop --------------------------------------------------------------
  var button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  var extraClass = script.getAttribute("data-class");
  // Met data-class krijgt de knop alleen de klassen van de site (eigen huisstijl).
  button.className = extraClass || "rfai-btn";
  button.addEventListener("click", open);

  var targetSel = script.getAttribute("data-target");
  var target = targetSel ? document.querySelector(targetSel) : null;
  if (target && target.parentNode) {
    target.parentNode.insertBefore(button, target.nextSibling);
  } else if (script.parentNode && script.parentNode !== document.head) {
    script.parentNode.insertBefore(button, script.nextSibling);
  } else {
    document.body.appendChild(button);
  }

  // ---- modal -------------------------------------------------------------
  var overlay = null;
  var frame = null;
  var previousOverflow = "";
  var inerted = [];

  function open() {
    if (overlay) return;

    overlay = document.createElement("div");
    overlay.className = "rfai-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", text.title);

    var panel = document.createElement("div");
    panel.className = "rfai-panel";

    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "rfai-close";
    closeBtn.setAttribute("aria-label", text.close);
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", close);

    frame = document.createElement("iframe");
    frame.className = "rfai-frame";
    frame.title = text.title;
    frame.src = formUrl();

    panel.appendChild(closeBtn);
    panel.appendChild(frame);
    overlay.appendChild(panel);
    overlay.addEventListener("mousedown", function (e) {
      if (e.target === overlay) close();
    });

    // De rest van de pagina onbereikbaar maken voor toetsenbord en screenreader.
    for (var i = 0; i < document.body.children.length; i++) {
      var el = document.body.children[i];
      if (!el.inert && el.tagName !== "SCRIPT" && el.tagName !== "STYLE") {
        el.inert = true;
        inerted.push(el);
      }
    }
    document.body.appendChild(overlay);
    previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.addEventListener("keydown", onKeydown);
    closeBtn.focus();
  }

  function close() {
    if (!overlay) return;
    document.removeEventListener("keydown", onKeydown);
    overlay.remove();
    overlay = null;
    frame = null;
    for (var i = 0; i < inerted.length; i++) inerted[i].inert = false;
    inerted = [];
    document.documentElement.style.overflow = previousOverflow;
    button.focus();
  }

  function onKeydown(e) {
    if (e.key === "Escape") close();
  }

  // ---- berichten van het formulier --------------------------------------
  window.addEventListener("message", function (e) {
    if (e.origin !== appOrigin || !frame || e.source !== frame.contentWindow) return;
    var d = e.data;
    if (!d || d.source !== "rentalflowai") return;
    if (d.type === "close") close();
    if (d.type === "submitted") {
      document.dispatchEvent(
        new CustomEvent("rentalflowai:submitted", {
          detail: { tenant: tenant, propertyId: propertyId },
        }),
      );
    }
  });

  window.RentalFlowAI = { open: open, close: close };
})();
