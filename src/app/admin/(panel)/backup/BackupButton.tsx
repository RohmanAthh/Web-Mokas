"use client";

import { useActionState } from "react";
import { FormAlert } from "@/components/forms";
import { runBackupNow, type AccountState } from "../../account-actions";

export function BackupButton() {
  const [state, action, pending] = useActionState<AccountState>(runBackupNow, {});
  return (
    <form action={action} className="space-y-3">
      <button className="btn-primary" disabled={pending}>{pending ? "Membuat backup..." : "Backup sekarang"}</button>
      <FormAlert state={state} />
    </form>
  );
}
