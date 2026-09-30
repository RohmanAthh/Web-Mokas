import type { FormState } from "@/app/actions";

/** Palet kotak bento — dipakai bergiliran agar grid terasa hidup. */
export const TILE_COLORS = ["bg-nb-cyan", "bg-nb-pink", "bg-nb-green", "bg-nb-violet", "bg-nb-orange", "bg-nb-lemon"] as const;
export const tileColor = (i: number) => TILE_COLORS[i % TILE_COLORS.length];

export function NbField({
  label,
  name,
  error,
  hint,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={name} className="nb-label">{label}_</label>
      {children}
      {hint && !error && <p className="mt-1 font-mono text-[11px] text-ink/60">{hint}</p>}
      {error && <p className="mt-1.5 inline-block bg-ink px-1.5 py-0.5 font-mono text-[11px] font-bold text-nb-pink">! {error}</p>}
    </div>
  );
}

/** Centang persetujuan pemrosesan data pribadi (UU PDP) — wajib di setiap form publik. */
export function NbConsent({ error, id = "consent" }: { error?: string; id?: string }) {
  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed">
        <input id={id} name="consent" type="checkbox" required className="mt-0.5 h-4 w-4 shrink-0 accent-ink" />
        <span>
          Saya setuju data saya (nama, nomor WhatsApp, dan isian form ini) digunakan untuk menindaklanjuti permintaan saya,
          sesuai <a href="/kebijakan-privasi" target="_blank" className="font-bold underline">Kebijakan Privasi</a>.
        </span>
      </label>
      {error && <p className="mt-1.5 inline-block bg-ink px-1.5 py-0.5 font-mono text-[11px] font-bold text-nb-pink">! {error}</p>}
    </div>
  );
}

export function NbAlert({ state }: { state: FormState }) {
  if (!state.message) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className={`border-2 border-ink px-3 py-2.5 font-mono text-sm font-bold ${state.ok ? "bg-nb-green" : "bg-nb-pink"}`}
    >
      {state.ok ? "✓ " : "✕ "}
      {state.message}
    </div>
  );
}
