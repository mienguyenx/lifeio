// Voice / text command assistant: turns a natural-language request ("nhắc tôi
// gọi mẹ lúc 6 giờ chiều mai", "tạo thói quen uống 8 ly nước mỗi ngày") into
// structured actions via OpenAI-style function calling. The backend only
// *proposes* actions; the frontend shows them for confirmation and applies them
// through its local-first store, so data flows through the normal sync path.

import { fold, matchScore } from './fuzzyMatch';
import { describeTemporal, extractVnTemporal, type TemporalHit } from './vnTemporal';

export const LIFE_AREA_IDS = [
  'health', 'relationships', 'career', 'finance', 'personal',
  'fun', 'environment', 'spirituality', 'learning', 'contribution',
] as const;

export interface AssistantContext {
  today?: string; // YYYY-MM-DD in the user's timezone
  now?: string; // HH:mm
  weekday?: number; // 0 = Sunday
  timezone?: string;
  habits?: { id: string; name: string; doneToday?: boolean; target?: number }[];
  tasks?: { id: string; title: string; dueDate?: string }[];
  goals?: { id: string; title: string; progress?: number }[];
  /** Đang có phiên tập trung (Pomodoro) chạy không. */
  focusRunning?: boolean;
  /** Trang người dùng đang mở. */
  page?: string;
}

export type AssistantActionType =
  | 'create_task' | 'complete_task' | 'create_habit' | 'complete_habit'
  | 'create_goal' | 'create_journal_entry' | 'create_note' | 'add_finance_transaction'
  | 'update_task' | 'delete_task' | 'log_health' | 'start_focus' | 'stop_focus'
  | 'update_goal_progress' | 'open_page';

export interface AssistantAction {
  type: AssistantActionType;
  args: Record<string, unknown>;
  /** Mức chắc chắn khi khớp tên gần đúng (0–1); < 0.75 → giao diện hỏi xác nhận. */
  confidence?: number;
}

export const HEALTH_METRICS = ['water', 'sleep', 'exercise', 'steps', 'weight', 'mood'] as const;
export const PAGES = ['today', 'tasks', 'habits', 'goals', 'journal', 'notes', 'finance', 'health', 'calendar', 'vision', 'activity', 'coach', 'settings', 'learning', 'relationships', 'reviews'] as const;

const area = { type: 'string', enum: [...LIFE_AREA_IDS], description: 'Lĩnh vực cuộc sống phù hợp nhất' };
const date = (d: string) => ({ type: 'string', description: `${d} (YYYY-MM-DD)` });
const time = (d: string) => ({ type: 'string', description: `${d} (HH:mm, 24h)` });
const fn = (name: string, description: string, properties: Record<string, unknown>, required: string[]) => ({
  type: 'function',
  function: { name, description, parameters: { type: 'object', properties, required } },
});

