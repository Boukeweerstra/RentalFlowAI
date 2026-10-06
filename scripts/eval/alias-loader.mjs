// Laat Node de "@/..."-paden en de extensieloze relatieve imports van de app begrijpen,
// zodat scripts de echte code (regelmotor, AI-laag) kunnen draaien zonder Next.
// Gebruik: node --experimental-strip-types --import ./scripts/eval/register.mjs <script>
import { pathToFileURL, fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../../src");

function withExtension(base) {
  for (const candidate of [`${base}.ts`, `${base}.tsx`, path.join(base, "index.ts")]) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const found = withExtension(path.join(root, specifier.slice(2)));
    if (found) return nextResolve(pathToFileURL(found).href, context);
  }
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && !path.extname(specifier) && context.parentURL?.startsWith("file:")) {
    const found = withExtension(path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier));
    if (found) return nextResolve(pathToFileURL(found).href, context);
  }
  return nextResolve(specifier, context);
}
