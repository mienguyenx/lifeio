// Bộ hẹn giờ nhắc nhở phía máy chủ (chạy mỗi phút): nhắc task sắp đến hạn, nhắc thói quen
// đúng giờ, bản tin buổi sáng. Chỉ gửi cho người đã bật thông báo trên ít nhất 1 thiết bị.
import { pool } from '../db';
import { sendToUser } from './push';

const LOCK_ID = 7_340_021; // advisory lock — tránh gửi trùng khi chạy nhiều instance
let timer: NodeJS.Timeout | null = null;
let running = false;

interface UserRow {
  user_id: string; tz: string; local_date: string; local_min: number;
  task_reminders: boolean; habit_reminders: boolean; overdue_alerts: boolean; daily_digest: boolean;
  digest_min: number; quiet_start: number | null; quiet_end: number | null;
}

const inQuiet = (u: UserRow) => {
  if (u.quiet_start == null || u.quiet_end == null || u.quiet_start === u.quiet_end) return false;
  return u.quiet_start < u.quiet_end ? u.local_min >= u.quiet_start && u.local_min < u.quiet_end : u.local_min >= u.quiet_start || u.local_min < u.quiet_end;
};

async function users(): Promise<UserRow[]> {
  const { rows } = await pool.query<UserRow>(`
    WITH u AS (
      SELECT DISTINCT s.user_id, COALESCE(np.timezone, p.timezone, 'Asia/Ho_Chi_Minh') AS tz,
        COALESCE(np.task_reminders, true) AS task_reminders, COALESCE(np.habit_reminders, true) AS habit_reminders,
        COALESCE(np.overdue_alerts, true) AS overdue_alerts, COALESCE(np.daily_digest, true) AS daily_digest,
        COALESCE(np.digest_time, '08:00'::time) AS digest_time, np.quiet_start, np.quiet_end
      FROM "push_subscriptions" s
      LEFT JOIN "notification_prefs" np ON np.user_id = s.user_id
      LEFT JOIN "profiles" p ON p.id = s.user_id
    )
    SELECT user_id, tz, task_reminders, habit_reminders, overdue_alerts, daily_digest,
      to_char(now() AT TIME ZONE tz, 'YYYY-MM-DD') AS local_date,
      (EXTRACT(HOUR FROM now() AT TIME ZONE tz) * 60 + EXTRACT(MINUTE FROM now() AT TIME ZONE tz))::int AS local_min,
      (EXTRACT(HOUR FROM digest_time) * 60 + EXTRACT(MINUTE FROM digest_time))::int AS digest_min,
      CASE WHEN quiet_start IS NULL THEN NULL ELSE (EXTRACT(HOUR FROM quiet_start) * 60 + EXTRACT(MINUTE FROM quiet_start))::int END AS quiet_start,
      CASE WHEN quiet_end IS NULL THEN NULL ELSE (EXTRACT(HOUR FROM quiet_end) * 60 + EXTRACT(MINUTE FROM quiet_end))::int END AS quiet_end
    FROM u`);
  return rows.filter((r) => { try { new Intl.DateTimeFormat('en', { timeZone: r.tz }); return true; } catch { return false; } });
}

async function taskReminders(u: UserRow) {
  // Hạn = 23:59:59 ngày due_date theo giờ địa phương; nhắc trước reminder_minutes (giống app)
  const { rows } = await pool.query<{ id: string; title: string; mins_left: number }>(`
    SELECT id, title, EXTRACT(EPOCH FROM (((due_date + time '23:59:59') AT TIME ZONE $2) - now()))::int / 60 AS mins_left
    FROM "tasks"
    WHERE user_id = $1 AND status <> 'done' AND deleted_at IS NULL AND COALESCE(archived, false) = false
      AND due_date IS NOT NULL AND reminder_minutes IS NOT NULL
      AND now() >= ((due_date + time '23:59:59') AT TIME ZONE $2) - make_interval(mins => reminder_minutes)
      AND now() <= ((due_date + time '23:59:59') AT TIME ZONE $2)
      AND (last_reminded IS NULL OR (last_reminded AT TIME ZONE $2)::date < (now() AT TIME ZONE $2)::date)
    LIMIT 20`, [u.user_id, u.tz]);
  for (const t of rows) {
    const left = t.mins_left >= 60 ? `${Math.round(t.mins_left / 60)} giờ` : `${Math.max(1, t.mins_left)} phút`;
    await pool.query(`UPDATE "tasks" SET last_reminded = now() WHERE id = $1`, [t.id]);
    await sendToUser(u.user_id, { type: 'task', title: `⏰ Nhắc nhở: ${t.title}`, body: `Còn ${left} đến hạn!`, url: '/tasks', tag: t.id, dedupeKey: `task:${t.id}:${u.local_date}`, actions: [{ action: 'open', title: 'Mở công việc' }] });
  }
}

