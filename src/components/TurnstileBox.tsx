"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

const SCRIPT_ID = "cf-turnstile-script";

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.turnstile) return resolve();
    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      document.head.appendChild(script);
    }
    script.addEventListener("load", () => resolve());
    script.addEventListener("error", () => reject(new Error("turnstile script")));
  });
}

type Props = {
  siteKey: string;
  lang: string;
  /** Verhoog dit getal om het vakje opnieuw te laten controleren (een token is eenmalig). */
  resetKey: number;
  /** Ontvangt het token, of "" als het verlopen of mislukt is. Moet een stabiele functie zijn. */
  onToken: (token: string) => void;
  /** Wordt aangeroepen als het script of de controle niet geladen kan worden. */
  onError: () => void;
};

/** Cloudflare Turnstile-vakje (botcontrole). Alleen gerenderd als er een site key is. */
export default function TurnstileBox({ siteKey, lang, resetKey, onToken, onError }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetId.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          language: lang,
          theme: "light",
          callback: (token: string) => onToken(token),
          "expired-callback": () => onToken(""),
          "error-callback": () => {
            onToken("");
            onError();
          },
        });
      })
      .catch(() => onError());
    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = undefined;
    };
  }, [siteKey, lang, onToken, onError]);

  useEffect(() => {
    if (resetKey > 0 && widgetId.current && window.turnstile) {
      window.turnstile.reset(widgetId.current);
    }
  }, [resetKey]);

  return <div ref={containerRef} className="min-h-[65px]" />;
}
