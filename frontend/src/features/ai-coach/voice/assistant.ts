import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useSyncedStore } from '@/hooks/useSyncedStore';
import { useFinanceSync } from '@/hooks/sync/useFinanceSync';
import { useHealthSync, type HealthLog } from '@/hooks/sync/useHealthSync';
import { usePomodoroStore } from '@/stores/usePomodoroStore';
import { metricOf } from '@/features/health/utils/health.utils';
import { functionUrl, getAccessToken } from '@/integrations/api/httpClient';
import { LIFE_AREAS, type LifeArea } from '@/types/lifeos';

export type AssistantActionType =
  | 'create_task' | 'complete_task' | 'create_habit' | 'complete_habit'
  | 'create_goal' | 'create_journal_entry' | 'create_note' | 'add_finance_transaction'
  | 'update_task' | 'delete_task' | 'log_health' | 'start_focus' | 'stop_focus'
  | 'update_goal_progress' | 'open_page';

export type ActionStatus = 'pending' | 'done' | 'dismissed' | 'undone' | 'failed';

export interface AssistantAction {
  id: string;
  type: AssistantActionType;
  args: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  status: ActionStatus;
  /** Độ chắc khi máy chủ khớp tên gần đúng (0–1). */
  confidence?: number;
}

/** Trang mà lệnh "mở …" có thể tới. */
export const PAGE_ROUTES: Record<string, { path: string; name: string }> = {
  today: { path: '/', name: 'Hôm nay' }, tasks: { path: '/tasks', name: 'Công việc' }, habits: { path: '/habits', name: 'Thói quen' },
  goals: { path: '/goals', name: 'Mục tiêu' }, journal: { path: '/journal', name: 'Nhật ký' }, notes: { path: '/notes', name: 'Ghi chú' },
  finance: { path: '/finance', name: 'Tài chính' }, health: { path: '/health', name: 'Sức khỏe' }, calendar: { path: '/calendar', name: 'Lịch' },
  vision: { path: '/me?view=vision', name: 'Tầm nhìn' }, activity: { path: '/activity', name: 'Lịch sử hoạt động' }, coach: { path: '/ai-chat', name: 'AI Coach' },
  settings: { path: '/settings', name: 'Cài đặt' }, learning: { path: '/learning', name: 'Học tập' }, relationships: { path: '/relationships', name: 'Mối quan hệ' },
  reviews: { path: '/weekly-review', name: 'Review tuần' },
};

/**
 * Lệnh rủi ro → luôn hỏi xác nhận (kể cả ở chế độ tự lưu): xoá, số tiền lớn,
 * hoặc máy chủ chỉ khớp tên gần đúng. Còn lại chạy ngay và cho "Hoàn tác".
 */
export function needsConfirm(a: AssistantAction): boolean {
  if (a.type === 'delete_task') return true;
  if (a.type === 'add_finance_transaction' && Number(a.args.amount) >= 2_000_000) return true;
  if (a.confidence !== undefined && a.confidence < 0.75) return true;
  return false;
}

export interface ActionResult { message: string; undo?: () => Promise<void>; /** Nơi xem kết quả (nút “Xem”). */ view?: string }
/** Tab danh sách công việc chứa việc có hạn `d`. */
const taskTab = (d?: string) => { const t = format(new Date(), 'yyyy-MM-dd'); return !d ? 'all' : d === t ? 'today' : d > t ? 'upcoming' : 'overdue'; };
const whenLabel = (d?: string, time?: string) => [d && (dayLabel(d) ?? '').toLowerCase(), time && `lúc ${time}`].filter(Boolean).join(' ');

/** Câu có vẻ là lệnh tạo/cập nhật dữ liệu → hỏi trợ lý hành động trước khi chat. */
const COMMAND_RE = /^(?:hãy\s+|giúp\s+(?:tôi|mình|em|anh|chị)\s+|cho\s+(?:tôi|mình)\s+|làm\s+ơn\s+)?(?:tạo|thêm|ghi|lưu|nhắc|đặt|lên\s+lịch|đánh\s+dấu|hoàn\s+thành|check[\s-]?in|xong|đã\s+(?:làm|xong|uống|tập|đọc|chạy|đi|hoàn)|chi\s|tiêu\s|thu\s|nhận\s|mua\s|ăn\s|viết\s+nhật\s+ký|note|add|create|remind|log)/i;
export const looksLikeCommand = (text: string) => COMMAND_RE.test(text.trim()) || /\b(nhắc (tôi|mình)|mỗi (ngày|sáng|tối|tuần)|hằng ngày|hàng ngày)\b/i.test(text);

