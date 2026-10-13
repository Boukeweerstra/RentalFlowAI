import "server-only";
import type { WorkflowPayload } from "@/lib/workflow-payload";

/**
 * Verstuurt een aanvraag naar de workflow die de mails en de Sheet afhandelt (n8n, lokaal of online).
 *
 * Deze module is server-only: de webhook-URL en het geheim staan in omgevingsvariabelen zonder
 * NEXT_PUBLIC_-prefix en mogen nooit naar de browser. Wordt dit bestand per ongeluk in een
 * client-component geïmporteerd, dan faalt de build.
 *
 * Instellingen: `WORKFLOW_WEBHOOK_URL` en `WORKFLOW_WEBHOOK_SECRET`. De oude namen
 * `MAKE_WEBHOOK_URL` en `MAKE_WEBHOOK_SECRET` werken nog, zodat bestaande instellingen blijven kloppen.
 */
export type DeliveryResult =
  | { ok: true; mode: "workflow" | "dev-log" }
  | { ok: false; reason: "not_configured" | "delivery_failed" };

export function webhookSecret(): string {
  return process.env.WORKFLOW_WEBHOOK_SECRET || process.env.MAKE_WEBHOOK_SECRET || "";
}

export async function deliverToWorkflow(payload: WorkflowPayload): Promise<DeliveryResult> {
  const url = process.env.WORKFLOW_WEBHOOK_URL || process.env.MAKE_WEBHOOK_URL;

  if (!url) {
    if (process.env.NODE_ENV === "production") {
      console.error("WORKFLOW_WEBHOOK_URL ontbreekt");
      return { ok: false, reason: "not_configured" };
    }
    // Lokaal testen zonder workflow: alleen mokdata, dus loggen is veilig.
    console.log("[dev] aanvraag (geen WORKFLOW_WEBHOOK_URL):\n", payload.mail.notify.body);
    return { ok: true, mode: "dev-log" };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        // De webhook (n8n: Header Auth) controleert deze header. De naam is blijven staan zodat een
        // bestaande koppeling niet breekt; in n8n heet de header "x-make-apikey".
        "x-make-apikey": webhookSecret(),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error("Workflow-webhook gaf status", res.status);
      return { ok: false, reason: "delivery_failed" };
    }
    return { ok: true, mode: "workflow" };
  } catch (err) {
    // Alleen de foutnaam loggen: de fout kan de URL bevatten.
    console.error("Workflow-webhook fout", (err as Error).name);
    return { ok: false, reason: "delivery_failed" };
  }
}
