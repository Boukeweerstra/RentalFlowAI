/**
 * Maakt van een `next`-waarde (uit de URL of een formulier) een veilige interne bestemming.
 * Alleen paden onder /dashboard zijn toegestaan; alles anders (andere sites, //host, \\host, tekens
 * die de URL kunnen breken) valt terug op /dashboard. Zo kan de inlogpagina niet als open redirect misbruikt worden.
 */
export function safeNext(value: unknown): string {
  const fallback = "/dashboard";
  if (typeof value !== "string" || value.length > 300) return fallback;
  if (!/^\/dashboard(?:[/?][A-Za-z0-9\-._~%=&/?]*)?$/.test(value)) return fallback;
  return value;
}
