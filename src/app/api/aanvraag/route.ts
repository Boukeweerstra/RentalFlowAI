import { NextResponse } from "next/server";
import { configProvider } from "@/lib/config";
import { deliverToMake } from "@/lib/make-client";
import { buildMakePayload } from "@/lib/make-payload";
import { validateApplication } from "@/lib/validate-application";

// Prototype-rate-limiter: geheugen van dit ene serverproces, per IP. Op serverless
// (Vercel) deelt elke instantie zijn eigen teller en is x-forwarded-for te beïnvloeden,
// dus dit is geen echte bescherming. Productie: zie PLAN.md ("Productiegeschikte rate limiting").
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

export async function POST(request: Request) {
  // Alleen same-origin (het formulier draait in onze eigen iframe).
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const ids = raw as {
    tenantId?: unknown;
    propertyId?: unknown;
    hints?: { rent?: unknown; address?: unknown };
  };
  if (typeof ids?.tenantId !== "string" || typeof ids?.propertyId !== "string") {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const rent = typeof ids.hints?.rent === "number" ? ids.hints.rent : undefined;
  const address =
    typeof ids.hints?.address === "string" ? ids.hints.address.slice(0, 200) : undefined;
  const config = await configProvider.getProperty(ids.tenantId, ids.propertyId, {
    rent: rent && rent > 0 && rent <= 100_000 ? rent : undefined,
    address,
  });
  if (!config) {
    return NextResponse.json({ error: "property_not_found" }, { status: 404 });
  }

  // Honeypot: bots krijgen een nep-succes en er wordt niets verstuurd.
  const website = (raw as { website?: unknown }).website;
  if (typeof website === "string" && website.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const result = validateApplication(raw, config);
  if (!result.ok) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  const tenant = await configProvider.getTenant(config.tenantId);
  if (!tenant) {
    return NextResponse.json({ error: "property_not_found" }, { status: 404 });
  }

  const delivery = await deliverToMake(buildMakePayload(result.application, config, tenant));
  if (!delivery.ok) {
    return NextResponse.json(
      { error: delivery.reason },
      { status: delivery.reason === "not_configured" ? 500 : 502 },
    );
  }
  return NextResponse.json({ ok: true, id: result.application.id, mode: delivery.mode });
}