async function habitReminders(u: UserRow) {
  // Đúng giờ nhắc (cho phép trễ tối đa 10 phút nếu máy chủ bận), chưa hoàn thành hôm nay
  const { rows } = await pool.query<{ id: string; name: string; icon: string | null }>(`
    SELECT h.id, h.name, h.icon FROM "habits" h
    WHERE h.user_id = $1 AND h.deleted_at IS NULL AND h.archived_at IS NULL AND h.reminder_enabled = true AND h.reminder_time IS NOT NULL
      AND (EXTRACT(HOUR FROM h.reminder_time) * 60 + EXTRACT(MINUTE FROM h.reminder_time))::int BETWEEN $2::int - 10 AND $2::int
      AND NOT ($3 = ANY(COALESCE(h.completed_dates, '{}')))
      AND NOT EXISTS (SELECT 1 FROM "habit_completions" c WHERE c.habit_id = h.id AND c.date = $3::date)
    LIMIT 20`, [u.user_id, u.local_min, u.local_date]);
  for (const h of rows) {
    await sendToUser(u.user_id, { type: 'habit', title: `${h.icon && h.icon.length <= 4 ? h.icon : '🔔'} Đến giờ: ${h.name}`, body: 'Giữ chuỗi ngày của bạn nhé — chỉ cần vài phút!', url: '/habits', tag: `habit-reminder-${h.id}`, dedupeKey: `habit:${h.id}:${u.local_date}` });
  }
}

async function dailyDigest(u: UserRow) {
  if (u.local_min < u.digest_min || u.local_min > u.digest_min + 30) return;
  const { rows: [c] } = await pool.query<{ today: number; overdue: number; habits: number }>(`
    SELECT
      (SELECT count(*) FROM "tasks" WHERE user_id = $1 AND status <> 'done' AND deleted_at IS NULL AND COALESCE(archived,false) = false AND due_date = $2::date)::int AS today,
      (SELECT count(*) FROM "tasks" WHERE user_id = $1 AND status <> 'done' AND deleted_at IS NULL AND COALESCE(archived,false) = false AND due_date < $2::date)::int AS overdue,
      (SELECT count(*) FROM "habits" WHERE user_id = $1 AND deleted_at IS NULL AND archived_at IS NULL)::int AS habits`, [u.user_id, u.local_date]);
  if (!c.today && !c.overdue && !c.habits) return;
  const parts = [c.today && `${c.today} việc hôm nay`, c.overdue && u.overdue_alerts && `${c.overdue} việc quá hạn`, c.habits && `${c.habits} thói quen`].filter(Boolean);
  await sendToUser(u.user_id, { type: 'info', title: '☀️ Chào buổi sáng!', body: `Hôm nay: ${parts.join(' · ')}. Bắt đầu thôi!`, url: '/', tag: 'daily-digest', dedupeKey: `digest:${u.user_id}:${u.local_date}` });
}

export async function runPushTick() {
  if (running) return;
  running = true;
  const noLock = process.env.PUSH_NO_LOCK === '1';
  const client = noLock ? null : await pool.connect();
  try {
    if (client) {
      const { rows } = await client.query<{ ok: boolean }>(`SELECT pg_try_advisory_lock($1) AS ok`, [LOCK_ID]);
      if (!rows[0]?.ok) return;
    }
    try {
      for (const u of await users()) {
        if (inQuiet(u)) continue;
        try {
          if (u.task_reminders) await taskReminders(u);
          if (u.habit_reminders) await habitReminders(u);
          if (u.daily_digest) await dailyDigest(u);
        } catch (e) { console.warn('[push] user tick failed', u.user_id, (e as Error).message); }
      }
    } finally { if (client) await client.query(`SELECT pg_advisory_unlock($1)`, [LOCK_ID]); }
  } catch (e) {
    console.warn('[push] tick failed', (e as Error).message);
  } finally { client?.release(); running = false; }
}

export function startPushScheduler() {
  if (timer || process.env.PUSH_SCHEDULER === 'off') return;
  timer = setInterval(() => void runPushTick(), 60_000);
  setTimeout(() => void runPushTick(), 5_000);
}
export function stopPushScheduler() { if (timer) clearInterval(timer); timer = null; }
