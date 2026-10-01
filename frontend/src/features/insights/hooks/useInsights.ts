import { latestWheel, previousWheel } from '@/lib/lifeWheel';
import { useMemo } from 'react';
import { format, subDays } from 'date-fns';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { LIFE_AREAS, type LifeArea } from '@/types/lifeos';
import { isDoneOn } from '@/features/habits/utils/habit.utils';

export type Metric = 'tasks' | 'habits' | 'focus' | 'mood' | 'journal' | 'goals';
export interface DayPoint { d: string; tasks: number; habits: number; habitsPct: number; focus: number; mood: number | null; journal: number; goals: number }

const key = (dt: Date) => format(dt, 'yyyy-MM-dd');

/** Tổng hợp số liệu theo ngày từ dữ liệu đã có trong store (tasks, habits, pomodoro, journal, goals). */
export function useInsights() {
  const tasks = useLifeOSStore((s) => s.tasks);
  const habits = useLifeOSStore((s) => s.habits);
  const pomodoro = useLifeOSStore((s) => s.pomodoroSessions);
  const journal = useLifeOSStore((s) => s.journalEntries);
  const goals = useLifeOSStore((s) => s.goals);
  const wheel = useLifeOSStore((s) => s.lifeWheelScores);
  const user = useLifeOSStore((s) => s.user);

  return useMemo(() => {
    const liveTasks = tasks.filter((t) => !t.deletedAt);
    const liveHabits = habits.filter((h) => !h.archivedAt && !h.deletedAt);
    const liveGoals = goals.filter((g) => !g.deletedAt);
    const work = pomodoro.filter((p) => p.phase === 'work');

    const days: DayPoint[] = Array.from({ length: 90 }, (_, i) => {
      const d = key(subDays(new Date(), 89 - i));
      const hDone = liveHabits.filter((h) => isDoneOn(h, d)).length;
      const j = journal.filter((e) => e.date === d);
      return {
        d,
        tasks: liveTasks.filter((t) => t.completedAt && key(new Date(t.completedAt)) === d).length,
        habits: hDone,
        habitsPct: liveHabits.length ? Math.round((hDone / liveHabits.length) * 100) : 0,
        focus: work.filter((p) => key(new Date(p.completedAt)) === d).reduce((a, p) => a + (p.duration || 25), 0),
        mood: j.length ? +(j.reduce((a, e) => a + e.mood, 0) / j.length).toFixed(1) : null,
        journal: j.length,
        goals: liveGoals.reduce((a, g) => a + (g.progressHistory || []).filter((h) => h.date.slice(0, 10) === d).length, 0) + liveGoals.filter((g) => g.completedAt && key(new Date(g.completedAt)) === d).length,
      };
    });
    const today = days[days.length - 1];
    const week = days.slice(-7); const prevWeek = days.slice(-14, -7);
    const sum = (arr: DayPoint[], k: 'tasks' | 'habits' | 'focus' | 'journal') => arr.reduce((a, p) => a + p[k], 0);
    const pct = (a: number, b: number) => (b ? Math.round(((a - b) / b) * 100) : a ? 100 : 0);

    const todayTasks = liveTasks.filter((t) => (t.dueDate && t.dueDate.slice(0, 10) === today.d) || (t.completedAt && key(new Date(t.completedAt)) === today.d));
    const activeGoals = liveGoals.filter((g) => !g.completedAt);
    const hours = Array.from({ length: 24 }, (_, h) => ({ h, min: 0 }));
    work.filter((p) => new Date(p.completedAt) >= subDays(new Date(), 30)).forEach((p) => { hours[new Date(p.completedAt).getHours()].min += p.duration || 25; });

    const latest = latestWheel(wheel);
    const prev = previousWheel(wheel);
    const scores = (latest?.scores || Object.fromEntries(LIFE_AREAS.map((a) => [a.id, 5]))) as Record<LifeArea, number>;
    const ranked = LIFE_AREAS.map((a) => ({ ...a, v: scores[a.id] ?? 5, delta: prev ? (scores[a.id] ?? 5) - (prev.scores[a.id] ?? 5) : 0 })).sort((a, b) => b.v - a.v);

    return {
      user, days, week,
      tiles: {
        tasks: { done: todayTasks.filter((t) => t.status === 'done' || t.completedAt).length, total: todayTasks.length, delta: pct(sum(week, 'tasks'), sum(prevWeek, 'tasks')) },
        habits: { done: today.habits, total: liveHabits.length, delta: pct(sum(week, 'habits'), sum(prevWeek, 'habits')) },
        goals: { done: liveGoals.filter((g) => g.completedAt).length, total: liveGoals.length, active: activeGoals.length, avg: activeGoals.length ? Math.round(activeGoals.reduce((a, g) => a + g.progress, 0) / activeGoals.length) : 0 },
        journal: { week: sum(week, 'journal'), delta: pct(sum(week, 'journal'), sum(prevWeek, 'journal')) },
      },
      hours, hasWheel: !!latest, wheelDate: latest?.date, scores, ranked,
      maxHabits: liveHabits.length,
    };
  }, [tasks, habits, pomodoro, journal, goals, wheel, user]);
}
export type InsightsData = ReturnType<typeof useInsights>;
