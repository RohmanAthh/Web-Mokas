// Identitas showroom — ubah sesuai bisnis Anda.
export const site = {
  name: "Garasi Prima",
  tagline: "Mobil bekas berkualitas, harga jujur",
  description:
    "Showroom mobil bekas terpercaya. Setiap unit lolos inspeksi 150 titik, surat lengkap, dan bisa kredit dengan DP ringan.",
  whatsapp: "6281234567890", // format internasional tanpa "+"
  phone: "0812-3456-7890",
  email: "halo@garasiprima.test",
  address: "Jl. Raya Otomotif No. 88, Jakarta Selatan",
  hours: "Senin–Sabtu 09.00–18.00, Minggu 10.00–15.00",
  /** Tulisan watermark di foto mobil yang diunggah; kosongkan untuk mematikan. */
  watermark: "GARASI PRIMA",
  /** Untuk halaman Kebijakan Privasi & Syarat — ISI dengan data badan usaha Anda. */
  legal: {
    entity: "[Nama badan usaha, mis. CV Garasi Prima Sejahtera]",
    privacyEmail: "privasi@garasiprima.test",
    city: "Jakarta Selatan",
    updatedAt: "2026-09-30",
  },
  mapsEmbed: "https://www.google.com/maps?q=Jakarta%20Selatan&output=embed",
};

export const BODY_TYPES = ["MPV", "SUV", "Sedan", "Hatchback", "Pickup"] as const;
export const TRANSMISSIONS = ["Manual", "Otomatis"] as const;
export const FUELS = ["Bensin", "Diesel", "Hybrid", "Listrik"] as const;
export const CAR_STATUSES = {
  available: { label: "Tersedia", className: "bg-emerald-100 text-emerald-800" },
  booked: { label: "Dipesan", className: "bg-amber-100 text-amber-800" },
  sold: { label: "Terjual", className: "bg-slate-200 text-slate-700" },
} as const;
export const LEAD_TYPES = {
  inquiry: "Pertanyaan",
  test_drive: "Test Drive",
  sell: "Jual Mobil",
  credit: "Pengajuan Kredit",
} as const;
// Pipeline leads, urut sesuai alur follow-up.
export const LEAD_STATUSES = {
  new: { label: "Baru", className: "bg-blue-100 text-blue-800" },
  contacted: { label: "Dihubungi", className: "bg-amber-100 text-amber-800" },
  negotiating: { label: "Negosiasi", className: "bg-violet-100 text-violet-800" },
  won: { label: "Deal", className: "bg-emerald-100 text-emerald-800" },
  lost: { label: "Batal", className: "bg-slate-200 text-slate-600" },
} as const;
export const OPEN_LEAD_STATUSES = ["new", "contacted", "negotiating"] as const;

export type CarStatus = keyof typeof CAR_STATUSES;
export type LeadType = keyof typeof LEAD_TYPES;
export type LeadStatus = keyof typeof LEAD_STATUSES;

export function waLink(text: string) {
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`;
}
