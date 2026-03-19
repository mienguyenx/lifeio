import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useMemo } from 'react';
import { differenceInDays, parseISO } from 'date-fns';
import { getTodayDateString, getTodayStart, isToday, isBeforeToday, parseDateInTimezone } from '@/utils/dateUtils';

export interface GoalsBadge {
  overdue: number;
  approaching: number;
  total: number;
  totalGoals: number;
  completedGoals: number;
  avgProgress: number;
}

export interface TasksBadge {
  overdue: number;
  high: number;
  medium: number;
  low: number;
  total: number;
  completedToday: number;
  totalTasks: number;
}

export interface HabitsBadge {
  daily: number;
  weekly: number;
  total: number;
  completedToday: number;
  totalActive: number;
  totalStreak: number;
  topStreak: number;
}

export function useNotificationBadges() {
  const tasks = useLifeOSStore((s) => s.tasks);
  const habits = useLifeOSStore((s) => s.habits);
  const goals = useLifeOSStore((s) => s.goals);
  
  // Use timezone-aware date utilities (GMT+7)
  const today = useMemo(() => getTodayDateString(), []);
  const todayDate = useMemo(() => getTodayStart(), []);

  return useMemo(() => {
    // Tasks stats - exclude deleted items
    const activeTasks = tasks.filter(t => !t.deletedAt);
    const incompleteTasks = activeTasks.filter(t => t.status !== 'done');
    const overdueTasks = incompleteTasks.filter(t => {
      if (!t.dueDate) return false;
      // Use timezone-aware comparison
      return isBeforeToday(t.dueDate);
    });
    const completedTodayTasks = activeTasks.filter(t => 
      t.status === 'done' && t.completedAt?.startsWith(today)
    ).length;
    
    const tasksBadge: TasksBadge = {
      overdue: overdueTasks.length,
      high: incompleteTasks.filter(t => t.priority === 'high').length,
      medium: incompleteTasks.filter(t => t.priority === 'medium').length,
      low: incompleteTasks.filter(t => t.priority === 'low').length,
      total: incompleteTasks.length,
      completedToday: completedTodayTasks,
      totalTasks: activeTasks.length,
    };

    // Habits stats - exclude deleted and archived items
    const activeHabits = habits.filter(h => !h.archivedAt && !h.deletedAt);
    const completedHabitsToday = activeHabits.filter(h => {
      const target = h.targetPerDay || 1;
      const todayCompletion = h.completions?.find(c => c.date === today);
      const todayCount = todayCompletion?.count || (h.completedDates.includes(today) ? 1 : 0);
      return todayCount >= target;
    });
    const uncheckedHabits = activeHabits.filter(h => {
      const target = h.targetPerDay || 1;
      const todayCompletion = h.completions?.find(c => c.date === today);
      const todayCount = todayCompletion?.count || (h.completedDates.includes(today) ? 1 : 0);
      return todayCount < target;
    });
    const totalStreak = activeHabits.reduce((sum, h) => sum + h.streak, 0);
    const topStreak = activeHabits.length > 0 ? Math.max(...activeHabits.map(h => h.streak)) : 0;

    const habitsBadge: HabitsBadge = {
      daily: uncheckedHabits.filter(h => h.frequency === 'daily').length,
      weekly: uncheckedHabits.filter(h => h.frequency === 'weekly').length,
      total: uncheckedHabits.length,
      completedToday: completedHabitsToday.length,
      totalActive: activeHabits.length,
      totalStreak,
      topStreak,
    };

    // Goals stats - exclude deleted items
    const activeGoals = goals.filter(g => !g.completedAt && !g.deletedAt);
    const completedGoals = goals.filter(g => g.completedAt && !g.deletedAt).length;
    const avgProgress = activeGoals.length > 0 
      ? Math.round(activeGoals.reduce((sum, g) => sum + g.progress, 0) / activeGoals.length)
      : 0;
    
    let overdueGoals = 0;
    let approachingGoals = 0;
    activeGoals.forEach(g => {
      if (!g.targetDate) return;
      const targetDate = parseISO(g.targetDate);
      const daysUntilDeadline = differenceInDays(targetDate, todayDate);
      
      if (daysUntilDeadline < 0) {
        overdueGoals++;
      } else if (daysUntilDeadline <= 7) {
        approachingGoals++;
      }
    });

    return {
      tasks: tasksBadge,
      habits: habitsBadge,
      goals: {
        overdue: overdueGoals,
        approaching: approachingGoals,
        total: overdueGoals + approachingGoals,
        totalGoals: goals.filter(g => !g.deletedAt).length,
        completedGoals,
        avgProgress,
      } as GoalsBadge,
    };
  }, [tasks, habits, goals, today, todayDate]);
}
