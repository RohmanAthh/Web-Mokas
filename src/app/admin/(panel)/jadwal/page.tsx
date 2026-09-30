import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { testDrivesBetween } from "@/lib/leads";
import { addDays, nowInShowroom, slotsFor } from "@/lib/slots";
import { LEAD_STATUSES } from "@/lib/site";

export const metadata: Metadata = { title: "Jadwal Test Drive" };

// Jam yang ditampilkan di grid (gabungan semua hari)
const HOURS = Array.from({ length: 10 }, (_, i) => `${String(9 + i).padStart(2, "0")}:00`);

function mondayOf(date: string) {
  const dow = new Date(date + "T00:00:00Z").getUTCDay(); // 0 = Minggu
  return addDays(date, dow === 0 ? -6 : 1 - dow);
}
const fmt = (d: string, opts: Intl.DateTimeFormatOptions) => new Date(d + "T00:00:00Z").toLocaleDateString("id-ID", { ...opts, timeZone: "UTC" });

export default async function SchedulePage({ searchParams }: PageProps<"/admin/jadwal">) {
  await requireUser("leads");
  const sp = await searchParams;
  const today = nowInShowroom().date;
  const start = mondayOf(typeof sp.minggu === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.minggu) ? sp.minggu : today);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const bookings = testDrivesBetween(days[0], days[6]);
  // Test drive lama (tanpa jam) ditampilkan di baris "Tanpa jam"
  const at = (d: string, t: string | null) => bookings.filter((b) => b.preferred_date === d && b.preferred_time === t);
  const openHours = (d: string) => new Set(slotsFor(d).map((s) => s.time));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Jadwal test drive</h1>
          <p className="text-sm text-slate-500">
            {fmt(days[0], { day: "numeric", month: "long" })} – {fmt(days[6], { day: "numeric", month: "long", year: "numeric" })} · {bookings.length} jadwal
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/jadwal?minggu=${addDays(start, -7)}`} className="btn-secondary btn-sm">← Minggu lalu</Link>
          <Link href="/admin/jadwal" className="btn-secondary btn-sm">Minggu ini</Link>
          <Link href={`/admin/jadwal?minggu=${addDays(start, 7)}`} className="btn-secondary btn-sm">Minggu depan →</Link>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[900px] table-fixed border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-16 border-b border-slate-200 bg-slate-50 p-2" />
              {days.map((d) => (
                <th key={d} className={`border-b border-l border-slate-200 p-2 text-left ${d === today ? "bg-brand-50" : "bg-slate-50"}`}>
                  <span className="block text-xs font-medium text-slate-500 uppercase">{fmt(d, { weekday: "short" })}</span>
                  <span className={`text-lg font-bold ${d === today ? "text-brand-700" : ""}`}>{fmt(d, { day: "numeric" })}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((h) => (
              <tr key={h}>
                <td className="border-b border-slate-100 p-2 align-top text-xs font-medium text-slate-500">{h}</td>
                {days.map((d) => {
                  const list = at(d, h);
                  const open = openHours(d).has(h) || d < today;
                  return (
                    <td key={d} className={`h-16 border-b border-l border-slate-100 p-1 align-top ${open ? "" : "bg-slate-50/80"}`}>
                      {list.map((b) => (
                        <Link key={b.id} href={`/admin/leads/${b.id}`} className={`mb-1 block rounded-md px-2 py-1 text-xs ${LEAD_STATUSES[b.status].className} hover:ring-2 hover:ring-brand-500`}>
                          <span className="block font-semibold">{b.name}</span>
                          <span className="block truncate opacity-80">{b.car_title}</span>
                        </Link>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
            {bookings.some((b) => !b.preferred_time) && (
              <tr>
                <td className="p-2 text-xs font-medium text-slate-500">Tanpa jam</td>
                {days.map((d) => (
                  <td key={d} className="border-l border-slate-100 p-1 align-top">
                    {at(d, null).map((b) => (
                      <Link key={b.id} href={`/admin/leads/${b.id}`} className="mb-1 block rounded-md bg-slate-100 px-2 py-1 text-xs">{b.name}</Link>
                    ))}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">Kotak abu-abu = di luar jam slot (istirahat / tutup). Slot diatur di <code>src/lib/slots.ts</code>. Lead berstatus &quot;Batal&quot; tidak menahan slot.</p>
    </div>
  );
}
