import { useCallback } from 'react';
import { activeSupabase as supabase, ensureValidSession } from '@/integrations/supabase/externalClient';
import { useAuth } from '@/hooks/useAuth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useSyncQueue } from './useSyncQueue';
import type { Task, Subtask, TaskTag } from '@/types/lifeos';
import type { Database } from '@/integrations/supabase/types';

type TaskRow = Database['public']['Tables']['tasks']['Row'];
type SubtaskRow = Database['public']['Tables']['subtasks']['Row'];
type TaskTagRow = Database['public']['Tables']['task_tags']['Row'];

// Transform Supabase row to local Task type
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
    reminderTime: row.reminder_time || undefined, // Specific time (HH:mm) for reminder
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

// Transform local Task to Supabase format
// For full saves (create/upsert)
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
    reminder_minutes: task.reminderMinutes || null, // Minutes before deadline to remind
    reminder_time: task.reminderTime || null, // Specific time (HH:mm) to remind
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

// Transform partial Task updates to Supabase format
// Only includes fields that are explicitly set in the updates object
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

// Helper function to retry with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on 4xx errors (client errors)
      if (error?.status >= 400 && error?.status < 500) {
        throw error;
      }
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`[TasksSync] Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Helper function to load subtasks with batch processing and retry logic
async function loadSubtasksForTasks(taskIds: string[]): Promise<Record<string, SubtaskRow[]>> {
  if (taskIds.length === 0) {
    return {};
  }

  const BATCH_SIZE = 100;
  const subtasksByTask: Record<string, SubtaskRow[]> = {};

  // If we have many task IDs, split into batches to avoid URL length issues
  if (taskIds.length > BATCH_SIZE) {
    console.log(`[TasksSync] Loading subtasks for ${taskIds.length} tasks in batches of ${BATCH_SIZE}`);
    
    const batches: string[][] = [];
    for (let i = 0; i < taskIds.length; i += BATCH_SIZE) {
      batches.push(taskIds.slice(i, i + BATCH_SIZE));
    }

    // Load each batch with retry logic
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
        }, 3, 1000);

        // Group subtasks by task
        batchSubtasks.forEach(s => {
          if (!subtasksByTask[s.task_id]) {
            subtasksByTask[s.task_id] = [];
          }
          subtasksByTask[s.task_id].push(s);
        });

        console.log(`[TasksSync] Loaded subtasks batch ${batchIndex + 1}/${batches.length} (${batchSubtasks.length} subtasks)`);
      } catch (error) {
        console.warn(`[TasksSync] Failed to load subtasks for batch ${batchIndex + 1}/${batches.length}:`, error);
        // Continue with other batches even if one fails
      }
    }
  } else {
    // Single batch - use retry logic
    try {
      const subtasksData = await retryWithBackoff(async () => {
        const { data, error } = await supabase
          .from('subtasks')
          .select('id,task_id,title,completed,completed_at')
          .in('task_id', taskIds);

        if (error) throw error;
        return data || [];
      }, 3, 1000);

      // Group subtasks by task
      subtasksData.forEach(s => {
        if (!subtasksByTask[s.task_id]) {
          subtasksByTask[s.task_id] = [];
        }
        subtasksByTask[s.task_id].push(s);
      });

      console.log(`[TasksSync] Loaded ${subtasksData.length} subtasks for ${taskIds.length} tasks`);
    } catch (error) {
      console.warn('[TasksSync] Failed to load subtasks (non-critical, tasks will still load):', error);
      // Return empty object - tasks will load without subtasks
    }
  }

  return subtasksByTask;
}

export function useTasksSync() {
  const { user } = useAuth();
  const { isOnline } = useOnlineStatus();
  const { queueChange } = useSyncQueue();

  // Load tasks from Supabase
  const loadTasks = useCallback(async (): Promise<Task[]> => {
    if (!user) {
      console.log('[TasksSync] No user, skipping load');
      return [];
    }

    try {
      // Session check is done once in loadAllData() - no need to check here
      console.log('[TasksSync] Loading tasks for user:', user.id);
      
      // Fetch tasks with optimized select and pagination
      // Filter out deleted tasks at database level
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('id,title,description,area,priority,status,due_date,estimated_pomodoros,completed_pomodoros,tags,recurring_frequency,recurring_interval,recurring_week_days,recurring_end_date,reminder_minutes,reminder_time,last_reminded,archived,archived_at,created_at,completed_at,goal_id,milestone_id,deleted_at,position,user_id')
        .eq('user_id', user.id)
        .is('deleted_at', null) // Only load non-deleted tasks
        .order('created_at', { ascending: false })
        .range(0, 999); // Limit to 1000 tasks

      if (tasksError) {
        console.error('[TasksSync] Error loading tasks:', tasksError);
        throw tasksError;
      }

      const taskCount = tasksData?.length || 0;
      console.log(`[TasksSync] Loaded ${taskCount} tasks from database`);

      if (taskCount === 0) {
        return [];
      }

      // Fetch subtasks separately with error handling
      // If subtasks fail, we still return tasks (just without subtasks)
      const taskIds = tasksData.map(t => t.id);
      let subtasksByTask: Record<string, SubtaskRow[]> = {};

      try {
        subtasksByTask = await loadSubtasksForTasks(taskIds);
        const subtaskCount = Object.values(subtasksByTask).flat().length;
        console.log(`[TasksSync] Loaded ${subtaskCount} subtasks for ${Object.keys(subtasksByTask).length} tasks`);
      } catch (error) {
        // Non-critical error - log warning but continue
        console.warn('[TasksSync] Failed to load subtasks (tasks will still be returned):', error);
        subtasksByTask = {};
      }

      // Transform and return tasks
      const transformedTasks = tasksData.map(t => 
        transformTaskFromDB(t, subtasksByTask[t.id] || [])
      );

      console.log(`[TasksSync] Successfully loaded ${transformedTasks.length} tasks`);
      return transformedTasks;
    } catch (error) {
      console.error('[TasksSync] Critical error loading tasks:', error);
      return [];
    }
  }, [user]);

  // Load task tags from Supabase
  const loadTaskTags = useCallback(async (): Promise<TaskTag[]> => {
    if (!user) return [];

    try {
      // Session check is done once in loadAllData() - no need to check here
      
      const { data, error } = await supabase
        .from('task_tags')
        .select('id,name,color,user_id')
        .eq('user_id', user.id);

      if (error) throw error;

      return (data || []).map(t => ({
        id: t.id,
        name: t.name,
        color: t.color,
      }));
    } catch (error) {
      console.error('Error loading task tags:', error);
      return [];
    }
  }, [user]);

  // Save task to Supabase
  const saveTask = useCallback(async (task: Task): Promise<boolean> => {
    if (!user) return false;

    const data = transformTaskToDB(task, user.id);

    if (!isOnline) {
      await queueChange('create', 'tasks', task.id, data);
      return true;
    }

    try {
      await ensureValidSession();
      
      // Upsert task
      const { error: taskError } = await supabase
        .from('tasks')
        .upsert(data);

      if (taskError) throw taskError;

      // Handle subtasks
      if (task.subtasks && task.subtasks.length > 0) {
        const subtasksData = task.subtasks.map(s => ({
          id: s.id,
          task_id: task.id,
          title: s.title,
          completed: s.completed || false,
          completed_at: s.completedAt || null,
        }));

        const { error: subtasksError } = await supabase
          .from('subtasks')
          .upsert(subtasksData);

        if (subtasksError) throw subtasksError;
      }

      return true;
    } catch (error) {
      console.error('Error saving task:', error);
      await queueChange('create', 'tasks', task.id, data);
      return false;
    }
  }, [user, isOnline, queueChange]);

  // Update task in Supabase
  const updateTask = useCallback(async (id: string, updates: Partial<Task>): Promise<boolean> => {
    if (!user) return false;

    // Use transformTaskUpdatesToDB to only include fields that are being updated
    const data = transformTaskUpdatesToDB(updates);

    if (!isOnline) {
      await queueChange('update', 'tasks', id, data);
      return true;
    }

    try {
      await ensureValidSession();
      
      const { error } = await supabase
        .from('tasks')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating task:', error);
      await queueChange('update', 'tasks', id, data);
      return false;
    }
  }, [user, isOnline, queueChange]);

  // Delete task from Supabase
  const deleteTask = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;

    if (!isOnline) {
      await queueChange('delete', 'tasks', id, {});
      return true;
    }

    try {
      await ensureValidSession();
      
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      await queueChange('delete', 'tasks', id, {});
      return false;
    }
  }, [user, isOnline, queueChange]);

  // Toggle subtask
  const toggleSubtask = useCallback(async (subtaskId: string, completed: boolean): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('subtasks')
        .update({
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        })
        .eq('id', subtaskId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error toggling subtask:', error);
      return false;
    }
  }, [user]);

  // Add subtask
  const addSubtask = useCallback(async (taskId: string, subtask: Subtask): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('subtasks')
        .insert({
          id: subtask.id,
          task_id: taskId,
          title: subtask.title,
          completed: subtask.completed || false,
          completed_at: subtask.completedAt || null,
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error adding subtask:', error);
      return false;
    }
  }, [user]);

  // Delete subtask
  const deleteSubtask = useCallback(async (subtaskId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('subtasks')
        .delete()
        .eq('id', subtaskId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting subtask:', error);
      return false;
    }
  }, [user]);

  // Save task tag
  const saveTaskTag = useCallback(async (tag: TaskTag): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('task_tags')
        .upsert({
          id: tag.id,
          user_id: user.id,
          name: tag.name,
          color: tag.color,
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving task tag:', error);
      return false;
    }
  }, [user]);

  // Delete task tag
  const deleteTaskTag = useCallback(async (tagId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('task_tags')
        .delete()
        .eq('id', tagId)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting task tag:', error);
      return false;
    }
  }, [user]);

  return {
    loadTasks,
    loadTaskTags,
    saveTask,
    updateTask,
    deleteTask,
    toggleSubtask,
    addSubtask,
    deleteSubtask,
    saveTaskTag,
    deleteTaskTag,
  };
}