export const ASSISTANT_TOOLS = [
  fn('create_task', 'Tạo một công việc (task/việc cần làm/nhắc việc).', {
    title: { type: 'string', description: 'Tiêu đề ngắn gọn, viết hoa chữ đầu' },
    description: { type: 'string' },
    dueDate: date('Hạn hoàn thành'),
    reminderTime: time('Giờ nhắc nếu người dùng nói giờ cụ thể'),
    priority: { type: 'string', enum: ['low', 'medium', 'high'] },
    area,
    goalId: { type: 'string', description: 'id mục tiêu liên quan nếu người dùng nhắc tới' },
  }, ['title']),
  fn('complete_task', 'Đánh dấu một công việc đã có là hoàn thành.', {
    taskId: { type: 'string', description: 'id lấy từ danh sách công việc' },
    taskTitle: { type: 'string', description: 'Tên công việc như người dùng nói (dùng khi không chắc id)' },
  }, []),
  fn('update_task', 'Sửa / dời lịch / đổi ưu tiên một công việc đã có ("dời việc X sang thứ 6", "đổi giờ nhắc…").', {
    taskId: { type: 'string', description: 'id lấy từ danh sách công việc' },
    taskTitle: { type: 'string', description: 'Tên công việc như người dùng nói' },
    title: { type: 'string', description: 'Tiêu đề mới nếu người dùng muốn đổi tên' },
    dueDate: date('Hạn mới'),
    reminderTime: time('Giờ nhắc mới'),
    priority: { type: 'string', enum: ['low', 'medium', 'high'] },
  }, []),
  fn('delete_task', 'Xoá (bỏ vào thùng rác) một công việc đã có. Chỉ dùng khi người dùng nói rõ xoá/bỏ/huỷ việc.', {
    taskId: { type: 'string' },
    taskTitle: { type: 'string', description: 'Tên công việc như người dùng nói' },
  }, []),
  fn('create_habit', 'Tạo một thói quen lặp lại.', {
    name: { type: 'string' },
    description: { type: 'string' },
    area,
    frequency: { type: 'string', enum: ['daily', 'weekly', 'custom'] },
    customDays: { type: 'array', items: { type: 'integer', minimum: 0, maximum: 6 }, description: 'Các ngày trong tuần (0 = Chủ nhật) khi frequency là custom/weekly' },
    targetPerDay: { type: 'integer', description: 'Số lần/lượng mỗi ngày, ví dụ 8 (ly nước)' },
    targetUnit: { type: 'string', description: 'Đơn vị, ví dụ "ly", "phút", "trang"' },
    reminderTime: time('Giờ nhắc'),
    icon: { type: 'string', description: 'Một emoji phù hợp' },
  }, ['name', 'area', 'frequency']),
  fn('complete_habit', 'Check-in / đánh dấu đã làm một thói quen đã có hôm nay (hoặc cộng thêm số lần).', {
    habitId: { type: 'string', description: 'id lấy từ danh sách thói quen' },
    habitName: { type: 'string', description: 'Tên thói quen như người dùng nói' },
    count: { type: 'integer', minimum: 1, maximum: 50, description: 'Số lần/lượng cộng thêm, ví dụ "uống thêm 2 ly" = 2. Mặc định 1' },
  }, []),
  fn('create_goal', 'Tạo một mục tiêu.', {
    title: { type: 'string' },
    description: { type: 'string' },
    area,
    targetDate: date('Ngày đích'),
    milestones: { type: 'array', items: { type: 'string' }, description: '2-5 cột mốc nếu hợp lý' },
  }, ['title', 'area']),
  fn('update_goal_progress', 'Cập nhật tiến độ (%) của một mục tiêu đã có.', {
    goalId: { type: 'string' },
    goalTitle: { type: 'string', description: 'Tên mục tiêu như người dùng nói' },
    progress: { type: 'integer', minimum: 0, maximum: 100, description: 'Tiến độ mới 0–100' },
  }, ['progress']),
  fn('log_health', 'Ghi chỉ số sức khỏe: nước uống (ly), giấc ngủ (giờ), vận động (phút), bước chân, cân nặng (kg), tâm trạng (1–5).', {
    metric: { type: 'string', enum: [...HEALTH_METRICS] },
    value: { type: 'number', description: 'Giá trị theo đơn vị: water=ly, sleep=giờ, exercise=phút, steps=bước, weight=kg, mood=1–5' },
    notes: { type: 'string', description: 'Ví dụ "chạy bộ", "ngủ chập chờn"' },
    date: date('Ngày của chỉ số (mặc định hôm nay; "tối qua ngủ…" = hôm qua)'),
  }, ['metric', 'value']),
  fn('start_focus', 'Bắt đầu một phiên tập trung (Pomodoro), có thể gắn với một công việc.', {
    minutes: { type: 'integer', minimum: 5, maximum: 180, description: 'Số phút (mặc định theo cài đặt)' },
    taskId: { type: 'string' },
    taskTitle: { type: 'string', description: 'Tên công việc sẽ tập trung' },
  }, []),
  fn('stop_focus', 'Dừng / kết thúc phiên tập trung đang chạy.', {}, []),
  fn('open_page', 'Mở một trang trong ứng dụng ("mở tài chính", "xem lịch").', {
    page: { type: 'string', enum: [...PAGES] },
  }, ['page']),
  fn('create_journal_entry', 'Ghi nhật ký cho hôm nay.', {
    content: { type: 'string', description: 'Nội dung nhật ký, giữ nguyên lời người dùng, sửa lỗi chính tả nhẹ' },
    mood: { type: 'integer', minimum: 1, maximum: 5, description: 'Tâm trạng 1 (rất tệ) – 5 (rất tốt), suy ra từ lời nói' },
    energy: { type: 'integer', minimum: 1, maximum: 5 },
    gratitude: { type: 'array', items: { type: 'string' }, description: 'Những điều biết ơn nếu có' },
  }, ['content']),
  fn('create_note', 'Lưu một ghi chú / ý tưởng.', {
    title: { type: 'string' },
    content: { type: 'string' },
    area,
  }, ['title', 'content']),
  fn('add_finance_transaction', 'Ghi một khoản thu hoặc chi.', {
    type: { type: 'string', enum: ['income', 'expense'] },
    amount: { type: 'number', description: 'Số tiền VND, ví dụ "50 nghìn" = 50000, "2 triệu" = 2000000' },
    category: { type: 'string', description: 'Ví dụ: Ăn uống, Di chuyển, Lương, Mua sắm' },
    description: { type: 'string' },
    date: date('Ngày giao dịch'),
  }, ['type', 'amount', 'category']),
];

