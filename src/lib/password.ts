// Aturan kekuatan password admin.
const COMMON = new Set([
  "password", "password1", "password123", "12345678", "123456789", "1234567890", "qwerty123", "qwertyuiop",
  "admin123", "administrator", "iloveyou", "sayang123", "bismillah", "indonesia", "11111111", "00000000",
  "garasiprima", "showroom123", "mobilbekas",
]);

export const PASSWORD_RULE = "Minimal 10 karakter, kombinasi huruf dan angka, bukan password umum.";

/** @returns pesan error, atau null bila password cukup kuat */
export function passwordProblem(pw: string, ctx: { email?: string; name?: string } = {}) {
  if (pw.length < 10) return "Password minimal 10 karakter.";
  if (pw.length > 128) return "Password maksimal 128 karakter.";
  if (!/[a-zA-Z]/.test(pw) || !/\d/.test(pw)) return "Gunakan kombinasi huruf dan angka.";
  const lower = pw.toLowerCase();
  if (COMMON.has(lower) || /^(.)\1+$/.test(pw)) return "Password ini terlalu umum, pilih yang lain.";
  const local = ctx.email?.split("@")[0]?.toLowerCase();
  if (local && local.length >= 4 && lower.includes(local)) return "Password tidak boleh memuat email Anda.";
  return null;
}

/** Password sementara acak (tanpa karakter mirip: 0/O, 1/l/I). */
export function tempPassword(length = 14): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += chars[b % chars.length];
  // pastikan ada huruf & angka
  return /\d/.test(out) && /[a-zA-Z]/.test(out) ? out : tempPassword(length);
}
