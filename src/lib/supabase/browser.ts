import { createBrowserClient } from "@supabase/ssr";

/** Supabase-client in de browser (alleen voor live bijwerken). Gebruikt de publieke sleutel en de sessie van de gebruiker. */
export function createBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