export const CONFIRM_RE = /^(ok|oke|okay|ừ|ừm|có|được|đồng ý|xác nhận|lưu|làm đi|tạo đi|chuẩn|đúng rồi|yes)\b/i;
export const CANCEL_RE = /^(không|thôi|hủy|huỷ|bỏ|đừng|no)\b/i;

const areaName = (a?: string) => LIFE_AREAS.find((x) => x.id === a)?.name;
const vnd = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';
const dayLabel = (d?: string) => {
  if (!d) return undefined;
  const today = format(new Date(), 'yyyy-MM-dd');
  const tomorrow = format(new Date(Date.now() + 864e5), 'yyyy-MM-dd');
  if (d === today) return 'Hôm nay';
  if (d === tomorrow) return 'Ngày mai';
  try { return format(new Date(d + 'T00:00:00'), 'EEEE, dd/MM', { locale: vi }); } catch { return d; }
};
const FREQ: Record<string, string> = { daily: 'Hằng ngày', weekly: 'Hằng tuần', custom: 'Tùy chỉnh' };
const DOW = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

/** Mô tả hành động để hiển thị trên thẻ xác nhận và đọc thành tiếng. */
export function describeAction(a: AssistantAction): { kind: string; icon: string; tint: 'violet' | 'mint' | 'sky' | 'amber' | 'rose' | 'orange'; title: string; meta: string[]; spoken: string } {
  const s = useLifeOSStore.getState();
  const x = a.args;
  switch (a.type) {
    case 'create_task': {
      const meta = [dayLabel(x.dueDate), x.reminderTime && `⏰ ${x.reminderTime}`, x.priority === 'high' ? 'Ưu tiên cao' : x.priority === 'low' ? 'Ưu tiên thấp' : undefined, areaName(x.area)].filter(Boolean) as string[];
      return { kind: 'Công việc mới', icon: 'module/tasks', tint: 'violet', title: x.title, meta, spoken: `công việc ${x.title}${x.dueDate ? ', ' + (dayLabel(x.dueDate) ?? '').toLowerCase() : ''}${x.reminderTime ? ' lúc ' + x.reminderTime : ''}` };
    }
    case 'complete_task': {
      const t = s.tasks.find((t) => t.id === x.taskId);
      return { kind: 'Hoàn thành công việc', icon: 'module/tasks', tint: 'mint', title: t?.title ?? 'Công việc', meta: ['Đánh dấu đã xong'], spoken: `hoàn thành ${t?.title ?? 'công việc'}` };
    }
    case 'create_habit': {
      const days = x.customDays?.length ? x.customDays.map((d: number) => DOW[d]).join(', ') : undefined;
      const meta = [FREQ[x.frequency] ?? x.frequency, days, x.targetPerDay ? `${x.targetPerDay} ${x.targetUnit ?? 'lần'}/ngày` : undefined, x.reminderTime && `⏰ ${x.reminderTime}`, areaName(x.area)].filter(Boolean) as string[];
      return { kind: 'Thói quen mới', icon: 'module/habits', tint: 'sky', title: `${x.icon ? x.icon + ' ' : ''}${x.name}`, meta, spoken: `thói quen ${x.name}` };
    }
    case 'complete_habit': {
      const h = s.habits.find((h) => h.id === x.habitId);
      const n = Number(x.count) || 1;
      return { kind: 'Check-in thói quen', icon: 'module/habits', tint: 'mint', title: h?.name ?? 'Thói quen', meta: [n > 1 || (h?.targetPerDay ?? 1) > 1 ? `+${n} ${h?.targetUnit || 'lần'}` : undefined, 'Hôm nay'].filter(Boolean) as string[], spoken: `check-in ${h?.name ?? 'thói quen'}${n > 1 ? ` thêm ${n} ${h?.targetUnit || 'lần'}` : ''}` };
    }
    case 'create_goal':
      return { kind: 'Mục tiêu mới', icon: 'module/goals', tint: 'amber', title: x.title, meta: [areaName(x.area), x.targetDate && `🎯 ${dayLabel(x.targetDate)}`, x.milestones?.length ? `${x.milestones.length} cột mốc` : undefined].filter(Boolean) as string[], spoken: `mục tiêu ${x.title}` };
    case 'create_journal_entry':
      return { kind: 'Nhật ký hôm nay', icon: 'module/journal', tint: 'rose', title: String(x.content ?? '').slice(0, 90) + (String(x.content ?? '').length > 90 ? '…' : ''), meta: [x.mood ? `Tâm trạng ${x.mood}/5` : undefined, x.energy ? `Năng lượng ${x.energy}/5` : undefined].filter(Boolean) as string[], spoken: 'một trang nhật ký' };
    case 'create_note':
      return { kind: 'Ghi chú', icon: 'module/notes', tint: 'orange', title: x.title, meta: [String(x.content ?? '').slice(0, 60)], spoken: `ghi chú ${x.title}` };
    case 'update_task': {
      const t = s.tasks.find((t) => t.id === x.taskId);
      const meta = [x.title && `→ “${x.title}”`, x.dueDate && `📅 ${dayLabel(x.dueDate)}`, x.reminderTime && `⏰ ${x.reminderTime}`, x.priority === 'high' ? 'Ưu tiên cao' : x.priority === 'low' ? 'Ưu tiên thấp' : x.priority === 'medium' ? 'Ưu tiên vừa' : undefined].filter(Boolean) as string[];
      return { kind: 'Cập nhật công việc', icon: 'module/tasks', tint: 'sky', title: t?.title ?? 'Công việc', meta, spoken: `dời ${t?.title ?? 'công việc'}${x.dueDate ? ' sang ' + (dayLabel(x.dueDate) ?? '').toLowerCase() : ''}${x.reminderTime ? ' lúc ' + x.reminderTime : ''}` };
    }
    case 'delete_task': {
      const t = s.tasks.find((t) => t.id === x.taskId);
      return { kind: 'Xoá công việc', icon: 'module/tasks', tint: 'rose', title: t?.title ?? 'Công việc', meta: ['Chuyển vào thùng rác'], spoken: `xoá ${t?.title ?? 'công việc'}` };
    }
    case 'log_health': {
      const m = metricOf(x.metric);
      return { kind: 'Sức khỏe', icon: 'module/health', tint: m.tint as 'sky', title: `${m.emoji} ${m.name}: ${x.value} ${m.unit}`, meta: [x.notes, dayLabel(x.date ?? format(new Date(), 'yyyy-MM-dd'))].filter(Boolean) as string[], spoken: `${m.name.toLowerCase()} ${x.value} ${m.unit}` };
    }
    case 'start_focus': {
      const t = x.taskId ? s.tasks.find((t) => t.id === x.taskId) : undefined;
      const min = x.minutes ?? s.pomodoroSettings?.workDuration ?? 25;
      return { kind: 'Bắt đầu tập trung', icon: 'module/focus', tint: 'violet', title: t ? t.title : `Phiên ${min} phút`, meta: [`⏱ ${min} phút`], spoken: `phiên tập trung ${min} phút${t ? ' cho ' + t.title : ''}` };
    }
    case 'stop_focus':
      return { kind: 'Dừng tập trung', icon: 'module/focus', tint: 'orange', title: 'Kết thúc phiên Pomodoro', meta: [], spoken: 'dừng phiên tập trung' };
    case 'update_goal_progress': {
      const g = s.goals.find((g) => g.id === x.goalId);
      return { kind: 'Tiến độ mục tiêu', icon: 'module/goals', tint: 'amber', title: g?.title ?? 'Mục tiêu', meta: [`${g?.progress ?? 0}% → ${x.progress}%`], spoken: `tiến độ ${g?.title ?? 'mục tiêu'} ${x.progress} phần trăm` };
    }
    case 'open_page': {
      const p = PAGE_ROUTES[x.page];
      return { kind: 'Mở trang', icon: 'module/today', tint: 'violet', title: p?.name ?? x.page, meta: [], spoken: `mở trang ${p?.name ?? ''}` };
    }
    case 'add_finance_transaction':
      return { kind: x.type === 'income' ? 'Khoản thu' : 'Khoản chi', icon: 'module/finance', tint: x.type === 'income' ? 'mint' : 'rose', title: `${x.type === 'income' ? '+' : '−'}${vnd(Number(x.amount))} · ${x.category}`, meta: [x.description, dayLabel(x.date ?? format(new Date(), 'yyyy-MM-dd'))].filter(Boolean) as string[], spoken: `${x.type === 'income' ? 'khoản thu' : 'khoản chi'} ${vnd(Number(x.amount)).replace('đ', ' đồng')} cho ${x.category}` };
  }
}

