import "server-only";

/**
 * IP-adres van de bezoeker. Op Vercel zet het platform `x-vercel-forwarded-for` / `x-real-ip` zelf
 * en is die niet door de bezoeker te vervalsen; `x-forwarded-for` alleen als terugval (lokaal).
 */
export function ipFromHeaders(h: Pick<Headers, "get">): string {
  return (
    h.get("x-vercel-forwarded-for")?.split(",")[0].trim() ||
    h.get("x-real-ip")?.trim() ||
    h.get("x-forwarded-for")?.split(",")[0].trim() ||
    "unknown"
  );
}

export const clientIp = (request: Request): string => ipFromHeaders(request.headers);
