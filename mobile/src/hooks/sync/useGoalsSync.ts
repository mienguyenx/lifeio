import { useCallback } from 'react';
import { supabase, ensureValidSession } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { addToSyncQueue } from '@/lib/storage';
import type { Goal, Milestone } from '@/types/lifeos';
import type { Database } from '@/integrations/supabase/types';

type GoalRow = Database['public']['Tables']['goals']['Row'];
type MilestoneRow = Database['public']['Tables']['goal_milestones']['Row'];

function transformGoalFromDB(row: GoalRow, milestones: MilestoneRow[]): Goal {
  return {
    id: row.id,
    title: row.title,
    description: row.description || undefined,
    area: row.area,
    targetDate: row.target_date || undefined,
    progress: row.progress || 0,
    milestones: milestones.map(m => ({
      id: m.id,
      title: m.title,
      completed: m.completed || false,
      completedAt: m.completed_at || undefined,
      taskId: m.task_id || undefined,
    })),
    priority: row.priority || undefined,
    status: row.status || undefined,
    isFocused: row.is_focused || undefined,
    focusedAt: row.focused_at || undefined,
    archivedAt: row.archived_at || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    completedAt: row.completed_at || undefined,
    reminderDays: row.reminder_days || undefined,
    reminderEnabled: row.reminder_enabled || undefined,
    lastReminded: row.last_reminded || undefined,
    currentStreak: row.current_streak || undefined,
    bestStreak: row.best_streak || undefined,
    lastActivityDate: row.last_activity_date || undefined,
    dependencies: row.dependencies || undefined,
    dependents: row.dependents || undefined,
    isPublic: row.is_public || undefined,
    shareCode: row.share_code || undefined,
    pushEnabled: row.push_enabled || undefined,
    pushDeadline: row.push_deadline || undefined,
    pushWeekly: row.push_weekly || undefined,
    deletedAt: row.deleted_at || undefined,
  };
}

function transformGoalToDB(goal: Partial<Goal>, userId: string) {
  return {
    id: goal.id,
    user_id: userId,
    title: goal.title,
    description: goal.description || null,
    area: goal.area,
    target_date: goal.targetDate || null,
    progress: goal.progress || 0,
    priority: goal.priority || null,
    status: goal.status || null,
    is_focused: goal.isFocused || null,
    focused_at: goal.focusedAt || null,
    archived_at: goal.archivedAt || null,
    completed_at: goal.completedAt || null,
    reminder_days: goal.reminderDays || null,
    reminder_enabled: goal.reminderEnabled || null,
    dependencies: goal.dependencies || null,
    dependents: goal.dependents || null,
    deleted_at: goal.deletedAt || null,
  };
}

export function useGoalsSync() {
  const { user } = useAuth();
  const { isOnline } = useOnlineStatus();

  const loadGoals = useCallback(async (): Promise<Goal[]> => {
    if (!user) return [];
    try {
      const { data: goalsData, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (!goalsData?.length) return [];

      // Load milestones
      const goalIds = goalsData.map(g => g.id);
      let milestonesByGoal: Record<string, MilestoneRow[]> = {};
      try {
        const { data: milestonesData } = await supabase
          .from('goal_milestones')
          .select('*')
          .in('goal_id', goalIds);
        if (milestonesData) {
          milestonesData.forEach(m => {
            if (!milestonesByGoal[m.goal_id]) milestonesByGoal[m.goal_id] = [];
            milestonesByGoal[m.goal_id].push(m);
          });
        }
      } catch {}

      return goalsData.map(g => transformGoalFromDB(g, milestonesByGoal[g.id] || []));
    } catch {
      return [];
    }
  }, [user]);

  const saveGoal = useCallback(async (goal: Goal): Promise<boolean> => {
    if (!user) return false;
    const data = transformGoalToDB(goal, user.id);
    if (!isOnline) {
      await addToSyncQueue('create', 'goals', goal.id, data);
      return true;
    }
    try {
      await ensureValidSession();
      const { error } = await supabase.from('goals').upsert(data);
      if (error) throw error;
      // Upsert milestones
      if (goal.milestones?.length) {
        const milestonesData = goal.milestones.map(m => ({
          id: m.id, goal_id: goal.id, title: m.title,
          completed: m.completed || false, completed_at: m.completedAt || null,
          task_id: m.taskId || null,
        }));
        await supabase.from('goal_milestones').upsert(milestonesData);
      }
      return true;
    } catch {
      await addToSyncQueue('create', 'goals', goal.id, data);
      return false;
    }
  }, [user, isOnline]);

  const updateGoal = useCallback(async (id: string, updates: Partial<Goal>): Promise<boolean> => {
    if (!user) return false;
    const data: Record<string, unknown> = {};
    if ('title' in updates) data.title = updates.title;
    if ('description' in updates) data.description = updates.description || null;
    if ('area' in updates) data.area = updates.area;
    if ('targetDate' in updates) data.target_date = updates.targetDate || null;
    if ('progress' in updates) data.progress = updates.progress;
    if ('status' in updates) data.status = updates.status || null;
    if ('completedAt' in updates) data.completed_at = updates.completedAt || null;
    if ('deletedAt' in updates) data.deleted_at = updates.deletedAt || null;

    if (!isOnline) {
      await addToSyncQueue('update', 'goals', id, data);
      return true;
    }
    try {
      await ensureValidSession();
      const { error } = await supabase.from('goals').update(data).eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      return true;
    } catch {
      await addToSyncQueue('update', 'goals', id, data);
      return false;
    }
  }, [user, isOnline]);

  const deleteGoal = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;
    if (!isOnline) {
      await addToSyncQueue('delete', 'goals', id, {});
      return true;
    }
    try {
      await ensureValidSession();
      const { error } = await supabase.from('goals').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      return true;
    } catch {
      await addToSyncQueue('delete', 'goals', id, {});
      return false;
    }
  }, [user, isOnline]);

  return { loadGoals, saveGoal, updateGoal, deleteGoal };
}
