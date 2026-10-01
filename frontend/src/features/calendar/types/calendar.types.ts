import type { LifeArea } from '@/types/lifeos';

/** Nguồn dữ liệu của lịch — đúng 6 loại mà Calendar cũ đã tổng hợp từ store. */
export type CalendarItemType = 'task' | 'habit' | 'journal' | 'pomodoro' | 'review' | 'goal';
export type CalendarView = 'month' | 'week' | 'day' | 'agenda';

export interface CalendarItem {
  id: string;
  type: CalendarItemType;
  /** id gốc trong store (task.id, habit.id …) */
  refId: string;
  title: string;
  date: string; // yyyy-MM-dd (giờ địa phương)
  start?: string; // HH:mm — chỉ khi dữ liệu gốc có giờ
  end?: string; // HH:mm
  completed?: boolean;
  meta?: string;
  description?: string;
  area?: LifeArea;
  /** đường dẫn module gốc */
  href: string;
}

/** Dữ liệu form "Thêm sự kiện" — được lưu thành Task (dueDate + reminderTime) như trang Tasks. */
export interface EventDraft {
  kind: 'event' | 'todo';
  title: string;
  description: string;
  date: string;
  time: string;
  allDay: boolean;
  repeat: 'none' | 'daily' | 'weekly' | 'monthly';
  area?: LifeArea;
  priority: 'low' | 'medium' | 'high';
  reminderMinutes: number;
  goalId: string;
}
