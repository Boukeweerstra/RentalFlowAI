import { NextResponse } from "next/server";
import { clientIp } from "@/lib/abuse/client-ip";
import { createFormToken } from "@/lib/abuse/form-token";
import { limits } from "@/lib/abuse/limits";
import { getStore } from "@/lib/abuse/store";

/**
 * GET /api/form-token?tenantId=..&propertyId=..
 * Geeft een ondertekend formuliertoken (zoals het formulier zelf ook krijgt). Bedoeld voor
 * testscripts (scripts/e2e.mjs). Het token geeft geen extra rechten: de invultijd (minimaal
 * FORM_MIN_SECONDS), Turnstile, de limieten en de dubbele-aanvraagcontrole gelden gewoon.
 */
export async function GET(request: Request) {
  const store = getStore();
  const count = await store.incr(`rl:token:${clientIp(request)}`, limits.ipWindowSeconds);
  if (count > limits.ipMax * 6) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId") ?? "";
  const propertyId = searchParams.get("propertyId") ?? "";
  if (!tenantId || !propertyId || tenantId.length > 64 || propertyId.length > 64) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  return NextResponse.json(
    {
      formToken: createFormToken(tenantId, propertyId),
      minSeconds: limits.formMinSeconds,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
