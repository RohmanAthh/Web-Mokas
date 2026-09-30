// Skor kecocokan mobil untuk kuis "Cari yang cocok". Murni (tanpa DB) agar mudah diuji.
import { monthlyFrom, type Car } from "./car-utils";
import { rupiahShort } from "./format";
import { inspectionScore } from "./inspection";

export const USES = {
  keluarga: { label: "Keluarga", emoji: "👨‍👩‍👧‍👦", note: "Antar-jemput, mudik" },
  kota: { label: "Harian di kota", emoji: "🏙️", note: "Irit & gampang parkir" },
  luarkota: { label: "Luar kota / jalan rusak", emoji: "⛰️", note: "Tangguh & bertenaga" },
  usaha: { label: "Usaha / angkut barang", emoji: "📦", note: "Muat banyak" },
} as const;
export type Use = keyof typeof USES;

export const SEAT_OPTIONS = { "4": "1–4 orang", "5": "5 orang", "7": "6–7 orang" } as const;

export type QuizAnswers = {
  use: Use;
  seats: 4 | 5 | 7;
  mode: "cicilan" | "tunai";
  /** cicilan per bulan atau harga tunai maksimal, Rupiah */
  budget: number;
  trans: "Otomatis" | "Manual" | "";
};

export function parseAnswers(sp: Record<string, string | string[] | undefined>): QuizAnswers | null {
  const get = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : sp[k]) ?? "";
  const use = get("use") as Use;
  const seats = Number(get("seats"));
  const mode = get("mode") === "tunai" ? "tunai" : "cicilan";
  const budget = Number(get("budget"));
  const trans = ["Otomatis", "Manual"].includes(get("trans")) ? (get("trans") as "Otomatis" | "Manual") : "";
  if (!(use in USES) || ![4, 5, 7].includes(seats) || !(budget > 0)) return null;
  return { use, seats: seats as 4 | 5 | 7, mode, budget, trans };
}

type Match = { car: Car; pct: number; reasons: string[]; warnings: string[] };

const USE_BODY: Record<Use, Record<string, number>> = {
  keluarga: { MPV: 1, SUV: 0.8, Sedan: 0.4, Hatchback: 0.3, Pickup: 0 },
  kota: { Hatchback: 1, Sedan: 0.8, MPV: 0.5, SUV: 0.5, Pickup: 0.1 },
  luarkota: { SUV: 1, Pickup: 0.8, MPV: 0.5, Sedan: 0.3, Hatchback: 0.2 },
  usaha: { Pickup: 1, MPV: 0.8, SUV: 0.4, Hatchback: 0.2, Sedan: 0.1 },
};

export function scoreCar(car: Car, a: QuizAnswers): Match {
  const reasons: string[] = [];
  const warnings: string[] = [];
  let score = 0;

  // 1. Kebutuhan pemakaian (30)
  const body = USE_BODY[a.use][car.body_type] ?? 0.3;
  score += body * 30;
  if (body >= 0.8) reasons.push(`${car.body_type} pas untuk ${USES[a.use].label.toLowerCase()}`);
  if (a.use === "kota" && car.engine_cc > 0 && car.engine_cc <= 1500) { score += 4; reasons.push("Mesin kecil, irit di kota"); }
  if (a.use === "kota" && (car.fuel === "Hybrid" || car.fuel === "Listrik")) { score += 6; reasons.push(`${car.fuel} — hemat BBM`); }
  if ((a.use === "luarkota" || a.use === "usaha") && car.fuel === "Diesel") { score += 5; reasons.push("Diesel bertenaga & awet"); }

  // 2. Kapasitas (20) — kurang kursi = penalti besar
  if (car.seats >= a.seats) {
    score += 20;
    if (a.seats === 7) reasons.push(`${car.seats} kursi`);
  } else {
    score -= 15;
    warnings.push(`Hanya ${car.seats} kursi`);
  }

  // 3. Budget (35)
  const cost = a.mode === "cicilan" ? monthlyFrom(car.price) : car.price;
  const ratio = cost / a.budget;
  if (ratio <= 1) {
    score += 35;
    reasons.push(a.mode === "cicilan" ? `Cicilan ± ${rupiahShort(cost)}/bln, masuk budget` : `${rupiahShort(cost)}, masuk budget`);
  } else if (ratio <= 1.15) {
    score += 20;
    warnings.push(`Sedikit di atas budget (${rupiahShort(cost)}${a.mode === "cicilan" ? "/bln" : ""})`);
  } else if (ratio <= 1.35) {
    score += 5;
    warnings.push(`Di atas budget (${rupiahShort(cost)}${a.mode === "cicilan" ? "/bln" : ""})`);
  } else {
    score -= 25;
    warnings.push("Jauh di atas budget");
  }

  // 4. Transmisi (10)
  if (!a.trans || car.transmission === a.trans) {
    score += 10;
    if (a.trans) reasons.push(a.trans === "Otomatis" ? "Matic sesuai pilihan" : "Manual sesuai pilihan");
  } else {
    warnings.push(car.transmission === "Otomatis" ? "Transmisi matic" : "Transmisi manual");
  }

  // 5. Kondisi (5): skor inspeksi, umur & km
  const insp = inspectionScore(car.inspection).total;
  if (insp !== null) {
    score += (insp / 100) * 3;
    if (insp >= 90) reasons.push(`Skor inspeksi ${insp}/100`);
  }
  const age = new Date().getFullYear() - car.year;
  score += Math.max(0, 2 - age * 0.25);
  if (car.mileage / Math.max(age, 1) < 12_000) reasons.push("Kilometer rendah untuk umurnya");

  return { car, pct: Math.round(Math.max(0, Math.min(100, score))), reasons: reasons.slice(0, 4), warnings };
}

export function recommend(cars: Car[], a: QuizAnswers, limit = 6) {
  return cars
    .filter((c) => c.status === "available")
    .map((c) => scoreCar(c, a))
    .sort((x, y) => y.pct - x.pct || x.car.price - y.car.price)
    .slice(0, limit);
}
