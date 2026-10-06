import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { confirmRecovery } from "./actions";

export const metadata: Metadata = { title: "Doorgaan – RentalFlowAI", robots: { index: false } };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Tussenstap: de gebruiker moet zelf op "Doorgaan" klikken, zodat automatische linkscans de code niet verbruiken. */
export default async function ConfirmPage({ searchParams }: PageProps<"/auth/bevestig">) {
  const query = await searchParams;
  const hash = first(query.token_hash);
  if (!hash || first(query.type) !== "recovery") redirect("/login?fout=link");

  return (
    <main lang="nl" className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Nieuw wachtwoord kiezen</h1>
      <p className="mt-1 mb-6 text-sm text-zinc-700">Klik op doorgaan om een nieuw wachtwoord in te stellen.</p>
      <form action={confirmRecovery}>
        <input type="hidden" name="token_hash" value={hash} />
        <button type="submit"
          className="min-h-11 w-full rounded-md bg-zinc-900 px-4 py-3 font-medium text-white hover:bg-zinc-700">
          Doorgaan
        </button>
      </form>
    </main>
  );
}
