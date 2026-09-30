// Buat akun Owner pertama di server production (tanpa data demo):
//   npm run create-owner -- --email pemilik@domain.com --name "Nama Pemilik"
// Password sementara dicetak sekali; wajib diganti saat login pertama.
import { DatabaseSync } from "node:sqlite";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { migrate } from "../src/lib/migrate.mjs";

const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
};
const email = arg("email")?.trim().toLowerCase();
const name = arg("name")?.trim() || "Owner";
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Pakai: npm run create-owner -- --email pemilik@domain.com --name "Nama Pemilik"');
  process.exit(1);
}

const dataDir = path.join(process.cwd(), "data");
fs.mkdirSync(path.join(dataDir, "uploads"), { recursive: true });
const db = new DatabaseSync(process.env.DATABASE_PATH ?? path.join(dataDir, "showroom.db"));
migrate(db);

const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
let password = "";
while (!/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
  password = Array.from(crypto.randomBytes(14), (b) => chars[b % chars.length]).join("");
}
const salt = crypto.randomBytes(16).toString("hex");
const hash = `${salt}:${crypto.scryptSync(password, salt, 64).toString("hex")}`;

const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
if (existing) {
  // Email sudah ada → jadikan Owner aktif & reset password (untuk pemulihan bila Owner terkunci)
  db.prepare("UPDATE users SET role = 'owner', active = 1, password_hash = ?, must_change_password = 1, session_version = session_version + 1 WHERE id = ?").run(hash, existing.id);
  console.log(`Akun ${email} dijadikan Owner & password direset.`);
} else {
  db.prepare("INSERT INTO users (name, email, password_hash, role, must_change_password) VALUES (?, ?, ?, 'owner', 1)").run(name, email, hash);
  console.log(`Owner ${name} <${email}> dibuat.`);
}
console.log(`Password sementara: ${password}`);
console.log("Login di /admin/login lalu ganti password. Pesan ini tidak disimpan di mana pun.");
