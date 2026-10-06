import type { PrecheckReason } from "@/lib/schema";
import type { Group, Handling } from "./types";

/** Korte adviezen per reden, in de volgorde waarin ze het meest helpen. */
const ADVICE: Partial<Record<PrecheckReason, string>> = {
  guarantor_required: "Vraag gegevens van de garantsteller op",
  income_too_low: "Controleer het inkomen, vraag recente loonstroken op",
  income_type_not_allowed: "Controleer de inkomstenbron",
  probation_not_allowed: "Controleer het dienstverband, vraag een werkgeversverklaring",
  employment_too_short: "Controleer het dienstverband, vraag een werkgeversverklaring",
  deposit_guarantee_required: "Bespreek de borgstelling",
  residence_permit_required: "Vraag om het verblijfsdocument",
  start_date_out_of_range: "Overleg over de ingangsdatum",
  lease_too_short: "Overleg over de huurperiode",
  student_not_allowed: "Controleer of studenten acceptabel zijn voor deze woning",
  housemates_not_allowed: "Controleer de woonsituatie",
  pets_not_allowed: "Bespreek de huisdieren",
  too_many_occupants: "Bespreek het aantal bewoners",
};

/**
 * De suggestie voor de volgende stap. Bewust vaste regels (geen AI): voorspelbaar en uitlegbaar.
 * Het is een suggestie; de makelaar beslist.
 */
export function nextStep(group: Group, reasons: PrecheckReason[], handling: Handling): string {
  if (handling === "afgerond") return "Afgerond";
  if (handling === "bezichtiging_gepland") return "Bezichtiging staat gepland";

  if (group === "suitable") {
    return handling === "benaderd"
      ? "Wacht op de reactie en plan de bezichtiging"
      : "Neem contact op en plan een bezichtiging";
  }

  if (group === "review") {
    const advice = [...new Set(reasons.map((r) => ADVICE[r]).filter((a): a is string => Boolean(a)))];
    if (advice.length === 0) return "Bekijk de aanvraag en beslis";
    return advice.slice(0, 2).join("; ");
  }

  return "U beslist: er wordt niets automatisch verstuurd";
}
