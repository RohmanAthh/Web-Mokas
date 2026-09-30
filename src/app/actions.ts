"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { carsByIds, getCarById, publicCar } from "@/lib/cars";
import { bookedSlots, createLead } from "@/lib/leads";
import { notifyNewLead } from "@/lib/notify";
import { isValidSlot, slotsFor } from "@/lib/slots";
import { flatInstallment, tanggal } from "@/lib/format";
import { CREDIT } from "@/lib/credit";

export type FormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
  /** Nilai yang dikirim, agar form terisi kembali saat validasi gagal (React me-reset form setelah action). */
  values?: Record<string, string>;
};

const phone = z
  .string()
  .trim()
  .transform((s) => s.replace(/[\s-]/g, ""))
  .pipe(z.string().regex(/^(\+62|62|0)8\d{7,12}$/, "Nomor HP tidak valid (contoh: 081234567890)"));

const contact = {
  consent: z.literal("on", "Centang persetujuan kebijakan privasi untuk melanjutkan"),
  name: z.string().trim().min(2, "Nama wajib diisi").max(80),
  phone,
  email: z.union([z.literal(""), z.email("Email tidak valid")]).default(""),
  message: z.string().trim().max(1000).default(""),
};

function fieldErrors(error: z.ZodError, values: Record<string, string>): FormState {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    errors[key] ??= issue.message;
  }
  return { ok: false, message: "Periksa kembali isian Anda.", errors, values };
}

function raw(fd: FormData) {
  const o: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") o[k] = v;
  return o;
}

const leadSchema = z.object({
  ...contact,
  type: z.enum(["inquiry", "test_drive", "credit"]),
  carId: z.coerce.number().int().positive().optional(),
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
  dp: z.coerce.number().optional(),
  tenor: z.coerce.number().optional(),
});

/** Pertanyaan, booking test drive, atau pengajuan kredit dari halaman mobil / kontak. */
export async function submitLead(_prev: FormState, fd: FormData): Promise<FormState> {
  if (fd.get("website")) return { ok: true, message: "Terima kasih!" }; // honeypot anti-spam
  const values = raw(fd);
  const parsed = leadSchema.safeParse(values);
  if (!parsed.success) return fieldErrors(parsed.error, values);
  const d = parsed.data;

  const car = d.carId ? getCarById(d.carId) : null;
  if (d.carId && !car) return { ok: false, message: "Mobil tidak ditemukan.", values };

  if (d.type === "test_drive") {
    const invalid = (field: string, msg: string): FormState => ({ ok: false, errors: { [field]: msg }, message: "Periksa kembali isian Anda.", values });
    if (!car) return { ok: false, message: "Pilih mobil untuk test drive.", values };
    if (!d.preferredDate || slotsFor(d.preferredDate).length === 0) return invalid("preferredDate", "Pilih tanggal (hari ini s/d 30 hari ke depan)");
    if (!d.preferredTime || !isValidSlot(d.preferredDate, d.preferredTime)) return invalid("preferredTime", "Pilih jam yang tersedia");
    if (bookedSlots(car.id, d.preferredDate).has(d.preferredTime)) {
      return invalid("preferredTime", "Jam ini baru saja dibooking orang lain. Pilih jam lain.");
    }
  }

  let data: Record<string, number> = {};
  if (d.type === "credit" && car) {
    const tenor = CREDIT.tenors.includes(d.tenor ?? 0) ? d.tenor! : 48;
    const dp = Math.min(Math.max(d.dp ?? 0, car.price * CREDIT.minDpRatio), car.price);
    data = { harga: car.price, dp, tenor, cicilan: Math.round(flatInstallment(car.price, dp, tenor, CREDIT.flatRate)) };
  }

  let leadId: number;
  try {
    leadId = createLead({
      carId: car?.id ?? null,
      type: d.type,
      name: d.name,
      phone: d.phone,
      email: d.email,
      message: d.message,
      preferredDate: d.type === "test_drive" ? d.preferredDate : null,
      preferredTime: d.type === "test_drive" ? d.preferredTime : null,
      data,
    });
  } catch (err) {
    // Unique index slot: dua orang booking jam yang sama bersamaan
    if (String(err).includes("UNIQUE")) {
      return { ok: false, errors: { preferredTime: "Jam ini baru saja dibooking. Pilih jam lain." }, message: "Periksa kembali isian Anda.", values };
    }
    throw err;
  }
  after(() => notifyNewLead(leadId));
  revalidatePath("/admin", "layout");

  const messages = {
    inquiry: "Pesan terkirim! Tim kami akan menghubungi Anda secepatnya.",
    test_drive: `Test drive ${car ? `${car.brand} ${car.model} ` : ""}dijadwalkan ${tanggal(d.preferredDate!)} jam ${d.preferredTime} WIB. Kami konfirmasi via WhatsApp.`,
    credit: "Pengajuan kredit diterima. Marketing kami akan menghubungi Anda untuk kelengkapan dokumen.",
  };
  return { ok: true, message: messages[d.type] };
}

const sellSchema = z.object({
  ...contact,
  brand: z.string().trim().min(2, "Merek wajib diisi").max(40),
  model: z.string().trim().min(1, "Model wajib diisi").max(60),
  year: z.coerce.number().int().min(1990, "Tahun tidak valid").max(new Date().getFullYear() + 1, "Tahun tidak valid"),
  mileage: z.coerce.number().int().min(0).max(2_000_000),
  askingPrice: z.coerce.number().int().min(0).optional(),
  city: z.string().trim().max(60).default(""),
});

/** Form "Jual Mobil Anda" / tukar tambah. */
export async function submitSellRequest(_prev: FormState, fd: FormData): Promise<FormState> {
  if (fd.get("website")) return { ok: true, message: "Terima kasih!" };
  const values = raw(fd);
  const parsed = sellSchema.safeParse(values);
  if (!parsed.success) return fieldErrors(parsed.error, values);
  const d = parsed.data;
  const leadId = createLead({
    type: "sell",
    name: d.name,
    phone: d.phone,
    email: d.email,
    message: d.message,
    data: { merek: d.brand, model: d.model, tahun: d.year, kilometer: d.mileage, harga_harapan: d.askingPrice ?? 0, kota: d.city },
  });
  after(() => notifyNewLead(leadId));
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Data mobil Anda sudah kami terima. Tim penilai akan menghubungi dalam 1×24 jam untuk jadwal inspeksi gratis." };
}

/** Slot jam test drive untuk satu mobil di tanggal tertentu (dipanggil dari form). */
export async function getSlots(carId: number, date: string) {
  const booked = Number.isInteger(carId) ? bookedSlots(carId, date) : new Set<string>();
  return slotsFor(date).map((s) => ({ time: s.time, available: !s.past && !booked.has(s.time) }));
}

/** Data publik beberapa mobil (untuk halaman favorit yang ID-nya disimpan di browser). */
export async function getPublicCars(ids: number[]) {
  if (!Array.isArray(ids)) return [];
  return carsByIds(ids.map(Number)).map(publicCar);
}
