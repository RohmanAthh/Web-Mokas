import "server-only";
import { anonymizeOldLeads, backupDir, listBackups, runBackup } from "./backup-core.mjs";
import { db, UPLOAD_DIR } from "./db";

export { backupDir, listBackups };

export function backupNow() {
  return runBackup(db, { uploadDir: UPLOAD_DIR });
}

/** Tugas harian: backup + retensi data pribadi. */
export function dailyMaintenance() {
  const result = backupNow();
  const anonymized = anonymizeOldLeads(db);
  console.info(`[backup] ${result.file} (${Math.round(result.size / 1024)} KB, ${result.photos} foto baru) → ${result.dir}` + (anonymized ? ` · ${anonymized} lead lama dianonimkan` : ""));
  return { ...result, anonymized };
}

const globalForJob = globalThis as unknown as { backupTimer?: NodeJS.Timeout };

/** Jadwalkan tugas harian pukul BACKUP_HOUR (default 02.00) waktu server. Matikan dengan BACKUP_SCHEDULE=off. */
export function scheduleDailyBackup() {
  if (process.env.BACKUP_SCHEDULE === "off" || globalForJob.backupTimer) return;
  const hour = Number(process.env.BACKUP_HOUR ?? 2);
  const next = new Date();
  next.setHours(hour, 0, 0, 0);
  if (next.getTime() <= Date.now()) next.setDate(next.getDate() + 1);
  const run = () => {
    try {
      dailyMaintenance();
    } catch (err) {
      console.error("[backup] gagal:", err);
    }
  };
  globalForJob.backupTimer = setTimeout(() => {
    run();
    globalForJob.backupTimer = setInterval(run, 24 * 60 * 60 * 1000);
  }, next.getTime() - Date.now());
  globalForJob.backupTimer.unref?.();
  console.info(`[backup] terjadwal setiap hari pukul ${String(hour).padStart(2, "0")}.00 → ${backupDir()}`);
}
