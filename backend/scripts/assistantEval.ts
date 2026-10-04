/**
 * Bộ kiểm thử lệnh giọng nói tiếng Việt cho /functions/ai-assistant.
 *
 *   npx tsx scripts/assistantEval.ts            # offline: mô phỏng output LLM "lỗi" → kiểm tra lớp chuẩn hoá
 *   EVAL_URL=https://…/api/v1 EVAL_TOKEN=… npx tsx scripts/assistantEval.ts --live   # gọi model thật
 *
 * Chế độ --live chỉ gọi endpoint *đề xuất* hành động — không ghi dữ liệu.
 */
import { buildAssistantSystemPrompt, parseAssistantActions, type AssistantContext } from '../src/lib/aiAssistantTools';

const ctx: AssistantContext = {
  today: '2026-10-07', now: '14:20', weekday: 3, timezone: 'Asia/Ho_Chi_Minh',
  tasks: [
    { id: 't-report', title: 'Nộp báo cáo quý 3', dueDate: '2026-10-08' },
    { id: 't-pr', title: 'Review PR backend' },
    { id: 't-slide', title: 'Hoàn thiện slide báo cáo Q4' },
    { id: 't-dentist', title: 'Đặt lịch khám răng' },
    { id: 't-quote', title: 'Gửi báo giá khách A' },
    { id: 't-power', title: 'Đóng tiền điện' },
  ],
  habits: [
    { id: 'h-water-am', name: 'Uống nước sau khi thức dậy', doneToday: true },
    { id: 'h-water', name: 'Uống 8 ly nước', target: 8 },
    { id: 'h-run', name: 'Chạy bộ 30 phút' },
    { id: 'h-read', name: 'Đọc sách 20 trang' },
    { id: 'h-meditate', name: 'Thiền 10 phút' },
  ],
  goals: [
    { id: 'g-en', title: 'Học tiếng Anh giao tiếp', progress: 40 },
    { id: 'g-save', title: 'Tiết kiệm 50 triệu', progress: 20 },
  ],
};

type Call = [string, Record<string, unknown>];
interface Case { text: string; sim: Call[]; expect: (Partial<Record<string, unknown>> & { type: string })[] | 'chat' | 'unresolved' }

// `sim` = output mà một model rẻ có thể trả về (cố ý sai ngày/giờ/số tiền, dùng tên thay id…).
const CASES: Case[] = [
  { text: 'Nhắc tôi gọi mẹ lúc 8 giờ tối mai', sim: [['create_task', { title: 'Gọi mẹ', dueDate: '2026-10-09', reminderTime: '8:00' }]], expect: [{ type: 'create_task', dueDate: '2026-10-08', reminderTime: '20:00' }] },
  { text: 'Dời việc nộp báo cáo sang thứ 6', sim: [['update_task', { taskTitle: 'nộp báo cáo', dueDate: '2026-10-10' }]], expect: [{ type: 'update_task', taskId: 't-report', dueDate: '2026-10-09' }] },
  { text: 'Xong việc review PR rồi', sim: [['complete_task', { taskId: 'task-123', taskTitle: 'review PR' }]], expect: [{ type: 'complete_task', taskId: 't-pr' }] },
  { text: 'Uống thêm 2 ly nước', sim: [['complete_habit', { habitName: 'uống nước', count: 2 }]], expect: [{ type: 'complete_habit', habitId: 'h-water', count: 2 }] },
  { text: 'Chi 45 nghìn ăn trưa', sim: [['add_finance_transaction', { type: 'expense', amount: 45, category: 'Ăn uống' }]], expect: [{ type: 'add_finance_transaction', amount: 45000, date: '2026-10-07' }] },
  { text: 'Hôm qua đổ xăng 80k', sim: [['add_finance_transaction', { type: 'expense', amount: 80000, category: 'Di chuyển' }]], expect: [{ type: 'add_finance_transaction', amount: 80000, date: '2026-10-06' }] },
  { text: 'Nhận lương 15 triệu 5', sim: [['add_finance_transaction', { type: 'income', amount: 15000000, category: 'Lương' }]], expect: [{ type: 'add_finance_transaction', amount: 15500000 }] },
  { text: 'Tối qua ngủ 7 tiếng rưỡi', sim: [['log_health', { metric: 'sleep', value: 7.5 }]], expect: [{ type: 'log_health', metric: 'sleep', value: 7.5, date: '2026-10-06' }] },
  { text: 'Cân nặng hôm nay 62,5 ký', sim: [['log_health', { metric: 'weight', value: 62.5, date: '07/10/2026' }]], expect: [{ type: 'log_health', metric: 'weight', value: 62.5, date: '2026-10-07' }] },
  { text: 'Bắt đầu tập trung 25 phút cho việc slide báo cáo', sim: [['start_focus', { minutes: 25, taskTitle: 'slide báo cáo' }]], expect: [{ type: 'start_focus', minutes: 25, taskId: 't-slide' }] },
  { text: 'Dừng tập trung', sim: [['stop_focus', {}]], expect: [{ type: 'stop_focus' }] },
  { text: 'Mục tiêu tiếng Anh được 60% rồi', sim: [['update_goal_progress', { goalTitle: 'tiếng Anh', progress: 60 }]], expect: [{ type: 'update_goal_progress', goalId: 'g-en', progress: 60 }] },
  { text: 'Tạo thói quen thiền mỗi tối lúc 9 giờ', sim: [['create_habit', { name: 'Thiền buổi tối', area: 'spirituality', frequency: 'daily', reminderTime: '21:00' }]], expect: [{ type: 'create_habit', reminderTime: '21:00' }] },
  { text: 'Xoá việc đặt lịch khám răng', sim: [['delete_task', { taskTitle: 'đặt lịch khám răng' }]], expect: [{ type: 'delete_task', taskId: 't-dentist' }] },
  { text: 'Mở trang tài chính', sim: [['open_page', { page: 'finance' }]], expect: [{ type: 'open_page', page: 'finance' }] },
  { text: 'Thứ 2 tuần sau 3 giờ chiều họp với khách A, quan trọng', sim: [['create_task', { title: 'Họp với khách A', dueDate: '2026-10-12', reminderTime: '15:00', priority: 'high' }]], expect: [{ type: 'create_task', dueDate: '2026-10-12', reminderTime: '15:00', priority: 'high' }] },
  { text: '30 phút nữa nhắc tôi uống thuốc', sim: [['create_task', { title: 'Uống thuốc', reminderTime: '14:30' }]], expect: [{ type: 'create_task', reminderTime: '14:50', dueDate: '2026-10-07' }] },
  { text: 'Mai đi siêu thị và thứ 7 dọn nhà', sim: [['create_task', { title: 'Đi siêu thị', dueDate: '2026-10-08' }], ['create_task', { title: 'Dọn nhà', dueDate: '2026-10-10' }]], expect: [{ type: 'create_task', dueDate: '2026-10-08' }, { type: 'create_task', dueDate: '2026-10-10' }] },
  { text: 'Hôm nay hơi mệt nhưng vui vì xong dự án', sim: [['create_journal_entry', { content: 'Hôm nay hơi mệt nhưng vui vì xong dự án.', mood: 4, energy: 2 }]], expect: [{ type: 'create_journal_entry', mood: 4 }] },
  { text: 'Đã chạy bộ rồi', sim: [['complete_habit', { habitName: 'chạy bộ' }]], expect: [{ type: 'complete_habit', habitId: 'h-run' }] },
  { text: 'Hoàn thành việc gửi báo giá', sim: [['complete_task', { taskId: 'Gửi báo giá khách A' }]], expect: [{ type: 'complete_task', taskId: 't-quote' }] },
  { text: 'Đánh dấu xong việc đi chợ', sim: [['complete_task', { taskTitle: 'đi chợ' }]], expect: 'unresolved' },
  { text: 'Gợi ý cách ngủ ngon hơn', sim: [], expect: 'chat' },
];

