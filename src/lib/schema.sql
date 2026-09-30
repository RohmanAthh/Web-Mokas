-- Skema database showroom. Dijalankan oleh src/lib/migrate.mjs (dipakai db.ts & scripts/seed.mjs).
-- Kolom yang ditambahkan belakangan juga didaftarkan di migrate.mjs agar DB lama ikut ter-update.
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'owner',       -- owner | sales | stok (lihat src/lib/roles.ts)
  active INTEGER NOT NULL DEFAULT 1,
  must_change_password INTEGER NOT NULL DEFAULT 0,
  session_version INTEGER NOT NULL DEFAULT 1, -- naik saat ganti password/nonaktif → sesi lama tidak berlaku
  last_login_at TEXT,
  password_changed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cars (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  variant TEXT NOT NULL DEFAULT '',
  year INTEGER NOT NULL,
  price INTEGER NOT NULL,            -- Rupiah
  mileage INTEGER NOT NULL,          -- km
  transmission TEXT NOT NULL,        -- Manual | Otomatis
  fuel TEXT NOT NULL,                -- Bensin | Diesel | Hybrid | Listrik
  body_type TEXT NOT NULL,           -- MPV | SUV | Sedan | Hatchback | Pickup
  color TEXT NOT NULL DEFAULT '',
  engine_cc INTEGER NOT NULL DEFAULT 0,
  seats INTEGER NOT NULL DEFAULT 5,
  plate TEXT NOT NULL DEFAULT '',    -- wilayah plat, mis. "B (Jakarta)"
  tax_until TEXT,                    -- YYYY-MM-DD
  description TEXT NOT NULL DEFAULT '',
  features TEXT NOT NULL DEFAULT '[]', -- JSON array of string
  status TEXT NOT NULL DEFAULT 'available', -- available | booked | sold
  featured INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  previous_price INTEGER,            -- harga sebelum turun (untuk label "Turun harga")
  price_changed_at TEXT,
  purchase_price INTEGER,            -- harga modal (hanya admin)
  recon_cost INTEGER NOT NULL DEFAULT 0, -- biaya rekondisi (hanya admin)
  sold_price INTEGER,
  sold_at TEXT,
  inspection TEXT NOT NULL DEFAULT '{}', -- JSON laporan inspeksi, lihat src/lib/inspection.ts
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS cars_status_idx ON cars(status);
CREATE INDEX IF NOT EXISTS cars_brand_idx ON cars(brand);

CREATE TABLE IF NOT EXISTS car_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  car_id INTEGER NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  path TEXT NOT NULL,                -- nama file di data/uploads
  sort INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS car_images_car_idx ON car_images(car_id);

CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  car_id INTEGER REFERENCES cars(id) ON DELETE SET NULL,
  type TEXT NOT NULL,                -- inquiry | test_drive | sell | credit
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  preferred_date TEXT,
  preferred_time TEXT,               -- slot test drive "HH:MM"
  follow_up_at TEXT,                 -- jadwal follow-up berikutnya (YYYY-MM-DD)
  consent_at TEXT,                   -- waktu pengunjung menyetujui kebijakan privasi
  anonymized_at TEXT,                -- data pribadi dihapus (retensi UU PDP)
  data TEXT NOT NULL DEFAULT '{}',   -- JSON detail tambahan (mobil yang dijual, simulasi kredit)
  status TEXT NOT NULL DEFAULT 'new', -- new | contacted | negotiating | won | lost
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS leads_status_idx ON leads(status);

CREATE TABLE IF NOT EXISTS lead_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  author TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS lead_notes_lead_idx ON lead_notes(lead_id);
