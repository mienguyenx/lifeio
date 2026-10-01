import { differenceInDays, format, isToday, isYesterday, parseISO } from 'date-fns';
import { LIFE_AREAS, type Goal, type GoalActivity, type LifeArea } from '@/types/lifeos';

export type GoalTab = 'all' | 'active' | 'completed' | 'paused';
export type GoalSortBy = 'progress' | 'deadline' | 'created' | 'title' | 'area';
export type GoalDeadline = 'all' | 'overdue' | 'approaching';

export const areaOf = (id?: string) => LIFE_AREAS.find((a) => a.id === id);
export const areaColor = (id: string) => `hsl(var(--area-${id}))`;

export const isPaused = (g: Goal) => !g.completedAt && g.status === 'paused';
export const isActive = (g: Goal) => !g.completedAt && g.status !== 'paused';
export const daysLeft = (g: Goal) => (g.targetDate ? differenceInDays(parseISO(g.targetDate), new Date()) : null);
export const isOverdue = (g: Goal) => !g.completedAt && (daysLeft(g) ?? 1) < 0;
export const isApproaching = (g: Goal) => { const d = daysLeft(g); return !g.completedAt && d !== null && d > 0 && d <= 7; };

export function matchesTab(g: Goal, t: GoalTab) {
  if (t === 'active') return isActive(g);
  if (t === 'completed') return !!g.completedAt;
  if (t === 'paused') return isPaused(g);
  return true;
}

export function deadlineLabel(g: Goal) {
  if (g.completedAt) return { text: `Hoàn thành ${format(parseISO(g.completedAt), 'dd/MM/yyyy')}`, tone: 'done' as const };
  const d = daysLeft(g);
  if (d === null) return { text: 'Chưa đặt hạn', tone: 'muted' as const };
  if (d < 0) return { text: `Quá hạn ${-d} ngày`, tone: 'danger' as const };
  if (d === 0) return { text: 'Hạn hôm nay', tone: 'warn' as const };
  return { text: `Còn ${d} ngày`, tone: d <= 7 ? ('warn' as const) : ('muted' as const) };
}

export function sortGoals(list: Goal[], by: GoalSortBy, order: 'asc' | 'desc') {
  const r = [...list].sort((a, b) => {
    let c = 0;
    if (by === 'progress') c = a.progress - b.progress;
    else if (by === 'deadline') c = !a.targetDate && !b.targetDate ? 0 : !a.targetDate ? 1 : !b.targetDate ? -1 : a.targetDate.localeCompare(b.targetDate);
    else if (by === 'created') c = (a.createdAt || '').localeCompare(b.createdAt || '');
    else if (by === 'title') c = a.title.localeCompare(b.title);
    else c = a.area.localeCompare(b.area);
    return order === 'desc' ? -c : c;
  });
  return r;
}

export const progressFrom = (ms: Goal['milestones']) => (ms.length ? Math.round((ms.filter((m) => m.completed).length / ms.length) * 100) : 0);

/** Ghi nhận hoạt động + streak (giữ nguyên logic GoalDetailModal cũ). */
export function activityUpdates(goal: Goal, type: GoalActivity['type'], description?: string): Partial<Goal> {
  const today = format(new Date(), 'yyyy-MM-dd');
  const activities = goal.activities || [];
  const hadToday = activities.some((a) => a.date === today);
  let streak = goal.currentStreak || 0;
  if (!hadToday) {
    const last = goal.lastActivityDate ? parseISO(goal.lastActivityDate) : null;
    if (!last) streak = 1;
    else if (isYesterday(last)) streak += 1;
    else if (!isToday(last)) streak = 1;
  }
  return {
    activities: [...activities, { date: today, type, description }],
    lastActivityDate: new Date().toISOString(),
    currentStreak: streak,
    bestStreak: Math.max(goal.bestStreak || 0, streak),
  };
}

export interface GoalFormValue {
  title: string;
  description: string;
  area: LifeArea;
  targetDate: string;
  priority: 'low' | 'medium' | 'high';
  isFocused: boolean;
  milestones: string[];
  reminderEnabled: boolean;
  reminderDays: number;
}
export const EMPTY_GOAL: GoalFormValue = {
  title: '', description: '', area: 'career', targetDate: '', priority: 'medium', isFocused: false, milestones: [], reminderEnabled: false, reminderDays: 7,
};
export const formFromGoal = (g: Goal): GoalFormValue => ({
  title: g.title, description: g.description || '', area: g.area, targetDate: g.targetDate?.slice(0, 10) || '', priority: g.priority || 'medium',
  isFocused: !!g.isFocused, milestones: [], reminderEnabled: !!g.reminderEnabled, reminderDays: g.reminderDays || 7,
});
