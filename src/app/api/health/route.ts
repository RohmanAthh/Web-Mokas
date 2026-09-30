import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Untuk monitoring (aaPanel / UptimeRobot): 200 bila app & database sehat.
export function GET() {
  try {
    db.prepare("SELECT 1").get();
    return Response.json({ ok: true, time: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  }
}