const WEEKDAYS = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];

export function buildAssistantSystemPrompt(ctx: AssistantContext, text = ''): string {
  const temporal = ctx.today ? describeTemporal(extractVnTemporal(text, ctx.today, ctx.now)) : '';
  const amounts = extractVnAmounts(text);
  const list = <T,>(items: T[] | undefined, f: (x: T) => string) => (items?.length ? items.slice(0, 40).map(f).join('\n') : '(trống)');
  return `Bạn là trợ lý của ứng dụng LifeOS. Nhiệm vụ: hiểu yêu cầu (thường là lời nói đã được chuyển thành văn bản, có thể sai chính tả/thiếu dấu) và gọi các hàm phù hợp để tạo hoặc cập nhật dữ liệu.

Quy tắc:
- Hôm nay là ${ctx.weekday !== undefined ? WEEKDAYS[ctx.weekday] + ', ' : ''}${ctx.today ?? 'không rõ'}, bây giờ là ${ctx.now ?? 'không rõ'} (${ctx.timezone ?? 'Asia/Ho_Chi_Minh'}). Quy đổi "mai", "thứ 6 tuần này", "cuối tháng"… thành ngày cụ thể.
- "6 giờ chiều" = 18:00, "8 giờ tối" = 20:00, "trưa" = 12:00.
- Một câu có thể chứa nhiều yêu cầu → gọi nhiều hàm.
- "Nhắc tôi…", "cần làm…", "phải…" là công việc (create_task). "Mỗi ngày/hằng tuần…" là thói quen (create_habit).
- Khi người dùng nói đã làm xong một việc/thói quen có trong danh sách, dùng complete_task/complete_habit với đúng id. Nếu không chắc id thì điền taskTitle/habitName đúng như lời người dùng — KHÔNG bịa id.
- "Dời/đổi/hoãn việc…" → update_task. "Xoá/bỏ việc…" → delete_task. "Tiến độ mục tiêu… 60%" → update_goal_progress.
- "Uống 2 ly nước", "chạy 30 phút", "ngủ 7 tiếng", "nặng 62 ký", "hôm nay vui/buồn": nếu có thói quen trùng khớp trong danh sách → complete_habit (count = số lượng); nếu không → log_health.
- "Bắt đầu tập trung / bấm giờ 25 phút / pomodoro" → start_focus; "dừng tập trung" → stop_focus${ctx.focusRunning ? ' (đang có phiên chạy)' : ''}.
- "Mở/xem trang…" → open_page.
- Chọn priority "high" khi người dùng nói gấp/quan trọng.
- Nếu yêu cầu chỉ là câu hỏi, tâm sự hoặc xin lời khuyên (không yêu cầu tạo/cập nhật gì) thì KHÔNG gọi hàm, chỉ trả lời "CHAT".
- Luôn viết nội dung bằng tiếng Việt có dấu.
${temporal ? '\n' + temporal + '\n' : ''}${amounts.length ? `\nSố tiền trong câu đã quy đổi: ${amounts.map((a) => `«${a.phrase}» = ${a.value}`).join(', ')}\n` : ''}${ctx.page ? `\nNgười dùng đang ở trang: ${ctx.page}\n` : ''}
Thói quen hiện có (id | tên | đã làm hôm nay?):
${list(ctx.habits, (h) => `${h.id} | ${h.name} | ${h.doneToday ? 'rồi' : 'chưa'}`)}

Công việc chưa xong (id | tiêu đề | hạn):
${list(ctx.tasks, (t) => `${t.id} | ${t.title} | ${t.dueDate ?? ''}`)}

Mục tiêu (id | tiêu đề | tiến độ):
${list(ctx.goals, (g) => `${g.id} | ${g.title} | ${g.progress ?? 0}%`)}`;
}

