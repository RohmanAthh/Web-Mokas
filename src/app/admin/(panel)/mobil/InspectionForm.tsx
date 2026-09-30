"use client";

import { useActionState, useState } from "react";
import { FormAlert } from "@/components/forms";
import { INSPECTION_GROUPS, INSPECTION_ITEM_COUNT, INSPECTION_STATUS, inspectionScore, type Inspection, type InspectionStatus } from "@/lib/inspection";
import { saveInspection } from "../../actions";

const OPTIONS = Object.entries(INSPECTION_STATUS) as [InspectionStatus, (typeof INSPECTION_STATUS)[InspectionStatus]][];
const SEG: Record<InspectionStatus, string> = {
  ok: "peer-checked:bg-emerald-600 peer-checked:text-white",
  minor: "peer-checked:bg-amber-500 peer-checked:text-white",
  fix: "peer-checked:bg-red-600 peer-checked:text-white",
};

export function InspectionForm({ carId, inspection }: { carId: number; inspection: Inspection }) {
  const [state, action, pending] = useActionState(saveInspection, {});
  // Status terkontrol agar skor langsung terlihat & tidak hilang saat form di-reset React
  const [items, setItems] = useState<Record<string, InspectionStatus>>(() =>
    Object.fromEntries(Object.entries(inspection.items ?? {}).map(([k, v]) => [k, v.s])),
  );
  const preview = inspectionScore({ items: Object.fromEntries(Object.entries(items).map(([k, s]) => [k, { s }])) });

  const setAll = (s: InspectionStatus) =>
    setItems(Object.fromEntries(INSPECTION_GROUPS.flatMap((g) => g.items.map(([k]) => [k, s]))));

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="id" value={carId} />
      <div className="flex flex-wrap items-center gap-3">
        <span className={`badge text-sm ${preview.total === null ? "bg-slate-100 text-slate-500" : preview.total >= 90 ? "bg-emerald-100 text-emerald-800" : preview.total >= 75 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-700"}`}>
          Skor: {preview.total ?? "—"}/100 · {preview.rated}/{INSPECTION_ITEM_COUNT} dinilai
        </span>
        <button type="button" onClick={() => setAll("ok")} className="btn-secondary btn-sm">Tandai semua baik</button>
        <button type="button" onClick={() => setItems({})} className="btn-sm btn text-slate-500 hover:text-slate-900">Kosongkan</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="insp-date" className="label">Tanggal inspeksi</label>
          <input id="insp-date" name="date" type="date" defaultValue={inspection.date ?? ""} className="input" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="insp-by" className="label">Inspektor</label>
          <input id="insp-by" name="inspector" defaultValue={inspection.inspector ?? ""} className="input" placeholder="Nama teknisi" />
        </div>
      </div>

      {INSPECTION_GROUPS.map((g) => (
        <fieldset key={g.key} className="rounded-xl border border-slate-200">
          <legend className="ml-3 px-1 text-sm font-semibold">{g.label}</legend>
          <div className="divide-y divide-slate-100">
            {g.items.map(([key, label]) => (
              <div key={key} className="grid gap-2 px-4 py-2.5 sm:grid-cols-[1fr_auto_1.2fr] sm:items-center">
                <span className="text-sm">{label}</span>
                <div className="inline-flex overflow-hidden rounded-lg border border-slate-300 text-xs font-medium">
                  {OPTIONS.map(([s, meta], i) => (
                    <label key={s} className={`cursor-pointer ${i > 0 ? "border-l border-slate-300" : ""}`}>
                      <input
                        type="radio"
                        name={`s_${key}`}
                        value={s}
                        checked={items[key] === s}
                        onChange={() => setItems({ ...items, [key]: s })}
                        className="peer sr-only"
                      />
                      <span className={`block px-2.5 py-1.5 hover:bg-slate-50 ${SEG[s]}`}>{meta.label}</span>
                    </label>
                  ))}
                </div>
                <input
                  name={`n_${key}`}
                  defaultValue={inspection.items?.[key]?.n ?? ""}
                  className="input py-1.5 text-xs"
                  placeholder={items[key] && items[key] !== "ok" ? "Catatan (tampil ke pembeli)" : "Catatan (opsional)"}
                  aria-label={`Catatan ${label}`}
                />
              </div>
            ))}
          </div>
        </fieldset>
      ))}

      <div>
        <label htmlFor="insp-summary" className="label">Ringkasan untuk pembeli</label>
        <textarea id="insp-summary" name="summary" rows={3} defaultValue={inspection.summary ?? ""} className="input" placeholder="Mis. Kondisi sangat terawat, hanya baret halus di bumper belakang." />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button className="btn-primary" disabled={pending}>{pending ? "Menyimpan..." : "Simpan laporan inspeksi"}</button>
        <div className="flex-1"><FormAlert state={state} /></div>
      </div>
    </form>
  );
}