type Got = { mode: string; actions: { type: string; args: Record<string, unknown>; confidence?: number }[] };
const toCalls = (sim: Call[]) => sim.map(([name, args]) => ({ function: { name, arguments: JSON.stringify(args) } }));

async function live(text: string): Promise<Got> {
  const r = await fetch(`${process.env.EVAL_URL}/functions/ai-assistant`, {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.EVAL_TOKEN}` },
    body: JSON.stringify({ text, context: ctx }),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return (await r.json()) as Got;
}

function check(c: Case, got: Got): string[] {
  if (c.expect === 'chat' || c.expect === 'unresolved') return got.mode === c.expect ? [] : [`mode ${got.mode} ≠ ${c.expect}`];
  const errs: string[] = [];
  if (got.actions.length !== c.expect.length) errs.push(`${got.actions.length} hành động ≠ ${c.expect.length}`);
  c.expect.forEach((e, i) => {
    const a = got.actions[i];
    if (!a) return;
    if (a.type !== e.type) { errs.push(`${a.type} ≠ ${e.type}`); return; }
    for (const [k, v] of Object.entries(e)) if (k !== 'type' && JSON.stringify(a.args[k]) !== JSON.stringify(v)) errs.push(`${k}=${JSON.stringify(a.args[k])} ≠ ${JSON.stringify(v)}`);
  });
  return errs;
}

(async () => {
  const isLive = process.argv.includes('--live');
  if (process.argv.includes('--prompt')) { console.log(buildAssistantSystemPrompt(ctx, CASES[0].text)); return; }
  let pass = 0;
  for (const c of CASES) {
    let got: Got;
    if (isLive) got = await live(c.text).catch((e) => ({ mode: 'error:' + e.message, actions: [] }));
    else {
      const { actions, issues } = parseAssistantActions(toCalls(c.sim), ctx, c.text);
      got = { mode: actions.length ? 'actions' : issues.length ? 'unresolved' : 'chat', actions };
    }
    const errs = check(c, got);
    if (!errs.length) pass++;
    const summary = got.actions.map((a) => `${a.confidence !== undefined ? `[~${a.confidence}] ` : ''}${a.type}(${Object.entries(a.args).map(([k, v]) => `${k}=${typeof v === 'string' ? v.slice(0, 24) : JSON.stringify(v)}`).join(', ')})`).join(' + ') || got.mode;
    console.log(`${errs.length ? '✗' : '✓'} ${c.text}\n    → ${summary}${errs.length ? `\n    ! ${errs.join('; ')}` : ''}`);
  }
  console.log(`\n${pass}/${CASES.length} đạt${isLive ? ' (model thật)' : ' (offline, output LLM mô phỏng)'}`);
})();
