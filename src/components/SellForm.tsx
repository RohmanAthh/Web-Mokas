"use client";

import { useActionState } from "react";
import { submitSellRequest, type FormState } from "@/app/actions";
import { Honeypot } from "./forms";
import { NbAlert, NbConsent, NbField } from "./nb";

export function SellForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(submitSellRequest, {});
  const e = state.errors ?? {};
  const v = state.values ?? {};
  const year = new Date().getFullYear();

  if (state.ok) {
    return (
      <div className="p-6">
        <p className="text-5xl font-bold">✓</p>
        <p className="mt-2 text-2xl font-bold uppercase">Beres!</p>
        <div className="mt-4"><NbAlert state={state} /></div>
      </div>
    );
  }

  return (
    <form action={action}>
      <Honeypot />
      <fieldset className="border-b-2 border-ink p-5 sm:p-6">
        <legend className="sr-only">Data mobil</legend>
        <p className="mb-4 flex items-center gap-2 font-bold uppercase"><span className="bg-ink px-2 font-mono text-nb-yellow">01</span> Mobilnya</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <NbField label="Merek" name="brand" error={e.brand}>
            <input id="brand" name="brand" defaultValue={v.brand} className="nb-input" required placeholder="toyota" />
          </NbField>
          <NbField label="Model & varian" name="model" error={e.model}>
            <input id="model" name="model" defaultValue={v.model} className="nb-input" required placeholder="avanza 1.3 g" />
          </NbField>
          <NbField label="Tahun" name="year" error={e.year}>
            <select id="year" name="year" className="nb-input" required defaultValue={v.year ?? ""}>
              <option value="" disabled>pilih tahun</option>
              {Array.from({ length: 25 }, (_, i) => year - i).map((y) => <option key={y}>{y}</option>)}
            </select>
          </NbField>
          <NbField label="Kilometer" name="mileage" error={e.mileage}>
            <input id="mileage" name="mileage" defaultValue={v.mileage} type="number" min={0} className="nb-input" required placeholder="65000" />
          </NbField>
          <NbField label="Harga harapan (opsional)" name="askingPrice" error={e.askingPrice} hint="rupiah, tanpa titik">
            <input id="askingPrice" name="askingPrice" defaultValue={v.askingPrice} type="number" min={0} step={1000000} className="nb-input" placeholder="150000000" />
          </NbField>
          <NbField label="Kota" name="city" error={e.city}>
            <input id="city" name="city" defaultValue={v.city} className="nb-input" placeholder="jakarta selatan" />
          </NbField>
        </div>
      </fieldset>
      <fieldset className="p-5 sm:p-6">
        <legend className="sr-only">Data pemilik</legend>
        <p className="mb-4 flex items-center gap-2 font-bold uppercase"><span className="bg-ink px-2 font-mono text-nb-yellow">02</span> Kamu</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <NbField label="Nama" name="name" error={e.name}>
            <input id="name" name="name" defaultValue={v.name} className="nb-input" required autoComplete="name" />
          </NbField>
          <NbField label="WhatsApp" name="phone" error={e.phone}>
            <input id="phone" name="phone" defaultValue={v.phone} className="nb-input" required inputMode="tel" placeholder="08xxxxxxxxxx" />
          </NbField>
          <NbField label="Email (opsional)" name="email" error={e.email}>
            <input id="email" name="email" defaultValue={v.email} type="email" className="nb-input" autoComplete="email" />
          </NbField>
          <NbField label="Kondisi / catatan" name="message" error={e.message}>
            <input id="message" name="message" defaultValue={v.message} className="nb-input" placeholder="servis rutin, mau tukar tambah SUV" />
          </NbField>
        </div>
        <div className="mt-5 space-y-3">
          <NbConsent error={e.consent} />
          <NbAlert state={state} />
          <button className="nb-btn w-full bg-nb-pink sm:w-auto" disabled={pending}>{pending ? "Mengirim..." : "Minta penawaran →"}</button>
        </div>
      </fieldset>
    </form>
  );
}
