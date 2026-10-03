import type { LifeArea, Task } from '@/types/lifeos';

export type { Task };
export type TaskView = 'list' | 'board' | 'calendar';
export type TaskTab = 'all' | 'today' | 'upcoming' | 'overdue' | 'completed';
export type TaskPriority = Task['priority'];
export type TaskStatus = Task['status'];
export type BoardColumnId = 'todo' | 'in_progress' | 'done';

export interface TaskDraft {
  title: string;
  description?: string;
  priority: TaskPriority;
  area?: LifeArea;
  dueDate?: string; // yyyy-MM-dd
  time?: string; // HH:mm -> stored as reminderTime
  repeat?: 'none' | 'daily' | 'weekly' | 'monthly';
  status?: TaskStatus;
  subtasks?: string[];
  parentId?: string;
}

export interface TaskCounts {
  all: number;
  today: number;
  upcoming: number;
  overdue: number;
  completed: number;
  highPriority: number;
  completionRate: number; // 0-100, tasks due today
}
