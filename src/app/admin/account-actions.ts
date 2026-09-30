"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, destroySession, hashPassword, requireUser, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { passwordProblem, tempPassword } from "@/lib/password";
import { isRole, ROLES } from "@/lib/roles";

export type AccountState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
  /** Password sementara yang harus diserahkan ke pengguna (ditampilkan sekali). */
  secret?: { email: string; password: string };
};

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

// ---------- Akun sendiri ----------

export async function changePassword(_prev: AccountState, fd: FormData): Promise<AccountState> {
  const user = await requireUser(undefined, { allowPasswordChange: true });
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("password") ?? "");
  const confirm = String(fd.get("confirm") ?? "");
  const row = db.prepare("SELECT password_hash FROM users WHERE id = ?").get(user.id) as { password_hash: string };

  const errors: Record<string, string> = {};
  if (!verifyPassword(current, row.password_hash)) errors.current = "Password saat ini salah.";
  const problem = passwordProblem(next, user);
  if (problem) errors.password = problem;
  else if (next === current) errors.password = "Password baru harus berbeda dari yang lama.";
  if (next !== confirm) errors.confirm = "Konfirmasi tidak sama.";
  if (Object.keys(errors).length) return { ok: false, message: "Periksa kembali isian Anda.", errors };

  const wasForced = !!user.must_change_password;
  const version = user.session_version + 1; // keluarkan sesi di perangkat lain
  db.prepare(
    `UPDATE users SET password_hash = ?, must_change_password = 0, session_version = ?, password_changed_at = datetime('now')
     WHERE id = ?`,
  ).run(hashPassword(next), version, user.id);
  await createSession(user.id, version);
  if (wasForced) redirect("/admin?selamat=1");
  return { ok: true, message: "Password berhasil diganti. Sesi di perangkat lain sudah dikeluarkan." };
}

export async function updateProfile(_prev: AccountState, fd: FormData): Promise<AccountState> {
  const user = await requireUser(undefined, { allowPasswordChange: true });
  const name = str(fd, "name");
  if (name.length < 2 || name.length > 60) return { ok: false, errors: { name: "Nama 2–60 karakter." } };
  db.prepare("UPDATE users SET name = ? WHERE id = ?").run(name, user.id);
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Profil tersimpan." };
}

export async function logoutEverywhere() {
  const user = await requireUser(undefined, { allowPasswordChange: true });
  db.prepare("UPDATE users SET session_version = session_version + 1 WHERE id = ?").run(user.id);
  await destroySession();
  redirect("/admin/login");
}

// ---------- Manajemen pengguna (Owner) ----------

type UserRow = { id: number; role: string; active: number };

/** Minimal harus tersisa satu Owner aktif. */
function wouldRemoveLastOwner(target: UserRow, change: { role?: string; active?: number; delete?: boolean }) {
  if (target.role !== "owner" || !target.active) return false;
  const stillOwner = !change.delete && (change.role ?? target.role) === "owner" && (change.active ?? target.active) === 1;
  if (stillOwner) return false;
  const others = (db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'owner' AND active = 1 AND id != ?").get(target.id) as { n: number }).n;
  return others === 0;
}

function targetUser(fd: FormData) {
  return db.prepare("SELECT id, role, active FROM users WHERE id = ?").get(Number(fd.get("id"))) as UserRow | undefined;
}

const newUserSchema = z.object({
  name: z.string().trim().min(2, "Nama wajib diisi").max(60),
  email: z.email("Email tidak valid").transform((e) => e.toLowerCase()),
  role: z.string().refine(isRole, "Pilih peran"),
});

export async function createUser(_prev: AccountState, fd: FormData): Promise<AccountState> {
  await requireUser("users");
  const parsed = newUserSchema.safeParse({ name: str(fd, "name"), email: str(fd, "email"), role: str(fd, "role") });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message;
    return { ok: false, message: "Periksa kembali isian.", errors };
  }
  const { name, email, role } = parsed.data;
  if (db.prepare("SELECT 1 FROM users WHERE email = ?").get(email)) {
    return { ok: false, message: "Periksa kembali isian.", errors: { email: "Email sudah terdaftar." } };
  }
  const password = tempPassword();
  db.prepare("INSERT INTO users (name, email, password_hash, role, must_change_password) VALUES (?, ?, ?, ?, 1)").run(
    name, email, hashPassword(password), role,
  );
  revalidatePath("/admin/pengguna");
  return { ok: true, message: `${name} ditambahkan sebagai ${ROLES[role as keyof typeof ROLES].label}.`, secret: { email, password } };
}

export async function resetUserPassword(_prev: AccountState, fd: FormData): Promise<AccountState> {
  const me = await requireUser("users");
  const t = targetUser(fd);
  if (!t) return { ok: false, message: "Pengguna tidak ditemukan." };
  if (t.id === me.id) return { ok: false, message: "Untuk akun sendiri, gunakan halaman Akun Saya." };
  const password = tempPassword();
  db.prepare("UPDATE users SET password_hash = ?, must_change_password = 1, session_version = session_version + 1 WHERE id = ?").run(
    hashPassword(password), t.id,
  );
  const email = (db.prepare("SELECT email FROM users WHERE id = ?").get(t.id) as { email: string }).email;
  revalidatePath("/admin/pengguna");
  return { ok: true, message: "Password direset. Semua sesi pengguna ini sudah dikeluarkan.", secret: { email, password } };
}

export async function setUserRole(fd: FormData) {
  const me = await requireUser("users");
  const t = targetUser(fd);
  const role = str(fd, "role");
  if (!t || !isRole(role) || t.id === me.id) return;
  if (wouldRemoveLastOwner(t, { role })) return;
  db.prepare("UPDATE users SET role = ?, session_version = session_version + 1 WHERE id = ?").run(role, t.id);
  revalidatePath("/admin/pengguna");
}

export async function setUserActive(fd: FormData) {
  const me = await requireUser("users");
  const t = targetUser(fd);
  const active = str(fd, "active") === "1" ? 1 : 0;
  if (!t || t.id === me.id) return;
  if (wouldRemoveLastOwner(t, { active })) return;
  // Nonaktif → sesi langsung dicabut
  db.prepare("UPDATE users SET active = ?, session_version = session_version + 1 WHERE id = ?").run(active, t.id);
  revalidatePath("/admin/pengguna");
}

export async function deleteUser(fd: FormData) {
  const me = await requireUser("users");
  const t = targetUser(fd);
  if (!t || t.id === me.id || wouldRemoveLastOwner(t, { delete: true })) return;
  db.prepare("DELETE FROM users WHERE id = ?").run(t.id);
  revalidatePath("/admin/pengguna");
}

// ---------- Backup (Owner) ----------

export async function runBackupNow(): Promise<AccountState> {
  await requireUser("backup");
  const { dailyMaintenance } = await import("@/lib/backup");
  try {
    const r = dailyMaintenance();
    revalidatePath("/admin/backup");
    return { ok: true, message: `Backup ${r.file} dibuat (${Math.round(r.size / 1024)} KB, ${r.photos} foto baru disalin).` };
  } catch (err) {
    console.error("[backup] gagal:", err);
    return { ok: false, message: "Backup gagal. Periksa ruang disk dan izin folder backup (lihat log server)." };
  }
}
