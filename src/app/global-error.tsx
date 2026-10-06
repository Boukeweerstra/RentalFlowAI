"use client";

/** Laatste vangnet als zelfs de hoofdindeling faalt. Heeft eigen html/body en geen globale stijlen. */
export default function GlobalError({ retry }: { retry: () => void }) {
  return (
    <html lang="nl">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, padding: "2rem 1rem" }}>
        <main style={{ maxWidth: "28rem", margin: "0 auto" }}>
          <h1 style={{ fontSize: "1.5rem" }}>Er is iets misgegaan</h1>
          <p role="alert" style={{ color: "#3f3f46" }}>Probeer het opnieuw. Lukt het niet, probeer het dan later nog eens.</p>
          <button type="button" onClick={() => retry()}
            style={{ minHeight: "44px", padding: "0.75rem 1rem", background: "#18181b", color: "#fff", border: 0, borderRadius: "6px", fontSize: "1rem" }}>
            Opnieuw proberen
          </button>
        </main>
      </body>
    </html>
  );
}
