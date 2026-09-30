// Backup manual / via cron: `npm run backup`
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { anonymizeOldLeads, runBackup } from "../src/lib/backup-core.mjs";

const dataDir = path.join(process.cwd(), "data");
const db = new DatabaseSync(process.env.DATABASE_PATH ?? path.join(dataDir, "showroom.db"));
const r = runBackup(db, { uploadDir: path.join(dataDir, "uploads") });
const anonymized = anonymizeOldLeads(db);
console.log(`Backup: ${r.file} (${Math.round(r.size / 1024)} KB), ${r.photos} foto baru → ${r.dir}`);
if (anonymized) console.log(`Retensi: ${anonymized} lead lama dianonimkan`);
