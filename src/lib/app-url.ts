import "server-only";

/** Basisadres van de app (runtime-variabele eerst; NEXT_PUBLIC wordt bij het bouwen vastgelegd). Zonder slash aan het eind. */
export function appBaseUrl(): string {
  const raw = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3100";
  return raw.trim().replace(/\/+$/, "");
}
