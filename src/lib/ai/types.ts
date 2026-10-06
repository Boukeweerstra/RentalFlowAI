/**
 * Eén vaste vorm voor elke AI-aanbieder. De rest van de app kent alleen deze interface, zodat wisselen van aanbieder
 * (OpenAI, Gemini, nepaanbieder voor tests) één instelling is.
 */
export type AiRequest = {
  system: string;
  user: string;
  /** Maximum aantal tokens in het antwoord (kostenbeheersing). */
  maxOutputTokens: number;
  /** Harde grens op de wachttijd; daarna telt het als fout en gaat de aanvraag gewoon door. */
  timeoutMs: number;
};

export type AiUsage = { inputTokens: number | null; outputTokens: number | null };

export type AiResult =
  | { ok: true; text: string; model: string; usage: AiUsage }
  /** `code` bevat nooit invoer of uitvoer, alleen een korte categorie (bijv. "http_429", "timeout"). */
  | { ok: false; code: string; model: string };

export interface AiProvider {
  readonly name: string;
  readonly model: string;
  /** Vraagt om één JSON-object als antwoord (als tekst; het valideren doet de aanroeper). */
  completeJson(req: AiRequest): Promise<AiResult>;
}
