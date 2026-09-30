// Reset & isi database dengan data demo: `npm run seed`
import { DatabaseSync } from "node:sqlite";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { migrate } from "../src/lib/migrate.mjs";

const root = process.cwd();
const dataDir = path.join(root, "data");
const uploadDir = path.join(dataDir, "uploads");
const dbPath = process.env.DATABASE_PATH ?? path.join(dataDir, "showroom.db");

fs.mkdirSync(uploadDir, { recursive: true });

// PENGAMAN: seed MENGHAPUS SEMUA DATA. Tolak bila database sudah berisi akun asli (bukan akun demo).
if (fs.existsSync(dbPath) && !process.argv.includes("--hapus-semua-data")) {
  const check = new DatabaseSync(dbPath);
  let real = [];
  try {
    real = check.prepare("SELECT email FROM users WHERE email NOT LIKE '%@garasiprima.test'").all();
  } catch {}
  check.close();
  if (real.length > 0 || process.env.NODE_ENV === "production") {
    console.error("✋ Dibatalkan: database ini berisi data asli (atau NODE_ENV=production).");
    console.error("   npm run seed akan MENGHAPUS SEMUA mobil, leads, dan pengguna.");
    console.error("   Jika benar-benar ingin: npm run seed -- --hapus-semua-data");
    process.exit(1);
  }
}
for (const f of fs.readdirSync(uploadDir)) fs.rmSync(path.join(uploadDir, f), { force: true });

const db = new DatabaseSync(dbPath);
db.exec("PRAGMA foreign_keys = OFF; DROP TABLE IF EXISTS lead_notes; DROP TABLE IF EXISTS leads; DROP TABLE IF EXISTS car_images; DROP TABLE IF EXISTS cars; DROP TABLE IF EXISTS users; PRAGMA foreign_keys = ON;");
migrate(db);

function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString("hex");
  return `${salt}:${crypto.scryptSync(pw, salt, 64).toString("hex")}`;
}
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// Akun demo — semuanya WAJIB ganti password saat login pertama.
const insertUser = db.prepare("INSERT INTO users (name, email, password_hash, role, must_change_password) VALUES (?, ?, ?, ?, 1)");
insertUser.run("Admin Showroom", "admin@garasiprima.test", hashPassword("password"), "owner");
insertUser.run("Sari (Sales)", "sales@garasiprima.test", hashPassword("password"), "sales");
insertUser.run("Dimas (Stok)", "stok@garasiprima.test", hashPassword("password"), "stok");

