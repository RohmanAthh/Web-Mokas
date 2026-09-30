import "server-only";
import nodemailer from "nodemailer";
import { rupiah } from "./format";
import { getLead } from "./leads";
import { LEAD_TYPES, site } from "./site";

/*
 * Notifikasi lead baru ke admin. Setiap channel aktif bila env-nya diisi (lihat .env.example):
 *  - Telegram : TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID           (gratis)
 *  - Email    : SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, NOTIFY_EMAIL_TO [, NOTIFY_EMAIL_FROM]
 *  - WhatsApp : FONNTE_TOKEN + NOTIFY_WA_TO                      (gateway WA pihak ketiga)
 *  - Webhook  : NOTIFY_WEBHOOK_URL (POST JSON — untuk Zapier/Make/n8n, dsb.)
 * Tanpa konfigurasi apa pun, ringkasan hanya dicetak ke log server.
 */

const MONEY_KEYS = new Set(["harga", "dp", "cicilan", "harga_harapan"]);

function buildMessage(leadId: number) {
  const l = getLead(leadId);
  if (!l) return null;
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const lines = [
    `🔔 Lead baru: ${LEAD_TYPES[l.type]}`,
    `Nama: ${l.name}`,
    `WA: ${l.phone}${l.email ? ` · ${l.email}` : ""}`,
  ];
  if (l.car_title) lines.push(`Mobil: ${l.car_title}`);
  if (l.preferred_date) lines.push(`Jadwal: ${l.preferred_date}${l.preferred_time ? ` jam ${l.preferred_time}` : ""}`);
  for (const [k, v] of Object.entries(l.data)) {
    lines.push(`${k.replace(/_/g, " ")}: ${MONEY_KEYS.has(k) ? rupiah(Number(v)) : v}`);
  }
  if (l.message) lines.push(`Pesan: ${l.message}`);
  if (base) lines.push(`${base}/admin/leads/${l.id}`);
  return { subject: `[${site.name}] ${LEAD_TYPES[l.type]} — ${l.name}`, text: lines.join("\n"), lead: l };
}

async function post(url: string, init: RequestInit) {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`${url.split("?")[0]} → HTTP ${res.status}`);
}

export async function notifyNewLead(leadId: number) {
  const msg = buildMessage(leadId);
  if (!msg) return;
  const env = process.env;
  const jobs: [string, () => Promise<unknown>][] = [];

  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
    jobs.push(["telegram", () =>
      post(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: msg.text, disable_web_page_preview: true }),
      })]);
  }
  if (env.SMTP_HOST && env.NOTIFY_EMAIL_TO) {
    jobs.push(["email", () =>
      nodemailer
        .createTransport({
          host: env.SMTP_HOST,
          port: Number(env.SMTP_PORT ?? 587),
          secure: Number(env.SMTP_PORT) === 465,
          auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
        })
        .sendMail({ from: env.NOTIFY_EMAIL_FROM ?? env.SMTP_USER, to: env.NOTIFY_EMAIL_TO, subject: msg.subject, text: msg.text })]);
  }
  if (env.FONNTE_TOKEN && env.NOTIFY_WA_TO) {
    jobs.push(["whatsapp", () =>
      post("https://api.fonnte.com/send", {
        method: "POST",
        headers: { Authorization: env.FONNTE_TOKEN! },
        body: new URLSearchParams({ target: env.NOTIFY_WA_TO!, message: msg.text }),
      })]);
  }
  if (env.NOTIFY_WEBHOOK_URL) {
    jobs.push(["webhook", () =>
      post(env.NOTIFY_WEBHOOK_URL!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "lead.created", text: msg.text, lead: msg.lead }),
      })]);
  }

  if (jobs.length === 0) {
    console.info(`[notify] ${msg.subject} (belum ada channel notifikasi yang dikonfigurasi)`);
    return;
  }
  const results = await Promise.allSettled(jobs.map(([, run]) => run()));
  results.forEach((r, i) => {
    if (r.status === "rejected") console.error(`[notify] gagal kirim via ${jobs[i][0]}:`, r.reason);
  });
}
