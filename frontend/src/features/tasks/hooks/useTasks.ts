import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useSyncedStore } from '@/hooks/useSyncedStore';
import type { LifeArea } from '@/types/lifeos';
import type { Task, TaskCounts, TaskDraft, TaskPriority, TaskStatus, TaskTab } from '../types/task.types';
import { isDone, isDueToday, isOverdue, isUpcoming, matchesTab, sortTasks } from '../utils/task.utils';

export interface TaskQuery {
  tab: TaskTab;
  search?: string;
  area?: LifeArea | 'all';
  priority?: TaskPriority | 'all';
}

/** Single source for the Tasks module: data, derived counts and synced actions. */
export function useTasks(query?: TaskQuery) {
  const allTasks = useLifeOSStore((s) => s.tasks);
  const synced = useSyncedStore();

  const tasks = useMemo(() => allTasks.filter((t) => !t.deletedAt && !t.archived), [allTasks]);

  const counts: TaskCounts = useMemo(() => {
    const dueToday = tasks.filter(isDueToday);
    const doneToday = dueToday.filter(isDone).length;
    return {
      all: tasks.filter((t) => !isDone(t)).length,
      today: dueToday.filter((t) => !isDone(t)).length,
      upcoming: tasks.filter(isUpcoming).length,
      overdue: tasks.filter(isOverdue).length,
      completed: tasks.filter(isDone).length,
      highPriority: tasks.filter((t) => !isDone(t) && t.priority === 'high').length,
      completionRate: dueToday.length ? Math.round((doneToday / dueToday.length) * 100) : 0,
    };
  }, [tasks]);

  const filtered = useMemo(() => {
    if (!query) return sortTasks(tasks);
    const q = query.search?.trim().toLowerCase();
    return sortTasks(
      tasks.filter((t) => {
        if (!matchesTab(t, query.tab)) return false;
        if (query.area && query.area !== 'all' && t.area !== query.area) return false;
        if (query.priority && query.priority !== 'all' && t.priority !== query.priority) return false;
        if (q && !`${t.title} ${t.description ?? ''}`.toLowerCase().includes(q)) return false;
        return true;
      }),
    );
  }, [tasks, query]);

  const createTask = useCallback(
    async (d: TaskDraft) => {
      const title = d.title.trim();
      if (!title) return;
      await synced.addTask({
        title,
        description: d.description?.trim() || undefined,
        priority: d.priority,
        area: d.area,
        status: d.status ?? 'todo',
        dueDate: d.dueDate || undefined,
        reminderTime: d.time || undefined,
        recurring: d.repeat && d.repeat !== 'none' ? { frequency: d.repeat, interval: 1 } : undefined,
      });
      toast.success('Đã thêm công việc', { description: title });
    },
    [synced],
  );

  const setStatus = useCallback(
    (task: Task, status: TaskStatus) =>
      synced.updateTask(task.id, {
        status,
        completedAt: status === 'done' ? new Date().toISOString() : undefined,
      }),
    [synced],
  );

  const toggleTaskCompletion = useCallback(
    (task: Task) => {
      const next = isDone(task) ? 'todo' : 'done';
      setStatus(task, next);
      if (next === 'done') toast.success('Hoàn thành! 🎉', { description: task.title });
    },
    [setStatus],
  );

  const deleteTask = useCallback(
    (task: Task) => {
      synced.deleteTask(task.id);
      toast('Đã chuyển vào thùng rác', { description: task.title });
    },
    [synced],
  );

  return {
    tasks,
    filtered,
    counts,
    createTask,
    updateTask: synced.updateTask,
    setStatus,
    toggleTaskCompletion,
    deleteTask,
    addSubtask: synced.addSubtask,
    toggleSubtask: synced.toggleSubtask,
    deleteSubtask: synced.deleteSubtask,
  };
}
