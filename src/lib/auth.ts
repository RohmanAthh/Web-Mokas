import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { can, type Permission, type Role } from "./roles";

export const SESSION_COOKIE = "gp_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 hari

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s && process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET wajib di-set di production");
  return s ?? "dev-secret-ganti-di-production";
}

function sign(payload: string) {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return expected.length === test.length && crypto.timingSafeEqual(expected, test);
}

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: Role;
  must_change_password: number;
  session_version: number;
};

/** Token: userId.sessionVersion.exp.signature — naikkan session_version untuk mencabut semua sesi user. */
export async function createSession(userId: number, sessionVersion: number) {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  const payload = `${userId}.${sessionVersion}.${exp}`;
  (await cookies()).set(SESSION_COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function currentUser(): Promise<AdminUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [id, ver, exp, sig] = token.split(".");
  if (!id || !ver || !exp || !sig) return null;
  const expected = sign(`${id}.${ver}.${exp}`);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  if (Number(exp) < Date.now() / 1000) return null;
  const user = db
    .prepare("SELECT id, name, email, role, must_change_password, session_version FROM users WHERE id = ? AND active = 1")
    .get(Number(id)) as AdminUser | undefined;
  if (!user || user.session_version !== Number(ver)) return null;
  return user;
}

/**
 * Wajib dipanggil di setiap halaman, route handler & server action admin.
 * - belum login → /admin/login
 * - wajib ganti password → /admin/akun (kecuali halaman akun itu sendiri)
 * - tidak punya izin → dashboard dengan pesan "akses ditolak"
 */
export async function requireUser(perm?: Permission, opts: { allowPasswordChange?: boolean } = {}): Promise<AdminUser> {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  if (user.must_change_password && !opts.allowPasswordChange) redirect("/admin/akun?wajib=1");
  if (perm && !can(user.role, perm)) redirect("/admin?akses=ditolak");
  return user;
}
