import { useCallback } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useSyncedStore } from '@/hooks/useSyncedStore';
import { useFinanceSync } from '@/hooks/sync/useFinanceSync';
import { functionUrl, getAccessToken } from '@/integrations/api/httpClient';
import { LIFE_AREAS, type LifeArea } from '@/types/lifeos';

export type AssistantActionType =
  | 'create_task' | 'complete_task' | 'create_habit' | 'complete_habit'
  | 'create_goal' | 'create_journal_entry' | 'create_note' | 'add_finance_transaction';

export type ActionStatus = 'pending' | 'done' | 'dismissed';

export interface AssistantAction {
  id: string;
  type: AssistantActionType;
  args: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  status: ActionStatus;
}

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
      return { kind: 'Check-in thói quen', icon: 'module/habits', tint: 'mint', title: h?.name ?? 'Thói quen', meta: ['Hôm nay'], spoken: `check-in ${h?.name ?? 'thói quen'}` };
    }
    case 'create_goal':
      return { kind: 'Mục tiêu mới', icon: 'module/goals', tint: 'amber', title: x.title, meta: [areaName(x.area), x.targetDate && `🎯 ${dayLabel(x.targetDate)}`, x.milestones?.length ? `${x.milestones.length} cột mốc` : undefined].filter(Boolean) as string[], spoken: `mục tiêu ${x.title}` };
    case 'create_journal_entry':
      return { kind: 'Nhật ký hôm nay', icon: 'module/journal', tint: 'rose', title: String(x.content ?? '').slice(0, 90) + (String(x.content ?? '').length > 90 ? '…' : ''), meta: [x.mood ? `Tâm trạng ${x.mood}/5` : undefined, x.energy ? `Năng lượng ${x.energy}/5` : undefined].filter(Boolean) as string[], spoken: 'một trang nhật ký' };
    case 'create_note':
      return { kind: 'Ghi chú', icon: 'module/notes', tint: 'orange', title: x.title, meta: [String(x.content ?? '').slice(0, 60)], spoken: `ghi chú ${x.title}` };
    case 'add_finance_transaction':
      return { kind: x.type === 'income' ? 'Khoản thu' : 'Khoản chi', icon: 'module/finance', tint: x.type === 'income' ? 'mint' : 'rose', title: `${x.type === 'income' ? '+' : '−'}${vnd(Number(x.amount))} · ${x.category}`, meta: [x.description, dayLabel(x.date ?? format(new Date(), 'yyyy-MM-dd'))].filter(Boolean) as string[], spoken: `${x.type === 'income' ? 'khoản thu' : 'khoản chi'} ${vnd(Number(x.amount)).replace('đ', ' đồng')} cho ${x.category}` };
  }
}

/** Gọi backend: văn bản → danh sách hành động đề xuất (hoặc 'chat'). */
export async function askAssistant(text: string): Promise<{ mode: 'actions' | 'chat'; actions: AssistantAction[]; message: string }> {
  const s = useLifeOSStore.getState();
  const now = new Date();
  const today = format(now, 'yyyy-MM-dd');
  const context = {
    today, now: format(now, 'HH:mm'), weekday: now.getDay(), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    habits: s.habits.filter((h) => !h.archivedAt && !(h as { deletedAt?: string }).deletedAt).slice(0, 40).map((h) => ({ id: h.id, name: h.name, doneToday: h.completedDates.includes(today) })),
    tasks: s.tasks.filter((t) => !t.deletedAt && t.status !== 'done' && !t.archived).slice(0, 40).map((t) => ({ id: t.id, title: t.title, dueDate: t.dueDate })),
    goals: s.goals.filter((g) => !g.deletedAt && !g.completedAt).slice(0, 30).map((g) => ({ id: g.id, title: g.title })),
  };
  const token = await getAccessToken();
  const resp = await fetch(functionUrl('ai-assistant'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ text, context }),
  });
  if (!resp.ok) throw Object.assign(new Error('assistant failed'), { status: resp.status });
  const data = (await resp.json()) as { mode: 'actions' | 'chat'; actions: Omit<AssistantAction, 'id' | 'status'>[]; message?: string };
  return { mode: data.mode, message: data.message ?? '', actions: (data.actions ?? []).map((a) => ({ ...a, id: crypto.randomUUID(), status: 'pending' as const })) };
}

