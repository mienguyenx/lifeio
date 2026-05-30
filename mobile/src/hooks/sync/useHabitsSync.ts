import { useCallback } from 'react';
import { supabase, ensureValidSession } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { addToSyncQueue } from '@/lib/storage';
import type { Habit, HabitCompletion } from '@/types/lifeos';
import type { Database } from '@/integrations/supabase/types';

type HabitRow = Database['public']['Tables']['habits']['Row'];
type HabitCompletionRow = Database['public']['Tables']['habit_completions']['Row'];

function transformHabitFromDB(row: HabitRow, completions: HabitCompletionRow[]): Habit {
  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    area: row.area,
    frequency: row.frequency || 'daily',
    customDays: row.custom_days || undefined,
    targetPerDay: row.target_per_day || undefined,
    targetUnit: row.target_unit || undefined,
    streak: row.streak || 0,
    bestStreak: row.best_streak || undefined,
    completedDates: row.completed_dates || [],
    completions: completions.map(c => ({
      date: c.date,
      count: c.count || 1,
      notes: c.notes || undefined,
      time: c.completion_time || undefined,
    })),
    reminderTime: row.reminder_time || undefined,
    reminderEnabled: row.reminder_enabled || undefined,
    color: row.color || undefined,
    icon: row.icon || undefined,
    goalId: row.goal_id || undefined,
    targetDays: row.target_days || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    archivedAt: row.archived_at || undefined,
    deletedAt: row.deleted_at || undefined,
  };
}

function transformHabitToDB(habit: Partial<Habit>, userId: string) {
  return {
    id: habit.id,
    user_id: userId,
    name: habit.name,
    description: habit.description || null,
    area: habit.area,
    frequency: habit.frequency || 'daily',
    custom_days: habit.customDays || null,
    target_per_day: habit.targetPerDay || null,
    target_unit: habit.targetUnit || null,
    streak: habit.streak || 0,
    best_streak: habit.bestStreak || null,
    completed_dates: habit.completedDates || [],
    reminder_time: habit.reminderTime || null,
    reminder_enabled: habit.reminderEnabled || null,
    color: habit.color || null,
    icon: habit.icon || null,
    goal_id: habit.goalId || null,
    target_days: habit.targetDays || null,
    archived_at: habit.archivedAt || null,
    deleted_at: habit.deletedAt || null,
  };
}

export function useHabitsSync() {
  const { user } = useAuth();
  const { isOnline } = useOnlineStatus();

  const loadHabits = useCallback(async (): Promise<Habit[]> => {
    if (!user) return [];
    try {
      const { data: habitsData, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (!habitsData?.length) return [];

      // Load completions for all habits
      const habitIds = habitsData.map(h => h.id);
      let completionsByHabit: Record<string, HabitCompletionRow[]> = {};
      try {
        const { data: completionsData } = await supabase
          .from('habit_completions')
          .select('*')
          .in('habit_id', habitIds);
        if (completionsData) {
          completionsData.forEach(c => {
            if (!completionsByHabit[c.habit_id]) completionsByHabit[c.habit_id] = [];
            completionsByHabit[c.habit_id].push(c);
          });
        }
      } catch {}

      return habitsData.map(h => transformHabitFromDB(h, completionsByHabit[h.id] || []));
    } catch {
      return [];
    }
  }, [user]);

  const saveHabit = useCallback(async (habit: Habit): Promise<boolean> => {
    if (!user) return false;
    const data = transformHabitToDB(habit, user.id);
    if (!isOnline) {
      await addToSyncQueue('create', 'habits', habit.id, data);
      return true;
    }
    try {
      await ensureValidSession();
      const { error } = await supabase.from('habits').upsert(data);
      if (error) throw error;
      return true;
    } catch {
      await addToSyncQueue('create', 'habits', habit.id, data);
      return false;
    }
  }, [user, isOnline]);

  const updateHabit = useCallback(async (id: string, updates: Partial<Habit>): Promise<boolean> => {
    if (!user) return false;
    const data: Record<string, unknown> = {};
    if ('name' in updates) data.name = updates.name;
    if ('description' in updates) data.description = updates.description || null;
    if ('area' in updates) data.area = updates.area;
    if ('frequency' in updates) data.frequency = updates.frequency;
    if ('streak' in updates) data.streak = updates.streak;
    if ('bestStreak' in updates) data.best_streak = updates.bestStreak;
    if ('completedDates' in updates) data.completed_dates = updates.completedDates;
    if ('targetPerDay' in updates) data.target_per_day = updates.targetPerDay || null;
    if ('targetUnit' in updates) data.target_unit = updates.targetUnit || null;
    if ('icon' in updates) data.icon = updates.icon || null;
    if ('color' in updates) data.color = updates.color || null;
    if ('archivedAt' in updates) data.archived_at = updates.archivedAt || null;
    if ('deletedAt' in updates) data.deleted_at = updates.deletedAt || null;

    if (!isOnline) {
      await addToSyncQueue('update', 'habits', id, data);
      return true;
    }
    try {
      await ensureValidSession();
      const { error } = await supabase.from('habits').update(data).eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      return true;
    } catch {
      await addToSyncQueue('update', 'habits', id, data);
      return false;
    }
  }, [user, isOnline]);

  const deleteHabit = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;
    if (!isOnline) {
      await addToSyncQueue('delete', 'habits', id, {});
      return true;
    }
    try {
      await ensureValidSession();
      const { error } = await supabase.from('habits').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      return true;
    } catch {
      await addToSyncQueue('delete', 'habits', id, {});
      return false;
    }
  }, [user, isOnline]);

  return { loadHabits, saveHabit, updateHabit, deleteHabit };
}
