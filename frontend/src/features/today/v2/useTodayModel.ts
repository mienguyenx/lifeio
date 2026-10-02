import { useMemo } from 'react';
import { parseISO, startOfWeek, endOfWeek, isWithinInterval, format } from 'date-fns';
import { getTodayDateString, getTodayStart } from '@/utils/dateUtils';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useSyncedStore } from '@/hooks/useSyncedStore';
import { usePomodoroStore } from '@/stores/usePomodoroStore';
import { useHealth } from '@/features/health/hooks/useHealth';
import { metricOf, valueOn } from '@/features/health/utils/health.utils';
import type { Habit, Task } from '@/types/lifeos';

const PRI = { high: 0, medium: 1, low: 2 } as const;

/** Dữ liệu + hành động dùng chung cho các phương án Today mới (tách từ TodayPage hiện tại). */
export function useTodayModel() {
  const health = useHealth();
  const user = useLifeOSStore((s) => s.user);
  const habits = useLifeOSStore((s) => s.habits);
  const tasks = useLifeOSStore((s) => s.tasks);
  const pomodoroSessions = useLifeOSStore((s) => s.pomodoroSessions);
  const dailyIntentions = useLifeOSStore((s) => s.dailyIntentions);
  const weeklyReviews = useLifeOSStore((s) => s.weeklyReviews);
  const userPreferences = useLifeOSStore((s) => s.userPreferences);
  const startPomodoro = usePomodoroStore((s) => s.start);
  const isPomodoroRunning = usePomodoroStore((s) => s.isRunning);
  const synced = useSyncedStore();

  const todayStr = getTodayDateString();
  const today = getTodayStart();
  const hour = new Date().getHours();

  const m = useMemo(() => {
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }), weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const activeHabits = habits.filter((h) => !h.archivedAt && !h.deletedAt);
    const todayHabits = activeHabits.filter((h) => h.frequency === 'daily' || h.customDays?.includes(today.getDay()))
      .sort((a, b) => (a.reminderTime || '99').localeCompare(b.reminderTime || '99'));
    const habitDone = (h: Habit) => {
      const target = h.targetPerDay || 1;
      const count = h.completions?.find((c) => c.date === todayStr)?.count || (h.completedDates.includes(todayStr) ? 1 : 0);
      return count >= target;
    };
    const doneHabits = todayHabits.filter(habitDone);
    const activeTasks = tasks.filter((t) => !t.archived && !t.deletedAt);
    const byPri = (a: Task, b: Task) => PRI[a.priority] - PRI[b.priority];
    const todayTasks = activeTasks.filter((t) => t.status !== 'done' && t.dueDate === todayStr).sort(byPri);
    const overdueTasks = activeTasks.filter((t) => t.status !== 'done' && t.dueDate && t.dueDate < todayStr).sort(byPri);
    const doneTasksToday = activeTasks.filter((t) => t.status === 'done' && t.completedAt?.startsWith(todayStr));
    const pomos = pomodoroSessions.filter((s) => s.completedAt.startsWith(todayStr) && s.phase === 'work');
    const total = todayHabits.length + todayTasks.length + overdueTasks.length + doneTasksToday.length;
    const done = doneHabits.length + doneTasksToday.length;
    const weekTasks = activeTasks.filter((t) => t.completedAt && isWithinInterval(parseISO(t.completedAt), { start: weekStart, end: weekEnd })).length;
    const weekHabits = activeHabits.reduce((n, h) => n + h.completedDates.filter((d) => isWithinInterval(parseISO(d), { start: weekStart, end: weekEnd })).length, 0);
    return {
      todayHabits, doneHabits, habitDone, todayTasks, overdueTasks, doneTasksToday, pomos,
      focusMin: pomos.reduce((a, s) => a + (s.duration || 25), 0),
      dayProgress: total ? Math.round((done / total) * 100) : 0,
      openTasks: [...overdueTasks, ...todayTasks],
      bestStreak: Math.max(0, ...activeHabits.map((h) => h.streak)),
      weekTasks, weekHabits,
      weekReviewed: !!weeklyReviews.find((r) => r.weekStart === format(weekStart, 'yyyy-MM-dd')),
      isNewUser: activeHabits.length === 0 && activeTasks.length === 0,
    };
  }, [habits, tasks, pomodoroSessions, weeklyReviews, todayStr]); // eslint-disable-line react-hooks/exhaustive-deps

  const waterM = metricOf('water'), sleepM = metricOf('sleep'), exM = metricOf('exercise');
  const intention = dailyIntentions.find((i) => i.date === todayStr);
  const rawName = (user?.name || '').trim();
  const firstName = rawName && rawName !== 'User' ? rawName.split(/\s+/).pop()! : '';
  const greeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  return {
    ...m, user, firstName, greeting, hour, today, todayStr, intention, userPreferences, isPomodoroRunning,
    health: {
      water: valueOn(health.logs, waterM, todayStr) ?? 0, waterTarget: waterM.target,
      sleep: valueOn(health.logs, sleepM, todayStr), exercise: valueOn(health.logs, exM, todayStr) ?? 0, exTarget: exM.target,
      addWater: () => health.add('water', 1, todayStr),
    },
    toggleHabit: (id: string) => synced.toggleHabitCompletion(id, todayStr),
    doneTask: (id: string) => synced.updateTask(id, { status: 'done', completedAt: new Date().toISOString() }),
    undoTask: (id: string) => synced.updateTask(id, { status: 'todo', completedAt: undefined }),
    focusTask: (id?: string) => { startPomodoro(id); if (id) synced.updateTask(id, { status: 'in_progress' }); },
    setIntention: (text: string) => synced.addDailyIntention(text),
    completeIntention: (id: string) => synced.completeDailyIntention(id),
    addTask: synced.addTask, addHabit: synced.addHabit, addJournalEntry: synced.addJournalEntry,
  };
}
export type TodayModel = ReturnType<typeof useTodayModel>;
