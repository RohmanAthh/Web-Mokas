import type { Lead } from "@/lib/leads";

export const MONEY_KEYS = new Set(["harga", "dp", "cicilan", "harga_harapan"]);

/** Link wa.me ke nomor lead dengan pesan pembuka. */
export function waUrl(l: Lead) {
  const p = l.phone.replace(/^0/, "62").replace(/^\+/, "");
  const about = l.car_title ? ` terkait ${l.car_title}` : l.type === "sell" ? " terkait mobil yang ingin Anda jual" : "";
  const when = l.type === "test_drive" && l.preferred_date ? ` Kami konfirmasi jadwal test drive ${l.preferred_date}${l.preferred_time ? ` jam ${l.preferred_time}` : ""}.` : "";
  return `https://wa.me/${p}?text=${encodeURIComponent(`Halo ${l.name}, kami dari showroom menindaklanjuti permintaan Anda${about}.${when}`)}`;
}
