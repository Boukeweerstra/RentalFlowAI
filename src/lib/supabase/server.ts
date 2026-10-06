import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const supabaseConfigured = (): boolean =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

/**
 * Supabase-client namens de ingelogde gebruiker (sessie uit cookies). Alle queries lopen via de
 * rijafscherming (RLS) van de database: een makelaar ziet alleen zijn eigen kantoor.
 * Maak per verzoek een nieuwe client; bewaar hem niet in een globale variabele.
 */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Aangeroepen vanuit een Server Component: negeren, de proxy ververst de sessie al.
          }
        },
      },
    },
  );
}

export type AuthedUser = { id: string; email: string };

/**
 * De ingelogde gebruiker, of null. Gebruikt getClaims(): dat controleert de handtekening van het token
 * en is dus veilig op de server. getSession() vertrouwen we hier bewust niet.
 */
export async function getAuthedUser(): Promise<AuthedUser | null> {
  if (!supabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;
  return { id: claims.sub, email: typeof claims.email === "string" ? claims.email : "" };
}
