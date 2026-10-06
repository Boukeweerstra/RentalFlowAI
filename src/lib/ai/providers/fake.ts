import type { AiProvider, AiRequest, AiResult } from "../types";

/**
 * Nepaanbieder voor tests en demo's: geen netwerk, geen kosten. Geeft een vaste, geldige samenvatting terug.
 * Met `override` kan een test elk antwoord (ook een kwaadaardig of kapot antwoord) nabootsen.
 */
export function createFakeProvider(override?: (req: AiRequest) => AiResult | Promise<AiResult>): AiProvider {
  return {
    name: "fake",
    model: "fake-1",
    async completeJson(req: AiRequest): Promise<AiResult> {
      if (override) return override(req);
      const length = req.user.length;
      return {
        ok: true,
        model: "fake-1",
        text: JSON.stringify({
          summary: `Voorbeeldsamenvatting van een toelichting van ${length} tekens (nepaanbieder, geen echte AI).`,
          points: ["Dit is een testresultaat"],
        }),
        usage: { inputTokens: 0, outputTokens: 0 },
      };
    },
  };
}
