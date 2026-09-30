import { tanggal } from "@/lib/format";
import { INSPECTION_ITEM_COUNT, INSPECTION_STATUS, inspectionFindings, inspectionScore, type Inspection } from "@/lib/inspection";

function scoreColor(s: number) {
  return s >= 90 ? "bg-nb-green" : s >= 75 ? "bg-nb-lemon" : "bg-nb-pink";
}

/** Laporan inspeksi publik: skor total, skor per kategori, dan temuan yang jujur ditampilkan. */
export function InspectionReport({ inspection }: { inspection: Inspection }) {
  const { total, groups, rated } = inspectionScore(inspection);
  if (total === null) {
    return <p className="font-mono text-sm">Laporan inspeksi unit ini sedang disiapkan. Tanyakan hasil inspeksinya via WhatsApp.</p>;
  }
  const findings = inspectionFindings(inspection);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className={`flex h-28 w-28 flex-col items-center justify-center border-2 border-ink shadow-[4px_4px_0_0_var(--color-ink)] ${scoreColor(total)}`}>
          <span className="text-5xl leading-none font-bold">{total}</span>
          <span className="font-mono text-[10px] font-bold uppercase">/ 100</span>
        </div>
        <div className="font-mono text-sm">
          <p><b>{rated}</b> dari {INSPECTION_ITEM_COUNT} poin utama dinilai{inspection.date ? ` · ${tanggal(inspection.date)}` : ""}{inspection.inspector ? ` · oleh ${inspection.inspector}` : ""}</p>
          {inspection.summary && <p className="mt-2 font-grotesk text-[15px]">&ldquo;{inspection.summary}&rdquo;</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {groups.filter((g) => g.score !== null).map((g) => (
          <div key={g.key} className="border-2 border-ink bg-white p-2.5">
            <div className="flex items-baseline justify-between gap-1">
              <span className="font-mono text-[11px] font-bold uppercase">{g.label}</span>
              <span className="font-bold">{g.score}</span>
            </div>
            <div className="mt-1.5 h-2.5 border-2 border-ink bg-paper">
              <div className={`h-full ${scoreColor(g.score!)}`} style={{ width: `${g.score}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div>
        <p className="nb-label">Temuan_</p>
        {findings.length === 0 ? (
          <p className="border-2 border-ink bg-nb-green px-3 py-2 font-mono text-sm font-bold">✓ Semua poin yang diperiksa dalam kondisi baik.</p>
        ) : (
          <ul className="divide-y-2 divide-ink border-2 border-ink bg-white">
            {findings.map((f) => (
              <li key={f.label} className="flex items-start gap-3 px-3 py-2">
                <span className={`nb-sticker shrink-0 ${INSPECTION_STATUS[f.status].className}`}>{INSPECTION_STATUS[f.status].short}</span>
                <span className="text-sm">
                  <b>{f.label}</b> <span className="font-mono text-xs text-ink/60">({f.group})</span>
                  {f.note && <span className="block font-mono text-xs">{f.note}</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 font-mono text-[11px] text-ink/60">Kami tampilkan temuan apa adanya. Datang langsung untuk cek bersama teknisi kami.</p>
      </div>
    </div>
  );
}
