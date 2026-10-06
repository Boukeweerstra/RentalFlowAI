import { SUMMARY_PROMPT_VERSION, buildSummaryRequest, parseSummary, type SummaryContent } from "./summary";
import type { AiProvider } from "./types";

export type AiOutputRow = {
  application_id: string;
  organization_id: string;
  kind: "summary";
  status: "ok" | "error";
  content: SummaryContent | null;
  model: string;
  prompt_version: string;
  input_tokens: number | null;
  output_tokens: number | null;
  error_code: string | null;
};

export type SummaryDeps = {
  provider: AiProvider | null;
  /** Telt één aanroep mee op het dagplafond; false = plafond bereikt. */
  claimBudget: () => Promise<boolean>;
  /** Slaat een resultaat op. Een dubbel resultaat (zelfde aanvraag en promptversie) is geen fout. */
  save: (row: AiOutputRow) => Promise<void>;
};

export type SummaryOutcome = "off" | "skipped" | "limit" | "ok" | "error";

/**
 * Maakt de samenvatting van de toelichting, zonder ooit de aanvraag zelf te raken: fouten van de AI worden alleen
 * als regel met een korte foutcode vastgelegd. Roep dit NA het opslaan aan en buiten het formulierantwoord.
 */
export async function runSummary(
  input: { applicationId: string; organizationId: string; motivation: string | undefined; applicantName: string },
  deps: SummaryDeps,
): Promise<SummaryOutcome> {
  if (!deps.provider) return "off";
  const request = input.motivation ? buildSummaryRequest(input.motivation, input.applicantName) : null;
  if (!request) return "skipped";
  if (!(await deps.claimBudget())) return "limit";

  const base = { application_id: input.applicationId, organization_id: input.organizationId, kind: "summary" as const, prompt_version: SUMMARY_PROMPT_VERSION };
  const result = await deps.provider.completeJson(request);

  if (!result.ok) {
    await deps.save({ ...base, status: "error", content: null, model: result.model, input_tokens: null, output_tokens: null, error_code: result.code });
    return "error";
  }
  const parsed = parseSummary(result.text);
  if (!parsed.ok) {
    await deps.save({
      ...base, status: "error", content: null, model: result.model,
      input_tokens: result.usage.inputTokens, output_tokens: result.usage.outputTokens, error_code: parsed.code,
    });
    return "error";
  }
  await deps.save({
    ...base, status: "ok", content: parsed.content, model: result.model,
    input_tokens: result.usage.inputTokens, output_tokens: result.usage.outputTokens, error_code: null,
  });
  return "ok";
}
