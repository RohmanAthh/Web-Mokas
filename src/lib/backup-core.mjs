// Backup database + foto, dan retensi data pribadi. Dipakai oleh app (src/lib/backup.ts) dan scripts/backup.mjs.
import fs from "node:fs";
import path from "node:path";

export const DB_PREFIX = "showroom-";

/** Folder backup: BACKUP_DIR (disarankan disk/drive lain) atau data/backups. */
export function backupDir() {
  return path.resolve(process.env.BACKUP_DIR || path.join(process.cwd(), "data", "backups"));
}

const pad = (n) => String(n).padStart(2, "0");
function stamp(d = new Date()) {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

/**
 * - Database: snapshot konsisten via VACUUM INTO (aman walau app sedang dipakai)
 * - Foto: disalin ke <dir>/uploads (inkremental — nama file upload unik & tidak pernah diubah)
 * - Menyimpan `keep` snapshot database terbaru
 * @param {import("node:sqlite").DatabaseSync} db
 * @param {{ uploadDir?: string; keep?: number }} [opts]
 */
export function runBackup(db, { uploadDir, keep = Number(process.env.BACKUP_KEEP ?? 14) } = {}) {
  const dir = backupDir();
  const photoDir = path.join(dir, "uploads");
  fs.mkdirSync(photoDir, { recursive: true });

  const file = path.join(dir, `${DB_PREFIX}${stamp()}.db`);
  db.exec(`VACUUM INTO '${file.replace(/'/g, "''")}'`);

  let photos = 0;
  if (uploadDir && fs.existsSync(uploadDir)) {
    for (const name of fs.readdirSync(uploadDir)) {
      const src = path.join(uploadDir, name);
      const dst = path.join(photoDir, name);
      if (!fs.statSync(src).isFile()) continue;
      if (fs.existsSync(dst) && fs.statSync(dst).size === fs.statSync(src).size) continue;
      fs.copyFileSync(src, dst);
      photos++;
    }
  }

  const snapshots = listBackups();
  for (const old of snapshots.slice(Math.max(1, keep))) fs.rmSync(path.join(dir, old.name), { force: true });

  return { file: path.basename(file), size: fs.statSync(file).size, photos, dir };
}

/** Snapshot database, terbaru dulu. */
export function listBackups() {
  const dir = backupDir();
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((n) => n.startsWith(DB_PREFIX) && n.endsWith(".db"))
    .map((name) => {
      const st = fs.statSync(path.join(dir, name));
      return { name, size: st.size, createdAt: st.mtime.toISOString() };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Retensi UU PDP: data pribadi lead yang sudah lebih dari N bulan dihapus (dianonimkan),
 * statistik (jenis, mobil, status, tanggal) tetap ada untuk laporan.
 * @param {import("node:sqlite").DatabaseSync} db
 */
export function anonymizeOldLeads(db, months = Number(process.env.LEAD_RETENTION_MONTHS ?? 24)) {
  if (!(months > 0)) return 0;
  const cutoff = `-${Math.floor(months)} months`;
  const ids = db
    .prepare("SELECT id FROM leads WHERE anonymized_at IS NULL AND created_at < datetime('now', ?)")
    .all(cutoff)
    .map((r) => r.id);
  if (ids.length === 0) return 0;
  const marks = ids.map(() => "?").join(",");
  db.prepare(`DELETE FROM lead_notes WHERE lead_id IN (${marks})`).run(...ids);
  db.prepare(
    `UPDATE leads SET name = '(dihapus)', phone = '', email = '', message = '', data = '{}', anonymized_at = datetime('now')
     WHERE id IN (${marks})`,
  ).run(...ids);
  return ids.length;
}
