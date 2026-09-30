import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { configProvider } from "@/lib/config";

/**
 * Zet per tenant `frame-ancestors`, zodat het formulier alleen in een iframe
 * op de toegestane makelaarsdomeinen geladen kan worden (tegen clickjacking).
 * Onbekende tenant = nergens embedbaar.
 */
export async function proxy(request: NextRequest) {
  const segments = request.nextUrl.pathname.split("/").filter(Boolean);
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
  matcher: "/embed/:path*",
};
