import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CarCard } from "@/components/CarCard";
import { allListedCars } from "@/lib/cars";
import { rupiah } from "@/lib/format";
import { parseAnswers, recommend, SEAT_OPTIONS, USES } from "@/lib/recommend";
import { waLink } from "@/lib/site";

export const metadata: Metadata = { title: "Rekomendasi Mobil", robots: { index: false } };

export default async function QuizResultPage({ searchParams }: PageProps<"/cari-cocok/hasil">) {
  const a = parseAnswers(await searchParams);
  if (!a) redirect("/cari-cocok");
  const matches = recommend(allListedCars(), a);
  const good = matches.filter((m) => m.pct >= 60);
  const summary = `${USES[a.use].label} · ${SEAT_OPTIONS[String(a.seats) as keyof typeof SEAT_OPTIONS]} · ${a.mode === "cicilan" ? `cicilan ≤ ${rupiah(a.budget)}/bln` : `≤ ${rupiah(a.budget)}`}${a.trans ? ` · ${a.trans === "Otomatis" ? "matic" : "manual"}` : ""}`;

  return (
    <div className="container-page py-8 sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="nb-sticker bg-white">{summary}</p>
          <h1 className="mt-4 text-5xl leading-[0.9] font-bold tracking-tighter uppercase sm:text-6xl">
            {good.length > 0 ? <>{good.length} mobil <span className="bg-nb-green px-2">cocok</span></> : <>Belum ada yang <span className="bg-nb-pink px-2">pas</span></>}
          </h1>
        </div>
        <Link href="/cari-cocok" className="nb-btn bg-white">↺ Ulangi kuis</Link>
      </div>

      {good.length === 0 && (
        <div className="nb-box mt-6 bg-nb-lemon p-5 font-mono text-sm">
          Unit yang benar-benar pas belum ada di stok. Di bawah ini yang paling mendekati — atau{" "}
          <a href={waLink(`Halo, tolong carikan mobil: ${summary}`)} target="_blank" rel="noopener" className="font-bold underline">minta kami carikan via WhatsApp →</a>
        </div>
      )}

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {matches.map((m, i) => (
          <div key={m.car.id} className="flex flex-col">
            <div className={`flex items-center justify-between border-2 border-b-0 border-ink px-3 py-2 ${m.pct >= 80 ? "bg-nb-green" : m.pct >= 60 ? "bg-nb-lemon" : "bg-white"}`}>
              <span className="font-mono text-xs font-bold uppercase">#{i + 1} kecocokan</span>
              <span className="text-2xl font-bold">{m.pct}%</span>
            </div>
            <CarCard car={m.car} index={i} />
            <ul className="mt-3 space-y-1 font-mono text-xs">
              {m.reasons.map((r) => <li key={r}>✓ {r}</li>)}
              {m.warnings.map((w) => <li key={w} className="text-ink/60">! {w}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