const VALID = new Set<string>(ASSISTANT_TOOLS.map((t) => t.function.name));
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

// ------------------------------ Số tiền ------------------------------
export interface AmountHit { phrase: string; value: number }
const UNIT: Record<string, number> = { k: 1e3, nghin: 1e3, ngan: 1e3, ca: 1e3, tr: 1e6, trieu: 1e6, cu: 1e6, ty: 1e9, ti: 1e9 };
/** "50k", "50 nghìn", "1 triệu 2", "2 triệu rưỡi", "1tr5", "200.000đ" → VND. */
export function extractVnAmounts(text: string): AmountHit[] {
  const out: AmountHit[] = [];
  const plain = fold(text.slice(0, 2000).replace(/(\d)[.,](\d{3})\b/g, '$1$2').replace(/(\d)[.,](\d{3})\b/g, '$1$2').replace(/(\d),(\d)/g, '$1.$2'));
  const re = /\b(\d+(?:\.\d+)?)\s*(k|nghin|ngan|ca|tr|trieu|cu|ty|ti)(?![a-z])(?:\s*(ruoi|\d{1,3})(?!\s*(?:k|nghin|ngan|tr|trieu|ly|lan|gio|phut|ngay|trang|buoc)))?|\b(\d{4,12})\s*(?:d|dong|vnd)\b/g;
  for (let m = re.exec(plain); m; m = re.exec(plain)) {
    if (m[4]) { out.push({ phrase: m[0].trim(), value: Number(m[4]) }); continue; }
    const unit = UNIT[m[2]];
    let v = Number(m[1]) * unit;
    if (m[3] === 'ruoi') v += unit / 2;
    else if (m[3]) v += Number(m[3]) * unit / 10 ** m[3].length; // "1 triệu 2" = 1,2 triệu
    out.push({ phrase: m[0].trim(), value: Math.round(v) });
  }
  return out;
}

/** Kết quả phân tích: hành động hợp lệ + vấn đề cần báo người dùng (không tìm thấy…). */
export interface ParsedActions { actions: AssistantAction[]; issues: string[] }

type Ref = { id: string; label: string; penalty?: number };
/**
 * Tìm id theo: id model trả về → tên model trích (taskTitle/habitName, hoặc tên
 * bị nhét vào id) → cả câu nói. Khi tên khớp sát nút nhiều mục, dùng câu nói gốc
 * để phân xử. `penalty` hạ điểm mục khó là đích (VD thói quen đã check-in).
 */
