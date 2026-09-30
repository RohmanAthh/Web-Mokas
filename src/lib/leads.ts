import "server-only";
import type { SQLInputValue } from "node:sqlite";
import { db } from "./db";
import type { LeadStatus, LeadType } from "./site";

export type Lead = {
  id: number;
  car_id: number | null;
  type: LeadType;
  name: string;
  phone: string;
  email: string;
  message: string;
  preferred_date: string | null;
  preferred_time: string | null;
  follow_up_at: string | null;
  data: Record<string, string | number>;
  status: LeadStatus;
  created_at: string;
  car_title: string | null;
  car_slug: string | null;
  note_count: number;
};

export type LeadNote = { id: number; lead_id: number; author: string; note: string; created_at: string };

const SELECT = `SELECT l.*, c.brand || ' ' || c.model || ' ' || c.year AS car_title, c.slug AS car_slug,
  (SELECT COUNT(*) FROM lead_notes n WHERE n.lead_id = l.id) AS note_count
  FROM leads l LEFT JOIN cars c ON c.id = l.car_id`;

function toLead(r: Record<string, unknown>): Lead {
  return { ...(r as unknown as Lead), data: JSON.parse((r.data as string) || "{}") };
}

export function createLead(l: {
  carId?: number | null;
  type: LeadType;
  name: string;
  phone: string;
  email?: string;
  message?: string;
  preferredDate?: string | null;
  preferredTime?: string | null;
  data?: Record<string, unknown>;
}) {
  // Form publik hanya bisa dikirim setelah pengunjung mencentang persetujuan privasi (divalidasi di actions.ts)
  const r = db
    .prepare(
      `INSERT INTO leads (car_id, type, name, phone, email, message, preferred_date, preferred_time, data, consent_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    )
    .run(
      l.carId ?? null,
      l.type,
      l.name,
      l.phone,
      l.email ?? "",
      l.message ?? "",
      l.preferredDate || null,
      l.preferredTime || null,
      JSON.stringify(l.data ?? {}),
    );
  return Number(r.lastInsertRowid);
}

export function listLeads(f: { status?: string; type?: string; q?: string; limit?: number } = {}) {
  const where: string[] = [];
  const args: SQLInputValue[] = [];
  if (f.status) { where.push("l.status = ?"); args.push(f.status); }
  if (f.type) { where.push("l.type = ?"); args.push(f.type); }
  if (f.q) { where.push("(l.name LIKE ? OR l.phone LIKE ?)"); args.push(`%${f.q}%`, `%${f.q}%`); }
  const rows = db
    .prepare(`${SELECT} ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY l.created_at DESC, l.id DESC LIMIT ?`)
    .all(...args, f.limit ?? 300) as Record<string, unknown>[];
  return rows.map(toLead);
}

export function getLead(id: number) {
  const r = db.prepare(`${SELECT} WHERE l.id = ?`).get(id) as Record<string, unknown> | undefined;
  return r ? toLead(r) : null;
}

export function leadNotes(leadId: number) {
  return db.prepare("SELECT * FROM lead_notes WHERE lead_id = ? ORDER BY created_at DESC, id DESC").all(leadId) as LeadNote[];
}

export function addLeadNote(leadId: number, author: string, note: string) {
  db.prepare("INSERT INTO lead_notes (lead_id, author, note) VALUES (?, ?, ?)").run(leadId, author, note);
}

/** Leads aktif yang jadwal follow-up-nya hari ini atau sudah lewat. */
export function dueFollowUps(today: string) {
  const rows = db
    .prepare(`${SELECT} WHERE l.follow_up_at IS NOT NULL AND l.follow_up_at <= ? AND l.status IN ('new','contacted','negotiating') ORDER BY l.follow_up_at`)
    .all(today) as Record<string, unknown>[];
  return rows.map(toLead);
}

/** Jam yang sudah dibooking untuk mobil pada tanggal tertentu. */
export function bookedSlots(carId: number, date: string) {
  const rows = db
    .prepare(
      `SELECT preferred_time FROM leads WHERE type = 'test_drive' AND car_id = ? AND preferred_date = ?
       AND preferred_time IS NOT NULL AND status != 'lost'`,
    )
    .all(carId, date) as { preferred_time: string }[];
  return new Set(rows.map((r) => r.preferred_time));
}

/** Jadwal test drive dalam rentang tanggal (untuk kalender admin). */
export function testDrivesBetween(from: string, to: string) {
  const rows = db
    .prepare(`${SELECT} WHERE l.type = 'test_drive' AND l.preferred_date BETWEEN ? AND ? AND l.status != 'lost' ORDER BY l.preferred_date, l.preferred_time`)
    .all(from, to) as Record<string, unknown>[];
  return rows.map(toLead);
}

export function leadCounts() {
  return db
    .prepare(
      `SELECT COALESCE(SUM(status = 'new'), 0) AS new,
              COALESCE(SUM(status IN ('contacted','negotiating')), 0) AS in_progress,
              COALESCE(SUM(created_at >= datetime('now', '-30 days')), 0) AS last30
       FROM leads`,
    )
    .get() as { new: number; in_progress: number; last30: number };
}

/** Konversi per jenis lead (90 hari). */
export function leadFunnel() {
  return db
    .prepare(
      `SELECT type, COUNT(*) AS total, SUM(status = 'won') AS won, SUM(status = 'lost') AS lost
       FROM leads WHERE created_at >= datetime('now', '-90 days') GROUP BY type ORDER BY total DESC`,
    )
    .all() as { type: LeadType; total: number; won: number; lost: number }[];
}
