"use server";

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSession, destroySession, requireUser, verifyPassword } from "@/lib/auth";
import { can } from "@/lib/roles";
import { carImages, getCarById, type Car } from "@/lib/cars";
import { db, UPLOAD_DIR } from "@/lib/db";
import { slugify } from "@/lib/format";
import { processCarPhoto } from "@/lib/images";
import { INSPECTION_GROUPS, INSPECTION_STATUS, type Inspection, type InspectionStatus } from "@/lib/inspection";
import { addLeadNote } from "@/lib/leads";
import { BODY_TYPES, CAR_STATUSES, FUELS, LEAD_STATUSES, TRANSMISSIONS, type CarStatus } from "@/lib/site";
import type { FormState } from "@/app/actions";

// ---------- Auth ----------

// Batasi percobaan login per email (in-memory, cukup untuk satu instance server).
const attempts = new Map<string, { n: number; until: number }>();

export async function login(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  const a = attempts.get(email);
  if (a && a.n >= 5 && a.until > Date.now()) {
    return { ok: false, message: "Terlalu banyak percobaan. Coba lagi dalam 10 menit." };
  }
  const user = db.prepare("SELECT id, password_hash, active, session_version FROM users WHERE email = ?").get(email) as
    | { id: number; password_hash: string; active: number; session_version: number }
    | undefined;
  // Pesan sama untuk email salah / password salah / akun nonaktif (tidak membocorkan akun mana yang ada)
  if (!user || !verifyPassword(password, user.password_hash) || !user.active) {
    attempts.set(email, { n: (a && a.until > Date.now() ? a.n : 0) + 1, until: Date.now() + 10 * 60_000 });
    return { ok: false, message: "Email atau password salah." };
  }
  attempts.delete(email);
  db.prepare("UPDATE users SET last_login_at = datetime('now') WHERE id = ?").run(user.id);
  await createSession(user.id, user.session_version);
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

// ---------- Mobil ----------

const IMAGE_SIGNATURES: [string, (b: Buffer) => boolean][] = [
  [".jpg", (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff],
  [".png", (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))],
  [".webp", (b) => b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP"],
];
// Foto dikompres ke WebP di server, jadi file asli dari kamera HP boleh besar.
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_IMAGES = 12;

// "" → undefined, selain itu angka bulat ≥ 0
const optionalMoney = z.preprocess(
  (v) => (v === "" || v == null ? undefined : String(v).replace(/\D/g, "")),
  z.coerce.number().int().min(0).optional(),
);

const carSchema = z.object({
  brand: z.string().trim().min(2, "Merek wajib diisi").max(40),
  model: z.string().trim().min(1, "Model wajib diisi").max(60),
  variant: z.string().trim().max(80).default(""),
  year: z.coerce.number().int().min(1980, "Tahun tidak valid").max(new Date().getFullYear() + 1, "Tahun tidak valid"),
  price: z.coerce.number().int().min(1_000_000, "Harga minimal Rp 1.000.000"),
  mileage: z.coerce.number().int().min(0, "Kilometer tidak valid"),
  transmission: z.enum(TRANSMISSIONS, "Pilih transmisi"),
  fuel: z.enum(FUELS, "Pilih bahan bakar"),
  body_type: z.enum(BODY_TYPES, "Pilih tipe bodi"),
  color: z.string().trim().max(30).default(""),
  engine_cc: z.coerce.number().int().min(0).max(10000).default(0),
  seats: z.coerce.number().int().min(1).max(20).default(5),
  plate: z.string().trim().max(40).default(""),
  tax_until: z.union([z.literal(""), z.iso.date("Tanggal tidak valid")]).default(""),
  description: z.string().trim().max(5000).default(""),
  features: z.string().max(3000).default(""),
  status: z.enum(Object.keys(CAR_STATUSES) as [keyof typeof CAR_STATUSES]),
  featured: z.string().optional(),
  purchase_price: optionalMoney,
  recon_cost: optionalMoney,
  sold_price: optionalMoney,
});

async function saveUploads(carId: number, files: File[]): Promise<string | null> {
  const existing = carImages(carId).length;
  const real = files.filter((f) => f.size > 0);
  if (existing + real.length > MAX_IMAGES) return `Maksimal ${MAX_IMAGES} foto per mobil.`;
  const prepared: { name: string; buf: Buffer }[] = [];
  for (const f of real) {
    if (f.size > MAX_IMAGE_BYTES) return `Foto "${f.name}" lebih dari 10 MB.`;
    const buf = Buffer.from(await f.arrayBuffer());
    if (!IMAGE_SIGNATURES.some(([, test]) => test(buf))) return `File "${f.name}" bukan gambar JPG/PNG/WEBP.`;
    try {
      // Resize + watermark + WebP
      prepared.push({ name: `${carId}-${crypto.randomBytes(8).toString("hex")}.webp`, buf: await processCarPhoto(buf) });
    } catch {
      return `Foto "${f.name}" rusak atau tidak bisa dibaca.`;
    }
  }
  const insert = db.prepare("INSERT INTO car_images (car_id, path, sort) VALUES (?, ?, ?)");
  let sort = existing;
  for (const p of prepared) {
    await fs.writeFile(path.join(UPLOAD_DIR, p.name), p.buf);
    insert.run(carId, p.name, sort++);
  }
  return null;
}

/**
 * Kolom harga & status turunan:
 * - harga turun → simpan harga lama di previous_price (label "Turun harga" 30 hari)
 * - harga naik sampai/melewati harga lama → label dihapus
 * - status jadi "sold" → catat sold_at & sold_price (default = harga jual)
 */
function derivedFields(old: Car | null, price: number, status: CarStatus, soldPriceInput?: number) {
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  let previous = old?.previous_price ?? null;
  let changedAt = old?.price_changed_at ?? null;
  if (old && price !== old.price) {
    changedAt = now;
    if (price < old.price) previous = Math.max(previous ?? 0, old.price);
    if (previous !== null && price >= previous) previous = null;
  }
  let soldAt: string | null = null;
  let soldPrice: number | null = null;
  if (status === "sold") {
    soldAt = old?.sold_at ?? now;
    soldPrice = soldPriceInput ?? old?.sold_price ?? price;
  }
  return { previous, changedAt, soldAt, soldPrice };
}

export async function saveCar(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser("cars.edit");
  const canCost = can(user.role, "cars.cost");
  const id = Number(fd.get("id")) || null;
  const raw: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") raw[k] = v;
  const parsed = carSchema.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message;
    return { ok: false, message: "Periksa kembali isian yang ditandai.", errors, values: raw };
  }
  const d = parsed.data;
  const features = JSON.stringify(
    d.features.split(/\r?\n|,/).map((s) => s.trim()).filter(Boolean).slice(0, 40),
  );
  const old = id ? getCarById(id) : null;
  if (id && !old) return { ok: false, message: "Mobil tidak ditemukan.", values: raw };
  // Peran tanpa akses modal: nilai lama dipertahankan, input dari form diabaikan
  if (!canCost) {
    d.purchase_price = old?.purchase_price ?? undefined;
    d.recon_cost = old?.recon_cost ?? 0;
    d.sold_price = old?.sold_price ?? undefined;
  }
  const x = derivedFields(old, d.price, d.status, d.sold_price);
  const values = [
    d.brand, d.model, d.variant, d.year, d.price, d.mileage, d.transmission, d.fuel, d.body_type, d.color,
    d.engine_cc, d.seats, d.plate, d.tax_until || null, d.description, features, d.status, d.featured ? 1 : 0,
    x.previous, x.changedAt, d.purchase_price ?? null, d.recon_cost ?? 0, x.soldPrice, x.soldAt,
  ];

  let carId: number;
  if (id) {
    db.prepare(
      `UPDATE cars SET brand=?, model=?, variant=?, year=?, price=?, mileage=?, transmission=?, fuel=?, body_type=?, color=?,
       engine_cc=?, seats=?, plate=?, tax_until=?, description=?, features=?, status=?, featured=?,
       previous_price=?, price_changed_at=?, purchase_price=?, recon_cost=?, sold_price=?, sold_at=?, updated_at=datetime('now')
       WHERE id=?`,
    ).run(...values, id);
    carId = id;
  } else {
    const slug = `${slugify(`${d.brand} ${d.model} ${d.variant} ${d.year}`)}-${crypto.randomBytes(3).toString("hex")}`;
    const r = db
      .prepare(
        `INSERT INTO cars (brand, model, variant, year, price, mileage, transmission, fuel, body_type, color,
         engine_cc, seats, plate, tax_until, description, features, status, featured,
         previous_price, price_changed_at, purchase_price, recon_cost, sold_price, sold_at, slug)
         VALUES (${Array(25).fill("?").join(", ")})`,
      )
      .run(...values, slug);
    carId = Number(r.lastInsertRowid);
  }

  const uploadError = await saveUploads(carId, fd.getAll("images").filter((f): f is File => f instanceof File));
  revalidatePath("/", "layout");
  if (uploadError) {
    if (!id) redirect(`/admin/mobil/${carId}?upload_error=${encodeURIComponent(uploadError)}`);
    return { ok: false, message: `Data tersimpan, tetapi: ${uploadError}`, values: raw };
  }
  if (!id) redirect(`/admin/mobil/${carId}?created=1`);
  return { ok: true, message: "Perubahan tersimpan." };
}

export async function deleteCar(fd: FormData) {
  await requireUser("cars.edit");
  const id = Number(fd.get("id"));
  const images = carImages(id);
  db.prepare("DELETE FROM cars WHERE id = ?").run(id);
  await Promise.all(images.map((i) => fs.rm(path.join(UPLOAD_DIR, i.path), { force: true })));
  revalidatePath("/", "layout");
  redirect("/admin/mobil");
}

export async function setCarStatus(fd: FormData) {
  await requireUser("cars.status");
  const status = String(fd.get("status"));
  if (!(status in CAR_STATUSES)) return;
  const car = getCarById(Number(fd.get("id")));
  if (!car) return;
  const x = derivedFields(car, car.price, status as CarStatus);
  db.prepare("UPDATE cars SET status = ?, sold_at = ?, sold_price = ?, updated_at = datetime('now') WHERE id = ?").run(
    status, x.soldAt, x.soldPrice, car.id,
  );
  revalidatePath("/", "layout");
}

/** Simpan laporan inspeksi dari form checklist. */
export async function saveInspection(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireUser("cars.edit");
  const car = getCarById(Number(fd.get("id")));
  if (!car) return { ok: false, message: "Mobil tidak ditemukan." };
  const items: NonNullable<Inspection["items"]> = {};
  for (const g of INSPECTION_GROUPS) {
    for (const [key] of g.items) {
      const st = String(fd.get(`s_${key}`) ?? "");
      if (!(st in INSPECTION_STATUS)) continue; // belum dinilai
      const n = String(fd.get(`n_${key}`) ?? "").trim().slice(0, 200);
      items[key] = n ? { s: st as InspectionStatus, n } : { s: st as InspectionStatus };
    }
  }
  const date = String(fd.get("date") ?? "");
  const inspection: Inspection = {
    date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined,
    inspector: String(fd.get("inspector") ?? "").trim().slice(0, 60) || undefined,
    summary: String(fd.get("summary") ?? "").trim().slice(0, 1000) || undefined,
    items,
  };
  db.prepare("UPDATE cars SET inspection = ?, updated_at = datetime('now') WHERE id = ?").run(JSON.stringify(inspection), car.id);
  revalidatePath("/", "layout");
  return { ok: true, message: `Laporan inspeksi tersimpan (${Object.keys(items).length} item dinilai).` };
}

export async function deleteImage(fd: FormData) {
  await requireUser("cars.edit");
  const img = db.prepare("SELECT * FROM car_images WHERE id = ?").get(Number(fd.get("imageId"))) as
    | { id: number; path: string }
    | undefined;
  if (!img) return;
  db.prepare("DELETE FROM car_images WHERE id = ?").run(img.id);
  await fs.rm(path.join(UPLOAD_DIR, img.path), { force: true });
  revalidatePath("/", "layout");
}

/** Jadikan foto sebagai sampul (urutan pertama). */
export async function makeCover(fd: FormData) {
  await requireUser("cars.edit");
  const imageId = Number(fd.get("imageId"));
  const img = db.prepare("SELECT car_id FROM car_images WHERE id = ?").get(imageId) as { car_id: number } | undefined;
  if (!img) return;
  const ids = carImages(img.car_id).map((i) => i.id).filter((i) => i !== imageId);
  const upd = db.prepare("UPDATE car_images SET sort = ? WHERE id = ?");
  [imageId, ...ids].forEach((id, idx) => upd.run(idx, id));
  revalidatePath("/", "layout");
}

// ---------- Leads ----------

export async function setLeadStatus(fd: FormData) {
  await requireUser("leads");
  const status = String(fd.get("status"));
  if (!(status in LEAD_STATUSES)) return;
  db.prepare("UPDATE leads SET status = ? WHERE id = ?").run(status, Number(fd.get("id")));
  revalidatePath("/admin", "layout");
}

export async function setFollowUp(fd: FormData) {
  await requireUser("leads");
  const date = String(fd.get("follow_up_at") ?? "");
  db.prepare("UPDATE leads SET follow_up_at = ? WHERE id = ?").run(/^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null, Number(fd.get("id")));
  revalidatePath("/admin", "layout");
}

export async function addNote(fd: FormData) {
  const user = await requireUser("leads");
  const note = String(fd.get("note") ?? "").trim().slice(0, 2000);
  const id = Number(fd.get("id"));
  if (!note || !id) return;
  addLeadNote(id, user.name, note);
  // Catatan pertama pada lead baru otomatis memindahkannya ke "Dihubungi"
  db.prepare("UPDATE leads SET status = 'contacted' WHERE id = ? AND status = 'new'").run(id);
  revalidatePath("/admin", "layout");
}

export async function deleteLead(fd: FormData) {
  await requireUser("leads");
  db.prepare("DELETE FROM leads WHERE id = ?").run(Number(fd.get("id")));
  revalidatePath("/admin", "layout");
  if (fd.get("redirect")) redirect("/admin/leads");
}
