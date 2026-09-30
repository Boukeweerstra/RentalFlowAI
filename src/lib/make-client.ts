import "server-only";
import type { MakePayload } from "@/lib/make-payload";

/**
 * Verstuurt een aanvraag naar het Make.com-scenario.
 *
 * Deze module is server-only: de webhook-URL en `MAKE_WEBHOOK_SECRET` staan in
 * omgevingsvariabelen zonder NEXT_PUBLIC_-prefix en mogen nooit naar de browser.
 * Wordt dit bestand per ongeluk in een client-component geïmporteerd, dan faalt de build.
 */
export type DeliveryResult =
  | { ok: true; mode: "make" | "dev-log" }
  | { ok: false; reason: "not_configured" | "delivery_failed" };

export async function deliverToMake(payload: MakePayload): Promise<DeliveryResult> {
  const url = process.env.MAKE_WEBHOOK_URL;

  if (!url) {
    if (process.env.NODE_ENV === "production") {
      console.error("MAKE_WEBHOOK_URL ontbreekt");
      return { ok: false, reason: "not_configured" };
    }
    // Lokaal testen zonder Make.com: alleen mokdata, dus loggen is veilig.
    console.log("[dev] aanvraag (geen MAKE_WEBHOOK_URL):\n", payload.mail.notify.body);
    return { ok: true, mode: "dev-log" };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        // Make's ingebouwde "API Key authentication" van de webhook controleert deze header.
        "x-make-apikey": process.env.MAKE_WEBHOOK_SECRET ?? "",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error("Make.com webhook gaf status", res.status);
      return { ok: false, reason: "delivery_failed" };
    }
    return { ok: true, mode: "make" };
  } catch (err) {
    // Alleen de foutnaam loggen: de fout kan de URL bevatten.
    console.error("Make.com webhook fout", (err as Error).name);
    return { ok: false, reason: "delivery_failed" };
  }
}
