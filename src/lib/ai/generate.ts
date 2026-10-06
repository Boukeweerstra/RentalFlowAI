import "server-only";
import { getStore } from "@/lib/abuse/store";
import { adminClient, lookupOrganizationId } from "@/lib/db/applications";
import type { Application } from "@/lib/schema";
import { dailyLimit, getProvider } from "./providers";
import { runSummary, type SummaryOutcome } from "./run";

/**
 * Maakt na het opslaan van een aanvraag (buiten het formulierantwoord) de AI-samenvatting van de toelichting.
 * Faalt nooit naar buiten: de aanvraag is dan al opgeslagen en verstuurd, en de AI is alleen een hulpmiddel.
 * Logt alleen categorieën, nooit tekst van de aanvrager of van de AI.
 */
export async function generateSummaryFor(app: Application): Promise<SummaryOutcome> {
  try {
    const provider = getProvider();
    if (!provider) return "off";
    const db = adminClient();
    const organizationId = await lookupOrganizationId(app.tenantId);
    if (!db || !organizationId) return "off";

    const outcome = await runSummary(
      { applicationId: app.id, organizationId, motivation: app.motivation, applicantName: app.applicant.name },
      {
        provider,
        claimBudget: async () => {
          const day = new Date().toISOString().slice(0, 10);
          const used = await getStore().incr(`ai:day:${day}`, 2 * 24 * 3600);
          return used <= dailyLimit();
        },
        save: async (row) => {
          const { error } = await db.from("ai_outputs").insert(row);
          if (error && error.code !== "23505") console.error("[ai] opslaan mislukt:", error.code);
        },
      },
    );
    if (outcome === "limit") console.warn("[ai] dagplafond bereikt: geen samenvatting gemaakt.");
    if (outcome === "error") console.warn("[ai] samenvatting mislukt (zie foutcode bij het resultaat).");
    return outcome;
  } catch (err) {
    console.error("[ai] onverwachte fout:", (err as Error).name);
    return "error";
  }
}
