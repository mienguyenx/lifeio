import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useSyncedStore } from '@/hooks/useSyncedStore';
import type { Goal } from '@/types/lifeos';
import { activityUpdates, isActive, isOverdue, isPaused, progressFrom, type GoalFormValue } from '../utils/goal.utils';

/** Dữ liệu + hành động Goals — bọc store/sync, giữ nguyên nghiệp vụ trang cũ. */
export function useGoals() {
  const all = useLifeOSStore((s) => s.goals);
  const tasks = useLifeOSStore((s) => s.tasks);
  const synced = useSyncedStore();
  const goals = useMemo(() => all.filter((g) => !g.deletedAt), [all]);

  const stats = useMemo(() => {
    const active = goals.filter(isActive);
    const ms = active.flatMap((g) => g.milestones);
    return {
      total: goals.length,
      active: active.length,
      completed: goals.filter((g) => g.completedAt).length,
      paused: goals.filter(isPaused).length,
      overdue: goals.filter(isOverdue).length,
      avgProgress: active.length ? Math.round(active.reduce((s, g) => s + g.progress, 0) / active.length) : 0,
      milestones: ms.length,
      milestonesDone: ms.filter((m) => m.completed).length,
      linkedTasksDone: tasks.filter((t) => !t.deletedAt && t.goalId && t.status === 'done').length,
    };
  }, [goals, tasks]);

  const byId = useCallback((id?: string | null) => (id ? goals.find((g) => g.id === id) ?? null : null), [goals]);

  const create = useCallback((f: GoalFormValue) => {
    if (!f.title.trim()) return;
    synced.addGoal({
      title: f.title.trim(), description: f.description.trim() || undefined, area: f.area,
      targetDate: f.targetDate || undefined, priority: f.priority, isFocused: f.isFocused || undefined,
      focusedAt: f.isFocused ? new Date().toISOString() : undefined,
      reminderEnabled: f.reminderEnabled, reminderDays: f.reminderDays, status: 'active',
      milestones: f.milestones.map((m) => m.trim()).filter(Boolean),
    });
    toast.success('Đã thêm mục tiêu mới 🎯');
  }, [synced]);

  const edit = useCallback((g: Goal, f: GoalFormValue) => {
    synced.updateGoal(g.id, {
      title: f.title.trim(), description: f.description.trim() || undefined, area: f.area, targetDate: f.targetDate || undefined,
      priority: f.priority, isFocused: f.isFocused, focusedAt: f.isFocused ? g.focusedAt || new Date().toISOString() : undefined,
      reminderEnabled: f.reminderEnabled, reminderDays: f.reminderDays,
      ...activityUpdates(g, 'note', 'Cập nhật thông tin goal'),
    });
    toast.success('Đã cập nhật mục tiêu');
  }, [synced]);

  const complete = useCallback((g: Goal) => {
    const now = new Date().toISOString();
    synced.updateGoal(g.id, { completedAt: now, progress: 100, milestones: g.milestones.map((m) => ({ ...m, completed: true, completedAt: m.completedAt || now })) });
    toast.success('🎉 Chúc mừng! Mục tiêu đã hoàn thành!');
  }, [synced]);
  const reopen = useCallback((g: Goal) => { synced.updateGoal(g.id, { completedAt: undefined, progress: progressFrom(g.milestones) }); toast.success('Đã mở lại mục tiêu'); }, [synced]);
  const setPaused = useCallback((g: Goal, paused: boolean) => {
    synced.updateGoal(g.id, { status: paused ? 'paused' : 'active' });
    toast.success(paused ? 'Đã tạm dừng mục tiêu' : 'Tiếp tục mục tiêu 💪');
  }, [synced]);
  const toggleFocus = useCallback((g: Goal) => {
    synced.updateGoal(g.id, { isFocused: !g.isFocused, focusedAt: !g.isFocused ? new Date().toISOString() : undefined });
  }, [synced]);
  const remove = useCallback((g: Goal) => { synced.deleteGoal(g.id); toast.success('Đã chuyển vào thùng rác'); }, [synced]);

  const addMilestone = useCallback((g: Goal, title: string) => {
    if (!title.trim()) return;
    const milestones = [...g.milestones, { id: crypto.randomUUID(), title: title.trim(), completed: false }];
    synced.updateGoal(g.id, { milestones, progress: progressFrom(milestones), ...activityUpdates(g, 'milestone', `Thêm milestone: ${title.trim()}`) });
  }, [synced]);
  const deleteMilestone = useCallback((g: Goal, id: string) => {
    const milestones = g.milestones.filter((m) => m.id !== id);
    synced.updateGoal(g.id, { milestones, progress: progressFrom(milestones) });
  }, [synced]);
  const toggleMilestone = useCallback((g: Goal, id: string) => synced.toggleMilestone(g.id, id), [synced]);

  return { goals, stats, byId, create, edit, complete, reopen, setPaused, toggleFocus, remove, addMilestone, deleteMilestone, toggleMilestone, update: synced.updateGoal };
}
export type GoalsApi = ReturnType<typeof useGoals>;
