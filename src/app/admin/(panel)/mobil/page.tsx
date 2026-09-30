import type { Metadata } from "next";
import Link from "next/link";
import { AutoSubmitForm } from "@/components/AutoSubmitForm";
import { Icon } from "@/components/Icon";
import { requireUser } from "@/lib/auth";
import { carTitle, daysInStock, listCars, mediaUrl, priceDrop } from "@/lib/cars";
import { km, rupiah, tanggal } from "@/lib/format";
import { can } from "@/lib/roles";
import { CAR_STATUSES } from "@/lib/site";
import { setCarStatus } from "../../actions";

export const metadata: Metadata = { title: "Stok Mobil" };

export default async function AdminCarsPage({ searchParams }: PageProps<"/admin/mobil">) {
  const user = await requireUser("cars.view");
  const canCost = can(user.role, "cars.cost");
  const canEdit = can(user.role, "cars.edit");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const status = typeof sp.status === "string" && sp.status in CAR_STATUSES ? sp.status : "";
  const page = Number(sp.page) || 1;
  const { cars, total, pages } = listCars({ q, status: status || undefined, includeAll: true, page });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stok mobil</h1>
          <p className="text-sm text-slate-500">{total} unit</p>
        </div>
        {canEdit && <Link href="/admin/mobil/baru" className="btn-primary"><Icon name="plus" className="h-4 w-4" /> Tambah mobil</Link>}
      </div>

      <AutoSubmitForm className="flex flex-wrap gap-2">
        <input name="q" defaultValue={q} className="input max-w-xs" placeholder="Cari merek / model / tahun" aria-label="Cari" />
        <select name="status" defaultValue={status} className="input w-auto" aria-label="Status">
          <option value="">Semua status</option>
          {Object.entries(CAR_STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <button className="btn-secondary">Cari</button>
      </AutoSubmitForm>

      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr><th>Mobil</th><th>Harga</th>{canCost && <th>Margin</th>}<th>Umur</th><th>Dilihat</th><th>Status</th><th /></tr>
          </thead>
          <tbody>
            {cars.map((c) => (
              <tr key={c.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {c.cover && <img src={mediaUrl(c.cover)!} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div className="min-w-0">
                      {canEdit ? <Link href={`/admin/mobil/${c.id}`} className="font-medium hover:text-brand-600">{carTitle(c)}</Link> : <span className="font-medium">{carTitle(c)}</span>}
                      <p className="text-xs text-slate-500">{c.body_type} · {c.transmission} · {c.plate}{c.featured ? " · ★ Pilihan" : ""}</p>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap">
                  <p className="font-medium">{rupiah(c.status === "sold" && c.sold_price ? c.sold_price : c.price)}</p>
                  <p className="text-xs text-slate-500">{km(c.mileage)}{priceDrop(c) > 0 ? " · ↓ turun harga" : ""}</p>
                </td>
                {canCost && <td className="whitespace-nowrap">
                  {c.purchase_price ? (() => { const m = (c.status === "sold" && c.sold_price ? c.sold_price : c.price) - c.purchase_price - c.recon_cost; return <span className={m >= 0 ? "text-emerald-700" : "text-red-600"}>{rupiah(m)}</span>; })() : <span className="text-xs text-slate-400">isi modal</span>}
                </td>}
                <td className="whitespace-nowrap">{c.status === "sold" ? <span className="text-xs text-slate-400">laku {tanggal(c.sold_at)}</span> : <span className={daysInStock(c) >= 60 ? "badge bg-red-100 text-red-700" : ""}>{daysInStock(c)} hr</span>}</td>
                <td>{c.views}</td>
                <td>
                  <form action={setCarStatus} className="flex items-center gap-1">
                    <input type="hidden" name="id" value={c.id} />
                    <select name="status" defaultValue={c.status} className={`badge cursor-pointer border-0 py-1 ${CAR_STATUSES[c.status].className}`} aria-label="Ubah status">
                      {Object.entries(CAR_STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                    <button className="text-xs font-medium text-brand-600 hover:underline">Simpan</button>
                  </form>
                </td>
                <td className="text-right whitespace-nowrap">
                  <Link href={`/mobil/${c.slug}`} target="_blank" className="mr-3 text-slate-400 hover:text-slate-700" aria-label="Lihat di situs">
                    <Icon name="external" className="inline h-4 w-4" />
                  </Link>
                  {canEdit && <Link href={`/admin/mobil/${c.id}`} className="font-medium text-brand-600 hover:underline">Edit</Link>}
                </td>
              </tr>
            ))}
            {cars.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-slate-500">Tidak ada mobil.</td></tr>}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex gap-1">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={`/admin/mobil?${new URLSearchParams({ q, status, page: String(p) })}`} className={`rounded-lg px-3 py-1.5 text-sm ${p === page ? "bg-brand-600 text-white" : "bg-white"}`}>{p}</Link>
          ))}
        </div>
      )}
    </div>
  );
}