/** Áp dụng hành động qua các hook đồng bộ sẵn có (local-first + sync DB). */
export function useApplyAction() {
  const synced = useSyncedStore();
  const finance = useFinanceSync();
  return useCallback(async (a: AssistantAction): Promise<string> => {
    const x = a.args;
    const today = format(new Date(), 'yyyy-MM-dd');
    const area = (x.area as LifeArea | undefined) ?? 'personal';
    switch (a.type) {
      case 'create_task':
        await synced.addTask({ title: String(x.title).trim(), description: x.description || undefined, priority: x.priority ?? 'medium', status: 'todo', area: x.area, dueDate: x.dueDate || (x.reminderTime ? today : undefined), reminderTime: x.reminderTime || undefined, goalId: x.goalId || undefined });
        return `Đã tạo công việc “${x.title}”`;
      case 'complete_task':
        await synced.updateTask(x.taskId, { status: 'done', completedAt: new Date().toISOString() });
        return 'Đã đánh dấu hoàn thành';
      case 'create_habit':
        await synced.addHabit({ name: String(x.name).trim(), description: x.description || undefined, area, frequency: x.frequency ?? 'daily', customDays: x.customDays?.length ? x.customDays : undefined, targetPerDay: x.targetPerDay || undefined, targetUnit: x.targetUnit || undefined, reminderTime: x.reminderTime || undefined, reminderEnabled: !!x.reminderTime, icon: x.icon || undefined });
        return `Đã tạo thói quen “${x.name}”`;
      case 'complete_habit': {
        const h = useLifeOSStore.getState().habits.find((h) => h.id === x.habitId);
        if (!h) throw new Error('Không tìm thấy thói quen');
        if (h.targetPerDay && h.targetPerDay > 1) await synced.incrementHabitCompletion(h.id, today);
        else if (!h.completedDates.includes(today)) await synced.toggleHabitCompletion(h.id, today);
        return `Đã check-in “${h.name}”`;
      }
      case 'create_goal':
        await synced.addGoal({ title: String(x.title).trim(), description: x.description || undefined, area, targetDate: x.targetDate || undefined, milestones: Array.isArray(x.milestones) ? x.milestones : undefined });
        return `Đã tạo mục tiêu “${x.title}”`;
      case 'create_journal_entry':
        await synced.addJournalEntry({ date: today, content: String(x.content), mood: clamp(x.mood), energy: clamp(x.energy), gratitude: Array.isArray(x.gratitude) ? x.gratitude : undefined });
        return 'Đã lưu nhật ký hôm nay';
      case 'create_note':
        await synced.addNote({ title: String(x.title), content: String(x.content), area: x.area, isPinned: false, isFavorite: false, tags: [] });
        return `Đã lưu ghi chú “${x.title}”`;
      case 'add_finance_transaction': {
        const t = { id: crypto.randomUUID(), type: x.type === 'income' ? 'income' as const : 'expense' as const, amount: Number(x.amount), category: String(x.category), description: String(x.description || x.category), date: x.date || today };
        useLifeOSStore.getState().addFinanceTransaction(t);
        await finance.saveTransaction(t);
        return `Đã ghi ${t.type === 'income' ? 'khoản thu' : 'khoản chi'} ${vnd(t.amount)}`;
      }
    }
  }, [synced, finance]);
}

const clamp = (v: unknown): 1 | 2 | 3 | 4 | 5 => Math.min(5, Math.max(1, Math.round(Number(v) || 3))) as 1 | 2 | 3 | 4 | 5;
