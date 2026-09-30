"use client";

import { useActionState } from "react";
import { Field, FormAlert } from "@/components/forms";
import { PASSWORD_RULE } from "@/lib/password";
import { changePassword, updateProfile, type AccountState } from "../../account-actions";

export function PasswordForm({ forced }: { forced: boolean }) {
  const [state, action, pending] = useActionState<AccountState, FormData>(changePassword, {});
  const e = state.errors ?? {};
  return (
    <form action={action} className="space-y-4">
      <Field label={forced ? "Password sementara / saat ini" : "Password saat ini"} name="current" error={e.current}>
        <input id="current" name="current" type="password" required autoComplete="current-password" className="input" />
      </Field>
      <Field label="Password baru" name="password" error={e.password} hint={PASSWORD_RULE}>
        <input id="password" name="password" type="password" required minLength={10} autoComplete="new-password" className="input" />
      </Field>
      <Field label="Ulangi password baru" name="confirm" error={e.confirm}>
        <input id="confirm" name="confirm" type="password" required autoComplete="new-password" className="input" />
      </Field>
      <FormAlert state={state} />
      <button className="btn-primary" disabled={pending}>{pending ? "Menyimpan..." : "Ganti password"}</button>
    </form>
  );
}

export function ProfileForm({ name }: { name: string }) {
  const [state, action, pending] = useActionState<AccountState, FormData>(updateProfile, {});
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="min-w-60 flex-1">
        <Field label="Nama tampilan" name="name" error={state.errors?.name}>
          <input id="name" name="name" defaultValue={name} required className="input" />
        </Field>
      </div>
      <button className="btn-secondary" disabled={pending}>Simpan</button>
      <div className="basis-full"><FormAlert state={state} /></div>
    </form>
  );
}
