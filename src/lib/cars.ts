import "server-only";
import type { SQLInputValue } from "node:sqlite";
import { db } from "./db";
import { parseInspection } from "./inspection";
import type { Car } from "./car-utils";

export type { Car } from "./car-utils";
export { carTitle, mediaUrl, publicCar, priceDrop, isNewArrival, daysInStock } from "./car-utils";

export type CarImage = { id: number; car_id: number; path: string; sort: number };

type Row = Record<string, unknown>;

const COVER_SQL = "(SELECT path FROM car_images i WHERE i.car_id = c.id ORDER BY sort, id LIMIT 1) AS cover";
/** Kondisi SQL "turun harga dalam 30 hari" — sama dengan priceDrop() di car-utils. */
const DROP_SQL = "(c.previous_price > c.price AND c.price_changed_at >= datetime('now', '-30 days'))";

function toCar(r: Row): Car {
  return {
    ...(r as unknown as Car),
    features: JSON.parse((r.features as string) || "[]"),
    featured: Boolean(r.featured),
    inspection: parseInspection(r.inspection),
  };
}

export type CarFilters = {
  q?: string;
  brand?: string;
  body?: string;
  transmission?: string;
  fuel?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxMileage?: number;
  /** hanya unit yang baru turun harga */
  deals?: boolean;
  sort?: string;
  page?: number;
  /** admin: tampilkan semua status */
  includeAll?: boolean;
  status?: string;
  pageSize?: number;
};

const SORTS: Record<string, string> = {
  terbaru: "c.created_at DESC, c.id DESC",
  "harga-terendah": "c.price ASC",
  "harga-tertinggi": "c.price DESC",
  "tahun-terbaru": "c.year DESC, c.price ASC",
  "km-terendah": "c.mileage ASC",
  "turun-harga": `${DROP_SQL} DESC, (c.previous_price - c.price) DESC, c.created_at DESC`,
  terlama: "c.created_at ASC",
};
export const SORT_OPTIONS = [
  ["terbaru", "Terbaru"],
  ["harga-terendah", "Harga terendah"],
  ["harga-tertinggi", "Harga tertinggi"],
  ["tahun-terbaru", "Tahun terbaru"],
  ["km-terendah", "Kilometer terendah"],
  ["turun-harga", "Turun harga"],
] as const;

export const PAGE_SIZE = 12;

export function listCars(f: CarFilters = {}) {
  const where: string[] = [];
  const args: SQLInputValue[] = [];
  if (f.status) {
    where.push("c.status = ?");
    args.push(f.status);
  } else if (!f.includeAll) {
    // Publik: tampilkan yang tersedia & dipesan; terjual disembunyikan.
    where.push("c.status IN ('available','booked')");
  }
  if (f.q) {
    for (const word of f.q.trim().split(/\s+/).slice(0, 5)) {
      where.push("(c.brand || ' ' || c.model || ' ' || c.variant || ' ' || c.year) LIKE ?");
      args.push(`%${word}%`);
    }
  }
  if (f.brand) { where.push("c.brand = ?"); args.push(f.brand); }
  if (f.body) { where.push("c.body_type = ?"); args.push(f.body); }
  if (f.transmission) { where.push("c.transmission = ?"); args.push(f.transmission); }
  if (f.fuel) { where.push("c.fuel = ?"); args.push(f.fuel); }
  if (f.minPrice) { where.push("c.price >= ?"); args.push(f.minPrice); }
  if (f.maxPrice) { where.push("c.price <= ?"); args.push(f.maxPrice); }
  if (f.minYear) { where.push("c.year >= ?"); args.push(f.minYear); }
  if (f.maxMileage) { where.push("c.mileage <= ?"); args.push(f.maxMileage); }
  if (f.deals) where.push(DROP_SQL);

  const whereSql = where.length ? "WHERE " + where.join(" AND ") : "";
  const total = (db.prepare(`SELECT COUNT(*) AS n FROM cars c ${whereSql}`).get(...args) as { n: number }).n;
  const size = f.pageSize ?? PAGE_SIZE;
  const page = Math.max(1, f.page ?? 1);
  const order = SORTS[f.sort ?? ""] ?? SORTS.terbaru;
  const rows = db
    .prepare(`SELECT c.*, ${COVER_SQL} FROM cars c ${whereSql} ORDER BY ${order} LIMIT ? OFFSET ?`)
    .all(...args, size, (page - 1) * size) as Row[];
  return { cars: rows.map(toCar), total, page, pages: Math.max(1, Math.ceil(total / size)) };
}

/** Semua unit yang dipajang (untuk kuis rekomendasi & sitemap). */
export function allListedCars() {
  const rows = db.prepare(`SELECT c.*, ${COVER_SQL} FROM cars c WHERE c.status IN ('available','booked') ORDER BY c.created_at DESC`).all() as Row[];
  return rows.map(toCar);
}

