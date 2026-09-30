// Slot jam test drive (zona waktu showroom: WIB). Aman dipakai di server & client.
export const TIMEZONE = "Asia/Jakarta";

// Jam mulai slot per hari (0 = Minggu). Durasi 1 jam.
const HOURS: Record<number, number[]> = {
  0: [10, 11, 12, 13, 14],
  1: [9, 10, 11, 13, 14, 15, 16, 17],
  2: [9, 10, 11, 13, 14, 15, 16, 17],
  3: [9, 10, 11, 13, 14, 15, 16, 17],
  4: [9, 10, 11, 13, 14, 15, 16, 17],
  5: [9, 10, 11, 14, 15, 16, 17], // Jumat: jeda salat Jumat
  6: [9, 10, 11, 13, 14, 15, 16, 17],
};
export const MAX_DAYS_AHEAD = 30;

const pad = (n: number) => String(n).padStart(2, "0");

/** Tanggal & jam saat ini di WIB. */
export function nowInShowroom() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour), minute: Number(parts.minute) };
}

export function addDays(date: string, days: number) {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Semua slot di tanggal tertentu, dengan slot yang sudah lewat ditandai. */
export function slotsFor(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];
  const now = nowInShowroom();
  if (date < now.date || date > addDays(now.date, MAX_DAYS_AHEAD)) return [];
  const dow = new Date(date + "T00:00:00Z").getUTCDay();
  return (HOURS[dow] ?? []).map((h) => ({
    time: `${pad(h)}:00`,
    // Minimal 1 jam dari sekarang
    past: date === now.date && h <= now.hour,
  }));
}

export function isValidSlot(date: string, time: string) {
  return slotsFor(date).some((s) => s.time === time && !s.past);
}
