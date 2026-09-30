import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { requireUser } from "@/lib/auth";
import { carTitle, inventoryStats, stockAging } from "@/lib/cars";
import { rupiah, rupiahShort, tanggal } from "@/lib/format";
import { dueFollowUps, leadCounts, listLeads, testDrivesBetween } from "@/lib/leads";
import { addDays, nowInShowroom } from "@/lib/slots";
import { can } from "@/lib/roles";
import { LEAD_STATUSES, LEAD_TYPES } from "@/lib/site";

export const metadata: Metadata = { title: "Dashboard Admin" };

export default async function DashboardPage({ searchParams }: PageProps<"/admin">) {
  const user = await requireUser();
  const sp = await searchParams;
  const canLeads = can(user.role, "leads");
  const canEdit = can(user.role, "cars.edit");
  const today = nowInShowroom().date;
  const inv = inventoryStats();
  const leads = leadCounts();
  const recentLeads = canLeads ? listLeads({ limit: 6 }) : [];
  const followUps = canLeads ? dueFollowUps(today) : [];
  const drives = canLeads ? testDrivesBetween(today, addDays(today, 1)) : [];
  const stale = stockAging().filter((s) => s.ageDays >= 60).slice(0, 5);

  const reportsHref = can(user.role, "reports") ? "/admin/laporan" : "/admin/mobil";
  const stats = [
    { label: "Unit tersedia", value: String(inv.available), sub: `${inv.booked} dipesan · ${inv.sold} terjual`, icon: "car", href: "/admin/mobil" },
    { label: "Nilai stok", value: rupiahShort(inv.stock_value), sub: `Rata-rata ${rupiahShort(inv.available ? inv.stock_value / inv.available : 0)} per unit`, icon: "wallet", href: reportsHref },
    ...(canLeads
      ? [
          { label: "Leads baru", value: String(leads.new), sub: `${leads.in_progress} sedang diproses`, icon: "inbox", href: "/admin/leads" },
          { label: "Leads 30 hari", value: String(leads.last30), sub: `${inv.views.toLocaleString("id-ID")} total kunjungan unit`, icon: "eye", href: reportsHref },
        ]
      : [{ label: "Total kunjungan unit", value: inv.views.toLocaleString("id-ID"), sub: "semua unit", icon: "eye", href: "/admin/mobil" }]),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500">{tanggal(today)}</p>
        </div>
        {canEdit && <Link href="/admin/mobil/baru" className="btn-primary"><Icon name="plus" className="h-4 w-4" /> Tambah mobil</Link>}
      </div>

      {sp.akses === "ditolak" && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">Anda tidak punya akses ke halaman itu. Minta Owner mengubah peran Anda bila perlu.</p>
      )}
      {sp.selamat === "1" && (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Password baru tersimpan. Selamat bekerja, {user.name}!</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card p-5 transition hover:border-brand-500">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{s.label}</p>
              <Icon name={s.icon} className="h-5 w-5 text-slate-400" />
            </div>
            <p className="mt-2 text-2xl font-bold">{s.value}</p>
            <p className="mt-1 text-xs text-slate-500">{s.sub}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {canLeads && (<>
        {/* Follow-up */}
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="font-semibold">Follow-up hari ini <span className="badge ml-1 bg-amber-100 text-amber-800">{followUps.length}</span></h2>
            <Link href="/admin/leads" className="text-sm font-medium text-brand-600 hover:underline">Pipeline →</Link>
          </div>
          {followUps.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-slate-500">Tidak ada follow-up terjadwal. 🎉</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {followUps.map((l) => (
                <li key={l.id}>
                  <Link href={`/admin/leads/${l.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50">
                    <div className="min-w-0">
                      <p className="font-medium">{l.name} <span className="text-xs font-normal text-slate-500">· {LEAD_TYPES[l.type]}</span></p>
                      <p className="truncate text-xs text-slate-500">{l.car_title ?? l.phone}</p>
                    </div>
                    <span className={`badge shrink-0 ${l.follow_up_at! < today ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}>
                      {l.follow_up_at! < today ? `Terlambat · ${tanggal(l.follow_up_at)}` : "Hari ini"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Test drive */}
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="font-semibold">Test drive hari ini & besok</h2>
            <Link href="/admin/jadwal" className="text-sm font-medium text-brand-600 hover:underline">Kalender →</Link>
          </div>
          {drives.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-slate-500">Belum ada jadwal.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {drives.map((l) => (
                <li key={l.id}>
                  <Link href={`/admin/leads/${l.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50">
                    <div className="w-16 shrink-0 text-center">
                      <p className="text-lg font-bold">{l.preferred_time ?? "—"}</p>
                      <p className="text-xs text-slate-500">{l.preferred_date === today ? "Hari ini" : "Besok"}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium">{l.name}</p>
                      <p className="truncate text-xs text-slate-500">{l.car_title} · {l.phone}</p>
                    </div>
                    <span className={`badge ml-auto shrink-0 ${LEAD_STATUSES[l.status].className}`}>{LEAD_STATUSES[l.status].label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Leads terbaru */}
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="font-semibold">Leads terbaru</h2>
            <Link href="/admin/leads?view=list" className="text-sm font-medium text-brand-600 hover:underline">Semua →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Nama</th><th>Jenis</th><th>Mobil</th><th>Status</th></tr></thead>
              <tbody>
                {recentLeads.map((l) => (
                  <tr key={l.id}>
                    <td><Link href={`/admin/leads/${l.id}`} className="font-medium hover:text-brand-600">{l.name}</Link><p className="text-xs text-slate-500">{l.phone}</p></td>
                    <td>{LEAD_TYPES[l.type]}</td>
                    <td className="text-slate-600">{l.car_title ?? (l.type === "sell" ? `${l.data.merek ?? ""} ${l.data.model ?? ""}` : "-")}</td>
                    <td><span className={`badge ${LEAD_STATUSES[l.status].className}`}>{LEAD_STATUSES[l.status].label}</span></td>
                  </tr>
                ))}
                {recentLeads.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-slate-500">Belum ada leads.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        </>)}

        {/* Stok lama */}
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="font-semibold">Stok &gt; 60 hari</h2>
            {can(user.role, "reports") && <Link href="/admin/laporan#umur-stok" className="text-sm font-medium text-brand-600 hover:underline">Laporan →</Link>}
          </div>
          {stale.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-slate-500">Semua stok masih segar.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {stale.map(({ car, ageDays, leadCount }) => (
                <li key={car.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    {canEdit ? <Link href={`/admin/mobil/${car.id}`} className="line-clamp-1 font-medium hover:text-brand-600">{carTitle(car)}</Link> : <p className="line-clamp-1 font-medium">{carTitle(car)}</p>}
                    <p className="text-xs text-slate-500">{rupiah(car.price)} · {leadCount} leads · {car.views} dilihat</p>
                  </div>
                  <span className="badge shrink-0 bg-red-100 text-red-700">{ageDays} hari</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
