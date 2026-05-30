import { useCallback } from 'react';
import { activeSupabase as supabase, ensureValidSession } from '@/integrations/supabase/externalClient';
import { useAuth } from '@/hooks/useAuth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useSyncQueue } from './useSyncQueue';
import type { Goal, Milestone } from '@/types/lifeos';
import type { Database } from '@/integrations/supabase/types';

type GoalRow = Database['public']['Tables']['goals']['Row'];
type MilestoneRow = Database['public']['Tables']['goal_milestones']['Row'];

// Transform Supabase row to local Goal type
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
    priority: row.priority || 'medium',
    status: row.status || 'active',
    isFocused: row.is_focused || false,
    focusedAt: row.focused_at || undefined,
    reminderDays: row.reminder_days || 7,
    reminderEnabled: row.reminder_enabled || false,
    lastReminded: row.last_reminded || undefined,
    currentStreak: row.current_streak || 0,
    bestStreak: row.best_streak || 0,
    lastActivityDate: row.last_activity_date || undefined,
    isPublic: row.is_public || false,
    shareCode: row.share_code || undefined,
    pushEnabled: row.push_enabled || false,
    pushDeadline: row.push_deadline || false,
    pushWeekly: row.push_weekly || false,
    dependencies: row.dependencies || undefined,
    dependents: row.dependents || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    completedAt: row.completed_at || undefined,
    archivedAt: row.archived_at || undefined,
    deletedAt: row.deleted_at || undefined,
  };
}

// Transform local Goal to Supabase format
function transformGoalToDB(goal: Partial<Goal>, userId: string) {
  return {
    id: goal.id,
    user_id: userId,
    title: goal.title,
    description: goal.description || null,
    area: goal.area,
    target_date: goal.targetDate || null,
    progress: goal.progress || 0,
    priority: goal.priority || 'medium',
    status: goal.status || 'active',
    is_focused: goal.isFocused || false,
    focused_at: goal.focusedAt || null,
    reminder_days: goal.reminderDays || 7,
    reminder_enabled: goal.reminderEnabled || false,
    last_reminded: goal.lastReminded || null,
    current_streak: goal.currentStreak || 0,
    best_streak: goal.bestStreak || 0,
    last_activity_date: goal.lastActivityDate || null,
    is_public: goal.isPublic || false,
    share_code: goal.shareCode || null,
    push_enabled: goal.pushEnabled || false,
    push_deadline: goal.pushDeadline || false,
    push_weekly: goal.pushWeekly || false,
    dependencies: goal.dependencies || null,
    dependents: goal.dependents || null,
    completed_at: goal.completedAt || null,
    archived_at: goal.archivedAt || null,
    deleted_at: goal.deletedAt || null,
  };
}

// Transform partial Goal updates to Supabase format
function transformGoalUpdatesToDB(updates: Partial<Goal>): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  
  if ('title' in updates) data.title = updates.title;
  if ('description' in updates) data.description = updates.description || null;
  if ('area' in updates) data.area = updates.area;
  if ('targetDate' in updates) data.target_date = updates.targetDate || null;
  if ('progress' in updates) data.progress = updates.progress || 0;
  if ('priority' in updates) data.priority = updates.priority || 'medium';
  if ('status' in updates) data.status = updates.status || 'active';
  if ('isFocused' in updates) data.is_focused = updates.isFocused || false;
  if ('focusedAt' in updates) data.focused_at = updates.focusedAt || null;
  if ('reminderDays' in updates) data.reminder_days = updates.reminderDays || 7;
  if ('reminderEnabled' in updates) data.reminder_enabled = updates.reminderEnabled || false;
  if ('lastReminded' in updates) data.last_reminded = updates.lastReminded || null;
  if ('currentStreak' in updates) data.current_streak = updates.currentStreak || 0;
  if ('bestStreak' in updates) data.best_streak = updates.bestStreak || 0;
  if ('lastActivityDate' in updates) data.last_activity_date = updates.lastActivityDate || null;
  if ('isPublic' in updates) data.is_public = updates.isPublic || false;
  if ('shareCode' in updates) data.share_code = updates.shareCode || null;
  if ('pushEnabled' in updates) data.push_enabled = updates.pushEnabled || false;
  if ('pushDeadline' in updates) data.push_deadline = updates.pushDeadline || false;
  if ('pushWeekly' in updates) data.push_weekly = updates.pushWeekly || false;
  if ('dependencies' in updates) data.dependencies = updates.dependencies || null;
  if ('dependents' in updates) data.dependents = updates.dependents || null;
  if ('completedAt' in updates) data.completed_at = updates.completedAt || null;
  if ('archivedAt' in updates) data.archived_at = updates.archivedAt || null;
  if ('deletedAt' in updates) data.deleted_at = updates.deletedAt || null;
  
  return data;
}

