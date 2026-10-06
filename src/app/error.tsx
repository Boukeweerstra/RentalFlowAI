"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    // Alleen de referentie loggen, geen gegevens van aanvragers.
    console.error("[app] fout", error.digest ?? "");
  }, [error]);

  return (
    <main lang="nl" className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Er is iets misgegaan</h1>
      <p role="alert" className="mt-2 text-zinc-700">
        Dit ligt niet aan jou. Probeer het opnieuw. Lukt het nog steeds niet, wacht dan even en probeer het later nog eens.
        {error.digest && <span className="mt-2 block text-xs text-zinc-600">Referentie: {error.digest}</span>}
      </p>
      <p className="mt-6">
        <button type="button" onClick={() => retry()}
          className="min-h-11 rounded-md bg-brand-800 px-4 py-3 font-medium text-white hover:bg-brand-700">
          Opnieuw proberen
        </button>
      </p>
    </main>
  );
}
