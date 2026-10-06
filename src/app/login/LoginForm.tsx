"use client";

import { useActionState } from "react";
import { signIn, type LoginState } from "./actions";

const fieldCls =
  "mt-1 block w-full min-h-11 rounded-md border border-zinc-500 bg-white px-3 py-2 text-base shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/30 aria-[invalid=true]:border-red-700";

export default function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, {});

  return (
    <form action={action} className="space-y-5" noValidate>
      <div>
        <label htmlFor="email" className="block text-sm font-medium">E-mailadres</label>
        <input id="email" name="email" type="email" autoComplete="username" required
          className={fieldCls} aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "login-error" : undefined} />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium">Wachtwoord</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required
          className={fieldCls} aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "login-error" : undefined} />
      </div>
      {state.error && (
        <p id="login-error" role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending}
        className="min-h-11 w-full rounded-md bg-zinc-900 px-4 py-3 font-medium text-white hover:bg-zinc-700 disabled:opacity-60">
        {pending ? "Bezig met inloggen…" : "Inloggen"}
      </button>
    </form>
  );
}
