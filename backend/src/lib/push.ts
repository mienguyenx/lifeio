// Web Push: khóa VAPID (env hoặc tự tạo lưu trong admin_settings), gửi thông báo tới
// mọi thiết bị đã đăng ký của người dùng, lưu vào hộp thư user_notifications.
import webpush from 'web-push';
import { pool } from '../db';

interface Vapid { publicKey: string; privateKey: string; subject: string }
let vapid: Vapid | null = null;

export async function getVapid(): Promise<Vapid> {
  if (vapid) return vapid;
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@lifeos.app';
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    vapid = { publicKey: process.env.VAPID_PUBLIC_KEY, privateKey: process.env.VAPID_PRIVATE_KEY, subject };
  } else {
    const { rows } = await pool.query<{ value: Vapid }>(`SELECT value FROM "admin_settings" WHERE key = 'web_push_vapid'`);
    if (rows[0]?.value?.publicKey) vapid = { ...rows[0].value, subject: rows[0].value.subject || subject };
    else {
      const k = webpush.generateVAPIDKeys();
      const v = { publicKey: k.publicKey, privateKey: k.privateKey, subject };
      // ON CONFLICT: nếu tiến trình khác vừa tạo, dùng bản đã lưu
      const { rows: saved } = await pool.query<{ value: Vapid }>(
        `INSERT INTO "admin_settings" (key, value, description) VALUES ('web_push_vapid', $1::jsonb, 'Khóa VAPID cho Web Push')
           ON CONFLICT (key) DO UPDATE SET key = EXCLUDED.key RETURNING value`,
        [JSON.stringify(v)],
      );
      vapid = saved[0].value;
    }
  }
  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);
  return vapid;
}

export interface PushPayload {
  title: string; body?: string; url?: string; tag?: string; type?: string;
  actions?: { action: string; title: string }[];
  /** Không ghi vào hộp thư (VD thông báo thử) */
  ephemeral?: boolean;
  /** Khóa chống gửi trùng (VD habit:<id>:2026-10-02) */
  dedupeKey?: string;
}

/** Gửi tới mọi thiết bị của user. Trả số thiết bị nhận thành công; null nếu đã gửi (trùng khóa). */
export async function sendToUser(userId: string, p: PushPayload): Promise<{ sent: number; failed: number; devices: number } | null> {
  await getVapid();
  let notificationId: string | null = null;
  if (!p.ephemeral || p.dedupeKey) {
    const { rows } = await pool.query<{ id: string }>(
      `INSERT INTO "user_notifications" (user_id, type, title, body, url, tag, dedupe_key) VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (dedupe_key) DO NOTHING RETURNING id`,
      [userId, p.type ?? 'system', p.title, p.body ?? null, p.url ?? null, p.tag ?? null, p.dedupeKey ?? null],
    );
    if (!rows[0]) return null; // đã gửi trước đó
    notificationId = rows[0].id;
  }
  const { rows: subs } = await pool.query<{ id: string; endpoint: string; p256dh: string; auth: string }>(
    `SELECT id, endpoint, p256dh, auth FROM "push_subscriptions" WHERE user_id = $1`, [userId],
  );
  const payload = JSON.stringify({ title: p.title, body: p.body, url: p.url ?? '/', tag: p.tag, type: p.type, actions: p.actions, id: notificationId });
  let sent = 0, failed = 0;
  await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 3600, urgency: 'high' });
      sent++;
      await pool.query(`UPDATE "push_subscriptions" SET last_used_at = now(), failure_count = 0, last_error = NULL WHERE id = $1`, [s.id]);
    } catch (e) {
      failed++;
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await pool.query(`DELETE FROM "push_subscriptions" WHERE id = $1`, [s.id]);
      else await pool.query(`UPDATE "push_subscriptions" SET failure_count = failure_count + 1, last_error = $2 WHERE id = $1`, [s.id, String((e as Error).message).slice(0, 300)]);
    }
  }));
  return { sent, failed, devices: subs.length };
}
