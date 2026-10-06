import { NextResponse, type NextRequest } from "next/server";
import { appBaseUrl } from "@/lib/app-url";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

/** Alleen deze interne bestemmingen zijn toegestaan na de link uit de mail (geen open redirect). */
const ALLOWED_NEXT = new Set(["/wachtwoord-nieuw", "/dashboard"]);

/** Ontvangt de link uit de herstelmail: wisselt de eenmalige code om voor een sessie. */
export async function GET(request: NextRequest) {
  const base = appBaseUrl();
  const code = request.nextUrl.searchParams.get("code");
  const next = request.nextUrl.searchParams.get("next") ?? "/dashboard";
  const target = ALLOWED_NEXT.has(next) ? next : "/dashboard";

  if (supabaseConfigured() && code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${base}${target}`);
  }
  return NextResponse.redirect(`${base}/login?fout=link`);
}
