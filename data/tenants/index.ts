import demo from "./demo.json";
import rotsvastTest from "./rotsvast-test.json";
import voorbeeldProductie from "./voorbeeld-productie.json";

/**
 * Register van alle tenants (makelaars). Nieuwe tenant = JSON-bestand toevoegen
 * en hier één regel. Statisch geïmporteerd zodat het ook op Vercel en in de
 * proxy werkt (geen runtime-bestandstoegang nodig).
 */
export const tenantFiles: Record<string, unknown> = {
  demo,
  "rotsvast-test": rotsvastTest,
  "voorbeeld-productie": voorbeeldProductie,
};
