import { useMemo } from 'react';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import type { Goal, Task, Habit } from '@/types/lifeos';

interface GoalProgressData {
  goal: Goal;
  linkedTasks: Task[];
  linkedHabits: Habit[];
  completedTasks: number;
  totalTasks: number;
  habitProgress: number; // 0-100 based on completed days vs target
  milestoneProgress: number; // 0-100 from milestones
  calculatedProgress: number; // Combined progress
}

// Calculate habit progress based on completed days vs target
function calculateHabitProgress(habit: Habit): number {
  const targetDays = habit.targetDays || 30; // Default 30 days target
  const completedDays = habit.completedDates.length;
  return Math.min(100, Math.round((completedDays / targetDays) * 100));
}

// Calculate combined goal progress from milestones, tasks, and habits
export function calculateGoalProgress(
  goal: Goal,
  linkedTasks: Task[],
  linkedHabits: Habit[]
): number {
  const weights = {
    milestones: 0.4, // 40% weight
    tasks: 0.35, // 35% weight
    habits: 0.25, // 25% weight
  };

  // Milestone progress (from goal's own milestones)
  const milestoneProgress = goal.milestones.length > 0
    ? (goal.milestones.filter(m => m.completed).length / goal.milestones.length) * 100
    : 0;

  // Task progress
  const completedTasks = linkedTasks.filter(t => t.status === 'done').length;
  const taskProgress = linkedTasks.length > 0
    ? (completedTasks / linkedTasks.length) * 100
    : 0;

  // Habit progress (average of all linked habits' progress)
  const habitProgressValues = linkedHabits.map(calculateHabitProgress);
  const habitProgress = habitProgressValues.length > 0
    ? habitProgressValues.reduce((a, b) => a + b, 0) / habitProgressValues.length
    : 0;

  // Calculate weighted progress
  // If no items in a category, redistribute weight
  let totalWeight = 0;
  let weightedSum = 0;

  if (goal.milestones.length > 0) {
    weightedSum += milestoneProgress * weights.milestones;
    totalWeight += weights.milestones;
  }
  if (linkedTasks.length > 0) {
    weightedSum += taskProgress * weights.tasks;
    totalWeight += weights.tasks;
  }
  if (linkedHabits.length > 0) {
    weightedSum += habitProgress * weights.habits;
    totalWeight += weights.habits;
  }

  // If nothing linked, return 0
  if (totalWeight === 0) return 0;

  return Math.round(weightedSum / totalWeight);
}

// Hook to get progress data for a single goal
export function useGoalProgress(goalId: string): GoalProgressData | null {
  const goals = useLifeOSStore((s) => s.goals);
  const tasks = useLifeOSStore((s) => s.tasks);
  const habits = useLifeOSStore((s) => s.habits);

  return useMemo(() => {
    const goal = goals.find(g => g.id === goalId && !g.deletedAt);
    if (!goal) return null;

    const linkedTasks = tasks.filter(t => t.goalId === goalId && !t.deletedAt);
    const linkedHabits = habits.filter(h => h.goalId === goalId && !h.deletedAt);

    const completedTasks = linkedTasks.filter(t => t.status === 'done').length;
    const totalTasks = linkedTasks.length;

    const habitProgressValues = linkedHabits.map(calculateHabitProgress);
    const habitProgress = habitProgressValues.length > 0
      ? Math.round(habitProgressValues.reduce((a, b) => a + b, 0) / habitProgressValues.length)
      : 0;

    const milestoneProgress = goal.milestones.length > 0
      ? Math.round((goal.milestones.filter(m => m.completed).length / goal.milestones.length) * 100)
      : 0;

    const calculatedProgress = calculateGoalProgress(goal, linkedTasks, linkedHabits);

    return {
      goal,
      linkedTasks,
      linkedHabits,
      completedTasks,
      totalTasks,
      habitProgress,
      milestoneProgress,
      calculatedProgress,
    };
  }, [goals, tasks, habits, goalId]);
}

// Hook to get all goals with their progress data
export function useAllGoalsProgress(): GoalProgressData[] {
  const goals = useLifeOSStore((s) => s.goals);
  const tasks = useLifeOSStore((s) => s.tasks);
  const habits = useLifeOSStore((s) => s.habits);

  return useMemo(() => {
    return goals
      .filter(g => !g.deletedAt)
      .map(goal => {
        const linkedTasks = tasks.filter(t => t.goalId === goal.id && !t.deletedAt);
        const linkedHabits = habits.filter(h => h.goalId === goal.id && !h.deletedAt);

        const completedTasks = linkedTasks.filter(t => t.status === 'done').length;
        const totalTasks = linkedTasks.length;

        const habitProgressValues = linkedHabits.map(calculateHabitProgress);
        const habitProgress = habitProgressValues.length > 0
          ? Math.round(habitProgressValues.reduce((a, b) => a + b, 0) / habitProgressValues.length)
          : 0;

        const milestoneProgress = goal.milestones.length > 0
          ? Math.round((goal.milestones.filter(m => m.completed).length / goal.milestones.length) * 100)
          : 0;

        const calculatedProgress = calculateGoalProgress(goal, linkedTasks, linkedHabits);

        return {
          goal,
          linkedTasks,
          linkedHabits,
          completedTasks,
          totalTasks,
          habitProgress,
          milestoneProgress,
          calculatedProgress,
        };
      });
  }, [goals, tasks, habits]);
}
