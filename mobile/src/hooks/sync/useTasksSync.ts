import { useCallback } from 'react';
import { supabase, ensureValidSession } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { addToSyncQueue } from '@/lib/storage';
import type { Task, Subtask, TaskTag } from '@/types/lifeos';
import type { Database } from '@/integrations/supabase/types';

type TaskRow = Database['public']['Tables']['tasks']['Row'];
type SubtaskRow = Database['public']['Tables']['subtasks']['Row'];
type TaskTagRow = Database['public']['Tables']['task_tags']['Row'];

function transformTaskFromDB(row: TaskRow, subtasks: SubtaskRow[]): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description || undefined,
    area: row.area || undefined,
    priority: row.priority || 'medium',
    status: row.status || 'todo',
    dueDate: row.due_date || undefined,
    estimatedPomodoros: row.estimated_pomodoros || undefined,
    completedPomodoros: row.completed_pomodoros || 0,
    subtasks: subtasks.map(s => ({
      id: s.id,
      title: s.title,
      completed: s.completed || false,
      completedAt: s.completed_at || undefined,
    })),
    tags: row.tags || undefined,
    recurring: row.recurring_frequency ? {
      frequency: row.recurring_frequency,
      interval: row.recurring_interval || 1,
      weekDays: row.recurring_week_days || undefined,
      endDate: row.recurring_end_date || undefined,
    } : undefined,
    reminderMinutes: row.reminder_minutes || undefined,
    reminderTime: row.reminder_time || undefined,
    lastReminded: row.last_reminded || undefined,
    archived: row.archived || false,
    archivedAt: row.archived_at || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    completedAt: row.completed_at || undefined,
    goalId: row.goal_id || undefined,
    milestoneId: row.milestone_id || undefined,
    deletedAt: row.deleted_at || undefined,
    position: row.position || undefined,
  };
}

function transformTaskToDB(task: Partial<Task>, userId: string) {
  return {
    id: task.id,
    user_id: userId,
    title: task.title,
    description: task.description || null,
    area: task.area || null,
    priority: task.priority || 'medium',
    status: task.status || 'todo',
    due_date: task.dueDate || null,
    estimated_pomodoros: task.estimatedPomodoros || null,
    completed_pomodoros: task.completedPomodoros || 0,
    tags: task.tags || null,
    recurring_frequency: task.recurring?.frequency || null,
    recurring_interval: task.recurring?.interval || null,
    recurring_week_days: task.recurring?.weekDays || null,
    recurring_end_date: task.recurring?.endDate || null,
    reminder_minutes: task.reminderMinutes || null,
    reminder_time: task.reminderTime || null,
    last_reminded: task.lastReminded || null,
    archived: task.archived || false,
    archived_at: task.archivedAt || null,
    completed_at: task.completedAt || null,
    goal_id: task.goalId || null,
    milestone_id: task.milestoneId || null,
    deleted_at: task.deletedAt || null,
    position: task.position || null,
  };
}

function transformTaskUpdatesToDB(updates: Partial<Task>): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  if ('title' in updates) data.title = updates.title;
  if ('description' in updates) data.description = updates.description || null;
  if ('area' in updates) data.area = updates.area || null;
  if ('priority' in updates) data.priority = updates.priority || 'medium';
  if ('status' in updates) data.status = updates.status || 'todo';
  if ('dueDate' in updates) data.due_date = updates.dueDate || null;
  if ('estimatedPomodoros' in updates) data.estimated_pomodoros = updates.estimatedPomodoros || null;
  if ('completedPomodoros' in updates) data.completed_pomodoros = updates.completedPomodoros || 0;
  if ('tags' in updates) data.tags = updates.tags || null;
  if ('recurring' in updates) {
    data.recurring_frequency = updates.recurring?.frequency || null;
    data.recurring_interval = updates.recurring?.interval || null;
    data.recurring_week_days = updates.recurring?.weekDays || null;
    data.recurring_end_date = updates.recurring?.endDate || null;
  }
  if ('reminderMinutes' in updates) data.reminder_minutes = updates.reminderMinutes || null;
  if ('reminderTime' in updates) data.reminder_time = updates.reminderTime || null;
  if ('lastReminded' in updates) data.last_reminded = updates.lastReminded || null;
  if ('archived' in updates) data.archived = updates.archived || false;
  if ('archivedAt' in updates) data.archived_at = updates.archivedAt || null;
  if ('completedAt' in updates) data.completed_at = updates.completedAt || null;
  if ('goalId' in updates) data.goal_id = updates.goalId || null;
  if ('milestoneId' in updates) data.milestone_id = updates.milestoneId || null;
  if ('deletedAt' in updates) data.deleted_at = updates.deletedAt || null;
  if ('position' in updates) data.position = updates.position || null;
  return data;
}

async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3, baseDelay = 1000): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      if (error?.status >= 400 && error?.status < 500) throw error;
      if (attempt === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt)));
    }
  }
  throw lastError;
}