export function useGoalsSync() {
  const { user } = useAuth();
  const { isOnline } = useOnlineStatus();
  const { queueChange } = useSyncQueue();

  // Load goals from Supabase
  const loadGoals = useCallback(async (): Promise<Goal[]> => {
    if (!user) return [];

    try {
      // Ensure valid session before request
      await ensureValidSession();
      
      // Fetch goals
      const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (goalsError) throw goalsError;

      // Fetch milestones for all goals
      const goalIds = goalsData?.map(g => g.id) || [];
      const { data: milestonesData, error: milestonesError } = await supabase
        .from('goal_milestones')
        .select('*')
        .in('goal_id', goalIds);

      if (milestonesError) throw milestonesError;

      // Group milestones by goal
      const milestonesByGoal: Record<string, MilestoneRow[]> = {};
      (milestonesData || []).forEach(m => {
        if (!milestonesByGoal[m.goal_id]) {
          milestonesByGoal[m.goal_id] = [];
        }
        milestonesByGoal[m.goal_id].push(m);
      });

      return (goalsData || []).map(g => 
        transformGoalFromDB(g, milestonesByGoal[g.id] || [])
      );
    } catch (error) {
      console.error('Error loading goals:', error);
      return [];
    }
  }, [user]);

  // Save goal to Supabase
  const saveGoal = useCallback(async (goal: Goal): Promise<boolean> => {
    if (!user) return false;

    const data = transformGoalToDB(goal, user.id);

    if (!isOnline) {
      await queueChange('create', 'goals', goal.id, data);
      return true;
    }

    try {
      // Ensure valid session before request
      await ensureValidSession();
      
      // Upsert goal
      const { error: goalError } = await supabase
        .from('goals')
        .upsert(data);

      if (goalError) throw goalError;

      // Handle milestones
      if (goal.milestones && goal.milestones.length > 0) {
        const milestonesData = goal.milestones.map(m => ({
          id: m.id,
          goal_id: goal.id,
          title: m.title,
          completed: m.completed || false,
          completed_at: m.completedAt || null,
          task_id: m.taskId || null,
        }));

        const { error: milestonesError } = await supabase
          .from('goal_milestones')
          .upsert(milestonesData);

        if (milestonesError) throw milestonesError;
      }

      return true;
    } catch (error) {
      console.error('Error saving goal:', error);
      await queueChange('create', 'goals', goal.id, data);
      return false;
    }
  }, [user, isOnline, queueChange]);

  // Update goal in Supabase
  const updateGoal = useCallback(async (id: string, updates: Partial<Goal>): Promise<boolean> => {
    if (!user) return false;

    const data = transformGoalUpdatesToDB(updates);

    if (!isOnline) {
      await queueChange('update', 'goals', id, data);
      return true;
    }

    try {
      // Ensure valid session before request
      await ensureValidSession();
      
      const { error } = await supabase
        .from('goals')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Also update milestones if provided
      if (updates.milestones) {
        const milestonesData = updates.milestones.map(m => ({
          id: m.id,
          goal_id: id,
          title: m.title,
          completed: m.completed || false,
          completed_at: m.completedAt || null,
          task_id: m.taskId || null,
        }));

        const { error: milestonesError } = await supabase
          .from('goal_milestones')
          .upsert(milestonesData);

        if (milestonesError) throw milestonesError;
      }

      return true;
    } catch (error) {
      console.error('Error updating goal:', error);
      await queueChange('update', 'goals', id, data);
      return false;
    }
  }, [user, isOnline, queueChange]);

  // Delete goal from Supabase
  const deleteGoal = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;

    if (!isOnline) {
      await queueChange('delete', 'goals', id, {});
      return true;
    }

    try {
      // Ensure valid session before request
      await ensureValidSession();
      
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting goal:', error);
      await queueChange('delete', 'goals', id, {});
      return false;
    }
  }, [user, isOnline, queueChange]);

  // Toggle milestone
  const toggleMilestone = useCallback(async (milestoneId: string, completed: boolean): Promise<boolean> => {
    if (!user) return false;

    try {
      // Ensure valid session before request
      await ensureValidSession();
      
      const { error } = await supabase
        .from('goal_milestones')
        .update({
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        })
        .eq('id', milestoneId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error toggling milestone:', error);
      return false;
    }
  }, [user]);

  // Add milestone
  const addMilestone = useCallback(async (goalId: string, milestone: Milestone): Promise<boolean> => {
    if (!user) return false;

    try {
      // Ensure valid session before request
      await ensureValidSession();
      
      const { error } = await supabase
        .from('goal_milestones')
        .insert({
          id: milestone.id,
          goal_id: goalId,
          title: milestone.title,
          completed: milestone.completed || false,
          completed_at: milestone.completedAt || null,
          task_id: milestone.taskId || null,
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error adding milestone:', error);
      return false;
    }
  }, [user]);

  // Delete milestone
  const deleteMilestone = useCallback(async (milestoneId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Ensure valid session before request
      await ensureValidSession();
      
      const { error } = await supabase
        .from('goal_milestones')
        .delete()
        .eq('id', milestoneId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting milestone:', error);
      return false;
    }
  }, [user]);

  return {
    loadGoals,
    saveGoal,
    updateGoal,
    deleteGoal,
    toggleMilestone,
    addMilestone,
    deleteMilestone,
  };
}