function resolveRef(list: Ref[], id: unknown, name: unknown, text: string): { id: string; confidence: number } | undefined {
  const sid = typeof id === 'string' ? id.trim() : '';
  if (sid && list.some((x) => x.id === sid)) return { id: sid, confidence: 1 };
  if (!list.length) return undefined;
  const query = [name, sid && !/^[0-9a-f-]{16,}$/i.test(sid) ? sid : undefined].find((q): q is string => typeof q === 'string' && !!q.trim());
  const scored = list.map((x) => ({
    x,
    byName: (query ? matchScore(query, x.label) : 0) - (x.penalty ?? 0),
    byText: matchScore(text, x.label) - (x.penalty ?? 0),
  }));
  const pick = (key: (s: typeof scored[number]) => number, min: number, margin: number) => {
    const r = [...scored].sort((a, b) => key(b) - key(a));
    if (!r[0] || key(r[0]) < min) return undefined;
    if (r[1] && key(r[0]) < 0.9 && key(r[0]) - key(r[1]) < margin) return null; // sát nút
    return { id: r[0].x.id, confidence: Math.round(Math.min(1, key(r[0])) * 100) / 100 };
  };
  if (query) {
    const byName = pick((s) => s.byName, 0.5, 0.15);
    if (byName) return byName;
    if (byName === null) {
      const mixed = pick((s) => 0.6 * s.byName + 0.4 * s.byText, 0.45, 0.1);
      if (mixed) return { id: mixed.id, confidence: Math.min(mixed.confidence, 0.7) };
    }
  }
  const byText = pick((s) => s.byText, 0.7, 0.15);
  return byText ? { id: byText.id, confidence: Math.min(byText.confidence, 0.8) } : undefined;
}