async function loadSubtasksForTasks(taskIds: string[]): Promise<Record<string, SubtaskRow[]>> {
  if (taskIds.length === 0) return {};
  const BATCH_SIZE = 100;
  const subtasksByTask: Record<string, SubtaskRow[]> = {};

  if (taskIds.length > BATCH_SIZE) {
    const batches: string[][] = [];
    for (let i = 0; i < taskIds.length; i += BATCH_SIZE) batches.push(taskIds.slice(i, i + BATCH_SIZE));
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      try {
        const batchSubtasks = await retryWithBackoff(async () => {
          const { data, error } = await supabase
            .from('subtasks')
            .select('id,task_id,title,completed,completed_at')
            .in('task_id', batch);
          if (error) throw error;
          return data || [];
        });
        batchSubtasks.forEach(s => {
          if (!subtasksByTask[s.task_id]) subtasksByTask[s.task_id] = [];
          subtasksByTask[s.task_id].push(s);
        });
      } catch {}
    }
  } else {
    try {
      const subtasksData = await retryWithBackoff(async () => {
        const { data, error } = await supabase
          .from('subtasks')
          .select('id,task_id,title,completed,completed_at')
          .in('task_id', taskIds);
        if (error) throw error;
        return data || [];
      });
      subtasksData.forEach(s => {
        if (!subtasksByTask[s.task_id]) subtasksByTask[s.task_id] = [];
        subtasksByTask[s.task_id].push(s);
      });
    } catch {}
  }
  return subtasksByTask;
}

export function useTasksSync() {
  const { user } = useAuth();
  const { isOnline } = useOnlineStatus();

  const loadTasks = useCallback(async (): Promise<Task[]> => {
    if (!user) return [];
    try {
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(0, 999);
      if (tasksError) throw tasksError;
      if (!tasksData?.length) return [];
      const taskIds = tasksData.map(t => t.id);
      let subtasksByTask: Record<string, SubtaskRow[]> = {};
      try {
        subtasksByTask = await loadSubtasksForTasks(taskIds);
      } catch {}
      return tasksData.map(t => transformTaskFromDB(t, subtasksByTask[t.id] || []));
    } catch {
      return [];
    }
  }, [user]);

  const loadTaskTags = useCallback(async (): Promise<TaskTag[]> => {
    if (!user) return [];
    try {
      const { data, error } = await supabase
        .from('task_tags')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      return (data || []).map(t => ({ id: t.id, name: t.name, color: t.color }));
    } catch { return []; }
  }, [user]);

  const saveTask = useCallback(async (task: Task): Promise<boolean> => {
    if (!user) return false;
    const data = transformTaskToDB(task, user.id);
    if (!isOnline) {
      await addToSyncQueue('create', 'tasks', task.id, data);
      return true;
    }
    try {
      await ensureValidSession();
      const { error: taskError } = await supabase.from('tasks').upsert(data);
      if (taskError) throw taskError;
      if (task.subtasks?.length) {
        const subtasksData = task.subtasks.map(s => ({
          id: s.id, task_id: task.id, title: s.title,
          completed: s.completed || false, completed_at: s.completedAt || null,
        }));
        const { error: subtasksError } = await supabase.from('subtasks').upsert(subtasksData);
        if (subtasksError) throw subtasksError;
      }
      return true;
    } catch {
      await addToSyncQueue('create', 'tasks', task.id, data);
      return false;
    }
  }, [user, isOnline]);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>): Promise<boolean> => {
    if (!user) return false;
    const data = transformTaskUpdatesToDB(updates);
    if (!isOnline) {
      await addToSyncQueue('update', 'tasks', id, data);
      return true;
    }
    try {
      await ensureValidSession();
      const { error } = await supabase.from('tasks').update(data).eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      return true;
    } catch {
      await addToSyncQueue('update', 'tasks', id, data);
      return false;
    }
  }, [user, isOnline]);

  const deleteTask = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;
    if (!isOnline) {
      await addToSyncQueue('delete', 'tasks', id, {});
      return true;
    }
    try {
      await ensureValidSession();
      const { error } = await supabase.from('tasks').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      return true;
    } catch {
      await addToSyncQueue('delete', 'tasks', id, {});
      return false;
    }
  }, [user, isOnline]);

  const toggleSubtask = useCallback(async (subtaskId: string, completed: boolean): Promise<boolean> => {
    if (!user) return false;
    try {
      const { error } = await supabase.from('subtasks').update({
        completed, completed_at: completed ? new Date().toISOString() : null,
      }).eq('id', subtaskId);
      if (error) throw error;
      return true;
    } catch { return false; }
  }, [user]);

  const addSubtask = useCallback(async (taskId: string, subtask: Subtask): Promise<boolean> => {
    if (!user) return false;
    try {
      const { error } = await supabase.from('subtasks').insert({
        id: subtask.id, task_id: taskId, title: subtask.title,
        completed: subtask.completed || false, completed_at: subtask.completedAt || null,
      });
      if (error) throw error;
      return true;
    } catch { return false; }
  }, [user]);

  const deleteSubtask = useCallback(async (subtaskId: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const { error } = await supabase.from('subtasks').delete().eq('id', subtaskId);
      if (error) throw error;
      return true;
    } catch { return false; }
  }, [user]);

  const saveTaskTag = useCallback(async (tag: TaskTag): Promise<boolean> => {
    if (!user) return false;
    try {
      const { error } = await supabase.from('task_tags').upsert({
        id: tag.id, user_id: user.id, name: tag.name, color: tag.color,
      });
      if (error) throw error;
      return true;
    } catch { return false; }
  }, [user]);

  const deleteTaskTag = useCallback(async (tagId: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const { error } = await supabase.from('task_tags').delete().eq('id', tagId).eq('user_id', user.id);
      if (error) throw error;
      return true;
    } catch { return false; }
  }, [user]);

  return {
    loadTasks, loadTaskTags, saveTask, updateTask, deleteTask,
    toggleSubtask, addSubtask, deleteSubtask, saveTaskTag, deleteTaskTag,
  };
}
