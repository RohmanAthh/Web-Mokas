// Migrasi database: dipakai oleh src/lib/db.ts (saat app start) dan scripts/seed.mjs.
import fs from "node:fs";
import path from "node:path";

// Kolom yang ditambahkan setelah versi awal — ALTER TABLE jika DB lama belum punya.
const ADDED_COLUMNS = {
  users: {
    role: "TEXT NOT NULL DEFAULT 'owner'",
    active: "INTEGER NOT NULL DEFAULT 1",
    must_change_password: "INTEGER NOT NULL DEFAULT 0",
    session_version: "INTEGER NOT NULL DEFAULT 1",
    last_login_at: "TEXT",
    password_changed_at: "TEXT",
  },
  cars: {
    previous_price: "INTEGER",
    price_changed_at: "TEXT",
    purchase_price: "INTEGER",
    recon_cost: "INTEGER NOT NULL DEFAULT 0",
    sold_price: "INTEGER",
    sold_at: "TEXT",
    inspection: "TEXT NOT NULL DEFAULT '{}'",
  },
  leads: {
    preferred_time: "TEXT",
    follow_up_at: "TEXT",
    consent_at: "TEXT",
    anonymized_at: "TEXT",
  },
};

/** @param {import("node:sqlite").DatabaseSync} db */
export function migrate(db) {
  db.exec(fs.readFileSync(path.join(process.cwd(), "src/lib/schema.sql"), "utf8"));
  for (const [table, cols] of Object.entries(ADDED_COLUMNS)) {
    const existing = new Set(db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name));
    for (const [name, def] of Object.entries(cols)) {
      if (!existing.has(name)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${def}`);
    }
  }
  // Status lama "closed" → "won"
  db.exec("UPDATE leads SET status = 'won' WHERE status = 'closed'");
  // Satu slot test drive per mobil per jam (lead yang batal tidak menahan slot).
  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS leads_slot_uq ON leads(car_id, preferred_date, preferred_time)
           WHERE type = 'test_drive' AND preferred_time IS NOT NULL AND status != 'lost'`);
  db.exec("CREATE INDEX IF NOT EXISTS leads_follow_up_idx ON leads(follow_up_at)");
}
