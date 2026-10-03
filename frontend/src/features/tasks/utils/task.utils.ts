import { addDays, format, isValid, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { LIFE_AREAS, type LifeArea } from '@/types/lifeos';
import type { BoardColumnId, Task, TaskPriority, TaskStatus, TaskTab } from '../types/task.types';

export const todayKey = () => format(new Date(), 'yyyy-MM-dd');
export const dateKey = (d: Date) => format(d, 'yyyy-MM-dd');

/** Normalises any stored due date (yyyy-MM-dd or ISO) to yyyy-MM-dd. */
export function dueKey(task: Pick<Task, 'dueDate'>): string | undefined {
  if (!task.dueDate) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(task.dueDate)) return task.dueDate;
  const d = parseISO(task.dueDate);
  return isValid(d) ? dateKey(d) : undefined;
}

export const isDone = (t: Task) => t.status === 'done';
export const isDueToday = (t: Task) => dueKey(t) === todayKey();
export const isOverdue = (t: Task) => !isDone(t) && !!dueKey(t) && dueKey(t)! < todayKey();
export const isUpcoming = (t: Task) => !isDone(t) && !!dueKey(t) && dueKey(t)! > todayKey();

export function matchesTab(t: Task, tab: TaskTab): boolean {
  switch (tab) {
    case 'all': return !isDone(t);
    // Hôm nay = việc đến hạn hôm nay + việc quá hạn + việc đã xong trong hôm nay (nhóm “Đã xong” thu gọn).
    case 'today': return isDone(t) ? !!t.completedAt && format(parseISO(t.completedAt), 'yyyy-MM-dd') === todayKey() : isDueToday(t) || isOverdue(t);
    case 'upcoming': return isUpcoming(t);
    case 'overdue': return isOverdue(t);
    case 'completed': return isDone(t);
  }
}

export const TAB_LABEL: Record<TaskTab, string> = {
  all: 'Tất cả', today: 'Hôm nay', upcoming: 'Sắp tới', overdue: 'Quá hạn', completed: 'Đã xong',
};

export const PRIORITY_META: Record<TaskPriority, { label: string; rank: number; chip: string; dot: string }> = {
  high: { label: 'Cao', rank: 3, chip: 'bg-[#FFECEE] text-[#E5484D] dark:bg-[#FF6B78]/15 dark:text-[#FF8A94]', dot: '#FF6B78' },
  medium: { label: 'Trung bình', rank: 2, chip: 'bg-[#FFF3E2] text-[#D97706] dark:bg-[#FFB84D]/15 dark:text-[#FFC46B]', dot: '#FFB84D' },
  low: { label: 'Thấp', rank: 1, chip: 'bg-[#E6F8F1] text-[#1F9D74] dark:bg-[#57D3AE]/15 dark:text-[#6EE0BD]', dot: '#57D3AE' },
};

export const STATUS_META: Record<TaskStatus, { label: string; chip: string }> = {
  todo: { label: 'Cần làm', chip: 'bg-secondary text-muted-foreground' },
  in_progress: { label: 'Đang làm', chip: 'bg-lavender text-primary dark:bg-primary/15' },
  deferred: { label: 'Tạm hoãn', chip: 'bg-[#FFF6D9] text-[#B7791F] dark:bg-[#FFC63D]/15 dark:text-[#FFD36B]' },
  done: { label: 'Hoàn thành', chip: 'bg-[#E6F8F1] text-[#1F9D74] dark:bg-[#57D3AE]/15 dark:text-[#6EE0BD]' },
};

export const BOARD_COLUMNS: { id: BoardColumnId; label: string; tint: string; accent: string }[] = [
  { id: 'todo', label: 'Cần làm', tint: 'bg-secondary/70', accent: '#7D8495' },
  { id: 'in_progress', label: 'Đang làm', tint: 'bg-lavender/70 dark:bg-primary/10', accent: '#6D5DF2' },
  { id: 'done', label: 'Hoàn thành', tint: 'bg-[#EAF8F2] dark:bg-[#57D3AE]/10', accent: '#22B07D' },
];

export const columnOf = (t: Task): BoardColumnId => (t.status === 'deferred' ? 'todo' : t.status);

export function areaMeta(area?: LifeArea) {
  const a = LIFE_AREAS.find((x) => x.id === area);
  if (!a) return undefined;
  return { ...a, cssVar: `--area-${a.id}` };
}

/** Chip style using the area CSS variable (hsl triplet). */
export const areaChipStyle = (area?: LifeArea) =>
  area
    ? { backgroundColor: `hsl(var(--area-${area}) / 0.14)`, color: `hsl(var(--area-${area}))` }
    : undefined;

export function formatDue(t: Task): string | undefined {
  const k = dueKey(t);
  if (!k) return undefined;
  const today = todayKey();
  const tomorrow = dateKey(addDays(new Date(), 1));
  const yesterday = dateKey(addDays(new Date(), -1));
  const time = t.reminderTime ? ` · ${t.reminderTime}` : '';
  if (k === today) return `Hôm nay${time}`;
  if (k === tomorrow) return `Ngày mai${time}`;
  if (k === yesterday) return `Hôm qua${time}`;
  return `${format(parseISO(k), 'EEE, d/M', { locale: vi })}${time}`;
}

export function sortTasks(list: Task[]): Task[] {
  return [...list].sort((a, b) => {
    if (isDone(a) !== isDone(b)) return isDone(a) ? 1 : -1;
    const da = dueKey(a) ?? '9999';
    const db = dueKey(b) ?? '9999';
    if (da !== db) return da < db ? -1 : 1;
    const ta = a.reminderTime ?? '99';
    const tb = b.reminderTime ?? '99';
    if (ta !== tb) return ta < tb ? -1 : 1;
    return PRIORITY_META[b.priority].rank - PRIORITY_META[a.priority].rank;
  });
}

export const subtaskProgress = (t: Task) => {
  const total = t.subtasks?.length ?? 0;
  const done = t.subtasks?.filter((s) => s.completed).length ?? 0;
  return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
};

export interface TaskGroup { id: string; title: string; subtitle?: string; tasks: Task[] }

/** Groups for the list view: Quá hạn → Hôm nay → Sắp tới → Không có hạn → Đã xong. */
export function groupTasks(list: Task[]): TaskGroup[] {
  const sorted = sortTasks(list);
  const groups: TaskGroup[] = [
    { id: 'overdue', title: 'Quá hạn', tasks: sorted.filter(isOverdue) },
    {
      id: 'today', title: 'Hôm nay',
      subtitle: format(new Date(), 'EEEE, d/M', { locale: vi }),
      tasks: sorted.filter((t) => isDueToday(t) && !isDone(t)),
    },
    { id: 'upcoming', title: 'Sắp tới', tasks: sorted.filter(isUpcoming) },
    { id: 'someday', title: 'Chưa đặt hạn', tasks: sorted.filter((t) => !isDone(t) && !dueKey(t)) },
    { id: 'done', title: 'Đã hoàn thành', tasks: sorted.filter(isDone) },
  ];
  return groups.filter((g) => g.tasks.length > 0);
}
