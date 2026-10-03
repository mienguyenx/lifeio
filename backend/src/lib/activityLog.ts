// Nhật ký hoạt động: tự động ghi lại thao tác tạo / sửa / hoàn thành / xoá của người dùng
// trên các bảng dữ liệu chính (qua data gateway). Không bao giờ làm hỏng request gốc.
import { pool } from '../db';

type Row = Record<string, unknown>;
type Action = 'created' | 'updated' | 'completed' | 'uncompleted' | 'deleted' | 'trashed' | 'restored' | 'archived' | 'unarchived';

interface Spec {
  module: string;
  entity: string;
  title: (r: Row) => string | undefined;
  /** cột thay đổi thường xuyên do hệ thống — không tính là "chỉnh sửa" */
  ignore?: string[];
  complete?: (o: Row, n: Row) => 'completed' | 'uncompleted' | null;
  owner?: string;
  /** chỉ ghi khi tạo mới (vd. phiên Focus) */
  createOnly?: boolean;
}

const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v : undefined);
const firstLine = (v: unknown) => str(v)?.split('\n').find((l) => l.trim())?.replace(/^#+\s*/, '').slice(0, 140);
const len = (v: unknown) => (Array.isArray(v) ? v.length : 0);

export const ACTIVITY_TABLES: Record<string, Spec> = {
  tasks: {
    module: 'tasks', entity: 'task', title: (r) => str(r.title), ignore: ['position', 'last_reminded', 'completed_pomodoros', 'completed_at'],
    complete: (o, n) => (o.status === n.status ? null : n.status === 'done' ? 'completed' : o.status === 'done' ? 'uncompleted' : null),
  },
  habits: {
    module: 'habits', entity: 'habit', title: (r) => str(r.name), ignore: ['streak', 'best_streak'],
    complete: (o, n) => (len(n.completed_dates) > len(o.completed_dates) ? 'completed' : len(n.completed_dates) < len(o.completed_dates) ? 'uncompleted' : null),
  },
  goals: {
    module: 'goals', entity: 'goal', title: (r) => str(r.title),
    complete: (o, n) => (Number(o.progress ?? 0) < 100 && Number(n.progress ?? 0) >= 100 ? 'completed' : null),
  },
  journal_entries: { module: 'journal', entity: 'journal', title: (r) => firstLine(r.content) },
  notes: { module: 'notes', entity: 'note', title: (r) => str(r.title) ?? firstLine(r.content), ignore: ['position', 'last_viewed_at'] },
  pomodoro_sessions: { module: 'focus', entity: 'pomodoro', title: (r) => `Phiên Focus ${r.duration ?? 25} phút`, createOnly: true },
  daily_checkins: { module: 'checkin', entity: 'checkin', title: (r) => (r.kind === 'morning' ? 'Check-in buổi sáng' : 'Tổng kết buổi tối') },
  weekly_reviews: { module: 'reviews', entity: 'weekly_review', title: (r) => `Review tuần ${str(r.week_start) ?? ''}`.trim() },
  monthly_reviews: { module: 'reviews', entity: 'monthly_review', title: (r) => `Review tháng ${str(r.month) ?? ''}`.trim() },
  yearly_reviews: { module: 'reviews', entity: 'yearly_review', title: (r) => `Review năm ${r.year ?? ''}`.trim() },
  life_wheel_scores: { module: 'life-wheel', entity: 'life_wheel', title: () => 'Đánh giá Bánh xe cuộc sống' },
  life_visions: { module: 'vision', entity: 'vision', title: (r) => firstLine(r.statement) },
  personal_values: { module: 'vision', entity: 'value', title: (r) => str(r.name) },
  life_roles: { module: 'vision', entity: 'role', title: (r) => str(r.name) },
  personal_traits: { module: 'vision', entity: 'trait', title: (r) => str(r.name) },
  life_milestones: { module: 'vision', entity: 'milestone', title: (r) => str(r.title) },
  finance_transactions: { module: 'finance', entity: 'transaction', title: (r) => str(r.description) ?? str(r.category) },
  health_logs: { module: 'health', entity: 'health_log', title: (r) => str(r.type) },
  learning_books: { module: 'learning', entity: 'book', title: (r) => str(r.title) },
  learning_courses: { module: 'learning', entity: 'course', title: (r) => str(r.title) },
  relationships_contacts: { module: 'relationships', entity: 'contact', title: (r) => str(r.name) },
  profiles: { module: 'account', entity: 'profile', title: () => 'Hồ sơ cá nhân', owner: 'id', ignore: ['last_seen_at'] },
};

const ALWAYS_IGNORE = new Set(['id', 'user_id', 'created_at', 'updated_at']);

export const isLoggedTable = (table: string) => table in ACTIVITY_TABLES;

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

function classify(spec: Spec, o: Row, n: Row, keys: string[]): { action: Action; fields?: string[] } | null {
  if (spec.createOnly) return null;
  if ('deleted_at' in n && !o.deleted_at && n.deleted_at) return { action: 'trashed' };
  if ('deleted_at' in n && o.deleted_at && !n.deleted_at) return { action: 'restored' };
  if ('archived_at' in n && !o.archived_at && n.archived_at) return { action: 'archived' };
  if ('archived_at' in n && o.archived_at && !n.archived_at) return { action: 'unarchived' };
  if ('archived' in n && o.archived !== n.archived && typeof n.archived === 'boolean') return { action: n.archived ? 'archived' : 'unarchived' };
  const c = spec.complete?.(o, n);
  if (c) return { action: c };
  const ignore = new Set([...(spec.ignore ?? []), ...ALWAYS_IGNORE]);
  const fields = keys.filter((k) => !ignore.has(k) && !same(o[k], n[k]));
  return fields.length ? { action: 'updated', fields } : null;
}

interface Entry { userId: string; spec: Spec; action: Action; row: Row; fields?: string[] }

async function write(e: Entry) {
  const entityId = e.row.id != null ? String(e.row.id) : null;
  const title = e.spec.title(e.row)?.slice(0, 200) ?? null;
  if (entityId && e.action === 'updated') {
    // Gộp nhiều lần sửa liên tiếp (vd. gõ phím → tự lưu) thành một dòng
    const recent = await pool.query(
      `SELECT id, action FROM activity_log WHERE user_id = $1 AND entity_id = $2 AND created_at > now() - interval '10 minutes' ORDER BY created_at DESC LIMIT 1`,
      [e.userId, entityId],
    );
    const prev = recent.rows[0];
    if (prev?.action === 'created') return; // vừa tạo xong rồi chỉnh tiếp → không cần dòng mới
    if (prev?.action === 'updated') {
      await pool.query(
        `UPDATE activity_log SET created_at = now(), title = COALESCE($2, title),
           details = jsonb_build_object('fields', (SELECT COALESCE(jsonb_agg(DISTINCT x), '[]'::jsonb) FROM jsonb_array_elements_text(COALESCE(details->'fields', '[]'::jsonb) || $3::jsonb) AS x))
         WHERE id = $1`,
        [prev.id, title, JSON.stringify(e.fields ?? [])],
      );
      return;
    }
  }
  await pool.query(
    `INSERT INTO activity_log (user_id, module, action, entity_type, entity_id, title, details) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [e.userId, e.spec.module, e.action, e.spec.entity, entityId, title, JSON.stringify(e.fields ? { fields: e.fields } : {})],
  );
}

async function flush(entries: Entry[], log?: (err: unknown) => void) {
  for (const e of entries.slice(0, 100)) {
    try { await write(e); } catch (err) { log?.(err); }
  }
  // Dọn bản ghi cũ hơn 1 năm (thỉnh thoảng)
  if (entries.length && Math.random() < 0.01) {
    pool.query(`DELETE FROM activity_log WHERE user_id = $1 AND created_at < now() - interval '365 days'`, [entries[0].userId]).catch(() => {});
  }
}

const ownerOf = (spec: Spec, row: Row, fallback: string) => String(row[spec.owner ?? 'user_id'] ?? fallback);

/** Đọc các dòng hiện có (trước khi ghi) theo id — để so sánh thay đổi. */
export async function snapshotByIds(table: string, ids: unknown[]): Promise<Map<string, Row>> {
  const m = new Map<string, Row>();
  const list = ids.filter((x) => x != null).map(String);
  if (!list.length || !isLoggedTable(table)) return m;
  try {
    const res = await pool.query(`SELECT * FROM "${table}" WHERE id::text = ANY($1)`, [list.slice(0, 500)]);
    for (const r of res.rows) m.set(String(r.id), r);
  } catch { /* bảng không có id */ }
  return m;
}

export async function logInsert(table: string, actor: string, rows: Row[], before: Map<string, Row>, inputKeys: string[], log?: (err: unknown) => void) {
  const spec = ACTIVITY_TABLES[table];
  if (!spec) return;
  const entries: Entry[] = [];
  for (const raw of rows) {
    const { __inserted, ...row } = raw as Row & { __inserted?: boolean };
    const old = row.id != null ? before.get(String(row.id)) : undefined;
    const userId = ownerOf(spec, row, actor);
    if (__inserted || (!old && __inserted === undefined)) { entries.push({ userId, spec, action: 'created', row }); continue; }
    if (!old) { if (!spec.createOnly) entries.push({ userId, spec, action: 'updated', row, fields: inputKeys.filter((k) => !ALWAYS_IGNORE.has(k) && !(spec.ignore ?? []).includes(k)) }); continue; }
    const c = classify(spec, old, row, inputKeys);
    if (c) entries.push({ userId, spec, row, ...c });
  }
  await flush(entries, log);
}

export async function logUpdate(table: string, actor: string, before: Row[], after: Row[], keys: string[], log?: (err: unknown) => void) {
  const spec = ACTIVITY_TABLES[table];
  if (!spec) return;
  const old = new Map(before.map((r) => [String(r.id), r]));
  const entries: Entry[] = [];
  for (const row of after) {
    const o = old.get(String(row.id));
    if (!o) continue;
    const c = classify(spec, o, row, keys);
    if (c) entries.push({ userId: ownerOf(spec, row, actor), spec, row, ...c });
  }
  await flush(entries, log);
}

export async function logDelete(table: string, actor: string, rows: Row[], log?: (err: unknown) => void) {
  const spec = ACTIVITY_TABLES[table];
  if (!spec || spec.createOnly || table === 'profiles') return;
  await flush(rows.map((row) => ({ userId: ownerOf(spec, row, actor), spec, action: 'deleted' as const, row })), log);
}
