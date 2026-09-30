import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { tanggal } from "@/lib/format";
import { ROLES, type Role } from "@/lib/roles";
import { deleteUser, setUserActive, setUserRole } from "../../account-actions";
import { ConfirmButton } from "../ConfirmButton";
import { CreateUserForm, ResetPasswordButton } from "./UserForms";

export const metadata: Metadata = { title: "Pengguna" };

type Row = { id: number; name: string; email: string; role: Role; active: number; must_change_password: number; last_login_at: string | null };

export default async function UsersPage() {
  const me = await requireUser("users");
  const users = db
    .prepare("SELECT id, name, email, role, active, must_change_password, last_login_at FROM users ORDER BY active DESC, role, name")
    .all() as Row[];

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengguna</h1>
        <p className="text-sm text-slate-500">Beri tiap staf akun sendiri — jangan berbagi satu password.</p>
      </div>

      <section className="card p-6">
        <h2 className="mb-4 font-semibold">Tambah pengguna</h2>
        <CreateUserForm />
      </section>

      <section className="card overflow-x-auto">
        <table className="data-table">
          <thead><tr><th>Nama</th><th>Peran</th><th>Status</th><th>Login terakhir</th><th /></tr></thead>
          <tbody>
            {users.map((u) => {
              const self = u.id === me.id;
              return (
                <tr key={u.id} className={u.active ? "" : "opacity-60"}>
                  <td>
                    <p className="font-medium">{u.name} {self && <span className="badge ml-1 bg-brand-50 text-brand-700">Anda</span>}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </td>
                  <td>
                    {self ? (
                      <span className="text-sm">{ROLES[u.role].label}</span>
                    ) : (
                      <form action={setUserRole} className="flex items-center gap-1">
                        <input type="hidden" name="id" value={u.id} />
                        <select name="role" defaultValue={u.role} className="input w-auto py-1 text-xs" aria-label={`Peran ${u.name}`}>
                          {Object.entries(ROLES).map(([k, r]) => <option key={k} value={k}>{r.label}</option>)}
                        </select>
                        <button className="text-xs font-medium text-brand-600 hover:underline">Simpan</button>
                      </form>
                    )}
                  </td>
                  <td>
                    {!u.active ? (
                      <span className="badge bg-slate-200 text-slate-600">Nonaktif</span>
                    ) : u.must_change_password ? (
                      <span className="badge bg-amber-100 text-amber-800">Menunggu ganti password</span>
                    ) : (
                      <span className="badge bg-emerald-100 text-emerald-800">Aktif</span>
                    )}
                  </td>
                  <td className="text-xs whitespace-nowrap text-slate-500">{u.last_login_at ? tanggal(u.last_login_at) : "Belum pernah"}</td>
                  <td className="text-right">
                    {!self && (
                      <div className="flex flex-col items-end gap-1.5">
                        <ResetPasswordButton id={u.id} name={u.name} />
                        <form action={setUserActive}>
                          <input type="hidden" name="id" value={u.id} />
                          <input type="hidden" name="active" value={u.active ? "0" : "1"} />
                          <button className="text-xs font-medium text-slate-600 hover:underline">{u.active ? "Nonaktifkan" : "Aktifkan"}</button>
                        </form>
                        <form action={deleteUser}>
                          <input type="hidden" name="id" value={u.id} />
                          <ConfirmButton message={`Hapus akun ${u.name}? Catatan leads yang dibuatnya tetap tersimpan.`} className="text-xs font-medium text-red-600 hover:underline">Hapus</ConfirmButton>
                        </form>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="card p-6">
        <h2 className="font-semibold">Hak akses per peran</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {Object.entries(ROLES).map(([k, r]) => (
            <li key={k}><span className="font-medium">{r.label}</span> — <span className="text-slate-600">{r.description}</span></li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-slate-500">Mengubah peran atau menonaktifkan akun langsung mengeluarkan sesi pengguna tersebut. Minimal harus ada satu Owner aktif.</p>
      </section>
    </div>
  );
}
