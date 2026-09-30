"use client";

import { useActionState, useState } from "react";
import { Field, FormAlert } from "@/components/forms";
import type { Car } from "@/lib/car-utils";
import { rupiah } from "@/lib/format";
import { BODY_TYPES, CAR_STATUSES, FUELS, TRANSMISSIONS } from "@/lib/site";
import { saveCar } from "../../actions";

export function CarForm({ car, canCost = false }: { car?: Car; canCost?: boolean }) {
  const [state, action, pending] = useActionState(saveCar, {});
  const [price, setPrice] = useState(car?.price ?? 0);
  const [cost, setCost] = useState(car?.purchase_price ?? 0);
  const [recon, setRecon] = useState(car?.recon_cost ?? 0);
  const [status, setStatus] = useState<string>(car?.status ?? "available");
  const margin = cost ? price - cost - recon : null;
  const [previews, setPreviews] = useState<string[]>([]);
  const e = state.errors ?? {};
  const v = state.values;
  const year = new Date().getFullYear();

  return (
    <form action={action} className="space-y-6">
      {car && <input type="hidden" name="id" value={car.id} />}

      <section className="card space-y-4 p-6">
        <h2 className="font-semibold">Identitas unit</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Merek *" name="brand" error={e.brand}>
            <input id="brand" name="brand" defaultValue={v ? v.brand : car?.brand} className="input" required list="brand-list" />
            <datalist id="brand-list">
              {["Toyota", "Honda", "Daihatsu", "Suzuki", "Mitsubishi", "Nissan", "Mazda", "Hyundai", "Wuling", "BMW", "Mercedes-Benz"].map((b) => <option key={b} value={b} />)}
            </datalist>
          </Field>
          <Field label="Model *" name="model" error={e.model}>
            <input id="model" name="model" defaultValue={v ? v.model : car?.model} className="input" required placeholder="Avanza" />
          </Field>
          <Field label="Varian" name="variant" error={e.variant}>
            <input id="variant" name="variant" defaultValue={v ? v.variant : car?.variant} className="input" placeholder="1.5 G CVT" />
          </Field>
          <Field label="Tahun *" name="year" error={e.year}>
            <select id="year" name="year" defaultValue={v ? v.year : car?.year ?? ""} className="input" required>
              <option value="" disabled>Pilih</option>
              {Array.from({ length: 30 }, (_, i) => year + 1 - i).map((y) => <option key={y}>{y}</option>)}
            </select>
          </Field>
          <Field label="Warna" name="color" error={e.color}>
            <input id="color" name="color" defaultValue={v ? v.color : car?.color} className="input" placeholder="Putih" />
          </Field>
          <Field label="Plat nomor (wilayah)" name="plate" error={e.plate}>
            <input id="plate" name="plate" defaultValue={v ? v.plate : car?.plate} className="input" placeholder="B (Jakarta)" />
          </Field>
        </div>
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="font-semibold">Harga & spesifikasi</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Harga jual (Rp) *" name="price" error={e.price} hint={price ? rupiah(price) : undefined}>
            <input id="price" name="price" type="number" min={0} step={500000} defaultValue={v ? v.price : car?.price} onChange={(ev) => setPrice(Number(ev.target.value))} className="input" required />
          </Field>
          <Field label="Kilometer *" name="mileage" error={e.mileage}>
            <input id="mileage" name="mileage" type="number" min={0} defaultValue={v ? v.mileage : car?.mileage} className="input" required />
          </Field>
          <Field label="Pajak berlaku s/d" name="tax_until" error={e.tax_until}>
            <input id="tax_until" name="tax_until" type="date" defaultValue={v ? v.tax_until : car?.tax_until ?? ""} className="input" />
          </Field>
          <Field label="Transmisi *" name="transmission" error={e.transmission}>
            <select id="transmission" name="transmission" defaultValue={v ? v.transmission : car?.transmission ?? "Otomatis"} className="input">
              {TRANSMISSIONS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Bahan bakar *" name="fuel" error={e.fuel}>
            <select id="fuel" name="fuel" defaultValue={v ? v.fuel : car?.fuel ?? "Bensin"} className="input">
              {FUELS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Tipe bodi *" name="body_type" error={e.body_type}>
            <select id="body_type" name="body_type" defaultValue={v ? v.body_type : car?.body_type ?? "MPV"} className="input">
              {BODY_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Kapasitas mesin (cc)" name="engine_cc" error={e.engine_cc}>
            <input id="engine_cc" name="engine_cc" type="number" min={0} defaultValue={v ? v.engine_cc : car?.engine_cc ?? ""} className="input" placeholder="1496" />
          </Field>
          <Field label="Jumlah kursi" name="seats" error={e.seats}>
            <input id="seats" name="seats" type="number" min={1} max={20} defaultValue={v ? v.seats : car?.seats ?? 5} className="input" />
          </Field>
        </div>
      </section>

      {canCost && (
      <section className="card space-y-4 border-dashed bg-slate-50 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Modal & margin</h2>
          <span className="badge bg-slate-200 text-slate-700">Internal — tidak tampil di situs</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Harga beli / modal (Rp)" name="purchase_price" error={e.purchase_price}>
            <input id="purchase_price" name="purchase_price" type="number" min={0} step={500000} defaultValue={v ? v.purchase_price : car?.purchase_price ?? ""} onChange={(ev) => setCost(Number(ev.target.value))} className="input" />
          </Field>
          <Field label="Biaya rekondisi (Rp)" name="recon_cost" error={e.recon_cost} hint="Servis, cat, detailing, dll.">
            <input id="recon_cost" name="recon_cost" type="number" min={0} step={100000} defaultValue={v ? v.recon_cost : car?.recon_cost || ""} onChange={(ev) => setRecon(Number(ev.target.value))} className="input" />
          </Field>
          <div>
            <p className="label">Margin rencana</p>
            <p className={`rounded-lg px-3 py-2 text-sm font-semibold ${margin === null ? "bg-white text-slate-400" : margin >= 0 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700"}`}>
              {margin === null ? "Isi harga modal" : `${rupiah(margin)} (${price ? Math.round((margin / price) * 100) : 0}%)`}
            </p>
          </div>
        </div>
        {status === "sold" && (
          <Field label="Harga terjual (Rp)" name="sold_price" error={e.sold_price} hint="Kosongkan = sama dengan harga jual">
            <input id="sold_price" name="sold_price" type="number" min={0} step={500000} defaultValue={v ? v.sold_price : car?.sold_price ?? ""} className="input max-w-xs" />
          </Field>
        )}
      </section>
      )}

      <section className="card space-y-4 p-6">
        <h2 className="font-semibold">Deskripsi</h2>
        <Field label="Deskripsi kondisi" name="description" error={e.description}>
          <textarea id="description" name="description" rows={6} defaultValue={v ? v.description : car?.description} className="input" placeholder="Riwayat servis, kondisi interior/eksterior, kelengkapan surat..." />
        </Field>
        <Field label="Fitur & kelengkapan" name="features" error={e.features} hint="Satu fitur per baris">
          <textarea id="features" name="features" rows={5} defaultValue={v ? v.features : car?.features.join("\n")} className="input" placeholder={"Kamera mundur\nKeyless entry\nVelg racing"} />
        </Field>
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="font-semibold">{car ? "Tambah foto" : "Foto"}</h2>
        <input
          type="file"
          name="images"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
          onChange={(ev) => setPreviews(Array.from(ev.target.files ?? []).map((f) => URL.createObjectURL(f)))}
        />
        <p className="text-xs text-slate-500">JPG/PNG/WEBP, maks. 10 MB per foto, maks. 12 foto. Otomatis diperkecil, dikompres ke WebP & diberi watermark. Foto pertama menjadi sampul.</p>
        {previews.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {previews.map((src) => <img key={src} src={src} alt="" className="h-20 w-28 rounded-lg object-cover" />)}
          </div>
        )}
      </section>

      <section className="card flex flex-wrap items-end gap-6 p-6">
        <Field label="Status" name="status" error={e.status}>
          <select id="status" name="status" defaultValue={v ? v.status : car?.status ?? "available"} onChange={(ev) => setStatus(ev.target.value)} className="input w-44">
            {Object.entries(CAR_STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </Field>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input type="checkbox" name="featured" defaultChecked={v ? v.featured === "on" : car?.featured} className="h-4 w-4 accent-brand-600" />
          Tampilkan sebagai mobil pilihan di beranda
        </label>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button className="btn-primary" disabled={pending}>{pending ? "Menyimpan..." : car ? "Simpan perubahan" : "Simpan & publikasikan"}</button>
        <div className="flex-1"><FormAlert state={state} /></div>
      </div>
    </form>
  );
}
