import { z } from "zod";
import type { PrecheckReason } from "@/lib/schema";
import type { AiRequest } from "./types";

/** Verhoog bij elke inhoudelijke wijziging van de prompt of het schema. */
export const DRAFT_PROMPT_VERSION = "draft-mail-v1";

/**
 * Welke informatie we bij welke reden kunnen opvragen. Alleen redenen waarbij een vraag zin heeft staan hier: een reden als
 * "huisdieren niet toegestaan" is geen ontbrekende informatie, dus daar maken we geen mail voor.
 */
const ASKS_NL: Partial<Record<PrecheckReason, string>> = {
  income_too_low: "recente loonstroken of een werkgeversverklaring waaruit het inkomen blijkt",
  income_type_not_allowed: "meer uitleg en bewijs over de bron van het inkomen",
  probation_not_allowed: "een werkgeversverklaring met de contractduur en of de proeftijd is afgerond",
  // Zelfde tekst als bij proeftijd: één verklaring dekt beide, dus niet dubbel vragen.
  employment_too_short: "een werkgeversverklaring met de contractduur en of de proeftijd is afgerond",
  guarantor_required: "of er een garantsteller beschikbaar is en zo ja, de gegevens daarvan",
  deposit_guarantee_required: "of een borgstelling of waarborgregeling mogelijk is",
  residence_permit_required: "bevestiging dat er een geldige verblijfsvergunning is",
  start_date_out_of_range: "of de gewenste ingangsdatum flexibel is",
  lease_too_short: "of de gewenste huurperiode flexibel is",
};

/** De vragen die uit de redenen volgen, zonder dubbelen. Leeg = geen conceptmail mogelijk. */
export function asksFor(reasons: PrecheckReason[]): string[] {
  return [...new Set(reasons.map((r) => ASKS_NL[r]).filter((a): a is string => Boolean(a)))];
}

export const draftSchema = z.object({
  subject: z.string().trim().min(1).max(120),
  body: z.string().trim().min(20).max(1500),
});
export type DraftContent = z.infer<typeof draftSchema>;

const SYSTEM = `Je schrijft een CONCEPT van een korte, vriendelijke e-mail van een verhuurmakelaar aan een woningzoeker. De makelaar leest, past aan en verstuurt het zelf.
Doel van de mail: de genoemde ontbrekende informatie opvragen, zodat de aanvraag beoordeeld kan worden.

Regels:
- Schrijf in de gevraagde taal ("nl" = Nederlands, "en" = Engels), beleefd en zakelijk, maximaal 150 woorden.
- Begin met de aanhef "Beste [naam]," (Nederlands) of "Dear [naam]," (Engels) en sluit af met de groet en "[naam makelaar]". Gebruik precies deze plaatshouders; verzin geen namen.
- Vraag ALLEEN om de punten onder "Gevraagd". Voeg geen eigen vragen of eisen toe.
- Doe GEEN toezeggingen en geen uitspraak over de uitkomst: niet "geschikt", "afgewezen", "goedgekeurd", niet "u krijgt de woning". Zeg alleen dat de aanvraag verder beoordeeld wordt zodra de informatie binnen is.
- Noem geen bedragen, geen contactgegevens, geen links en geen persoonlijke kenmerken.
- Antwoord uitsluitend met één JSON-object: {"subject": string (max 120 tekens), "body": string (platte tekst met regeleinden)}.`;

/**
 * Bouwt de aanvraag voor de AI. Er gaat GEEN naam, mail of telefoonnummer mee: alleen het adres van de woning,
 * de taal en de punten die opgevraagd worden. De naam wordt pas in het dashboard ingevuld.
 */
export function buildDraftRequest(input: { lang: "nl" | "en"; propertyAddress: string; reasons: PrecheckReason[] }): AiRequest | null {
  const asks = asksFor(input.reasons);
  if (asks.length === 0) return null;
  return {
    system: SYSTEM,
    user: `Taal: ${input.lang}\nWoning: ${input.propertyAddress.slice(0, 120)}\nGevraagd:\n${asks.map((a) => `- ${a}`).join("\n")}`,
    maxOutputTokens: 500,
    timeoutMs: 20_000,
  };
}

const DECISION_OR_PROMISE =
  /\b(afwijz\w*|afgewezen|goedkeur\w*|goedgekeurd|geschikt\w*|ongeschikt\w*|niet\s+geschikt|approved|rejected|suitable|unsuitable|garanderen|gegarandeerd|guarantee[sd]?\s+(?:the|you)|toegewezen|u\s+krijgt\s+de\s+woning|you\s+(?:will|'ll)\s+get\s+the)\b/i;
const SENSITIVE =
  /\b(ziek\w*|handicap\w*|beperking\w*|diagnose\w*|zwanger\w*|geloof|religi\w*|afkomst|nationaliteit\w*|disabilit\w*|pregnan\w*|religio\w*|ethnic\w*)\b/i;
/** Een concept hoort geen contactgegevens, links of lange cijferreeksen te bevatten (verzonnen of overgenomen). */
const FOREIGN_DATA = /@|https?:|www\.|\d{6,}/i;

export type ParsedDraft =
  | { ok: true; content: DraftContent }
  | { ok: false; code: "invalid_json" | "invalid_shape" | "decision_language" | "sensitive" | "foreign_data" };

export function parseDraft(raw: string): ParsedDraft {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { ok: false, code: "invalid_json" };
  }
  const parsed = draftSchema.safeParse(json);
  if (!parsed.success) return { ok: false, code: "invalid_shape" };
  const text = `${parsed.data.subject}\n${parsed.data.body}`;
  if (DECISION_OR_PROMISE.test(text)) return { ok: false, code: "decision_language" };
  if (SENSITIVE.test(text)) return { ok: false, code: "sensitive" };
  if (FOREIGN_DATA.test(text)) return { ok: false, code: "foreign_data" };
  return { ok: true, content: parsed.data };
}

/** Vult de plaatshouder "[naam]" in met de voornaam. De naam bleef bewust uit de AI-aanroep. */
export function fillName(content: DraftContent, firstName: string): DraftContent {
  const name = firstName.trim() || "[naam]";
  return { subject: content.subject.replaceAll("[naam]", name), body: content.body.replaceAll("[naam]", name) };
}