/** Gọi backend: văn bản → danh sách hành động đề xuất (hoặc 'chat'). */
export async function askAssistant(text: string): Promise<{ mode: 'actions' | 'chat' | 'unresolved'; actions: AssistantAction[]; message: string }> {
  const s = useLifeOSStore.getState();
  const now = new Date();
  const today = format(now, 'yyyy-MM-dd');
  const context = {
    today, now: format(now, 'HH:mm'), weekday: now.getDay(), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    habits: s.habits.filter((h) => !h.archivedAt && !(h as { deletedAt?: string }).deletedAt).slice(0, 40).map((h) => ({ id: h.id, name: h.name, doneToday: h.completedDates.includes(today), target: h.targetPerDay })),
    tasks: s.tasks.filter((t) => !t.deletedAt && t.status !== 'done' && !t.archived).slice(0, 40).map((t) => ({ id: t.id, title: t.title, dueDate: t.dueDate })),
    goals: s.goals.filter((g) => !g.deletedAt && !g.completedAt).slice(0, 30).map((g) => ({ id: g.id, title: g.title, progress: g.progress })),
    focusRunning: usePomodoroStore.getState().isRunning,
    page: window.location.pathname,
  };
  const token = await getAccessToken();
  const resp = await fetch(functionUrl('ai-assistant'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ text, context }),
  });
  if (!resp.ok) throw Object.assign(new Error('assistant failed'), { status: resp.status });
  const data = (await resp.json()) as { mode: 'actions' | 'chat' | 'unresolved'; actions: Omit<AssistantAction, 'id' | 'status'>[]; message?: string };
  return { mode: data.mode, message: data.message ?? '', actions: (data.actions ?? []).map((a) => ({ ...a, id: crypto.randomUUID(), status: 'pending' as const })) };
}

