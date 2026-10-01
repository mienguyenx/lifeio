import { useMemo } from 'react';
import { useLifeOSStore } from '@/stores/useLifeOSStore';

/** Thống kê dùng chung cho Review tuần/tháng/năm — cùng công thức với các trang cũ. */
export function usePeriodStats(dates: string[]) {
  const tasks = useLifeOSStore((s) => s.tasks);
  const habits = useLifeOSStore((s) => s.habits);
  const goals = useLifeOSStore((s) => s.goals);
  const journal = useLifeOSStore((s) => s.journalEntries);
  const sessions = useLifeOSStore((s) => s.pomodoroSessions);
  const settings = useLifeOSStore((s) => s.pomodoroSettings);
  return useMemo(() => {
    const set = new Set(dates);
    const inP = (iso?: string) => !!iso && set.has(iso.slice(0, 10));
    const activeHabits = habits.filter((h) => !h.archivedAt && !h.deletedAt);
    const habitChecks = habits.reduce((n, h) => n + h.completedDates.filter((d) => set.has(d)).length, 0);
    const activeChecks = activeHabits.reduce((n, h) => n + h.completedDates.filter((d) => set.has(d)).length, 0);
    const possible = activeHabits.length * dates.length;
    const journals = journal.filter((j) => inP(j.date));
    const poms = sessions.filter((s) => s.phase === 'work' && inP(s.completedAt));
    return {
      tasksCompleted: tasks.filter((t) => inP(t.completedAt)).length,
      tasksCreated: tasks.filter((t) => inP(t.createdAt)).length,
      habitChecks,
      activeHabits: activeHabits.length,
      habitRate: possible ? Math.round((activeChecks / possible) * 100) : 0,
      goalsCompleted: goals.filter((g) => inP(g.completedAt)).length,
      goalsCreated: goals.filter((g) => inP(g.createdAt)).length,
      activeGoals: goals.filter((g) => !g.deletedAt && !g.completedAt).length,
      journalCount: journals.length,
      avgMood: journals.length ? journals.reduce((n, j) => n + j.mood, 0) / journals.length : null,
      pomodoroCount: poms.length,
      pomodoroMinutes: poms.length * (settings.workDuration || 25),
    };
  }, [dates, tasks, habits, goals, journal, sessions, settings]);
}
export type PeriodStats = ReturnType<typeof usePeriodStats>;
