import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { avgDaysToSell, carTitle, salesByMonth, stockAging } from "@/lib/cars";
import { rupiah, rupiahShort } from "@/lib/format";
import { leadFunnel } from "@/lib/leads";
import { LEAD_TYPES } from "@/lib/site";

export const metadata: Metadata = { title: "Laporan" };

const monthLabel = (ym: string) => new Date(`${ym}-01T00:00:00`).toLocaleDateString("id-ID", { month: "short", year: "2-digit" });

/** Grafik batang satu seri: batang tipis, ujung membulat 4px, label nilai di atas, tooltip per batang. */
function BarChart({ title, data, format }: { title: string; data: { label: string; value: number }[]; format: (n: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <figure className="card p-5">
      <figcaption className="text-sm font-semibold">{title}</figcaption>
      <div className="mt-4 flex h-44 items-end gap-[2px] border-b border-slate-200" role="img" aria-label={`${title}: ${data.map((d) => `${d.label} ${format(d.value)}`).join(", ")}`}>
        {data.map((d) => (
          <div key={d.label} className="group relative flex h-full flex-1 flex-col items-center justify-end px-2" title={`${d.label}: ${format(d.value)}`}>
            <span className="mb-1 text-[11px] font-medium text-slate-600">{d.value ? format(d.value) : ""}</span>
            <div
              className="w-full max-w-10 rounded-t-[4px] bg-brand-600 transition group-hover:bg-brand-700"
              style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value ? 2 : 0 }}
            />
            <span className="pointer-events-none absolute -top-2 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-full rounded-md bg-slate-900 px-2 py-1 text-xs whitespace-nowrap text-white group-hover:block">
              {d.label} · {format(d.value)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-[2px]">
        {data.map((d) => <span key={d.label} className="flex-1 text-center text-[11px] text-slate-500">{d.label}</span>)}
      </div>
    </figure>
  );
}

export default async function ReportPage() {
  await requireUser("reports");
  const sales = salesByMonth(6);
  const aging = stockAging();
  const funnel = leadFunnel();
  const avgDays = avgDaysToSell();

  const totalUnits = sales.reduce((s, m) => s + m.units, 0);
  const totalRevenue = sales.reduce((s, m) => s + m.revenue, 0);
  const totalMargin = sales.reduce((s, m) => s + m.margin, 0);
  const withCost = sales.reduce((s, m) => s + m.with_cost, 0);

  const buckets = [
    { label: "0–30 hari", test: (d: number) => d <= 30, className: "bg-emerald-100 text-emerald-800" },
    { label: "31–60 hari", test: (d: number) => d > 30 && d <= 60, className: "bg-amber-100 text-amber-800" },
    { label: "61–90 hari", test: (d: number) => d > 60 && d <= 90, className: "bg-orange-100 text-orange-800" },
    { label: "> 90 hari", test: (d: number) => d > 90, className: "bg-red-100 text-red-700" },
  ].map((b) => {
    const items = aging.filter((a) => b.test(a.ageDays));
    return { ...b, count: items.length, value: items.reduce((s, a) => s + a.car.price, 0) };
  });

  const stats = [
    ["Unit terjual (6 bln)", String(totalUnits), avgDays !== null ? `rata-rata laku dalam ${avgDays} hari` : "belum ada penjualan"],
    ["Omzet (6 bln)", rupiahShort(totalRevenue), `${totalUnits ? rupiahShort(totalRevenue / totalUnits) : "-"} per unit`],
    ["Margin kotor", rupiahShort(totalMargin), withCost < totalUnits ? `dari ${withCost}/${totalUnits} unit yang modalnya diisi` : "setelah modal & rekondisi"],
    ["Unit di stok", String(aging.length), `${rupiahShort(aging.reduce((s, a) => s + a.car.price, 0))} nilai pajang`],
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Laporan</h1>
        <p className="text-sm text-slate-500">Penjualan 6 bulan terakhir, umur stok, dan konversi leads. Margin memakai harga modal + biaya rekondisi yang diisi di data mobil.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value, sub]) => (
          <div key={label} className="card p-5">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold">{value}</p>
            <p className="mt-1 text-xs text-slate-500">{sub}</p>
          </div>
        ))}
      </div>

      {/* Dua ukuran berbeda skala → dua grafik terpisah, bukan dual-axis */}
      <div className="grid gap-6 lg:grid-cols-2">
        <BarChart title="Unit terjual per bulan" data={sales.map((m) => ({ label: monthLabel(m.ym), value: m.units }))} format={(n) => String(n)} />
        <BarChart title="Omzet per bulan" data={sales.map((m) => ({ label: monthLabel(m.ym), value: m.revenue }))} format={(n) => rupiahShort(n).replace("Rp ", "")} />
      </div>

      <details className="card group">
        <summary className="cursor-pointer px-5 py-3 text-sm font-medium text-slate-600">Lihat tabel penjualan per bulan</summary>
        <div className="overflow-x-auto border-t border-slate-100">
          <table className="data-table">
            <thead><tr><th>Bulan</th><th>Unit</th><th>Omzet</th><th>Margin kotor</th></tr></thead>
            <tbody>
              {sales.map((m) => (
                <tr key={m.ym}><td>{monthLabel(m.ym)}</td><td>{m.units}</td><td>{rupiah(m.revenue)}</td><td>{m.with_cost ? rupiah(m.margin) : "-"}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      {/* Umur stok */}
      <section className="card overflow-hidden" id="umur-stok">
        <div className="px-5 py-4">
          <h2 className="font-semibold">Umur stok</h2>
          <p className="text-sm text-slate-500">Unit yang lama terpajang mengikat modal. Pertimbangkan turun harga untuk unit &gt; 60 hari dengan sedikit leads.</p>
        </div>
        <div className="grid gap-3 px-5 pb-5 sm:grid-cols-4">
          {buckets.map((b) => (
            <div key={b.label} className="rounded-xl border border-slate-200 p-3">
              <span className={`badge ${b.className}`}>{b.label}</span>
              <p className="mt-2 text-xl font-bold">{b.count} unit</p>
              <p className="text-xs text-slate-500">{rupiahShort(b.value)}</p>
            </div>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Mobil</th><th>Umur</th><th>Harga</th><th>Margin rencana</th><th>Dilihat</th><th>Leads</th><th>Saran</th></tr></thead>
            <tbody>
              {[...aging].sort((a, b) => b.ageDays - a.ageDays).map(({ car, ageDays, leadCount }) => {
                const margin = car.purchase_price ? car.price - car.purchase_price - car.recon_cost : null;
                const hint = ageDays > 60 && leadCount <= 1
                  ? "Turunkan harga / promosikan"
                  : ageDays > 60
                    ? "Follow-up leads yang ada"
                    : car.views > 150 && leadCount === 0
                      ? "Banyak dilihat, 0 leads — cek harga/foto"
                      : "";
                return (
                  <tr key={car.id}>
                    <td><Link href={`/admin/mobil/${car.id}`} className="font-medium hover:text-brand-600">{carTitle(car)}</Link></td>
                    <td><span className={`badge ${buckets.find((b) => b.test(ageDays))!.className}`}>{ageDays} hari</span></td>
                    <td className="whitespace-nowrap">{rupiah(car.price)}</td>
                    <td className="whitespace-nowrap">{margin === null ? <span className="text-xs text-slate-400">-</span> : <span className={margin >= 0 ? "text-emerald-700" : "text-red-600"}>{rupiah(margin)}</span>}</td>
                    <td>{car.views}</td>
                    <td>{leadCount}</td>
                    <td className="text-xs text-slate-600">{hint}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Konversi leads */}
      <section className="card overflow-hidden">
        <div className="px-5 py-4">
          <h2 className="font-semibold">Konversi leads (90 hari)</h2>
          <p className="text-sm text-slate-500">Persentase lead yang ditandai &quot;Deal&quot;.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Jenis</th><th>Masuk</th><th>Deal</th><th>Batal</th><th>Masih proses</th><th className="w-1/3">Konversi</th></tr></thead>
            <tbody>
              {funnel.map((f) => {
                const pct = f.total ? Math.round((f.won / f.total) * 100) : 0;
                return (
                  <tr key={f.type}>
                    <td className="font-medium">{LEAD_TYPES[f.type]}</td>
                    <td>{f.total}</td>
                    <td>{f.won}</td>
                    <td>{f.lost}</td>
                    <td>{f.total - f.won - f.lost}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-600" style={{ width: `${pct}%` }} /></div>
                        <span className="w-10 text-right text-xs font-medium">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {funnel.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-slate-500">Belum ada leads 90 hari terakhir.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
