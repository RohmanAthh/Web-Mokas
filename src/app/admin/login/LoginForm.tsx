"use client";

import { useActionState } from "react";
import { login } from "../actions";
import { FormAlert } from "@/components/forms";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, {});
  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input id="email" name="email" type="email" className="input" required autoComplete="username" />
      </div>
      <div>
        <label htmlFor="password" className="label">Password</label>
        <input id="password" name="password" type="password" className="input" required autoComplete="current-password" />
      </div>
      <FormAlert state={state} />
      <button className="btn-primary w-full" disabled={pending}>{pending ? "Memeriksa..." : "Masuk"}</button>
    </form>
  );
}
