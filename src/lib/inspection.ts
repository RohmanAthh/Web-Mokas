// Checklist laporan inspeksi per unit. Disimpan sebagai JSON di cars.inspection.

export const INSPECTION_GROUPS = [
  {
    key: "mesin",
    label: "Mesin",
    items: [
      ["mesin_suara", "Suara & getaran mesin"],
      ["mesin_oli", "Rembesan oli"],
      ["mesin_pendingin", "Radiator & pendingin"],
      ["mesin_aki", "Aki & sistem pengisian"],
      ["mesin_knalpot", "Asap knalpot"],
    ],
  },
  {
    key: "transmisi",
    label: "Transmisi",
    items: [
      ["trans_perpindahan", "Perpindahan gigi"],
      ["trans_kopling", "Kopling / torque converter"],
      ["trans_as", "Gardan & as roda"],
    ],
  },
  {
    key: "kaki",
    label: "Kaki-kaki & rem",
    items: [
      ["kaki_shock", "Shock absorber"],
      ["kaki_rem", "Rem & kampas"],
      ["kaki_ban", "Kondisi ban"],
      ["kaki_setir", "Setir & power steering"],
      ["kaki_bushing", "Bushing & ball joint"],
    ],
  },
  {
    key: "listrik",
    label: "Kelistrikan",
    items: [
      ["listrik_lampu", "Lampu-lampu"],
      ["listrik_ac", "AC"],
      ["listrik_audio", "Audio & layar"],
      ["listrik_pw", "Power window & central lock"],
      ["listrik_dash", "Indikator dashboard"],
    ],
  },
  {
    key: "interior",
    label: "Interior",
    items: [
      ["int_jok", "Jok & trim"],
      ["int_plafon", "Plafon"],
      ["int_karpet", "Karpet & aroma kabin"],
      ["int_sabuk", "Sabuk pengaman"],
    ],
  },
  {
    key: "eksterior",
    label: "Eksterior",
    items: [
      ["ext_cat", "Cat & baret"],
      ["ext_panel", "Panel bodi & celah"],
      ["ext_kaca", "Kaca & spion"],
      ["ext_karat", "Karat / korosi"],
    ],
  },
  {
    key: "riwayat",
    label: "Riwayat & dokumen",
    items: [
      ["hist_banjir", "Bebas bekas banjir"],
      ["hist_tabrak", "Bebas tabrak berat"],
      ["hist_odometer", "Odometer wajar"],
      ["hist_dokumen", "BPKB / STNK / faktur sesuai"],
      ["hist_servis", "Riwayat servis"],
    ],
  },
] as const;

export const INSPECTION_STATUS = {
  ok: { label: "Baik", short: "OK", weight: 1, className: "bg-nb-green" },
  minor: { label: "Catatan kecil", short: "Minor", weight: 0.6, className: "bg-nb-lemon" },
  fix: { label: "Perlu perhatian", short: "Cek", weight: 0.2, className: "bg-nb-pink" },
} as const;

export type InspectionStatus = keyof typeof INSPECTION_STATUS;
export type Inspection = {
  date?: string;
  inspector?: string;
  summary?: string;
  items?: Record<string, { s: InspectionStatus; n?: string }>;
};

export const INSPECTION_ITEM_COUNT = INSPECTION_GROUPS.reduce((n, g) => n + g.items.length, 0);

export function parseInspection(raw: unknown): Inspection {
  if (typeof raw !== "string" || !raw) return {};
  try {
    return JSON.parse(raw) as Inspection;
  } catch {
    return {};
  }
}

/** Skor 0–100 per grup dan total; null bila belum diinspeksi. */
export function inspectionScore(insp: Inspection) {
  const items = insp.items ?? {};
  const groups = INSPECTION_GROUPS.map((g) => {
    const rated = g.items.map(([k]) => items[k]).filter(Boolean);
    const score = rated.length ? Math.round((rated.reduce((s, r) => s + INSPECTION_STATUS[r!.s].weight, 0) / rated.length) * 100) : null;
    return { key: g.key, label: g.label, score, rated: rated.length, total: g.items.length };
  });
  const all = Object.values(items);
  const total = all.length ? Math.round((all.reduce((s, r) => s + INSPECTION_STATUS[r.s].weight, 0) / all.length) * 100) : null;
  return { total, groups, rated: all.length };
}

/** Item dengan catatan (minor/fix) untuk ditampilkan jujur ke pembeli. */
export function inspectionFindings(insp: Inspection) {
  const items = insp.items ?? {};
  const out: { label: string; group: string; status: InspectionStatus; note?: string }[] = [];
  for (const g of INSPECTION_GROUPS) {
    for (const [k, label] of g.items) {
      const r = items[k];
      if (r && r.s !== "ok") out.push({ label, group: g.label, status: r.s, note: r.n });
    }
  }
  return out;
}
