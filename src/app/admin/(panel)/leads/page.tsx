import type { Metadata } from "next";
import Link from "next/link";
import { AutoSubmitForm } from "@/components/AutoSubmitForm";
import { Icon } from "@/components/Icon";
import { requireUser } from "@/lib/auth";
import { tanggal } from "@/lib/format";
import { listLeads, type Lead } from "@/lib/leads";
import { nowInShowroom } from "@/lib/slots";
import { LEAD_STATUSES, LEAD_TYPES, type LeadStatus } from "@/lib/site";
import { setLeadStatus } from "../../actions";
import { waUrl } from "./shared";

export const metadata: Metadata = { title: "Leads & Pesan" };

const STATUS_KEYS = Object.keys(LEAD_STATUSES) as LeadStatus[];
const COLUMN_BG: Record<LeadStatus, string> = {
  new: "bg-blue-50",
  contacted: "bg-amber-50",
  negotiating: "bg-violet-50",
  won: "bg-emerald-50",
  lost: "bg-slate-100",
};

function LeadCard({ l, today }: { l: Lead; today: string }) {
  const idx = STATUS_KEYS.indexOf(l.status);
  const next = idx < 3 ? STATUS_KEYS[idx + 1] : null; // new→contacted→negotiating→won
  const overdue = l.follow_up_at && l.follow_up_at <= today && idx < 3;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <Link href={`/admin/leads/${l.id}`} className="block">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium hover:text-brand-600">{l.name}</p>
          <span className="shrink-0 text-[11px] text-slate-400">{tanggal(l.created_at).replace(/ \d{4}$/, "")}</span>
        </div>
        <p className="text-xs text-slate-500">{LEAD_TYPES[l.type]}{l.car_title ? ` · ${l.car_title}` : l.type === "sell" ? ` · ${l.data.merek ?? ""} ${l.data.model ?? ""}` : ""}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {l.type === "test_drive" && l.preferred_date && (
            <span className="badge bg-slate-100 text-slate-700">🗓 {tanggal(l.preferred_date).replace(/ \d{4}$/, "")} {l.preferred_time ?? ""}</span>
          )}
          {l.follow_up_at && idx < 3 && (
            <span className={`badge ${overdue ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"}`}>⏰ {l.follow_up_at === today ? "hari ini" : tanggal(l.follow_up_at).replace(/ \d{4}$/, "")}</span>
          )}
          {l.note_count > 0 && <span className="badge bg-slate-100 text-slate-600">💬 {l.note_count}</span>}
        </div>
      </Link>
      <div className="mt-2 flex items-center gap-1.5 border-t border-slate-100 pt-2">
        <a href={waUrl(l)} target="_blank" rel="noopener" className="rounded-md bg-[#25D366] p-1.5 text-white" aria-label="Balas WhatsApp">
          <Icon name="whatsapp" className="h-3.5 w-3.5" />
        </a>
        {next && (
          <form action={setLeadStatus} className="ml-auto">
            <input type="hidden" name="id" value={l.id} />
            <button name="status" value={next} className="rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50">
              → {LEAD_STATUSES[next].label}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default async function LeadsPage({ searchParams }: PageProps<"/admin/leads">) {
  await requireUser("leads");
  const sp = await searchParams;
  const view = sp.view === "list" ? "list" : "board";
  const type = typeof sp.type === "string" && sp.type in LEAD_TYPES ? sp.type : "";
  const status = typeof sp.status === "string" && sp.status in LEAD_STATUSES ? sp.status : "";
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const leads = listLeads({ type: type || undefined, status: view === "list" ? status || undefined : undefined, q: q || undefined });
  const today = nowInShowroom().date;
  const hrefView = (v: string) => `/admin/leads?${new URLSearchParams({ view: v, ...(type && { type }), ...(q && { q }) })}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leads & pesan</h1>
          <p className="text-sm text-slate-500">Test drive, pertanyaan, kredit, dan penawaran jual mobil — geser dari Baru sampai Deal.</p>
        </div>
        <div className="inline-flex overflow-hidden rounded-lg border border-slate-300 bg-white text-sm font-medium">
          <Link href={hrefView("board")} className={`px-3 py-1.5 ${view === "board" ? "bg-slate-900 text-white" : "text-slate-600"}`}>Papan</Link>
          <Link href={hrefView("list")} className={`border-l border-slate-300 px-3 py-1.5 ${view === "list" ? "bg-slate-900 text-white" : "text-slate-600"}`}>Daftar</Link>
        </div>
      </div>

      <AutoSubmitForm className="flex flex-wrap gap-2">
        <input type="hidden" name="view" value={view} />
        <input name="q" defaultValue={q} className="input max-w-xs" placeholder="Cari nama / nomor HP" aria-label="Cari" />
        <select name="type" defaultValue={type} className="input w-auto" aria-label="Jenis">
          <option value="">Semua jenis</option>
          {Object.entries(LEAD_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        {view === "list" && (
          <select name="status" defaultValue={status} className="input w-auto" aria-label="Status">
            <option value="">Semua status</option>
            {Object.entries(LEAD_STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        )}
        <button className="btn-secondary">Cari</button>
      </AutoSubmitForm>

      {view === "board" ? (
        <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
          <div className="grid min-w-[1100px] grid-cols-5 gap-3">
            {STATUS_KEYS.map((s) => {
              const col = leads.filter((l) => l.status === s);
              return (
                <section key={s} className={`rounded-2xl p-3 ${COLUMN_BG[s]}`}>
                  <h2 className="mb-3 flex items-center justify-between px-1 text-sm font-semibold">
                    {LEAD_STATUSES[s].label}
                    <span className={`badge ${LEAD_STATUSES[s].className}`}>{col.length}</span>
                  </h2>
                  <div className="space-y-2">
                    {col.slice(0, 40).map((l) => <LeadCard key={l.id} l={l} today={today} />)}
                    {col.length === 0 && <p className="px-1 text-xs text-slate-400">Kosong</p>}
                    {col.length > 40 && <Link href={`/admin/leads?view=list&status=${s}`} className="block px-1 text-xs text-brand-600">+{col.length - 40} lainnya →</Link>}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Nama</th><th>Jenis</th><th>Mobil / detail</th><th>Follow-up</th><th>Status</th><th>Masuk</th></tr></thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id}>
                  <td><Link href={`/admin/leads/${l.id}`} className="font-medium hover:text-brand-600">{l.name}</Link><p className="text-xs text-slate-500">{l.phone}</p></td>
                  <td>{LEAD_TYPES[l.type]}</td>
                  <td className="text-slate-600">{l.car_title ?? (l.type === "sell" ? `${l.data.merek ?? ""} ${l.data.model ?? ""} ${l.data.tahun ?? ""}` : "-")}{l.preferred_date ? ` · ${tanggal(l.preferred_date)} ${l.preferred_time ?? ""}` : ""}</td>
                  <td className="whitespace-nowrap">{l.follow_up_at ? tanggal(l.follow_up_at) : "-"}</td>
                  <td><span className={`badge ${LEAD_STATUSES[l.status].className}`}>{LEAD_STATUSES[l.status].label}</span></td>
                  <td className="text-xs whitespace-nowrap text-slate-500">{tanggal(l.created_at)}</td>
                </tr>
              ))}
              {leads.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-slate-500">Tidak ada leads.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
