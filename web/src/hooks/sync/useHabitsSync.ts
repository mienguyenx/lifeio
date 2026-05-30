import { useCallback } from 'react';
import { activeSupabase as supabase, ensureValidSession } from '@/integrations/supabase/externalClient';
import { useAuth } from '@/hooks/useAuth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useSyncQueue } from './useSyncQueue';
import type { Habit, HabitCompletion } from '@/types/lifeos';
import type { Database } from '@/integrations/supabase/types';

type HabitRow = Database['public']['Tables']['habits']['Row'];
type HabitCompletionRow = Database['public']['Tables']['habit_completions']['Row'];

// Transform Supabase row to local Habit type
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
      count: c.count ?? 1, // Use nullish coalescing to preserve 0 values
      notes: c.notes || undefined,
      time: c.completion_time || undefined,
    })),
    reminderTime: row.reminder_time || undefined,
    reminderEnabled: row.reminder_enabled || false,
    color: row.color || undefined,
    icon: row.icon || undefined,
    goalId: row.goal_id || undefined,
    targetDays: row.target_days || undefined,
    createdAt: row.created_at && !isNaN(new Date(row.created_at).getTime()) 
      ? row.created_at 
      : new Date().toISOString(),
    archivedAt: row.archived_at && !isNaN(new Date(row.archived_at).getTime())
      ? row.archived_at
      : undefined,
    deletedAt: row.deleted_at && !isNaN(new Date(row.deleted_at).getTime())
      ? row.deleted_at
      : undefined,
  };
}

// Transform local Habit to Supabase insert/update format
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
    reminder_enabled: habit.reminderEnabled || false,
    color: habit.color || null,
    icon: habit.icon || null,
    goal_id: habit.goalId || null,
    target_days: habit.targetDays || null,
    archived_at: habit.archivedAt || null,
    deleted_at: habit.deletedAt || null,
  };
}

// Transform partial updates only
function transformHabitUpdatesToDB(updates: Partial<Habit>): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  
  if ('name' in updates) data.name = updates.name;
  if ('description' in updates) data.description = updates.description || null;
  if ('area' in updates) data.area = updates.area;
  if ('frequency' in updates) data.frequency = updates.frequency || 'daily';
  if ('customDays' in updates) data.custom_days = updates.customDays || null;
  if ('targetPerDay' in updates) data.target_per_day = updates.targetPerDay || null;
  if ('targetUnit' in updates) data.target_unit = updates.targetUnit || null;
  if ('streak' in updates) data.streak = updates.streak || 0;
  if ('bestStreak' in updates) data.best_streak = updates.bestStreak || null;
  if ('completedDates' in updates) data.completed_dates = updates.completedDates || [];
  if ('reminderTime' in updates) data.reminder_time = updates.reminderTime || null;
  if ('reminderEnabled' in updates) data.reminder_enabled = updates.reminderEnabled || false;
  if ('color' in updates) data.color = updates.color || null;
  if ('icon' in updates) data.icon = updates.icon || null;
  if ('goalId' in updates) data.goal_id = updates.goalId || null;
  if ('targetDays' in updates) data.target_days = updates.targetDays || null;
  if ('archivedAt' in updates) data.archived_at = updates.archivedAt || null;
  if ('deletedAt' in updates) data.deleted_at = updates.deletedAt || null;
  
  return data;
}

