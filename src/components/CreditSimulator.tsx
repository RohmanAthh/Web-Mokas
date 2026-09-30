"use client";

import { useActionState, useState } from "react";
import { submitLead, type FormState } from "@/app/actions";
import { CREDIT } from "@/lib/credit";
import { flatInstallment, rupiah } from "@/lib/format";
import { Honeypot } from "./forms";
import { NbAlert, NbConsent, NbField } from "./nb";

export function CreditSimulator({ carId, price }: { carId: number; price: number }) {
  const minDp = Math.ceil((price * CREDIT.minDpRatio) / 1_000_000) * 1_000_000;
  const [dp, setDp] = useState(Math.max(minDp, Math.round((price * 0.3) / 1_000_000) * 1_000_000));
  const [tenor, setTenor] = useState(48);
  const [applying, setApplying] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(submitLead, {});
  const monthly = flatInstallment(price, dp, tenor, CREDIT.flatRate);
  const e = state.errors ?? {};
  const v = state.values ?? {};

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
      <div className="space-y-5">
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <label htmlFor="dp" className="nb-label">DP_</label>
            <span className="font-mono text-sm font-bold">{rupiah(dp)} <span className="bg-ink px-1 text-nb-yellow">{Math.round((dp / price) * 100)}%</span></span>
          </div>
          <input
            id="dp"
            type="range"
            min={minDp}
            max={Math.round(price * 0.8)}
            step={1_000_000}
            value={dp}
            onChange={(ev) => setDp(Number(ev.target.value))}
            className="h-3 w-full cursor-pointer appearance-none border-2 border-ink bg-white accent-ink [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-ink [&::-webkit-slider-thumb]:bg-nb-pink"
          />
          <p className="mt-1 font-mono text-[11px]">min. {Math.round(CREDIT.minDpRatio * 100)}% = {rupiah(minDp)}</p>
        </div>
        <fieldset>
          <legend className="nb-label">Tenor_</legend>
          <div className="grid grid-cols-5 border-2 border-ink bg-white">
            {CREDIT.tenors.map((t, i) => (
              <button
                key={t}
                type="button"
                onClick={() => setTenor(t)}
                aria-pressed={tenor === t}
                className={`py-2.5 font-mono text-sm font-bold ${i > 0 ? "border-l-2 border-ink" : ""} ${tenor === t ? "bg-ink text-nb-yellow" : "hover:bg-nb-lemon"}`}
              >
                {t / 12}th
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="flex flex-col border-2 border-ink bg-ink p-4 text-white">
        <p className="font-mono text-xs text-nb-yellow uppercase">Cicilan / bulan_</p>
        <p className="mt-1 text-3xl font-bold tracking-tight">{rupiah(Math.round(monthly / 1000) * 1000)}</p>
        <p className="mt-2 font-mono text-[11px] leading-relaxed text-white/60">
          Pinjaman {rupiah(price - dp)} · flat {CREDIT.flatRate}%/th · belum termasuk asuransi & admin
        </p>
        {!applying && !state.ok && (
          <button type="button" className="nb-btn mt-4 border-white bg-nb-yellow text-ink shadow-[3px_3px_0_0_#fff] hover:shadow-[5px_5px_0_0_#fff]" onClick={() => setApplying(true)}>
            Ajukan kredit →
          </button>
        )}
      </div>

      {(applying || state.ok) && (
        <div className="lg:col-span-2">
          {state.ok ? (
            <NbAlert state={state} />
          ) : (
            <form action={action} className="grid gap-4 border-2 border-dashed border-ink bg-nb-lemon/40 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <input type="hidden" name="type" value="credit" />
              <input type="hidden" name="carId" value={carId} />
              <input type="hidden" name="dp" value={dp} />
              <input type="hidden" name="tenor" value={tenor} />
              <Honeypot />
              <NbField label="Nama" name="credit-name" error={e.name}>
                <input id="credit-name" name="name" defaultValue={v.name} className="nb-input" required autoComplete="name" />
              </NbField>
              <NbField label="WhatsApp" name="credit-phone" error={e.phone}>
                <input id="credit-phone" name="phone" defaultValue={v.phone} className="nb-input" required inputMode="tel" placeholder="08xxxxxxxxxx" />
              </NbField>
              <button className="nb-btn bg-nb-pink" disabled={pending}>{pending ? "Kirim..." : "Kirim"}</button>
              <div className="sm:col-span-3"><NbConsent id="credit-consent" error={e.consent} /></div>
              {state.message && <div className="sm:col-span-3"><NbAlert state={state} /></div>}
            </form>
          )}
        </div>
      )}
    </div>
  );
}
