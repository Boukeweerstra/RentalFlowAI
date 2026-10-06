import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { configProvider } from "@/lib/config";
import { updateSession } from "@/lib/supabase/proxy-session";

/**
 * Twee taken:
 *  - /embed/*  : per tenant `frame-ancestors`, zodat het formulier alleen in een iframe op de toegestane
 *                makelaarsdomeinen laadt (tegen clickjacking). Onbekende tenant = nergens embedbaar.
 *  - /login en /dashboard/* : sessie van de makelaar verversen, niet-ingelogden naar /login sturen en deze
 *                pagina's nooit in een iframe of cache toestaan.
 */
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path === "/login" || path.startsWith("/dashboard")) {
    return updateSession(request);
  }

  const segments = path.split("/").filter(Boolean);
  // /embed/aanvraag/[tenant]/[propertyId]
  const tenantId = segments[2];
  const tenant = tenantId ? await configProvider.getTenant(tenantId).catch(() => null) : null;

  const ancestors = tenant
    ? ["'self'", ...tenant.allowedOrigins.map((o) => new URL(o).origin)].join(" ")
    : "'none'";

  const response = NextResponse.next();
  response.headers.set("Content-Security-Policy", `frame-ancestors ${ancestors}`);
  return response;
}

export const config = {
  matcher: ["/embed/:path*", "/login", "/dashboard/:path*"],
};