export function carsByIds(ids: number[]) {
  const clean = [...new Set(ids.filter((n) => Number.isInteger(n) && n > 0))].slice(0, 30);
  if (clean.length === 0) return [];
  const rows = db
    .prepare(`SELECT c.*, ${COVER_SQL} FROM cars c WHERE c.id IN (${clean.map(() => "?").join(",")})`)
    .all(...clean) as Row[];
  const byId = new Map(rows.map((r) => [Number(r.id), toCar(r)]));
  return clean.map((id) => byId.get(id)).filter((c): c is Car => Boolean(c));
}

export function featuredCars(limit = 6) {
  const rows = db
    .prepare(
      `SELECT c.*, ${COVER_SQL} FROM cars c WHERE c.status = 'available'
       ORDER BY c.featured DESC, c.created_at DESC LIMIT ?`,
    )
    .all(limit) as Row[];
  return rows.map(toCar);
}

export function dealCount() {
  return (db.prepare(`SELECT COUNT(*) AS n FROM cars c WHERE c.status IN ('available','booked') AND ${DROP_SQL}`).get() as { n: number }).n;
}

export function similarCars(car: Car, limit = 4) {
  const rows = db
    .prepare(
      `SELECT c.*, ${COVER_SQL} FROM cars c
       WHERE c.status = 'available' AND c.id != ? AND (c.body_type = ? OR c.brand = ?)
       ORDER BY ABS(c.price - ?) LIMIT ?`,
    )
    .all(car.id, car.body_type, car.brand, car.price, limit) as Row[];
  return rows.map(toCar);
}

export function getCarBySlug(slug: string) {
  const r = db.prepare(`SELECT c.*, ${COVER_SQL} FROM cars c WHERE c.slug = ?`).get(slug) as Row | undefined;
  return r ? toCar(r) : null;
}

export function getCarById(id: number) {
  const r = db.prepare(`SELECT c.*, ${COVER_SQL} FROM cars c WHERE c.id = ?`).get(id) as Row | undefined;
  return r ? toCar(r) : null;
}

export function carImages(carId: number) {
  return db.prepare("SELECT * FROM car_images WHERE car_id = ? ORDER BY sort, id").all(carId) as CarImage[];
}

export function incrementViews(id: number) {
  db.prepare("UPDATE cars SET views = views + 1 WHERE id = ?").run(id);
}

export function brands(includeAll = false) {
  return db
    .prepare(
      `SELECT brand, COUNT(*) AS n FROM cars ${includeAll ? "" : "WHERE status IN ('available','booked')"}
       GROUP BY brand ORDER BY brand`,
    )
    .all() as { brand: string; n: number }[];
}

export function inventoryStats() {
  return db
    .prepare(
      `SELECT
        COALESCE(SUM(status = 'available'), 0) AS available,
        COALESCE(SUM(status = 'booked'), 0) AS booked,
        COALESCE(SUM(status = 'sold'), 0) AS sold,
        COALESCE(SUM(CASE WHEN status = 'available' THEN price END), 0) AS stock_value,
        COALESCE(SUM(views), 0) AS views
       FROM cars`,
    )
    .get() as { available: number; booked: number; sold: number; stock_value: number; views: number };
}

// ---------- Laporan ----------

/** Penjualan per bulan (N bulan terakhir, termasuk bulan ini). */
export function salesByMonth(months = 6) {
  const rows = db
    .prepare(
      `SELECT strftime('%Y-%m', sold_at) AS ym, COUNT(*) AS units,
              COALESCE(SUM(sold_price), 0) AS revenue,
              COALESCE(SUM(CASE WHEN purchase_price IS NOT NULL THEN sold_price - purchase_price - recon_cost END), 0) AS margin,
              SUM(purchase_price IS NOT NULL) AS with_cost
       FROM cars WHERE status = 'sold' AND sold_at >= date('now', 'start of month', ?)
       GROUP BY ym ORDER BY ym`,
    )
    .all(`-${months - 1} months`) as { ym: string; units: number; revenue: number; margin: number; with_cost: number }[];
  const byYm = new Map(rows.map((r) => [r.ym, r]));
  const out = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    out.push(byYm.get(ym) ?? { ym, units: 0, revenue: 0, margin: 0, with_cost: 0 });
  }
  return out;
}

/** Rata-rata lama unit terjual (hari) untuk unit yang laku 6 bulan terakhir. */
export function avgDaysToSell() {
  const r = db
    .prepare(`SELECT AVG(julianday(sold_at) - julianday(created_at)) AS d FROM cars WHERE status = 'sold' AND sold_at >= date('now', '-6 months')`)
    .get() as { d: number | null };
  return r.d === null ? null : Math.round(r.d);
}

/** Unit di stok beserta umur, jumlah leads, dan margin rencana. */
export function stockAging() {
  const rows = db
    .prepare(
      `SELECT c.*, ${COVER_SQL},
              CAST(julianday('now') - julianday(c.created_at) AS INTEGER) AS age_days,
              (SELECT COUNT(*) FROM leads l WHERE l.car_id = c.id) AS lead_count
       FROM cars c WHERE c.status IN ('available','booked') ORDER BY c.created_at ASC`,
    )
    .all() as Row[];
  return rows.map((r) => ({ car: toCar(r), ageDays: Number(r.age_days), leadCount: Number(r.lead_count) }));
}
