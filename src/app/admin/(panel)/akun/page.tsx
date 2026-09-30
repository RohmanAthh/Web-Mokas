import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { tanggal } from "@/lib/format";
import { ROLES } from "@/lib/roles";
import { logoutEverywhere } from "../../account-actions";
import { ConfirmButton } from "../ConfirmButton";
import { PasswordForm, ProfileForm } from "./AccountForms";

export const metadata: Metadata = { title: "Akun Saya" };

export default async function AccountPage() {
  const user = await requireUser(undefined, { allowPasswordChange: true });
  const info = db.prepare("SELECT last_login_at, password_changed_at, created_at FROM users WHERE id = ?").get(user.id) as {
    last_login_at: string | null;
    password_changed_at: string | null;
    created_at: string;
  };
  const forced = !!user.must_change_password;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Akun saya</h1>
        <p className="text-sm text-slate-500">{user.email} · {ROLES[user.role].label}</p>
      </div>

      {forced && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Ganti password dulu sebelum melanjutkan.</p>
          <p className="mt-1">Akun ini masih memakai password sementara/default. Demi keamanan data pembeli, buat password baru yang hanya Anda ketahui.</p>
        </div>
      )}

      <section className="card p-6">
        <h2 className="mb-4 font-semibold">Ganti password</h2>
        <PasswordForm forced={forced} />
      </section>

      {!forced && (
        <>
          <section className="card p-6">
            <h2 className="mb-4 font-semibold">Profil</h2>
            <ProfileForm name={user.name} />
          </section>

          <section className="card p-6">
            <h2 className="font-semibold">Keamanan sesi</h2>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div><dt className="text-slate-500">Login terakhir</dt><dd>{tanggal(info.last_login_at)}</dd></div>
              <div><dt className="text-slate-500">Password diganti</dt><dd>{info.password_changed_at ? tanggal(info.password_changed_at) : "Belum pernah"}</dd></div>
            </dl>
            <form action={logoutEverywhere} className="mt-4">
              <ConfirmButton message="Keluar dari semua perangkat, termasuk perangkat ini?" className="btn-secondary">
                Keluar dari semua perangkat
              </ConfirmButton>
            </form>
            <p className="mt-2 text-xs text-slate-500">Gunakan bila HP/laptop hilang atau Anda login di komputer orang lain.</p>
          </section>
        </>
      )}
    </div>
  );
}