/** Parse + sanitise tool calls from an OpenAI-style response into actions. */
export function parseAssistantActions(
  toolCalls: Array<{ function?: { name?: string; arguments?: string } }> | undefined,
  ctx: AssistantContext,
  text = '',
): ParsedActions {
  const lists: Record<'task' | 'habit' | 'goal', Ref[]> = {
    // Thói quen một-lần/ngày đã check-in hôm nay khó là đích của lệnh "đã làm…".
    habit: (ctx.habits ?? []).map((h) => ({ id: h.id, label: h.name, penalty: h.doneToday && !(Number(h.target) > 1) ? 0.2 : 0 })),
    task: (ctx.tasks ?? []).map((t) => ({ id: t.id, label: t.title })),
    goal: (ctx.goals ?? []).map((g) => ({ id: g.id, label: g.title })),
  };
  const temporal: TemporalHit[] = ctx.today ? extractVnTemporal(text, ctx.today, ctx.now) : [];
  const uniq = (xs: (string | undefined)[]) => [...new Set(xs.filter(Boolean) as string[])];
  const dates = uniq(temporal.map((h) => h.date));
  const times = uniq(temporal.filter((h) => !h.ambiguous).map((h) => h.time));
  const amounts = extractVnAmounts(text);
  const actions: AssistantAction[] = [];
  const issues: string[] = [];
  const calls = (toolCalls ?? []).filter((c) => c.function?.name && VALID.has(c.function.name));
  // Chỉ sửa ngày/giờ/số tiền khi câu có đúng một lệnh → không phá câu nhiều lệnh.
  const single = calls.length === 1;

  for (const call of calls) {
    const name = call.function!.name! as AssistantActionType;
    let args: Record<string, unknown> = {};
    try {
      args = JSON.parse(call.function?.arguments || '{}') as Record<string, unknown>;
    } catch {
      continue;
    }
    let confidence: number | undefined;
    if (args.area && !(LIFE_AREA_IDS as readonly string[]).includes(String(args.area))) delete args.area;
    if (args.goalId && name !== 'update_goal_progress' && !lists.goal.some((g) => g.id === args.goalId)) delete args.goalId;

    // --- Tham chiếu tới dữ liệu đã có ---
    const ref = (kind: 'task' | 'habit' | 'goal', idKey: string, nameKey: string, required: boolean, label: string) => {
      const r = resolveRef(lists[kind], args[idKey], args[nameKey], text);
      const said = String(args[nameKey] ?? '').trim();
      delete args[nameKey];
      if (!r) {
        delete args[idKey];
        if (required) issues.push(`Không tìm thấy ${label}${said ? ` “${said}”` : ''}`);
        return !required;
      }
      args[idKey] = r.id;
      if (r.confidence < 1) confidence = Math.min(confidence ?? 1, r.confidence);
      return true;
    };
    if ((name === 'complete_task' || name === 'update_task' || name === 'delete_task') && !ref('task', 'taskId', 'taskTitle', true, 'công việc')) continue;
    if (name === 'start_focus' && !ref('task', 'taskId', 'taskTitle', false, 'công việc')) continue;
    if (name === 'complete_habit' && !ref('habit', 'habitId', 'habitName', true, 'thói quen')) continue;
    if (name === 'update_goal_progress' && !ref('goal', 'goalId', 'goalTitle', true, 'mục tiêu')) continue;

    // --- Ngày / giờ: chuẩn hoá + sửa theo bộ quy đổi xác định ---
    const isTask = name === 'create_task' || name === 'update_task';
    const datedLog = name === 'add_finance_transaction' || name === 'log_health';
    const dateKey = name === 'create_goal' ? 'targetDate' : datedLog ? 'date' : isTask ? 'dueDate' : undefined;
    for (const k of ['dueDate', 'targetDate', 'date']) {
      if (args[k] && !DATE_RE.test(String(args[k]))) delete args[k];
    }
    if (dateKey && single && dates.length === 1 && (args[dateKey] || isTask || datedLog)) args[dateKey] = dates[0];
    if (args.reminderTime && !TIME_RE.test(String(args.reminderTime))) {
      const t = String(args.reminderTime).match(/^(\d{1,2}):(\d{2})/);
      if (t) args.reminderTime = `${t[1].padStart(2, '0')}:${t[2]}`; else delete args.reminderTime;
    }
    if (isTask && single && times.length === 1) args.reminderTime = times[0];
    // Có giờ nhắc mà chưa có ngày → hôm nay; thu chi / sức khỏe mặc định hôm nay.
    if (name === 'create_task' && args.reminderTime && !args.dueDate && ctx.today) args.dueDate = ctx.today;
    if (datedLog && !args.date && ctx.today) args.date = ctx.today;
    if (name === 'update_task' && !['title', 'dueDate', 'reminderTime', 'priority'].some((k) => args[k])) { issues.push('Chưa rõ muốn đổi gì cho công việc'); continue; }

    // --- Kiểu riêng từng hành động ---
    if (name === 'add_finance_transaction') {
      if (single && amounts.length === 1) args.amount = amounts[0].value;
      if (!(Number(args.amount) > 0)) continue;
      args.amount = Math.round(Number(args.amount));
    }
    if (name === 'log_health') {
      if (!(HEALTH_METRICS as readonly string[]).includes(String(args.metric))) continue;
      const v = Number(args.value);
      const range = { water: [0.5, 30], sleep: [0.5, 24], exercise: [1, 600], steps: [10, 100000], weight: [20, 300], mood: [1, 5] }[String(args.metric) as typeof HEALTH_METRICS[number]];
      if (!(v >= range[0] && v <= range[1])) { issues.push('Giá trị sức khỏe không hợp lệ'); continue; }
      args.value = v;
    }
    if (name === 'complete_habit' && args.count !== undefined) args.count = Math.max(1, Math.min(50, Math.round(Number(args.count) || 1)));
    if (name === 'update_goal_progress') {
      const pr = Number(args.progress);
      if (!(pr >= 0 && pr <= 100)) continue;
      args.progress = Math.round(pr);
    }
    if (name === 'start_focus' && args.minutes !== undefined) {
      const m = Math.round(Number(args.minutes));
      if (m >= 5 && m <= 180) args.minutes = m; else delete args.minutes;
    }
    if (name === 'open_page' && !(PAGES as readonly string[]).includes(String(args.page))) continue;
    if ((name === 'create_task' && !String(args.title ?? '').trim()) || (name === 'create_habit' && !String(args.name ?? '').trim())) continue;

    actions.push({ type: name, args, ...(confidence !== undefined ? { confidence } : {}) });
  }
  return { actions, issues };
}
