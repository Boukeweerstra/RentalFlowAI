"use client";

import { useActionState } from "react";
import { requestPasswordReset, type ResetRequestState } from "./actions";

const fieldCls =
  "mt-1 block w-full min-h-11 rounded-md border border-zinc-500 bg-white px-3 py-2 text-base shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/30";

export default function ResetRequestForm() {
  const [state, action, pending] = useActionState<ResetRequestState, FormData>(requestPasswordReset, {});

  if (state.sent) {
    return (
      <p role="status" className="rounded-md bg-green-50 p-3 text-sm text-green-900">
        Als dit e-mailadres bij ons bekend is, hebben we een e-mail gestuurd met een link om een nieuw
        wachtwoord te kiezen. Kijk ook in uw spam. De link is een uur geldig.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-5" noValidate>
      <div>
        <label htmlFor="email" className="block text-sm font-medium">E-mailadres</label>
        <input id="email" name="email" type="email" autoComplete="username" required className={fieldCls}
          aria-invalid={state.error ? true : undefined} aria-describedby={state.error ? "reset-error" : undefined} />
      </div>
      {state.error && (
        <p id="reset-error" role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">{state.error}</p>
      )}
      <button type="submit" disabled={pending}
        className="min-h-11 w-full rounded-md bg-brand-800 px-4 py-3 font-medium text-white hover:bg-brand-700 disabled:opacity-60">
        {pending ? "Bezig…" : "Stuur herstellink"}
      </button>
    </form>
  );
}
