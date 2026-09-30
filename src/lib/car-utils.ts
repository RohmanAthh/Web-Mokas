// Tipe & helper mobil yang aman dipakai di server maupun client (tanpa akses DB).
import type { CarStatus } from "./site";
import type { Inspection } from "./inspection";
import { CREDIT } from "./credit";
import { flatInstallment } from "./format";

export type Car = {
  id: number;
  slug: string;
  brand: string;
  model: string;
  variant: string;
  year: number;
  price: number;
  mileage: number;
  transmission: string;
  fuel: string;
  body_type: string;
  color: string;
  engine_cc: number;
  seats: number;
  plate: string;
  tax_until: string | null;
  description: string;
  features: string[];
  status: CarStatus;
  featured: boolean;
  views: number;
  previous_price: number | null;
  price_changed_at: string | null;
  inspection: Inspection;
  created_at: string;
  updated_at: string;
  cover: string | null;
  // Hanya untuk admin — dikosongkan oleh publicCar()
  purchase_price: number | null;
  recon_cost: number;
  sold_price: number | null;
  sold_at: string | null;
};

export function carTitle(c: Pick<Car, "brand" | "model" | "variant" | "year">) {
  return `${c.brand} ${c.model}${c.variant ? " " + c.variant : ""} ${c.year}`;
}

export function mediaUrl(file: string | null | undefined) {
  return file ? `/media/${file}` : null;
}

/** Buang field internal (modal, margin) sebelum dikirim ke browser. */
export function publicCar(c: Car): Car {
  return { ...c, purchase_price: null, recon_cost: 0, sold_price: null, sold_at: null };
}

const DAY = 86_400_000;
const parseSqlDate = (s: string) => new Date(s.replace(" ", "T") + (s.length > 10 ? "Z" : ""));

/** Selisih turun harga bila harga diturunkan dalam 30 hari terakhir. */
export function priceDrop(c: Pick<Car, "price" | "previous_price" | "price_changed_at">) {
  if (!c.previous_price || c.previous_price <= c.price || !c.price_changed_at) return 0;
  if (Date.now() - parseSqlDate(c.price_changed_at).getTime() > 30 * DAY) return 0;
  return c.previous_price - c.price;
}

/** Unit dipajang ≤ 7 hari. */
export function isNewArrival(c: Pick<Car, "created_at">) {
  return Date.now() - parseSqlDate(c.created_at).getTime() <= 7 * DAY;
}

export function daysInStock(c: Pick<Car, "created_at">) {
  return Math.max(0, Math.floor((Date.now() - parseSqlDate(c.created_at).getTime()) / DAY));
}

/** Estimasi cicilan kartu: DP 30%, tenor 4 tahun. */
export function monthlyFrom(price: number) {
  return Math.round(flatInstallment(price, price * 0.3, 48, CREDIT.flatRate) / 1000) * 1000;
}
