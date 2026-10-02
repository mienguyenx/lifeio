// /api/v1/push/* — đăng ký thiết bị nhận thông báo đẩy, tùy chọn thông báo, gửi thử.
import type { FastifyPluginAsync } from 'fastify';
import { pool } from '../db';
import { badRequest, forbidden } from '../lib/errors';
import { getVapid, sendToUser } from '../lib/push';
import { runPushTick } from '../lib/pushScheduler';

interface Sub { endpoint?: string; keys?: { p256dh?: string; auth?: string } }
const PREF_COLS = ['task_reminders', 'habit_reminders', 'overdue_alerts', 'daily_digest', 'digest_time', 'quiet_start', 'quiet_end', 'timezone'] as const;
const DEFAULT_PREFS = { task_reminders: true, habit_reminders: true, overdue_alerts: true, daily_digest: true, digest_time: '08:00', quiet_start: null, quiet_end: null, timezone: null };
const TIME = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

const pushRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.authenticate);
  const tag = { schema: { tags: ['push'], security: [{ bearerAuth: [] }] } };

  fastify.get('/push/public-key', tag, async () => ({ publicKey: (await getVapid()).publicKey }));

  fastify.post<{ Body: { subscription?: Sub; device_label?: string; platform?: string } }>('/push/subscribe', tag, async (request) => {
    const s = request.body?.subscription;
    if (!s?.endpoint || !s.keys?.p256dh || !s.keys?.auth) throw badRequest('subscription không hợp lệ');
    const ua = String(request.headers['user-agent'] ?? '').slice(0, 300);
    const { rows } = await pool.query(
      `INSERT INTO "push_subscriptions" (user_id, endpoint, p256dh, auth, user_agent, device_label, platform)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (endpoint) DO UPDATE SET user_id = EXCLUDED.user_id, p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth,
         user_agent = EXCLUDED.user_agent, device_label = COALESCE(EXCLUDED.device_label, "push_subscriptions".device_label),
         platform = EXCLUDED.platform, failure_count = 0, last_error = NULL
       RETURNING id`,
      [request.user!.id, s.endpoint, s.keys.p256dh, s.keys.auth, ua, request.body.device_label?.slice(0, 80) ?? null, request.body.platform?.slice(0, 30) ?? null],
    );
    return { ok: true, id: rows[0].id };
  });

  fastify.post<{ Body: { endpoint?: string } }>('/push/unsubscribe', tag, async (request) => {
    if (!request.body?.endpoint) throw badRequest('endpoint required');
    await pool.query(`DELETE FROM "push_subscriptions" WHERE user_id = $1 AND endpoint = $2`, [request.user!.id, request.body.endpoint]);
    return { ok: true };
  });

  fastify.get('/push/devices', tag, async (request) => {
    const { rows } = await pool.query(
      `SELECT id, device_label, platform, user_agent, created_at, last_used_at, failure_count, last_error, endpoint FROM "push_subscriptions" WHERE user_id = $1 ORDER BY created_at DESC`,
      [request.user!.id],
    );
    return { devices: rows };
  });

  fastify.delete<{ Params: { id: string } }>('/push/devices/:id', tag, async (request) => {
    await pool.query(`DELETE FROM "push_subscriptions" WHERE user_id = $1 AND id = $2`, [request.user!.id, request.params.id]);
    return { ok: true };
  });

  fastify.get('/push/prefs', tag, async (request) => {
    const { rows } = await pool.query(`SELECT ${PREF_COLS.join(', ')} FROM "notification_prefs" WHERE user_id = $1`, [request.user!.id]);
    const r = rows[0] ?? DEFAULT_PREFS;
    const hhmm = (v: unknown) => (typeof v === 'string' ? v.slice(0, 5) : v ?? null);
    return { prefs: { ...r, digest_time: hhmm(r.digest_time), quiet_start: hhmm(r.quiet_start), quiet_end: hhmm(r.quiet_end) } };
  });

  fastify.put<{ Body: Partial<Record<(typeof PREF_COLS)[number], unknown>> }>('/push/prefs', tag, async (request) => {
    const b = request.body ?? {};
    const v: Record<string, unknown> = {};
    for (const k of ['task_reminders', 'habit_reminders', 'overdue_alerts', 'daily_digest'] as const) if (k in b) v[k] = !!b[k];
    for (const k of ['digest_time', 'quiet_start', 'quiet_end'] as const) if (k in b) {
      const t = b[k];
      if (t === null || t === '') { if (k === 'digest_time') throw badRequest('digest_time required'); v[k] = null; }
      else if (typeof t === 'string' && TIME.test(t)) v[k] = t; else throw badRequest(`${k} không hợp lệ (HH:MM)`);
    }
    if ('timezone' in b) {
      const tz = b.timezone ? String(b.timezone) : null;
      if (tz) { try { new Intl.DateTimeFormat('en', { timeZone: tz }); } catch { throw badRequest('timezone không hợp lệ'); } }
      v.timezone = tz;
    }
    const keys = Object.keys(v);
    await pool.query(
      `INSERT INTO "notification_prefs" (user_id${keys.map((k) => `, ${k}`).join('')}) VALUES ($1${keys.map((_, i) => `, $${i + 2}`).join('')})
       ON CONFLICT (user_id) DO UPDATE SET ${[...keys.map((k) => `${k} = EXCLUDED.${k}`), 'updated_at = now()'].join(', ')}`,
      [request.user!.id, ...keys.map((k) => v[k])],
    );
    return { ok: true };
  });

  fastify.post<{ Body: { title?: string; body?: string } }>('/push/test', tag, async (request) => {
    const r = await sendToUser(request.user!.id, {
      type: 'success', title: request.body?.title?.slice(0, 80) || '✅ LifeOS', body: request.body?.body?.slice(0, 200) || 'Thông báo trên thiết bị đã hoạt động!', url: '/settings?tab=app', tag: 'push-test', ephemeral: true,
    });
    return r ?? { sent: 0, failed: 0, devices: 0 };
  });

  // Admin: chạy ngay một vòng nhắc nhở (kiểm tra cấu hình)
  fastify.post('/push/run', tag, async (request) => {
    const { rowCount } = await pool.query(`SELECT 1 FROM "user_roles" WHERE user_id = $1 AND role = 'admin'`, [request.user!.id]);
    if (!rowCount) throw forbidden('Admin access required');
    await runPushTick();
    return { ok: true };
  });
};

export default pushRoutes;
