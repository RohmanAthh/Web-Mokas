"use client";

import { useActionState, useState } from "react";
import { Field, FormAlert } from "@/components/forms";
import { ROLES } from "@/lib/roles";
import { createUser, resetUserPassword, type AccountState } from "../../account-actions";

/** Password sementara ditampilkan sekali saja — tidak disimpan dalam bentuk asli. */
function SecretBox({ secret }: { secret: NonNullable<AccountState["secret"]> }) {
  const [copied, setCopied] = useState(false);
  const text = `Login admin: ${typeof window !== "undefined" ? window.location.origin : ""}/admin/login\nEmail: ${secret.email}\nPassword sementara: ${secret.password}\n(Anda akan diminta membuat password baru saat login pertama.)`;
  return (
    <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm">
      <p className="font-semibold text-emerald-900">Password sementara — catat sekarang, tidak akan ditampilkan lagi:</p>
      <p className="mt-2 font-mono text-base select-all">{secret.password}</p>
      <p className="mt-1 text-xs text-emerald-800">Kirimkan secara pribadi ke pengguna. Mereka wajib menggantinya saat login pertama.</p>
      <button
        type="button"
        className="btn-secondary btn-sm mt-3"
        onClick={() => navigator.clipboard.writeText(text).then(() => setCopied(true))}
      >
        {copied ? "Tersalin ✓" : "Salin info login"}
      </button>
    </div>
  );
}

export function CreateUserForm() {
  const [state, action, pending] = useActionState<AccountState, FormData>(createUser, {});
  const e = state.errors ?? {};
  return (
    <div className="space-y-4">
      <form action={action} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
        <Field label="Nama" name="new-name" error={e.name}>
          <input id="new-name" name="name" required className="input" />
        </Field>
        <Field label="Email" name="new-email" error={e.email}>
          <input id="new-email" name="email" type="email" required className="input" />
        </Field>
        <Field label="Peran" name="new-role" error={e.role}>
          <select id="new-role" name="role" defaultValue="sales" className="input">
            {Object.entries(ROLES).map(([k, r]) => <option key={k} value={k}>{r.label}</option>)}
          </select>
        </Field>
        <button className="btn-primary" disabled={pending}>{pending ? "Menambah..." : "Tambah"}</button>
      </form>
      {!state.secret && <FormAlert state={state} />}
      {state.secret && (
        <>
          <FormAlert state={state} />
          <SecretBox secret={state.secret} />
        </>
      )}
    </div>
  );
}

export function ResetPasswordButton({ id, name }: { id: number; name: string }) {
  const [state, action, pending] = useActionState<AccountState, FormData>(resetUserPassword, {});
  return (
    <div>
      <form
        action={action}
        onSubmit={(ev) => {
          if (!confirm(`Reset password ${name}? Semua sesinya akan dikeluarkan.`)) ev.preventDefault();
        }}
      >
        <input type="hidden" name="id" value={id} />
        <button className="text-xs font-medium text-brand-600 hover:underline" disabled={pending}>Reset password</button>
      </form>
      {state.secret && <div className="mt-2"><SecretBox secret={state.secret} /></div>}
      {!state.ok && state.message && <p className="mt-1 text-xs text-red-600">{state.message}</p>}
    </div>
  );
}
