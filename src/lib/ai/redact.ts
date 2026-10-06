/**
 * Haalt herkenbare persoonsgegevens uit de tekst voordat die naar een AI-aanbieder gaat.
 * Dit is een vangnet, geen garantie: een naam of adres dat we niet kennen kan er nog in staan.
 * De naam van de aanvrager zelf kennen we wel en wordt altijd weggehaald.
 *
 * Volgorde is belangrijk: eerst e-mail, links, rekeningen en nummers (die kunnen de naam bevatten, zoals jan@voorbeeld.nl),
 * daarna de naam zelf.
 */
export function redactForAi(text: string, applicantName: string): string {
  let out = text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[e-mail]")
    .replace(/https?:\/\/\S+/gi, "[link]")
    .replace(/\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}(?:[A-Z0-9]?){0,16}\b/gi, "[rekening]")
    .replace(/(?:\+|00)?\d[\d\s().-]{7,}\d/g, "[nummer]");

  // Naamdelen van de aanvrager (minstens 3 tekens, hoofdletterongevoelig, hele woorden).
  const parts = applicantName
    .split(/\s+/)
    .map((p) => p.replace(/[^\p{L}'-]/gu, ""))
    .filter((p) => p.length >= 3);
  for (const part of parts) {
    const escaped = part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(`(?<![\\p{L}])${escaped}(?![\\p{L}])`, "giu"), "[naam]");
  }
  return out;
}
