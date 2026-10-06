import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Beveiligingsheaders voor /login en /dashboard: nooit in een iframe, nooit in een cache.
 * (Het formulier voor woningzoekers wordt juist wel ingesloten; dat regelt de proxy apart.)
 */
function secure(res: NextResponse): NextResponse {
  res.headers.set("Content-Security-Policy", "frame-ancestors 'none'");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("Referrer-Policy", "same-origin");
  res.headers.set("X-Content-Type-Options", "nosniff");
  return res;
}

/**
 * Ververst de sessie van de makelaar en stuurt niet-ingelogde bezoekers van /dashboard naar /login.
 * Let op: dit is een eerste hek. Elke pagina en serveractie controleert de gebruiker nog zelf,
 * en de database dwingt de rijafscherming af.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const path = request.nextUrl.pathname;

  // Alleen lokaal: een voorbeeldpagina met verzonnen gegevens, zonder inlog (in productie bestaat die niet).
  const isPreview = process.env.NODE_ENV !== "production" && path.startsWith("/dashboard/preview");

  let response = NextResponse.next({ request });
  if (!url || !key) {
    // Geen Supabase ingesteld: geen toegang tot het dashboard.
    if (path.startsWith("/dashboard") && !isPreview) {
      return secure(NextResponse.redirect(new URL("/login", request.url)));
    }
    return secure(response);
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  // Tussen createServerClient en getClaims geen andere code: dat geeft willekeurig uitloggen.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);

  const redirectTo = (to: string) => {
    const res = NextResponse.redirect(new URL(to, request.url));
    // Door Supabase vernieuwde cookies meenemen.
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    return secure(res);
  };

  if (!signedIn && path.startsWith("/dashboard") && !isPreview) return redirectTo("/login");
  if (signedIn && path === "/login") return redirectTo("/dashboard");

  return secure(response);
}
