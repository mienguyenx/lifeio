import { useMemo, useState } from 'react';
import { Bot, ChevronDown, ChevronUp, Sparkles, Target, ListTodo, Shield, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { getTodayDateString } from '@/utils/dateUtils';
import { LIFE_AREAS } from '@/types/lifeos';

export function AIDailyBriefing() {
  const tasks = useLifeOSStore((s) => s.tasks);
  const habits = useLifeOSStore((s) => s.habits);
  const goals = useLifeOSStore((s) => s.goals);
  const journalEntries = useLifeOSStore((s) => s.journalEntries);
  const morningCheckins = useLifeOSStore((s) => s.morningCheckins);
  const userPreferences = useLifeOSStore((s) => s.userPreferences);
  const todayStr = getTodayDateString();

  const [expanded, setExpanded] = useState(false);

  const briefing = useMemo(() => {
    const activeTasks = tasks.filter((t) => !t.archived && !t.deletedAt && t.status !== 'done');
    const todayTasks = activeTasks.filter((t) => t.dueDate === todayStr);
    const overdueTasks = activeTasks.filter((t) => t.dueDate && t.dueDate < todayStr);
    const highPriority = [...overdueTasks, ...todayTasks].filter((t) => t.priority === 'high');

    const activeHabits = habits.filter((h) => !h.archivedAt && !h.deletedAt);
    const todayHabits = activeHabits.filter((h) => {
      if (h.frequency === 'daily') return true;
      return h.customDays?.includes(new Date().getDay());
    });
    const uncompletedHabits = todayHabits.filter((h) => !h.completedDates.includes(todayStr));
    const priorityHabit = uncompletedHabits.sort((a, b) => b.streak - a.streak)[0];

    // Analyze recent patterns
    const last7Days: string[] = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push(d.toISOString().split('T')[0]);
    }

    const recentJournals = journalEntries.filter((j) => last7Days.includes(j.date));
    const avgMood = recentJournals.length > 0
      ? recentJournals.reduce((s, j) => s + j.mood, 0) / recentJournals.length
      : null;
    const avgEnergy = recentJournals.length > 0
      ? recentJournals.reduce((s, j) => s + j.energy, 0) / recentJournals.length
      : null;

    // Main goal suggestion
    const focusedGoal = goals.find((g) => g.isFocused && !g.completedAt && !g.deletedAt);
    const todayCheckin = morningCheckins.find((c) => c.date === todayStr);

    let mainGoal = todayCheckin?.mainGoal || '';
    if (!mainGoal && highPriority.length > 0) {
      mainGoal = highPriority[0].title;
    } else if (!mainGoal && focusedGoal) {
      mainGoal = `Tiến bộ trên goal: ${focusedGoal.title}`;
    }

    // Top 3 tasks
    const top3 = todayCheckin?.top3Tasks?.length
      ? todayCheckin.top3Tasks
      : [...overdueTasks, ...todayTasks]
          .sort((a, b) => {
            const p = { high: 3, medium: 2, low: 1 };
            return (p[b.priority] || 0) - (p[a.priority] || 0);
          })
          .slice(0, 3)
          .map((t) => t.title);

    // Avoid suggestion based on patterns
    let avoidItem = todayCheckin?.avoidItem || '';
    if (!avoidItem && avgMood !== null && avgMood < 3) {
      avoidItem = 'Tránh overwork — mood gần đây thấp, hãy nghỉ đúng giờ';
    } else if (!avoidItem && overdueTasks.length > 5) {
      avoidItem = 'Tránh nhận thêm task — đang có nhiều task tồn đọng';
    }

    // Pattern insight
    let insight = '';
    if (avgEnergy !== null && avgEnergy < 3) {
      insight = 'Năng lượng tuần qua thấp — ưu tiên ngủ sớm và task nhẹ.';
    } else if (avgMood !== null && avgMood >= 4) {
      insight = 'Mood tuần qua rất tốt — tận dụng đà này cho task khó!';
    } else if (priorityHabit && priorityHabit.streak >= 7) {
      insight = `Streak ${priorityHabit.name}: ${priorityHabit.streak} ngày — giữ vững!`;
    }

    // Determine tone
    const tone = userPreferences?.aiTone || 'gentle';
    let greeting = 'Chào buổi sáng!';
    if (tone === 'direct') greeting = 'Hôm nay cần làm:';
    else if (tone === 'strategic') greeting = 'Briefing hôm nay:';
    else if (tone === 'concise') greeting = 'Tóm tắt:';

    return {
      greeting,
      mainGoal,
      top3,
      priorityHabit,
      avoidItem,
      insight,
      overdueCount: overdueTasks.length,
      totalTasks: todayTasks.length,
      totalHabits: todayHabits.length,
      completedHabits: todayHabits.length - uncompletedHabits.length,
    };
  }, [tasks, habits, goals, journalEntries, morningCheckins, userPreferences, todayStr]);

  const hasContent = briefing.mainGoal || briefing.top3.length > 0;
  if (!hasContent) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-violet-50/50 via-background to-blue-50/30 dark:from-violet-950/15 dark:to-blue-950/10">
      <CardContent className="p-3 md:p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-violet-500/15 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
            </div>
            <span className="text-sm font-semibold">{briefing.greeting}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </Button>
        </div>

        {/* Main goal */}
        {briefing.mainGoal && (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-primary/8 border border-primary/15">
            <Target className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-xs font-medium">{briefing.mainGoal}</span>
          </div>
        )}

        {/* Top 3 tasks */}
        {briefing.top3.length > 0 && (
          <div className="space-y-1">
            {briefing.top3.map((task, idx) => (
              <div key={idx} className="flex items-center gap-2 px-2 py-0.5">
                <ListTodo className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="text-[11px] truncate">{task}</span>
              </div>
            ))}
          </div>
        )}

        {expanded && (
          <div className="space-y-2 animate-fade-in">
            {/* Priority Habit */}
            {briefing.priorityHabit && (
              <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-area-health/8">
                <Sparkles className="w-3 h-3 text-area-health shrink-0" />
                <span className="text-[11px]">
                  Habit ưu tiên: <strong>{briefing.priorityHabit.name}</strong>
                  {briefing.priorityHabit.minimumVersion && (
                    <span className="text-muted-foreground"> (min: {briefing.priorityHabit.minimumVersion})</span>
                  )}
                </span>
              </div>
            )}

            {/* Avoid */}
            {briefing.avoidItem && (
              <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-destructive/5">
                <Shield className="w-3 h-3 text-destructive shrink-0" />
                <span className="text-[11px] text-destructive">{briefing.avoidItem}</span>
              </div>
            )}

            {/* Insight */}
            {briefing.insight && (
              <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-accent/8">
                <TrendingUp className="w-3 h-3 text-accent shrink-0" />
                <span className="text-[11px] text-muted-foreground">{briefing.insight}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-0.5">
          <span>{briefing.completedHabits}/{briefing.totalHabits} habits</span>
          <span className="w-px h-3 bg-border" />
          <span>{briefing.totalTasks} tasks</span>
          {briefing.overdueCount > 0 && (
            <>
              <span className="w-px h-3 bg-border" />
              <span className="text-destructive">{briefing.overdueCount} overdue</span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
