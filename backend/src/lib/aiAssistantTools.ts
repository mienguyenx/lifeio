// Voice / text command assistant: turns a natural-language request ("nhắc tôi
// gọi mẹ lúc 6 giờ chiều mai", "tạo thói quen uống 8 ly nước mỗi ngày") into
// structured actions via OpenAI-style function calling. The backend only
// *proposes* actions; the frontend shows them for confirmation and applies them
// through its local-first store, so data flows through the normal sync path.

export const LIFE_AREA_IDS = [
  'health', 'relationships', 'career', 'finance', 'personal',
  'fun', 'environment', 'spirituality', 'learning', 'contribution',
] as const;

export interface AssistantContext {
  today?: string; // YYYY-MM-DD in the user's timezone
  now?: string; // HH:mm
  weekday?: number; // 0 = Sunday
  timezone?: string;
  habits?: { id: string; name: string; doneToday?: boolean }[];
  tasks?: { id: string; title: string; dueDate?: string }[];
  goals?: { id: string; title: string }[];
}

export type AssistantActionType =
  | 'create_task' | 'complete_task' | 'create_habit' | 'complete_habit'
  | 'create_goal' | 'create_journal_entry' | 'create_note' | 'add_finance_transaction';

export interface AssistantAction {
  type: AssistantActionType;
  args: Record<string, unknown>;
}

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
  }, ['taskId']),
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
  fn('complete_habit', 'Check-in / đánh dấu đã làm một thói quen đã có hôm nay.', {
    habitId: { type: 'string', description: 'id lấy từ danh sách thói quen' },
  }, ['habitId']),
  fn('create_goal', 'Tạo một mục tiêu.', {
    title: { type: 'string' },
    description: { type: 'string' },
    area,
    targetDate: date('Ngày đích'),
    milestones: { type: 'array', items: { type: 'string' }, description: '2-5 cột mốc nếu hợp lý' },
  }, ['title', 'area']),
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

export function buildAssistantSystemPrompt(ctx: AssistantContext): string {
  const list = <T,>(items: T[] | undefined, f: (x: T) => string) => (items?.length ? items.slice(0, 40).map(f).join('\n') : '(trống)');
  return `Bạn là trợ lý của ứng dụng LifeOS. Nhiệm vụ: hiểu yêu cầu (thường là lời nói đã được chuyển thành văn bản, có thể sai chính tả/thiếu dấu) và gọi các hàm phù hợp để tạo hoặc cập nhật dữ liệu.

Quy tắc:
- Hôm nay là ${ctx.weekday !== undefined ? WEEKDAYS[ctx.weekday] + ', ' : ''}${ctx.today ?? 'không rõ'}, bây giờ là ${ctx.now ?? 'không rõ'} (${ctx.timezone ?? 'Asia/Ho_Chi_Minh'}). Quy đổi "mai", "thứ 6 tuần này", "cuối tháng"… thành ngày cụ thể.
- "6 giờ chiều" = 18:00, "8 giờ tối" = 20:00, "trưa" = 12:00.
- Một câu có thể chứa nhiều yêu cầu → gọi nhiều hàm.
- "Nhắc tôi…", "cần làm…", "phải…" là công việc (create_task). "Mỗi ngày/hằng tuần…" là thói quen (create_habit).
- Khi người dùng nói đã làm xong một việc/thói quen có trong danh sách, dùng complete_task/complete_habit với đúng id. Không bịa id.
- Chọn priority "high" khi người dùng nói gấp/quan trọng.
- Nếu yêu cầu chỉ là câu hỏi, tâm sự hoặc xin lời khuyên (không yêu cầu tạo/cập nhật gì) thì KHÔNG gọi hàm, chỉ trả lời "CHAT".
- Luôn viết nội dung bằng tiếng Việt có dấu.

Thói quen hiện có (id | tên | đã làm hôm nay?):
${list(ctx.habits, (h) => `${h.id} | ${h.name} | ${h.doneToday ? 'rồi' : 'chưa'}`)}

Công việc chưa xong (id | tiêu đề | hạn):
${list(ctx.tasks, (t) => `${t.id} | ${t.title} | ${t.dueDate ?? ''}`)}

Mục tiêu (id | tiêu đề):
${list(ctx.goals, (g) => `${g.id} | ${g.title}`)}`;
}

const VALID = new Set<string>(ASSISTANT_TOOLS.map((t) => t.function.name));

/** Parse + sanitise tool calls from an OpenAI-style response into actions. */
export function parseAssistantActions(
  toolCalls: Array<{ function?: { name?: string; arguments?: string } }> | undefined,
  ctx: AssistantContext,
): AssistantAction[] {
  const ids = {
    habit: new Set((ctx.habits ?? []).map((h) => h.id)),
    task: new Set((ctx.tasks ?? []).map((t) => t.id)),
    goal: new Set((ctx.goals ?? []).map((g) => g.id)),
  };
  const out: AssistantAction[] = [];
  for (const call of toolCalls ?? []) {
    const name = call.function?.name;
    if (!name || !VALID.has(name)) continue;
    let args: Record<string, unknown> = {};
    try {
      args = JSON.parse(call.function?.arguments || '{}') as Record<string, unknown>;
    } catch {
      continue;
    }
    if (args.area && !(LIFE_AREA_IDS as readonly string[]).includes(String(args.area))) delete args.area;
    if (args.goalId && !ids.goal.has(String(args.goalId))) delete args.goalId;
    if (name === 'complete_habit' && !ids.habit.has(String(args.habitId))) continue;
    if (name === 'complete_task' && !ids.task.has(String(args.taskId))) continue;
    for (const k of ['dueDate', 'targetDate', 'date']) {
      if (args[k] && !/^\d{4}-\d{2}-\d{2}$/.test(String(args[k]))) delete args[k];
    }
    if (args.reminderTime && !/^\d{2}:\d{2}$/.test(String(args.reminderTime))) delete args.reminderTime;
    if (name === 'add_finance_transaction' && !(Number(args.amount) > 0)) continue;
    out.push({ type: name as AssistantActionType, args });
  }
  return out;
}
