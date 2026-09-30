import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { requireUser } from "@/lib/auth";
import { rupiah, tanggal } from "@/lib/format";
import { getLead, leadNotes } from "@/lib/leads";
import { addDays, nowInShowroom } from "@/lib/slots";
import { LEAD_STATUSES, LEAD_TYPES } from "@/lib/site";
import { addNote, deleteLead, setFollowUp, setLeadStatus } from "../../../actions";
import { ConfirmButton } from "../../ConfirmButton";
import { MONEY_KEYS, waUrl } from "../shared";

export const metadata: Metadata = { title: "Detail Lead" };

function waktu(s: string) {
  return new Date(s.replace(" ", "T") + "Z").toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" });
}

export default async function LeadDetailPage({ params }: PageProps<"/admin/leads/[id]">) {
  await requireUser("leads");
  const lead = getLead(Number((await params).id));
  if (!lead) notFound();
  const notes = leadNotes(lead.id);
  const today = nowInShowroom().date;
  const quick = [
    ["Besok", addDays(today, 1)],
    ["3 hari", addDays(today, 3)],
    ["1 minggu", addDays(today, 7)],
  ] as const;

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <Link href="/admin/leads" className="text-sm text-slate-500 hover:text-slate-900">← Pipeline leads</Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{lead.name}</h1>
          <span className="badge bg-slate-100 text-slate-700">{LEAD_TYPES[lead.type]}</span>
          <span className={`badge ${LEAD_STATUSES[lead.status].className}`}>{LEAD_STATUSES[lead.status].label}</span>
        </div>
        <p className="text-sm text-slate-500">Masuk {waktu(lead.created_at)}</p>
      </div>

      {/* Status pipeline */}
      <form action={setLeadStatus} className="card flex flex-wrap items-center gap-2 p-4">
        <input type="hidden" name="id" value={lead.id} />
        <span className="mr-1 text-sm font-medium text-slate-600">Pindahkan ke:</span>
        {Object.entries(LEAD_STATUSES).map(([k, v]) => (
          <button
            key={k}
            name="status"
            value={k}
            disabled={k === lead.status}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${k === lead.status ? `${v.className} border-transparent` : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"}`}
          >
            {v.label}
          </button>
        ))}
      </form>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="font-semibold">Kontak & detail</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-slate-500">WhatsApp</dt><dd className="font-medium">{lead.phone}</dd></div>
              {lead.email && <div className="flex justify-between gap-3"><dt className="text-slate-500">Email</dt><dd className="font-medium">{lead.email}</dd></div>}
              {lead.car_title && (
                <div className="flex justify-between gap-3"><dt className="text-slate-500">Mobil</dt><dd><Link href={`/mobil/${lead.car_slug}`} target="_blank" className="font-medium text-brand-600 hover:underline">{lead.car_title}</Link></dd></div>
              )}
              {lead.preferred_date && (
                <div className="flex justify-between gap-3"><dt className="text-slate-500">Jadwal test drive</dt><dd className="font-medium">{tanggal(lead.preferred_date)}{lead.preferred_time ? `, ${lead.preferred_time} WIB` : ""}</dd></div>
              )}
              {Object.entries(lead.data).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="text-slate-500 capitalize">{k.replace(/_/g, " ")}</dt>
                  <dd className="font-medium">{MONEY_KEYS.has(k) ? rupiah(Number(v)) : k === "tenor" ? `${v} bulan` : String(v)}</dd>
                </div>
              ))}
            </dl>
            {lead.message && <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">&ldquo;{lead.message}&rdquo;</p>}
            <a href={waUrl(lead)} target="_blank" rel="noopener" className="btn-wa mt-4 w-full"><Icon name="whatsapp" className="h-4 w-4" /> Balas via WhatsApp</a>
          </section>

          <section className="card p-5">
            <h2 className="font-semibold">Follow-up berikutnya</h2>
            <p className="mt-1 text-sm text-slate-500">{lead.follow_up_at ? `Dijadwalkan ${tanggal(lead.follow_up_at)}` : "Belum dijadwalkan"}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {quick.map(([label, date]) => (
                <form key={label} action={setFollowUp}>
                  <input type="hidden" name="id" value={lead.id} />
                  <button name="follow_up_at" value={date} className="btn-secondary btn-sm">{label}</button>
                </form>
              ))}
              {lead.follow_up_at && (
                <form action={setFollowUp}>
                  <input type="hidden" name="id" value={lead.id} />
                  <button name="follow_up_at" value="" className="btn-sm btn text-slate-500 hover:text-slate-900">Hapus jadwal</button>
                </form>
              )}
            </div>
            <form action={setFollowUp} className="mt-3 flex gap-2">
              <input type="hidden" name="id" value={lead.id} />
              <input type="date" name="follow_up_at" min={today} defaultValue={lead.follow_up_at ?? ""} className="input" aria-label="Tanggal follow-up" />
              <button className="btn-primary btn-sm">Set</button>
            </form>
          </section>
        </div>

        <section className="card p-5">
          <h2 className="font-semibold">Catatan & riwayat ({notes.length})</h2>
          <form action={addNote} className="mt-3 space-y-2">
            <input type="hidden" name="id" value={lead.id} />
            <textarea name="note" rows={3} required className="input" placeholder="Mis. Sudah telepon, minta nego 5 jt, janji datang Sabtu." aria-label="Catatan baru" />
            <button className="btn-primary btn-sm">Tambah catatan</button>
          </form>
          <ol className="mt-5 space-y-4 border-l-2 border-slate-200 pl-4">
            {notes.map((n) => (
              <li key={n.id} className="relative">
                <span className="absolute top-1.5 -left-[21px] h-2.5 w-2.5 rounded-full bg-brand-600" />
                <p className="text-xs text-slate-500">{n.author} · {waktu(n.created_at)}</p>
                <p className="mt-0.5 text-sm whitespace-pre-line">{n.note}</p>
              </li>
            ))}
            <li className="relative">
              <span className="absolute top-1.5 -left-[21px] h-2.5 w-2.5 rounded-full bg-slate-300" />
              <p className="text-xs text-slate-500">{waktu(lead.created_at)}</p>
              <p className="mt-0.5 text-sm text-slate-600">Lead masuk dari situs ({LEAD_TYPES[lead.type]})</p>
            </li>
          </ol>
        </section>
      </div>

      <form action={deleteLead}>
        <input type="hidden" name="id" value={lead.id} />
        <input type="hidden" name="redirect" value="1" />
        <ConfirmButton message="Hapus lead ini beserta catatannya?" className="text-sm font-medium text-red-600 hover:underline">Hapus lead</ConfirmButton>
      </form>
    </div>
  );
}
