import { useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useSyncedStore } from '@/hooks/useSyncedStore';
import type { CalendarItem, CalendarItemType, EventDraft } from '../types/calendar.types';
import { key, todayKey } from '../utils/calendar.utils';

const MOOD = ['😢', '😕', '😐', '🙂', '😊'];
const PRIO: Record<string, string> = { high: 'Ưu tiên cao', medium: 'Ưu tiên vừa', low: 'Ưu tiên thấp' };

/**
 * Gom dữ liệu thật trong store thành các mục lịch (giống CalendarPage cũ):
 * task theo hạn (giờ = reminderTime), task hoàn thành không có hạn, habit đã hoàn thành,
 * nhật ký, phiên Focus (giờ thực), weekly/monthly review, hạn mục tiêu.
 */
export function useCalendar(startKey: string, endKey: string) {
  const tasks = useLifeOSStore((s) => s.tasks);
  const habits = useLifeOSStore((s) => s.habits);
  const journalEntries = useLifeOSStore((s) => s.journalEntries);
  const pomodoroSessions = useLifeOSStore((s) => s.pomodoroSessions);
  const weeklyReviews = useLifeOSStore((s) => s.weeklyReviews);
  const monthlyReviews = useLifeOSStore((s) => s.monthlyReviews);
  const goals = useLifeOSStore((s) => s.goals);
  const workDuration = useLifeOSStore((s) => s.pomodoroSettings?.workDuration ?? 25);
  const synced = useSyncedStore();

  const inRange = useCallback((d?: string) => !!d && d >= startKey && d <= endKey, [startKey, endKey]);

  const items = useMemo(() => {
    const r: CalendarItem[] = [];
    for (const t of tasks) {
      if (t.deletedAt || t.archived) continue;
      const due = t.dueDate?.slice(0, 10);
      if (due && inRange(due)) {
        const est = (t.estimatedPomodoros || 0) * workDuration;
        r.push({
          id: `task-${t.id}`, type: 'task', refId: t.id, title: t.title, date: due,
          start: t.reminderTime || undefined,
          end: t.reminderTime && est ? addMin(t.reminderTime, est) : undefined,
          completed: t.status === 'done', meta: PRIO[t.priority], description: t.description, area: t.area, href: '/tasks',
        });
      } else if (!due && t.completedAt) {
        const d = key(new Date(t.completedAt));
        if (inRange(d)) r.push({ id: `task-done-${t.id}`, type: 'task', refId: t.id, title: t.title, date: d, completed: true, meta: 'Đã hoàn thành', area: t.area, href: '/tasks' });
      }
    }
    for (const h of habits) {
      if (h.deletedAt || h.archivedAt) continue;
      for (const d of h.completedDates) if (inRange(d)) r.push({
        id: `habit-${h.id}-${d}`, type: 'habit', refId: h.id, title: h.name, date: d, start: h.reminderTime || undefined,
        completed: true, meta: `🔥 Streak ${h.streak}`, area: h.area, href: '/habits',
      });
    }
    for (const j of journalEntries) if (inRange(j.date)) r.push({
      id: `journal-${j.id}`, type: 'journal', refId: j.id, title: j.content?.split('\n')[0]?.slice(0, 60) || 'Nhật ký', date: j.date,
      meta: j.mood ? `Tâm trạng ${MOOD[j.mood - 1]}` : undefined, description: j.content, href: '/journal',
    });
    for (const s of pomodoroSessions) {
      if (s.phase !== 'work') continue;
      const endAt = new Date(s.completedAt); const d = key(endAt);
      if (!inRange(d)) continue;
      const dur = s.duration || 25; const startAt = new Date(endAt.getTime() - dur * 60000);
      const task = s.taskId ? tasks.find((t) => t.id === s.taskId) : undefined;
      r.push({
        id: `pomo-${s.id}`, type: 'pomodoro', refId: s.id, title: task ? `Focus · ${task.title}` : `Focus ${dur} phút`, date: d,
        start: key(startAt) === d ? format(startAt, 'HH:mm') : '00:00', end: format(endAt, 'HH:mm'), completed: true, meta: `${dur} phút`, href: '/',
      });
    }
    for (const w of weeklyReviews) if (inRange(w.weekStart)) r.push({
      id: `weekly-${w.id}`, type: 'review', refId: w.id, title: 'Review tuần', date: w.weekStart, meta: `⭐ ${w.overallRating}/5`, completed: true, href: '/weekly-review',
    });
    for (const m of monthlyReviews) { const d = `${m.month}-01`; if (inRange(d)) r.push({
      id: `monthly-${m.id}`, type: 'review', refId: m.id, title: `Review tháng ${m.month.slice(5)}/${m.month.slice(0, 4)}`, date: d, meta: `⭐ ${m.overallRating}/5`, completed: true, href: '/monthly-review',
    }); }
    for (const g of goals) { const d = g.targetDate?.slice(0, 10); if (!g.deletedAt && d && inRange(d)) r.push({
      id: `goal-${g.id}`, type: 'goal', refId: g.id, title: `Hạn: ${g.title}`, date: d, completed: g.progress >= 100, meta: `Tiến độ ${g.progress}%`, description: g.description, area: g.area, href: '/goals',
    }); }
    return r;
  }, [tasks, habits, journalEntries, pomodoroSessions, weeklyReviews, monthlyReviews, goals, inRange, workDuration]);

  const today = todayKey();
  const focusToday = useMemo(() => pomodoroSessions
    .filter((s) => s.phase === 'work' && key(new Date(s.completedAt)) === today)
    .reduce((a, s) => ({ minutes: a.minutes + (s.duration || 0), sessions: a.sessions + 1 }), { minutes: 0, sessions: 0 }), [pomodoroSessions, today]);

  /** Tạo "sự kiện" = Task có hạn (và giờ) — cùng trường dữ liệu với module Công việc. */
  const createEvent = useCallback(async (d: EventDraft) => {
    const title = d.title.trim();
    if (!title) return;
    const timed = d.kind === 'event' && !d.allDay && d.time;
    await synced.addTask({
      title,
      description: d.description.trim() || undefined,
      priority: d.priority,
      area: d.area,
      status: 'todo',
      dueDate: d.date || undefined,
      reminderTime: timed ? d.time : undefined,
      reminderMinutes: timed && d.reminderMinutes ? d.reminderMinutes : undefined,
      recurring: d.repeat !== 'none' ? { frequency: d.repeat, interval: 1 } : undefined,
      goalId: d.goalId || undefined,
    } as Parameters<typeof synced.addTask>[0]);
    toast.success(d.kind === 'event' ? 'Đã thêm sự kiện vào lịch' : 'Đã thêm việc cần làm', { description: title });
  }, [synced]);

  /** Kéo-thả / đổi lịch: chỉ áp dụng cho Task. */
  const moveTask = useCallback((taskId: string, date: string, time?: string) => {
    synced.updateTask(taskId, time !== undefined ? { dueDate: date, reminderTime: time || undefined } : { dueDate: date });
  }, [synced]);

  const countBy = useMemo(() => {
    const c = {} as Record<CalendarItemType, number>;
    items.forEach((i) => (c[i.type] = (c[i.type] || 0) + 1));
    return c;
  }, [items]);

  return { items, countBy, goals, focusToday, createEvent, moveTask };
}

function addMin(hm: string, m: number) {
  const [h, mm] = hm.split(':').map(Number); const t = h * 60 + mm + m;
  return `${String(Math.min(23, Math.floor(t / 60))).padStart(2, '0')}:${String(t >= 24 * 60 ? 59 : t % 60).padStart(2, '0')}`;
}
