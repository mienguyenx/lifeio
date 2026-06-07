import { useMemo } from 'react';
import { Target, Zap, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { getTodayDateString } from '@/utils/dateUtils';
import type { Task, Habit, Goal } from '@/types/lifeos';

interface FocusItem {
  type: 'task' | 'habit' | 'goal';
  label: string;
  priority?: string;
  done: boolean;
}

export function TodayFocusCard() {
  const tasks = useLifeOSStore((s) => s.tasks);
  const habits = useLifeOSStore((s) => s.habits);
  const goals = useLifeOSStore((s) => s.goals);
  const dailyIntentions = useLifeOSStore((s) => s.dailyIntentions);
  const todayStr = getTodayDateString();

  const focusData = useMemo(() => {
    const activeTasks = tasks.filter((t) => !t.archived && !t.deletedAt && t.status !== 'done');
    const todayTasks = activeTasks.filter((t) => t.dueDate === todayStr);
    const overdueTasks = activeTasks.filter((t) => t.dueDate && t.dueDate < todayStr);

    // Top 3 tasks: overdue high > today high > today medium > any today
    const sortedTasks = [...overdueTasks, ...todayTasks].sort((a, b) => {
      const prio = { high: 3, medium: 2, low: 1 };
      return (prio[b.priority] || 0) - (prio[a.priority] || 0);
    });
    const top3Tasks: FocusItem[] = sortedTasks.slice(0, 3).map((t) => ({
      type: 'task',
      label: t.title,
      priority: t.priority,
      done: false,
    }));

    // Priority habit: the one with highest streak that isn't completed today
    const activeHabits = habits.filter((h) => !h.archivedAt && !h.deletedAt);
    const todayHabits = activeHabits.filter((h) => {
      if (h.frequency === 'daily') return true;
      const day = new Date().getDay();
      return h.customDays?.includes(day);
    });
    const uncompletedHabits = todayHabits.filter((h) => !h.completedDates.includes(todayStr));
    const priorityHabit = uncompletedHabits.sort((a, b) => b.streak - a.streak)[0];

    // Active focused goal
    const focusedGoal = goals.find((g) => g.isFocused && !g.completedAt && !g.deletedAt);

    // Today intention
    const todayIntention = dailyIntentions.find((i) => i.date === todayStr);

    // Detect friction: tasks overdue > 3 days
    const frictionTasks = overdueTasks.filter((t) => {
      if (!t.dueDate) return false;
      const diff = (new Date().getTime() - new Date(t.dueDate).getTime()) / (1000 * 60 * 60 * 24);
      return diff > 3;
    });

    return {
      top3Tasks,
      priorityHabit,
      focusedGoal,
      todayIntention,
      frictionTasks,
      overdueCount: overdueTasks.length,
      totalTodayTasks: todayTasks.length,
      completedHabits: todayHabits.filter((h) => h.completedDates.includes(todayStr)).length,
      totalHabits: todayHabits.length,
    };
  }, [tasks, habits, goals, dailyIntentions, todayStr]);

  const hasContent = focusData.top3Tasks.length > 0 || focusData.priorityHabit || focusData.focusedGoal;

  if (!hasContent) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <CardContent className="p-3 md:p-4 space-y-2.5">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-sm font-semibold">Today Focus</span>
          {focusData.overdueCount > 0 && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 ml-auto">
              <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />
              {focusData.overdueCount} overdue
            </Badge>
          )}
        </div>

        {/* Focused Goal */}
        {focusData.focusedGoal && (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-accent/10 border border-accent/20">
            <Target className="w-3.5 h-3.5 text-accent shrink-0" />
            <span className="text-xs font-medium truncate">{focusData.focusedGoal.title}</span>
            <span className="text-[10px] text-muted-foreground ml-auto shrink-0">{focusData.focusedGoal.progress}%</span>
          </div>
        )}

        {/* Top 3 Tasks */}
        {focusData.top3Tasks.length > 0 && (
          <div className="space-y-1">
            {focusData.top3Tasks.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-secondary/50 transition-colors">
                <span className={cn(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center text-[8px] font-bold shrink-0",
                  item.priority === 'high' ? 'border-destructive text-destructive' :
                  item.priority === 'medium' ? 'border-warning text-warning' :
                  'border-muted-foreground text-muted-foreground'
                )}>
                  {idx + 1}
                </span>
                <span className="text-xs truncate flex-1">{item.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Priority Habit */}
        {focusData.priorityHabit && (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-area-health/10 border border-area-health/20">
            <CheckCircle2 className="w-3.5 h-3.5 text-area-health shrink-0" />
            <span className="text-xs truncate flex-1">
              {focusData.priorityHabit.minimumVersion
                ? `${focusData.priorityHabit.name} (min: ${focusData.priorityHabit.minimumVersion})`
                : focusData.priorityHabit.name}
            </span>
            {focusData.priorityHabit.streak > 0 && (
              <span className="text-[10px] text-streak shrink-0">{focusData.priorityHabit.streak}d</span>
            )}
          </div>
        )}

        {/* Friction Alert */}
        {focusData.frictionTasks.length > 0 && (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-destructive/5 border border-destructive/15">
            <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />
            <span className="text-[11px] text-destructive">
              {focusData.frictionTasks.length} task quá hạn &gt;3 ngày — cần dọn dẹp hoặc chia nhỏ
            </span>
          </div>
        )}

        {/* Progress Summary */}
        <div className="flex items-center gap-3 pt-1 text-[10px] text-muted-foreground">
          <span>{focusData.completedHabits}/{focusData.totalHabits} habits</span>
          <span className="w-px h-3 bg-border" />
          <span>{focusData.totalTodayTasks} tasks hôm nay</span>
        </div>
      </CardContent>
    </Card>
  );
}
