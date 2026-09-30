"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { rupiah } from "@/lib/format";
import { SEAT_OPTIONS, USES, type Use } from "@/lib/recommend";

const STEPS = ["Pemakaian", "Penumpang", "Budget"] as const;
const BUDGET = {
  cicilan: { min: 2_000_000, max: 15_000_000, step: 250_000, initial: 5_000_000 },
  tunai: { min: 100_000_000, max: 600_000_000, step: 10_000_000, initial: 250_000_000 },
};

function Choice({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`nb-box flex flex-col items-start p-5 text-left transition hover:-translate-y-0.5 ${selected ? "bg-nb-yellow shadow-[6px_6px_0_0_var(--color-ink)]" : "bg-white"}`}
    >
      {children}
    </button>
  );
}

export function Quiz() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [use, setUse] = useState<Use | null>(null);
  const [seats, setSeats] = useState<string | null>(null);
  const [mode, setMode] = useState<"cicilan" | "tunai">("cicilan");
  const [budget, setBudget] = useState(BUDGET.cicilan.initial);
  const [trans, setTrans] = useState<"" | "Otomatis" | "Manual">("");

  const canNext = step === 0 ? !!use : step === 1 ? !!seats : true;
  const finish = () => {
    const qs = new URLSearchParams({ use: use!, seats: seats!, mode, budget: String(budget), trans });
    router.push(`/cari-cocok/hasil?${qs}`);
  };
  const b = BUDGET[mode];

  return (
    <div className="nb-box bg-white">
      {/* Progres */}
      <div className="grid grid-cols-3 border-b-2 border-ink">
        {STEPS.map((s, i) => (
          <button
            key={s}
            type="button"
            disabled={i > step}
            onClick={() => setStep(i)}
            className={`py-3 font-mono text-xs font-bold uppercase ${i > 0 ? "border-l-2 border-ink" : ""} ${i === step ? "bg-ink text-nb-yellow" : i < step ? "bg-nb-green" : "bg-paper text-ink/40"}`}
          >
            {String(i + 1).padStart(2, "0")} {s}
          </button>
        ))}
      </div>

      <div className="p-5 sm:p-8">
        {step === 0 && (
          <>
            <h2 className="text-3xl font-bold tracking-tight uppercase sm:text-4xl">Mobilnya paling sering buat apa?</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {(Object.keys(USES) as Use[]).map((k) => (
                <Choice key={k} selected={use === k} onClick={() => { setUse(k); setStep(1); }}>
                  <span className="text-4xl" aria-hidden="true">{USES[k].emoji}</span>
                  <span className="mt-3 text-xl font-bold uppercase">{USES[k].label}</span>
                  <span className="font-mono text-xs">{USES[k].note}</span>
                </Choice>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="text-3xl font-bold tracking-tight uppercase sm:text-4xl">Biasanya berapa orang yang ikut?</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {Object.entries(SEAT_OPTIONS).map(([k, label]) => (
                <Choice key={k} selected={seats === k} onClick={() => { setSeats(k); setStep(2); }}>
                  <span className="font-mono text-5xl font-bold">{k === "7" ? "7" : k === "5" ? "5" : "≤4"}</span>
                  <span className="mt-2 font-bold uppercase">{label}</span>
                </Choice>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-3xl font-bold tracking-tight uppercase sm:text-4xl">Budget-nya berapa?</h2>
            <div className="mt-6 inline-grid grid-cols-2 border-2 border-ink">
              {(["cicilan", "tunai"] as const).map((m, i) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={mode === m}
                  onClick={() => { setMode(m); setBudget(BUDGET[m].initial); }}
                  className={`px-5 py-2 font-bold uppercase ${i > 0 ? "border-l-2 border-ink" : ""} ${mode === m ? "bg-ink text-nb-yellow" : "bg-white"}`}
                >
                  {m === "cicilan" ? "Kredit" : "Tunai"}
                </button>
              ))}
            </div>
            <div className="mt-6">
              <label htmlFor="budget" className="nb-label">{mode === "cicilan" ? "Cicilan maks. per bulan_" : "Harga maks._"}</label>
              <p className="text-4xl font-bold tracking-tighter sm:text-5xl">{rupiah(budget)}{mode === "cicilan" && <span className="text-xl">/bln</span>}</p>
              <input
                id="budget"
                type="range"
                min={b.min}
                max={b.max}
                step={b.step}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="mt-4 h-3 w-full cursor-pointer appearance-none border-2 border-ink bg-white [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-ink [&::-webkit-slider-thumb]:bg-nb-pink"
              />
              <div className="mt-1 flex justify-between font-mono text-[11px]"><span>{rupiah(b.min)}</span><span>{rupiah(b.max)}</span></div>
              {mode === "cicilan" && <p className="mt-2 font-mono text-xs">Asumsi DP 30%, tenor 4 tahun.</p>}
            </div>
            <fieldset className="mt-6">
              <legend className="nb-label">Transmisi_</legend>
              <div className="inline-grid grid-cols-3 border-2 border-ink">
                {(["", "Otomatis", "Manual"] as const).map((t, i) => (
                  <button key={t || "bebas"} type="button" aria-pressed={trans === t} onClick={() => setTrans(t)} className={`px-4 py-2 font-mono text-sm font-bold uppercase ${i > 0 ? "border-l-2 border-ink" : ""} ${trans === t ? "bg-ink text-nb-yellow" : "bg-white"}`}>
                    {t === "Otomatis" ? "Matic" : t || "Bebas"}
                  </button>
                ))}
              </div>
            </fieldset>
          </>
        )}

        <div className="mt-8 flex items-center justify-between gap-3 border-t-2 border-dashed border-ink pt-5">
          <button type="button" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="nb-btn bg-white disabled:invisible">← Kembali</button>
          {step < 2 ? (
            <button type="button" onClick={() => setStep(step + 1)} disabled={!canNext} className="nb-btn bg-nb-yellow">Lanjut →</button>
          ) : (
            <button type="button" onClick={finish} className="nb-btn bg-nb-pink">Lihat hasil →</button>
          )}
        </div>
      </div>
    </div>
  );
}
