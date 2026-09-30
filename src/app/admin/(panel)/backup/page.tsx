import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { backupDir, listBackups } from "@/lib/backup";
import { BackupButton } from "./BackupButton";

export const metadata: Metadata = { title: "Backup" };

const size = (b: number) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`);
const waktu = (iso: string) => new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" });

export default async function BackupPage() {
  await requireUser("backup");
  const backups = listBackups();
  const dir = backupDir();
  const scheduled = process.env.BACKUP_SCHEDULE !== "off";
  const hour = String(Number(process.env.BACKUP_HOUR ?? 2)).padStart(2, "0");
  const latest = backups[0];
  // Server component: dirender per permintaan, jadi membaca waktu sekarang di sini aman
  // eslint-disable-next-line react-hooks/purity
  const stale = !latest || Date.now() - new Date(latest.createdAt).getTime() > 2 * 86_400_000;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Backup</h1>
        <p className="text-sm text-slate-500">Database (stok, leads, pengguna) dan foto mobil.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-sm text-slate-500">Jadwal otomatis</p>
          <p className="mt-1 text-lg font-bold">{scheduled ? `Setiap hari ${hour}.00` : "Mati"}</p>
          <p className="text-xs text-slate-500">Simpan {process.env.BACKUP_KEEP ?? 14} snapshot terakhir</p>
        </div>
        <div className={`card p-5 ${stale ? "border-amber-300 bg-amber-50" : ""}`}>
          <p className="text-sm text-slate-500">Backup terakhir</p>
          <p className="mt-1 text-lg font-bold">{latest ? waktu(latest.createdAt) : "Belum ada"}</p>
          {stale && <p className="text-xs text-amber-800">Lebih dari 2 hari — buat backup sekarang.</p>}
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">Retensi data leads</p>
          <p className="mt-1 text-lg font-bold">{process.env.LEAD_RETENTION_MONTHS ?? 24} bulan</p>
          <p className="text-xs text-slate-500">Data pribadi lebih lama dianonimkan otomatis</p>
        </div>
      </div>

      <section className="card p-6">
        <BackupButton />
        <p className="mt-3 text-xs text-slate-500">Lokasi: <code className="rounded bg-slate-100 px-1">{dir}</code></p>
        <p className="mt-1 text-xs text-slate-500">
          Tips: set <code>BACKUP_DIR</code> ke disk lain, lalu sinkronkan folder itu ke Google Drive/Dropbox/S3 — backup di disk yang sama
          tidak menolong bila server rusak.
        </p>
      </section>

      <section className="card overflow-x-auto">
        <table className="data-table">
          <thead><tr><th>Snapshot database</th><th>Waktu</th><th>Ukuran</th><th /></tr></thead>
          <tbody>
            {backups.map((b, i) => (
              <tr key={b.name}>
                <td className="font-mono text-xs">{b.name} {i === 0 && <span className="badge ml-1 bg-emerald-100 text-emerald-800">terbaru</span>}</td>
                <td className="whitespace-nowrap">{waktu(b.createdAt)}</td>
                <td>{size(b.size)}</td>
                <td className="text-right"><a href={`/admin/backup-file/${b.name}`} className="font-medium text-brand-600 hover:underline">Unduh</a></td>
              </tr>
            ))}
            {backups.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-slate-500">Belum ada backup.</td></tr>}
          </tbody>
        </table>
      </section>

      <section className="card p-6 text-sm">
        <h2 className="font-semibold">Cara restore</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-slate-600">
          <li>Hentikan aplikasi.</li>
          <li>Salin file snapshot ke <code>data/showroom.db</code> (hapus <code>showroom.db-wal</code> &amp; <code>-shm</code> bila ada).</li>
          <li>Salin isi folder <code>uploads</code> dari folder backup ke <code>data/uploads</code>.</li>
          <li>Jalankan lagi aplikasi.</li>
        </ol>
        <p className="mt-3 text-xs text-slate-500">File backup berisi data pribadi pembeli. Jangan dibagikan; simpan di tempat yang terkunci.</p>
      </section>
    </div>
  );
}