export function useHabitsSync() {
  const { user } = useAuth();
  const { isOnline } = useOnlineStatus();
  const { queueChange } = useSyncQueue();

  // Load habits from Supabase
  const loadHabits = useCallback(async (): Promise<Habit[]> => {
    if (!user) return [];

    try {
      // Session check is done once in loadAllData() - no need to check here
      
      // Fetch habits with optimized select and pagination
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('id,name,description,area,frequency,streak,best_streak,reminder_time,reminder_enabled,archived_at,created_at,deleted_at,user_id,goal_id,target_per_day,target_unit,target_days,custom_days,color,icon,completed_dates')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(0, 499); // Limit to 500 habits

      if (habitsError) throw habitsError;

      // Fetch completions for all habits with optimized select
      const habitIds = habitsData?.map(h => h.id) || [];
      const { data: completionsData, error: completionsError } = await supabase
        .from('habit_completions')
        .select('id,habit_id,date,count,completion_time,notes')
        .in('habit_id', habitIds)
        .order('date', { ascending: false })
        .limit(10000); // Limit completions (can be many)

      if (completionsError) throw completionsError;

      // Group completions by habit
      const completionsByHabit: Record<string, HabitCompletionRow[]> = {};
      (completionsData || []).forEach(c => {
        if (!completionsByHabit[c.habit_id]) {
          completionsByHabit[c.habit_id] = [];
        }
        completionsByHabit[c.habit_id].push(c);
      });

      return (habitsData || []).map(h => 
        transformHabitFromDB(h, completionsByHabit[h.id] || [])
      );
    } catch (error) {
      console.error('Error loading habits:', error);
      return [];
    }
  }, [user]);

  // Save habit to Supabase
  const saveHabit = useCallback(async (habit: Habit): Promise<boolean> => {
    if (!user) return false;

    const data = transformHabitToDB(habit, user.id);

    if (!isOnline) {
      await queueChange('create', 'habits', habit.id, data);
      return true;
    }

    try {
      await ensureValidSession();
      
      const { error } = await supabase
        .from('habits')
        .upsert(data);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving habit:', error);
      await queueChange('create', 'habits', habit.id, data);
      return false;
    }
  }, [user, isOnline, queueChange]);

  // Update habit in Supabase
  const updateHabit = useCallback(async (id: string, updates: Partial<Habit>): Promise<boolean> => {
    if (!user) return false;

    const data = transformHabitUpdatesToDB(updates);

    if (!isOnline) {
      await queueChange('update', 'habits', id, data);
      return true;
    }

    try {
      await ensureValidSession();
      
      const { error, data: updatedData } = await supabase
        .from('habits')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id)
        .select();

      if (error) {
        console.error('Error updating habit:', error);
        throw error;
      }
      
      if (!updatedData || updatedData.length === 0) {
        console.warn('No rows updated for habit:', id);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error updating habit:', error);
      await queueChange('update', 'habits', id, data);
      return false;
    }
  }, [user, isOnline, queueChange]);

  // Delete habit from Supabase
  const deleteHabit = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;

    if (!isOnline) {
      await queueChange('delete', 'habits', id, {});
      return true;
    }

    try {
      await ensureValidSession();
      
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting habit:', error);
      await queueChange('delete', 'habits', id, {});
      return false;
    }
  }, [user, isOnline, queueChange]);

  // Upsert habit completion (smart toggle)
  const upsertCompletion = useCallback(async (habitId: string, date: string, count: number, notes?: string): Promise<boolean> => {
    if (!user) return false;

    try {
      await ensureValidSession();
      
      // Check if completion exists
      const { data: existing } = await supabase
        .from('habit_completions')
        .select('*')
        .eq('habit_id', habitId)
        .eq('date', date)
        .maybeSingle();

      if (existing) {
        // Update existing completion
        const { error } = await supabase
          .from('habit_completions')
          .update({
            count,
            notes: notes || null,
            completion_time: new Date().toTimeString().slice(0, 5),
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        // Add new completion
        const { error } = await supabase
          .from('habit_completions')
          .insert({
            habit_id: habitId,
            date,
            count,
            notes: notes || null,
            completion_time: new Date().toTimeString().slice(0, 5),
          });
        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error('Error upserting completion:', error);
      return false;
    }
  }, [user]);

  // Delete habit completion
  const deleteCompletion = useCallback(async (habitId: string, date: string): Promise<boolean> => {
    if (!user) return false;

    try {
      await ensureValidSession();
      
      const { error } = await supabase
        .from('habit_completions')
        .delete()
        .eq('habit_id', habitId)
        .eq('date', date);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting completion:', error);
      return false;
    }
  }, [user]);

  // Toggle completion - used for simple toggle (add if not exists, remove if exists)
  const toggleCompletion = useCallback(async (habitId: string, date: string, count: number, notes?: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Check if completion exists
      const { data: existing } = await supabase
        .from('habit_completions')
        .select('*')
        .eq('habit_id', habitId)
        .eq('date', date)
        .maybeSingle();

      if (existing) {
        // Remove completion
        const { error } = await supabase
          .from('habit_completions')
          .delete()
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        // Add completion
        const { error } = await supabase
          .from('habit_completions')
          .insert({
            habit_id: habitId,
            date,
            count,
            notes: notes || null,
            completion_time: new Date().toTimeString().slice(0, 5),
          });
        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error('Error toggling completion:', error);
      return false;
    }
  }, [user]);

  return {
    loadHabits,
    saveHabit,
    updateHabit,
    deleteHabit,
    upsertCompletion,
    deleteCompletion,
    toggleCompletion,
  };
}
