"use client";

import type { FormState } from "@/app/actions";
import { Icon } from "./Icon";

export function Field({
  label,
  name,
  error,
  children,
  hint,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={name} className="label">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

export function FormAlert({ state }: { state: FormState }) {
  if (!state.message) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm ${state.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}
    >
      {state.ok && <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0" />}
      {state.message}
    </div>
  );
}

/** Field tersembunyi untuk menjebak bot spam. */
export function Honeypot() {
  return <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />;
}
