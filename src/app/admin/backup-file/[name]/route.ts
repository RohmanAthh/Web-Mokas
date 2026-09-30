import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { currentUser } from "@/lib/auth";
import { backupDir } from "@/lib/backup";
import { DB_PREFIX } from "@/lib/backup-core.mjs";
import { can } from "@/lib/roles";

// Unduh snapshot database — hanya Owner. Berisi data pribadi pembeli: simpan dengan aman.
export async function GET(_req: Request, ctx: RouteContext<"/admin/backup-file/[name]">) {
  const user = await currentUser();
  if (!user || user.must_change_password || !can(user.role, "backup")) return new Response("Forbidden", { status: 403 });
  const { name } = await ctx.params;
  const safe = path.basename(name);
  if (safe !== name || !safe.startsWith(DB_PREFIX) || !safe.endsWith(".db")) return new Response("Not found", { status: 404 });
  const file = path.join(backupDir(), safe);
  if (!fs.existsSync(file)) return new Response("Not found", { status: 404 });
  const stream = Readable.toWeb(fs.createReadStream(file)) as ReadableStream;
  return new Response(stream, {
    headers: {
      "Content-Type": "application/vnd.sqlite3",
      "Content-Disposition": `attachment; filename="${safe}"`,
      "Content-Length": String(fs.statSync(file).size),
      "Cache-Control": "no-store",
    },
  });
}
