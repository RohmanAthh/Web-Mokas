import type { Metadata } from "next";
import Link from "next/link";
import { monthlyFrom } from "@/components/CarCard";
import { FavButton } from "@/components/GarageButtons";
import { tileColor } from "@/components/nb";
import { carsByIds, carTitle, mediaUrl, priceDrop, type Car } from "@/lib/cars";
import { rupiah, rupiahShort, tanggal } from "@/lib/format";
import { inspectionScore } from "@/lib/inspection";
import { CAR_STATUSES } from "@/lib/site";
import { CompareSync, RemoveFromCompare } from "./CompareSync";

export const metadata: Metadata = { title: "Bandingkan Mobil", robots: { index: false } };

type Row = {
  label: string;
  value: (c: Car) => string;
  /** nilai numerik untuk menandai yang terbaik */
  score?: (c: Car) => number | null;
  best?: "min" | "max";
};

const ROWS: Row[] = [
  { label: "Harga", value: (c) => rupiah(c.price), score: (c) => c.price, best: "min" },
  { label: "Cicilan ±/bln", value: (c) => rupiah(monthlyFrom(c.price)), score: (c) => monthlyFrom(c.price), best: "min" },
  { label: "Tahun", value: (c) => String(c.year), score: (c) => c.year, best: "max" },
  { label: "Kilometer", value: (c) => `${c.mileage.toLocaleString("id-ID")} km`, score: (c) => c.mileage, best: "min" },
  { label: "Skor inspeksi", value: (c) => { const s = inspectionScore(c.inspection).total; return s === null ? "-" : `${s}/100`; }, score: (c) => inspectionScore(c.inspection).total, best: "max" },
  { label: "Transmisi", value: (c) => c.transmission },
  { label: "Bahan bakar", value: (c) => c.fuel },
  { label: "Tipe bodi", value: (c) => c.body_type },
  { label: "Mesin", value: (c) => (c.engine_cc ? `${c.engine_cc.toLocaleString("id-ID")} cc` : "Listrik") },
  { label: "Kursi", value: (c) => `${c.seats} orang`, score: (c) => c.seats, best: "max" },
  { label: "Warna", value: (c) => c.color || "-" },
  { label: "Plat", value: (c) => c.plate || "-" },
  { label: "Pajak s/d", value: (c) => tanggal(c.tax_until) },
  { label: "Status", value: (c) => CAR_STATUSES[c.status].label },
];

function bestIds(cars: Car[], row: Row) {
  if (!row.score || cars.length < 2) return new Set<number>();
  const vals = cars.map((c) => ({ id: c.id, v: row.score!(c) })).filter((x): x is { id: number; v: number } => x.v !== null);
  if (vals.length < 2) return new Set<number>();
  const target = row.best === "min" ? Math.min(...vals.map((x) => x.v)) : Math.max(...vals.map((x) => x.v));
  if (vals.every((x) => x.v === target)) return new Set<number>(); // semua sama → tidak ada pemenang
  return new Set(vals.filter((x) => x.v === target).map((x) => x.id));
}

export default async function ComparePage({ searchParams }: PageProps<"/bandingkan">) {
  const sp = await searchParams;
  const ids = String(sp.ids ?? "").split(",").map(Number).filter((n) => Number.isInteger(n) && n > 0).slice(0, 3);
  const cars = carsByIds(ids);
  const features = [...new Set(cars.flatMap((c) => c.features))];

  return (
    <div className="container-page py-8 sm:py-12">
      <CompareSync ids={cars.map((c) => c.id)} />
      <h1 className="text-5xl leading-[0.9] font-bold tracking-tighter uppercase sm:text-7xl">
        Adu <span className="bg-nb-yellow px-2">head-to-head</span>
      </h1>

      {cars.length < 2 ? (
        <div className="nb-box mt-8 bg-nb-cyan p-8">
          <p className="text-2xl font-bold uppercase">Pilih minimal 2 mobil</p>
          <p className="mt-2 max-w-md font-mono text-sm">Tekan tombol ☐ di kartu mobil (maks. 3), lalu klik &quot;Bandingkan&quot; di bar bawah layar.</p>
          <Link href="/mobil" className="nb-btn mt-5 bg-white">Pilih dari katalog →</Link>
        </div>
      ) : (
        <>
          <p className="mt-4 font-mono text-sm">★ = unggul di baris itu. Geser tabel ke samping di HP.</p>
          <div className="nb-box mt-6 overflow-x-auto bg-white">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr>
                  <th className="w-40 border-r-2 border-b-2 border-ink bg-paper p-3" />
                  {cars.map((c, i) => (
                    <th key={c.id} className={`border-b-2 border-ink p-3 align-top ${i > 0 ? "border-l-2" : ""} ${tileColor(i)}`}>
                      <Link href={`/mobil/${c.slug}`} className="block">
                        <div className="aspect-[4/3] overflow-hidden border-2 border-ink bg-white">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {c.cover && <img src={mediaUrl(c.cover)!} alt="" className="h-full w-full object-cover" />}
                        </div>
                        <p className="mt-2 text-lg leading-tight font-bold uppercase hover:underline">{c.brand} {c.model}</p>
                        <p className="font-mono text-xs font-normal">{c.variant}</p>
                      </Link>
                      <p className="mt-2 text-2xl font-bold">{rupiahShort(c.price)}</p>
                      {priceDrop(c) > 0 && <p className="font-mono text-xs">↓ turun {rupiahShort(priceDrop(c))}</p>}
                      <div className="mt-2 flex items-center gap-2">
                        <FavButton id={c.id} className="h-8 w-8" />
                        <RemoveFromCompare id={c.id} ids={cars.map((x) => x.id)} />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="font-mono text-sm">
                {ROWS.map((row) => {
                  const best = bestIds(cars, row);
                  return (
                    <tr key={row.label}>
                      <th scope="row" className="border-r-2 border-b-2 border-ink bg-paper p-3 text-xs font-bold uppercase">{row.label}</th>
                      {cars.map((c, i) => (
                        <td key={c.id} className={`border-b-2 border-ink p-3 ${i > 0 ? "border-l-2" : ""} ${best.has(c.id) ? "bg-nb-green font-bold" : ""}`}>
                          {row.value(c)} {best.has(c.id) && "★"}
                        </td>
                      ))}
                    </tr>
                  );
                })}
                {features.map((f) => (
                  <tr key={f}>
                    <th scope="row" className="border-r-2 border-b-2 border-ink bg-paper p-3 text-xs font-normal">{f}</th>
                    {cars.map((c, i) => (
                      <td key={c.id} className={`border-b-2 border-ink p-3 text-center ${i > 0 ? "border-l-2" : ""}`}>
                        {c.features.includes(f) ? <span className="font-bold">✓</span> : <span className="text-ink/30">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <th className="border-r-2 border-ink bg-paper p-3" />
                  {cars.map((c, i) => (
                    <td key={c.id} className={`p-3 ${i > 0 ? "border-l-2 border-ink" : ""}`}>
                      <Link href={`/mobil/${c.slug}#test-drive`} className="nb-btn w-full bg-nb-pink">Test drive</Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 font-mono text-xs">Bagikan perbandingan ini: salin alamat halaman — {carTitle(cars[0])} vs {cars.slice(1).map((c) => `${c.brand} ${c.model}`).join(" vs ")}.</p>
        </>
      )}
    </div>
  );
}