const newId = <T extends { id: string }>(before: T[], after: T[]) => { const ids = new Set(before.map((x) => x.id)); return after.find((x) => !ids.has(x.id))?.id; };

/**
 * Thực thi hành động qua các hook đồng bộ sẵn có (local-first + sync DB) và
 * trả về hàm `undo` để hoàn tác (xoá mục vừa tạo, khôi phục giá trị cũ…).
 */
export function useExecuteAction() {
  const synced = useSyncedStore();
  const finance = useFinanceSync();
  const health = useHealthSync();
  const navigate = useNavigate();
  return useCallback(async (a: AssistantAction): Promise<ActionResult> => {
    const x = a.args;
    const st = useLifeOSStore.getState;
    const today = format(new Date(), 'yyyy-MM-dd');
    const area = (x.area as LifeArea | undefined) ?? 'personal';
    switch (a.type) {
      case 'create_task': {
        const before = st().tasks;
        await synced.addTask({ title: String(x.title).trim(), description: x.description || undefined, priority: x.priority ?? 'medium', status: 'todo', area: x.area, dueDate: x.dueDate || (x.reminderTime ? today : undefined), reminderTime: x.reminderTime || undefined, goalId: x.goalId || undefined });
        const id = newId(before, st().tasks);
        const due = x.dueDate || (x.reminderTime ? today : undefined);
        const when = whenLabel(due, x.reminderTime);
        return { message: `Đã tạo công việc “${x.title}”${when ? ` — ${when}` : ''}${taskTab(due) === 'upcoming' ? ' (xem ở mục Sắp tới)' : ''}`, undo: id ? () => synced.permanentDeleteTask(id) : undefined, view: `/tasks?tab=${taskTab(due)}` };
      }
      case 'complete_task': {
        const prev = st().tasks.find((t) => t.id === x.taskId);
        if (!prev) throw new Error('Không tìm thấy công việc');
        await synced.updateTask(prev.id, { status: 'done', completedAt: new Date().toISOString() });
        return { message: `Đã hoàn thành “${prev.title}”`, undo: () => synced.updateTask(prev.id, { status: prev.status === 'done' ? 'todo' : prev.status, completedAt: prev.completedAt }) };
      }
      case 'update_task': {
        const prev = st().tasks.find((t) => t.id === x.taskId);
        if (!prev) throw new Error('Không tìm thấy công việc');
        const upd: Partial<typeof prev> = {};
        if (x.title) upd.title = String(x.title).trim();
        if (x.dueDate) upd.dueDate = x.dueDate;
        if (x.reminderTime) { upd.reminderTime = x.reminderTime; if (!x.dueDate && !prev.dueDate) upd.dueDate = today; }
        if (x.priority) upd.priority = x.priority;
        const old = Object.fromEntries(Object.keys(upd).map((k) => [k, prev[k as keyof typeof prev]])) as Partial<typeof prev>;
        await synced.updateTask(prev.id, upd);
        return { message: `Đã cập nhật “${prev.title}”${x.dueDate || x.reminderTime ? ' → ' + whenLabel(x.dueDate, x.reminderTime) : ''}`, undo: () => synced.updateTask(prev.id, old), view: `/tasks?tab=${taskTab(upd.dueDate ?? prev.dueDate)}` };
      }
      case 'delete_task': {
        const prev = st().tasks.find((t) => t.id === x.taskId);
        if (!prev) throw new Error('Không tìm thấy công việc');
        await synced.deleteTask(prev.id);
        return { message: `Đã chuyển “${prev.title}” vào thùng rác`, undo: () => synced.restoreTask(prev.id) };
      }
      case 'create_habit': {
        const before = st().habits;
        await synced.addHabit({ name: String(x.name).trim(), description: x.description || undefined, area, frequency: x.frequency ?? 'daily', customDays: x.customDays?.length ? x.customDays : undefined, targetPerDay: x.targetPerDay || undefined, targetUnit: x.targetUnit || undefined, reminderTime: x.reminderTime || undefined, reminderEnabled: !!x.reminderTime, icon: x.icon || undefined });
        const id = newId(before, st().habits);
        return { message: `Đã tạo thói quen “${x.name}”`, undo: id ? () => synced.permanentDeleteHabit(id) : undefined, view: '/habits' };
      }
      case 'complete_habit': {
        const h = st().habits.find((h) => h.id === x.habitId);
        if (!h) throw new Error('Không tìm thấy thói quen');
        const n = Math.max(1, Number(x.count) || 1);
        if (h.targetPerDay && h.targetPerDay > 1) {
          for (let i = 0; i < n; i++) await synced.incrementHabitCompletion(h.id, today);
          const c = st().habits.find((y) => y.id === h.id)?.completions?.find((c) => c.date === today)?.count;
          return { message: `Đã check-in “${h.name}”${c ? ` (${c}/${h.targetPerDay})` : ''}`, undo: async () => { for (let i = 0; i < n; i++) await synced.decrementHabitCompletion(h.id, today); } };
        }
        if (h.completedDates.includes(today)) return { message: `“${h.name}” đã check-in hôm nay rồi` };
        await synced.toggleHabitCompletion(h.id, today);
        return { message: `Đã check-in “${h.name}”`, undo: () => synced.toggleHabitCompletion(h.id, today) };
      }
      case 'create_goal': {
        const before = st().goals;
        await synced.addGoal({ title: String(x.title).trim(), description: x.description || undefined, area, targetDate: x.targetDate || undefined, milestones: Array.isArray(x.milestones) ? x.milestones : undefined });
        const id = newId(before, st().goals);
        return { message: `Đã tạo mục tiêu “${x.title}”`, undo: id ? () => synced.permanentDeleteGoal(id) : undefined, view: '/goals' };
      }
      case 'update_goal_progress': {
        const g = st().goals.find((g) => g.id === x.goalId);
        if (!g) throw new Error('Không tìm thấy mục tiêu');
        const old = g.progress;
        await synced.updateGoal(g.id, { progress: Number(x.progress) });
        return { message: `Tiến độ “${g.title}”: ${x.progress}%`, undo: () => synced.updateGoal(g.id, { progress: old }) };
      }
      case 'create_journal_entry': {
        const before = st().journalEntries;
        await synced.addJournalEntry({ date: today, content: String(x.content), mood: clamp(x.mood), energy: clamp(x.energy), gratitude: Array.isArray(x.gratitude) ? x.gratitude : undefined });
        const id = newId(before, st().journalEntries);
        return { message: 'Đã lưu nhật ký hôm nay', undo: id ? () => synced.deleteJournalEntry(id) : undefined, view: '/journal' };
      }
      case 'create_note': {
        const before = st().notes;
        await synced.addNote({ title: String(x.title), content: String(x.content), area: x.area, isPinned: false, isFavorite: false, tags: [] });
        const id = newId(before, st().notes);
        return { message: `Đã lưu ghi chú “${x.title}”`, undo: id ? () => synced.permanentDeleteNote(id) : undefined, view: '/notes' };
      }
      case 'add_finance_transaction': {
        const t = { id: crypto.randomUUID(), type: x.type === 'income' ? 'income' as const : 'expense' as const, amount: Number(x.amount), category: String(x.category), description: String(x.description || x.category), date: x.date || today };
        st().addFinanceTransaction(t);
        await finance.saveTransaction(t);
        return { message: `Đã ghi ${t.type === 'income' ? 'khoản thu' : 'khoản chi'} ${vnd(t.amount)}`, view: '/finance', undo: async () => { st().deleteFinanceTransaction(t.id); await finance.deleteTransaction(t.id); } };
      }
      case 'log_health': {
        const m = metricOf(x.metric);
        const log: HealthLog = { id: crypto.randomUUID(), date: x.date || today, type: m.id as HealthLog['type'], value: Number(x.value), unit: m.unit, notes: x.notes || undefined };
        st().addHealthLog(log);
        await health.saveHealthLog(log);
        return { message: `Đã ghi ${m.name.toLowerCase()} ${log.value} ${m.unit}`, view: '/health', undo: async () => { st().deleteHealthLog(log.id); await health.deleteHealthLog(log.id); } };
      }
      case 'start_focus': {
        usePomodoroStore.getState().start(x.taskId || undefined, x.minutes || undefined);
        const min = x.minutes ?? st().pomodoroSettings?.workDuration ?? 25;
        return { message: `Bắt đầu tập trung ${min} phút`, undo: async () => usePomodoroStore.getState().reset() };
      }
      case 'stop_focus': {
        const p = usePomodoroStore.getState();
        if (!p.isRunning) return { message: 'Không có phiên tập trung nào đang chạy' };
        p.pause();
        return { message: 'Đã dừng phiên tập trung', undo: async () => usePomodoroStore.getState().resume() };
      }
      case 'open_page': {
        const p = PAGE_ROUTES[x.page];
        if (!p) throw new Error('Không rõ trang');
        const from = window.location.pathname + window.location.search;
        navigate(p.path);
        return { message: `Đã mở ${p.name}`, undo: async () => navigate(from) };
      }
    }
  }, [synced, finance, health, navigate]);
}

/** Tương thích cũ: chỉ trả về thông báo. */
export function useApplyAction() {
  const exec = useExecuteAction();
  return useCallback(async (a: AssistantAction): Promise<string> => (await exec(a)).message, [exec]);
}

const clamp = (v: unknown): 1 | 2 | 3 | 4 | 5 => Math.min(5, Math.max(1, Math.round(Number(v) || 3))) as 1 | 2 | 3 | 4 | 5;
