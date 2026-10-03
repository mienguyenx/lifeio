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
  /** Việc con theo việc cha (1 cấp). */
  const childrenOf = useMemo(() => {
    const m = new Map<string, Task[]>();
    for (const t of tasks) if (t.parentId) m.set(t.parentId, [...(m.get(t.parentId) ?? []), t]);
    for (const list of m.values()) list.sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || a.createdAt.localeCompare(b.createdAt));
    return m;
  }, [tasks]);
  const byId = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);

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
    const base = tasks.filter((t) => {
        if (!matchesTab(t, query.tab)) return false;
        if (query.area && query.area !== 'all' && t.area !== query.area) return false;
        if (query.priority && query.priority !== 'all' && t.priority !== query.priority) return false;
        if (q && !`${t.title} ${t.description ?? ''}`.toLowerCase().includes(q)) return false;
        return true;
      });
    // Việc con không có hạn riêng “đi theo” việc cha: hiện dưới việc cha nếu việc cha đang hiển thị.
    const shown = new Set(base.map((t) => t.id));
    const extra = tasks.filter((t) => t.parentId && !shown.has(t.id) && shown.has(t.parentId) && !t.dueDate && (query.tab === 'completed' ? isDone(t) : !isDone(t)));
    return sortTasks([...base, ...extra]);
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
        parentId: d.parentId,
        subtasks: (d.subtasks ?? []).map((t, i) => t.trim()).filter(Boolean).map((title, i) => ({ id: crypto.randomUUID(), title, completed: false, position: i })),
      });
      if (!d.parentId) toast.success('Đã thêm công việc', { description: title });
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
      if (next !== 'done') return;
      const openKids = (childrenOf.get(task.id) ?? []).filter((c) => !isDone(c));
      const parent = task.parentId ? byId.get(task.parentId) : undefined;
      if (openKids.length) {
        toast.success('Hoàn thành! 🎉', {
          description: `Còn ${openKids.length} việc con chưa xong`,
          action: { label: 'Xong tất cả', onClick: () => openKids.forEach((c) => setStatus(c, 'done')) },
        });
      } else if (parent && !isDone(parent) && (childrenOf.get(parent.id) ?? []).every((c) => c.id === task.id || isDone(c))) {
        toast.success('Đã xong mọi việc con 🎉', { description: parent.title, action: { label: 'Hoàn thành việc cha', onClick: () => setStatus(parent, 'done') } });
      } else {
        toast.success('Hoàn thành! 🎉', { description: task.title });
      }
    },
    [setStatus, childrenOf, byId],
  );

  const deleteTask = useCallback(
    (task: Task) => {
      const kids = childrenOf.get(task.id) ?? [];
      synced.deleteTask(task.id);
      kids.forEach((c) => synced.deleteTask(c.id));
      toast('Đã chuyển vào thùng rác', { description: kids.length ? `${task.title} và ${kids.length} việc con` : task.title });
    },
    [synced, childrenOf],
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
    addSubtasks: synced.addSubtasks,
    childrenOf,
    byId,
    /** Tạo nhiều việc con (kế thừa lĩnh vực, ưu tiên của việc cha). */
    addChildren: async (parent: Task, titles: string[]) => {
      const base = childrenOf.get(parent.id)?.length ?? 0;
      for (const [i, title] of titles.entries()) {
        await synced.addTask({ title, priority: parent.priority, area: parent.area, status: 'todo', parentId: parent.id, position: base + i });
      }
      if (titles.length > 1) toast.success(`Đã thêm ${titles.length} việc con`);
    },
    detachChild: (child: Task) => { synced.updateTask(child.id, { parentId: undefined }); toast('Đã tách thành việc độc lập', { description: child.title }); },
    /** Chuyển một mục checklist thành việc con. */
    promoteChecklistItem: async (task: Task, subId: string) => {
      const item = task.subtasks?.find((s) => s.id === subId); if (!item) return;
      await synced.addTask({ title: item.title, priority: task.priority, area: task.area, status: item.completed ? 'done' : 'todo', completedAt: item.completed ? new Date().toISOString() : undefined, parentId: task.id, position: childrenOf.get(task.id)?.length ?? 0 });
      synced.deleteSubtask(task.id, subId);
      toast.success('Đã chuyển thành việc con', { description: item.title });
    },
    updateSubtask: synced.updateSubtask,
    reorderSubtasks: synced.reorderSubtasks,
    /** Tick một mục con; nếu đó là mục cuối cùng → gợi ý hoàn thành luôn công việc. */
    toggleSubtaskSmart: (task: Task, subId: string) => {
      const sub = task.subtasks?.find((s) => s.id === subId);
      synced.toggleSubtask(task.id, subId);
      const willAllDone = !!sub && !sub.completed && (task.subtasks ?? []).every((s) => s.id === subId || s.completed);
      if (willAllDone && !isDone(task)) {
        toast.success('Đã xong mọi mục con 🎉', {
          description: task.title,
          action: { label: 'Hoàn thành việc', onClick: () => setStatus(task, 'done') },
        });
      }
    },
  };
}
