"use client";

import { useActionState } from "react";
import { setNewPassword, type NewPasswordState } from "./actions";

const fieldCls =
  "mt-1 block w-full min-h-11 rounded-md border border-zinc-500 bg-white px-3 py-2 text-base shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/30";

export default function NewPasswordForm() {
  const [state, action, pending] = useActionState<NewPasswordState, FormData>(setNewPassword, {});
  return (
    <form action={action} className="space-y-5" noValidate>
      <div>
        <label htmlFor="password" className="block text-sm font-medium">Nieuw wachtwoord</label>
        <input id="password" name="password" type="password" autoComplete="new-password" required minLength={10}
          className={fieldCls} aria-describedby="pw-hint" />
        <p id="pw-hint" className="mt-1 text-xs text-zinc-700">Minimaal 10 tekens.</p>
      </div>
      <div>
        <label htmlFor="confirm" className="block text-sm font-medium">Herhaal wachtwoord</label>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" required className={fieldCls} />
      </div>
      {state.error && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">{state.error}</p>
      )}
      <button type="submit" disabled={pending}
        className="min-h-11 w-full rounded-md bg-zinc-900 px-4 py-3 font-medium text-white hover:bg-zinc-700 disabled:opacity-60">
        {pending ? "Bezig…" : "Wachtwoord opslaan"}
      </button>
    </form>
  );
}