// Ilustrasi placeholder (SVG) agar galeri tidak kosong sebelum foto asli diunggah.
const HEX = {
  Putih: "#f1f5f9", Hitam: "#1e293b", Silver: "#94a3b8", "Abu-abu": "#64748b", Merah: "#dc2626",
  Biru: "#2563eb", Coklat: "#92400e", Oranye: "#ea580c", Hijau: "#15803d",
};
const BG = [["#e0f2fe", "#bae6fd"], ["#fef3c7", "#fde68a"], ["#ede9fe", "#ddd6fe"]];
function carSvg(car, variant) {
  const body = HEX[car.color] ?? "#64748b";
  const [bg1, bg2] = BG[variant % BG.length];
  const tall = ["SUV", "MPV", "Pickup"].includes(car.body_type);
  const roofY = tall ? 150 : 175;
  const cabin =
    car.body_type === "Pickup"
      ? `M250 ${roofY + 70} L300 ${roofY} L470 ${roofY} L500 ${roofY + 70} Z`
      : car.body_type === "Sedan"
        ? `M230 ${roofY + 70} L320 ${roofY} L520 ${roofY} L610 ${roofY + 70} Z`
        : `M210 ${roofY + 70} L270 ${roofY} L580 ${roofY} L640 ${roofY + 70} Z`;
  const flip = variant === 1 ? `transform="translate(800,0) scale(-1,1)"` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500">
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg1}"/><stop offset="1" stop-color="${bg2}"/></linearGradient></defs>
<rect width="800" height="500" fill="url(#g)"/>
<rect y="360" width="800" height="140" fill="#cbd5e1" opacity=".55"/>
<ellipse cx="400" cy="372" rx="300" ry="18" fill="#0f172a" opacity=".18"/>
<g ${flip}>
<path d="${cabin}" fill="${body}" stroke="#0f172a" stroke-opacity=".25" stroke-width="3"/>
<path d="${cabin}" fill="#0f172a" opacity=".35" transform="translate(400 ${roofY + 70}) scale(.86) translate(-400 -${roofY + 62})"/>
<rect x="120" y="${roofY + 66}" width="580" height="${tall ? 104 : 88}" rx="34" fill="${body}" stroke="#0f172a" stroke-opacity=".25" stroke-width="3"/>
<rect x="120" y="${roofY + 118}" width="580" height="8" fill="#0f172a" opacity=".12"/>
<rect x="660" y="${roofY + 88}" width="36" height="16" rx="6" fill="#fde047"/>
<rect x="124" y="${roofY + 88}" width="26" height="16" rx="6" fill="#ef4444"/>
<circle cx="245" cy="${tall ? 345 : 335}" r="50" fill="#0f172a"/><circle cx="245" cy="${tall ? 345 : 335}" r="24" fill="#cbd5e1"/>
<circle cx="575" cy="${tall ? 345 : 335}" r="50" fill="#0f172a"/><circle cx="575" cy="${tall ? 345 : 335}" r="24" fill="#cbd5e1"/>
</g>
<text x="400" y="470" text-anchor="middle" font-family="system-ui,sans-serif" font-size="18" fill="#475569">Foto ilustrasi · ${car.brand} ${car.model} ${car.year}</text>
</svg>`;
}

const cars = [
  { brand: "Toyota", model: "Avanza", variant: "1.5 G", year: 2021, price: 198_000_000, mileage: 42_000, transmission: "Otomatis", fuel: "Bensin", body_type: "MPV", color: "Silver", engine_cc: 1496, seats: 7, plate: "B (Jakarta)", featured: 1 },
  { brand: "Toyota", model: "Kijang Innova", variant: "Reborn 2.4 V Diesel", year: 2019, price: 345_000_000, mileage: 78_000, transmission: "Otomatis", fuel: "Diesel", body_type: "MPV", color: "Hitam", engine_cc: 2393, seats: 7, plate: "B (Jakarta)", featured: 1 },
  { brand: "Toyota", model: "Fortuner", variant: "2.4 VRZ 4x2", year: 2020, price: 455_000_000, mileage: 61_000, transmission: "Otomatis", fuel: "Diesel", body_type: "SUV", color: "Putih", engine_cc: 2393, seats: 7, plate: "D (Bandung)", featured: 1 },
  { brand: "Honda", model: "Brio", variant: "RS CVT", year: 2022, price: 178_000_000, mileage: 18_500, transmission: "Otomatis", fuel: "Bensin", body_type: "Hatchback", color: "Oranye", engine_cc: 1199, seats: 5, plate: "B (Tangerang)", featured: 1 },
  { brand: "Honda", model: "HR-V", variant: "1.5 SE", year: 2021, price: 318_000_000, mileage: 35_000, transmission: "Otomatis", fuel: "Bensin", body_type: "SUV", color: "Merah", engine_cc: 1498, seats: 5, plate: "B (Bekasi)" },
  { brand: "Honda", model: "CR-V", variant: "1.5 Turbo Prestige", year: 2019, price: 405_000_000, mileage: 70_000, transmission: "Otomatis", fuel: "Bensin", body_type: "SUV", color: "Hitam", engine_cc: 1498, seats: 7, plate: "B (Jakarta)" },
  { brand: "Honda", model: "Jazz", variant: "RS CVT", year: 2018, price: 205_000_000, mileage: 82_000, transmission: "Otomatis", fuel: "Bensin", body_type: "Hatchback", color: "Putih", engine_cc: 1497, seats: 5, plate: "F (Bogor)" },
  { brand: "Mitsubishi", model: "Xpander", variant: "Ultimate", year: 2022, price: 265_000_000, mileage: 28_000, transmission: "Otomatis", fuel: "Bensin", body_type: "MPV", color: "Abu-abu", engine_cc: 1499, seats: 7, plate: "B (Depok)", featured: 1 },
  { brand: "Mitsubishi", model: "Pajero Sport", variant: "Dakar 4x2", year: 2018, price: 398_000_000, mileage: 96_000, transmission: "Otomatis", fuel: "Diesel", body_type: "SUV", color: "Putih", engine_cc: 2442, seats: 7, plate: "L (Surabaya)", status: "booked" },
  { brand: "Suzuki", model: "Ertiga", variant: "GX", year: 2020, price: 185_000_000, mileage: 55_000, transmission: "Manual", fuel: "Bensin", body_type: "MPV", color: "Coklat", engine_cc: 1462, seats: 7, plate: "B (Jakarta)" },
  { brand: "Daihatsu", model: "Terios", variant: "R Deluxe", year: 2021, price: 222_000_000, mileage: 39_000, transmission: "Otomatis", fuel: "Bensin", body_type: "SUV", color: "Silver", engine_cc: 1496, seats: 7, plate: "B (Bekasi)" },
  { brand: "Mazda", model: "CX-5", variant: "2.5 Elite", year: 2019, price: 368_000_000, mileage: 58_000, transmission: "Otomatis", fuel: "Bensin", body_type: "SUV", color: "Merah", engine_cc: 2488, seats: 5, plate: "B (Jakarta)", featured: 1 },
  { brand: "Honda", model: "Civic", variant: "1.5 Turbo ES", year: 2018, price: 385_000_000, mileage: 64_000, transmission: "Otomatis", fuel: "Bensin", body_type: "Sedan", color: "Biru", engine_cc: 1498, seats: 5, plate: "B (Jakarta)" },
  { brand: "Toyota", model: "Vios", variant: "1.5 G", year: 2017, price: 158_000_000, mileage: 99_000, transmission: "Manual", fuel: "Bensin", body_type: "Sedan", color: "Hitam", engine_cc: 1496, seats: 5, plate: "AB (Yogyakarta)" },
  { brand: "Wuling", model: "Air ev", variant: "Long Range", year: 2023, price: 189_000_000, mileage: 9_000, transmission: "Otomatis", fuel: "Listrik", body_type: "Hatchback", color: "Hijau", engine_cc: 0, seats: 4, plate: "B (Jakarta)" },
  { brand: "Toyota", model: "Hilux", variant: "2.4 E Double Cabin 4x4", year: 2019, price: 385_000_000, mileage: 88_000, transmission: "Manual", fuel: "Diesel", body_type: "Pickup", color: "Putih", engine_cc: 2393, seats: 5, plate: "KT (Balikpapan)" },
  { brand: "Toyota", model: "Yaris", variant: "TRD Sportivo", year: 2016, price: 162_000_000, mileage: 105_000, transmission: "Otomatis", fuel: "Bensin", body_type: "Hatchback", color: "Putih", engine_cc: 1497, seats: 5, plate: "B (Jakarta)", status: "sold", soldDaysAgo: 18 },
  // Unit yang sudah terjual beberapa bulan terakhir (untuk laporan)
  { brand: "Toyota", model: "Agya", variant: "1.2 G", year: 2020, price: 128_000_000, mileage: 41_000, transmission: "Otomatis", fuel: "Bensin", body_type: "Hatchback", color: "Merah", engine_cc: 1197, seats: 5, plate: "B (Jakarta)", status: "sold", soldDaysAgo: 40 },
  { brand: "Honda", model: "Mobilio", variant: "E CVT", year: 2018, price: 152_000_000, mileage: 77_000, transmission: "Otomatis", fuel: "Bensin", body_type: "MPV", color: "Silver", engine_cc: 1497, seats: 7, plate: "B (Depok)", status: "sold", soldDaysAgo: 55 },
  { brand: "Toyota", model: "Rush", variant: "1.5 S GR", year: 2019, price: 215_000_000, mileage: 62_000, transmission: "Otomatis", fuel: "Bensin", body_type: "SUV", color: "Hitam", engine_cc: 1496, seats: 7, plate: "B (Bekasi)", status: "sold", soldDaysAgo: 70 },
  { brand: "Daihatsu", model: "Sigra", variant: "1.2 R", year: 2021, price: 132_000_000, mileage: 33_000, transmission: "Manual", fuel: "Bensin", body_type: "MPV", color: "Putih", engine_cc: 1197, seats: 7, plate: "F (Bogor)", status: "sold", soldDaysAgo: 88 },
  { brand: "Toyota", model: "Kijang Innova", variant: "2.0 G", year: 2017, price: 255_000_000, mileage: 110_000, transmission: "Manual", fuel: "Bensin", body_type: "MPV", color: "Abu-abu", engine_cc: 1998, seats: 8, plate: "B (Jakarta)", status: "sold", soldDaysAgo: 104 },
  { brand: "Honda", model: "BR-V", variant: "1.5 E Prestige", year: 2019, price: 205_000_000, mileage: 58_000, transmission: "Otomatis", fuel: "Bensin", body_type: "SUV", color: "Putih", engine_cc: 1497, seats: 7, plate: "B (Tangerang)", status: "sold", soldDaysAgo: 125 },
  { brand: "Nissan", model: "Grand Livina", variant: "1.5 XV", year: 2017, price: 118_000_000, mileage: 96_000, transmission: "Otomatis", fuel: "Bensin", body_type: "MPV", color: "Coklat", engine_cc: 1498, seats: 7, plate: "D (Bandung)", status: "sold", soldDaysAgo: 150 },
];

// Umur di stok (hari) untuk 16 unit yang dipajang — sebagian sengaja lama agar laporan umur stok terisi
const AGES = [3, 12, 20, 5, 33, 45, 72, 8, 25, 40, 95, 15, 64, 50, 2, 80];
// Unit yang baru turun harga: index → [harga lama, turun berapa hari lalu]
const DROPS = { 2: [472_000_000, 4], 5: [419_000_000, 9], 6: [212_000_000, 2], 15: [395_000_000, 12] };

const FEATURES = {
  base: ["AC Double Blower", "Power Window", "Central Lock", "Audio Touchscreen", "Kamera Mundur", "Dual Airbag", "ABS + EBD"],
  premium: ["Keyless Entry & Push Start", "Cruise Control", "Velg Racing Original", "Sensor Parkir", "Jok Kulit", "Apple CarPlay / Android Auto"],
};

// ---- Laporan inspeksi (deterministik per unit) ----
const INSPECTION_KEYS = [
  "mesin_suara", "mesin_oli", "mesin_pendingin", "mesin_aki", "mesin_knalpot",
  "trans_perpindahan", "trans_kopling", "trans_as",
  "kaki_shock", "kaki_rem", "kaki_ban", "kaki_setir", "kaki_bushing",
  "listrik_lampu", "listrik_ac", "listrik_audio", "listrik_pw", "listrik_dash",
  "int_jok", "int_plafon", "int_karpet", "int_sabuk",
  "ext_cat", "ext_panel", "ext_kaca", "ext_karat",
  "hist_banjir", "hist_tabrak", "hist_odometer", "hist_dokumen", "hist_servis",
];
const FINDINGS = [
  ["ext_cat", "minor", "Baret halus di bumper belakang, sudah dipoles"],
  ["kaki_ban", "minor", "Ban depan sisa ±40%, disarankan ganti dalam 6 bulan"],
  ["int_jok", "minor", "Jok pengemudi sedikit aus di sisi kiri"],
  ["mesin_aki", "minor", "Aki usia 2 tahun, kondisi normal"],
  ["kaki_shock", "minor", "Shock belakang mulai lembut"],
  ["ext_panel", "minor", "Pintu belakang kanan pernah repaint (bukan tabrakan)"],
  ["listrik_audio", "minor", "Layar head unit sedikit lambat"],
  ["kaki_bushing", "fix", "Bushing arm depan diganti baru sebelum serah terima"],
  ["mesin_oli", "fix", "Rembes tipis di tutup klep — seal diganti sebelum serah terima"],
];
function inspectionFor(i, car) {
  const items = Object.fromEntries(INSPECTION_KEYS.map((k) => [k, { s: "ok" }]));
  const age = 2026 - car.year;
  const n = Math.min(4, Math.floor(age / 2) + (i % 2)); // makin tua makin banyak catatan
  for (let j = 0; j < n; j++) {
    const [key, s, note] = FINDINGS[(i * 3 + j * 2) % FINDINGS.length];
    if (s === "fix" && age < 5) continue;
    items[key] = { s, n: note };
  }
  if (i % 7 === 3) delete items.listrik_audio; // contoh item belum dinilai
  return JSON.stringify({
    date: new Date(Date.now() - (AGES[i] ?? 30) * 86_400_000).toISOString().slice(0, 10),
    inspector: ["Pak Joko (Kepala Bengkel)", "Rudi S.", "Agus Priyanto"][i % 3],
    summary: n <= 1 ? "Kondisi sangat terawat, siap pakai tanpa perbaikan." : "Kondisi baik dan layak jalan jauh. Catatan kecil di bawah sudah kami sampaikan apa adanya.",
    items,
  });
}

const sqlTime = (daysAgo) => new Date(Date.now() - daysAgo * 86_400_000).toISOString().slice(0, 19).replace("T", " ");
const round = (n, step = 1_000_000) => Math.round(n / step) * step;

const insertCar = db.prepare(`INSERT INTO cars
  (slug, brand, model, variant, year, price, mileage, transmission, fuel, body_type, color, engine_cc, seats, plate, tax_until,
   description, features, status, featured, views, previous_price, price_changed_at, purchase_price, recon_cost, sold_price, sold_at,
   inspection, created_at, updated_at)
  VALUES (${Array(29).fill("?").join(", ")})`);
const insertImg = db.prepare("INSERT INTO car_images (car_id, path, sort) VALUES (?, ?, ?)");

const carIds = [];
const stamp = Date.now().toString(36);
cars.forEach((c, i) => {
  const slug = slugify(`${c.brand} ${c.model} ${c.variant} ${c.year}`) + "-" + (100 + i);
  const premium = c.price > 250_000_000;
  const features = [...FEATURES.base, ...(premium ? FEATURES.premium : FEATURES.premium.slice(0, 2))];
  const description =
    `${c.brand} ${c.model} ${c.variant} tahun ${c.year}, warna ${c.color.toLowerCase()}, kilometer ${c.mileage.toLocaleString("id-ID")}. ` +
    `Tangan pertama dari baru, servis rutin di bengkel resmi dengan buku servis lengkap. ` +
    `Interior bersih dan wangi, mesin halus, kaki-kaki senyap. Bebas banjir dan bebas tabrak — sudah lolos inspeksi 150 titik.\n\n` +
    `Surat-surat lengkap: BPKB, STNK, faktur, dan kunci serep. Pajak panjang. Bisa tukar tambah dan kredit dengan DP mulai 20%.`;
  const sold = c.status === "sold";
  const ageDays = sold ? c.soldDaysAgo + 20 + (i % 4) * 9 : AGES[i];
  const tax = `${2026 + (i % 2)}-${String((i % 12) + 1).padStart(2, "0")}-15`;
  const drop = DROPS[i];
  const purchase = round(c.price * (0.84 + (i % 4) * 0.015));
  const recon = round(2_500_000 + (i % 5) * 1_250_000, 250_000);
  const { lastInsertRowid } = insertCar.run(
    slug, c.brand, c.model, c.variant, c.year, c.price, c.mileage, c.transmission, c.fuel, c.body_type, c.color,
    c.engine_cc, c.seats, c.plate, tax, description, JSON.stringify(features), c.status ?? "available", c.featured ?? 0,
    40 + ((i * 97) % 380),
    drop ? drop[0] : null, drop ? sqlTime(drop[1]) : null,
    purchase, recon,
    sold ? c.price - round((i % 3) * 1_500_000) : null, sold ? sqlTime(c.soldDaysAgo) : null,
    inspectionFor(i, c), sqlTime(ageDays), sqlTime(drop ? drop[1] : Math.min(ageDays, 3)),
  );
  const id = Number(lastInsertRowid);
  carIds.push(id);
  for (let v = 0; v < 3; v++) {
    const file = `seed-${id}-${v}-${stamp}.svg`;
    fs.writeFileSync(path.join(uploadDir, file), carSvg(c, v));
    insertImg.run(id, file, v);
  }
});

// ---- Leads, jadwal test drive, catatan ----
const wib = Object.fromEntries(
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date()).map((p) => [p.type, p.value]),
);
const today = `${wib.year}-${wib.month}-${wib.day}`;
const plus = (n) => {
  const d = new Date(today + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

const insertLead = db.prepare(`INSERT INTO leads (car_id, type, name, phone, email, message, preferred_date, preferred_time, follow_up_at, data, status, created_at, consent_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
const insertNote = db.prepare("INSERT INTO lead_notes (lead_id, author, note, created_at) VALUES (?, ?, ?, ?)");
const lead = (l) =>
  Number(insertLead.run(
    l.car ?? null, l.type, l.name, l.phone, l.email ?? "", l.message ?? "", l.date ?? null, l.time ?? null, l.follow ?? null,
    JSON.stringify(l.data ?? {}), l.status ?? "new", sqlTime(l.ago ?? 0), sqlTime(l.ago ?? 0),
  ).lastInsertRowid);
const note = (leadId, text, daysAgo) => insertNote.run(leadId, "Admin Showroom", text, sqlTime(daysAgo));

lead({ car: carIds[0], type: "test_drive", name: "Budi Santoso", phone: "081298765432", email: "budi@example.test", message: "Bawa istri juga.", date: plus(1), time: "16:00", ago: 0.1 });
lead({ car: carIds[3], type: "test_drive", name: "Maya Anggraini", phone: "081377788899", date: plus(1), time: "10:00", ago: 0.5 });
const l3 = lead({ car: carIds[11], type: "test_drive", name: "Hendra Gunawan", phone: "082122334455", date: plus(3), time: "14:00", status: "contacted", follow: plus(2), ago: 2 });
note(l3, "Sudah konfirmasi via WA, datang bersama mekanik sendiri.", 1.5);
lead({ car: carIds[7], type: "credit", name: "Siti Rahma", phone: "085711223344", message: "Mohon info syarat kredit", data: { harga: 265_000_000, dp: 60_000_000, tenor: 48, cicilan: 5_381_250 }, follow: today, ago: 1 });
const l5 = lead({ car: carIds[1], type: "credit", name: "Rizky Pratama", phone: "081299001122", data: { harga: 345_000_000, dp: 100_000_000, tenor: 36, cicilan: 8_132_639 }, status: "negotiating", follow: plus(-1), ago: 5 });
note(l5, "Dokumen KTP, KK, slip gaji sudah dikirim ke leasing.", 4);
note(l5, "Leasing minta DP naik ke 110 jt. Nasabah sedang pertimbangkan.", 1);
const l6 = lead({ type: "sell", name: "Andi Wijaya", phone: "081355577799", email: "andi@example.test", message: "Mobil pribadi, siap inspeksi", data: { merek: "Honda", model: "Mobilio E", tahun: 2017, kilometer: 90000, harga_harapan: 125_000_000, kota: "Depok" }, status: "contacted", follow: plus(1), ago: 3 });
note(l6, "Jadwal inspeksi di rumah pemilik, Depok.", 2);
lead({ car: carIds[2], type: "inquiry", name: "Dewi Lestari", phone: "087812341234", message: "Apakah harga masih bisa nego?", status: "won", ago: 6 });
lead({ car: carIds[4], type: "inquiry", name: "Fajar Nugroho", phone: "081911223344", message: "Unit masih ada? Bisa video call?", ago: 0.3 });
lead({ car: carIds[16], type: "test_drive", name: "Lina Marlina", phone: "085600112233", date: plus(-20), time: "11:00", status: "won", ago: 25 });
lead({ car: carIds[9], type: "inquiry", name: "Tono Sutrisno", phone: "081822334455", message: "Bisa tukar tambah Avanza 2012?", status: "lost", ago: 12 });
const l11 = lead({ car: carIds[13], type: "test_drive", name: "Yusuf Hakim", phone: "087733445566", date: plus(4), time: "13:00", status: "negotiating", ago: 4 });
note(l11, "Sudah test drive jalan tol, minta harga net 150 jt.", 3);

console.log(`Seed selesai: ${cars.length} mobil (${cars.filter((c) => c.status === "sold").length} terjual), 11 leads.`);
console.log("Akun demo (password: password, wajib diganti saat login pertama):");
console.log("  Owner  admin@garasiprima.test");
console.log("  Sales  sales@garasiprima.test");
console.log("  Stok   stok@garasiprima.test");
