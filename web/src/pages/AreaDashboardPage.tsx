import { useMemo, useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Target, CheckCircle2, Flame, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { LIFE_AREAS } from '@/types/lifeos';
import type { LifeArea } from '@/types/lifeos';
import { getTodayDateString } from '@/utils/dateUtils';

export default function AreaDashboardPage() {
  const habits = useLifeOSStore((s) => s.habits);
  const tasks = useLifeOSStore((s) => s.tasks);
  const goals = useLifeOSStore((s) => s.goals);
  const journalEntries = useLifeOSStore((s) => s.journalEntries);
  const lifeWheelScores = useLifeOSStore((s) => s.lifeWheelScores);
  const userPreferences = useLifeOSStore((s) => s.userPreferences);

  const [selectedArea, setSelectedArea] = useState<LifeArea | null>(null);
  const todayStr = getTodayDateString();

  // Generate 7-day date range
  const last7Days = useMemo(() => {
    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  }, []);

  const areaStats = useMemo(() => {
    return LIFE_AREAS.map((area) => {
      const areaHabits = habits.filter((h) => h.area === area.id && !h.archivedAt && !h.deletedAt);
      const areaTasks = tasks.filter((t) => t.area === area.id && !t.archived && !t.deletedAt);
      const areaGoals = goals.filter((g) => g.area === area.id && !g.deletedAt && !g.completedAt);

      // Habit completion rate (7 days)
      const habitCompletions = areaHabits.reduce((sum, h) => {
        return sum + h.completedDates.filter((d) => last7Days.includes(d)).length;
      }, 0);
      const habitExpected = areaHabits.reduce((sum, h) => {
        if (h.frequency === 'daily') return sum + 7;
        return sum + (h.customDays?.length || 0);
      }, 0);
      const habitRate = habitExpected > 0 ? Math.round((habitCompletions / habitExpected) * 100) : -1;

      // Task completion
      const completedTasks = areaTasks.filter((t) => t.status === 'done');
      const pendingTasks = areaTasks.filter((t) => t.status !== 'done');
      const overdueTasks = pendingTasks.filter((t) => t.dueDate && t.dueDate < todayStr);

      // Goal progress
      const avgGoalProgress = areaGoals.length > 0
        ? Math.round(areaGoals.reduce((s, g) => s + g.progress, 0) / areaGoals.length)
        : -1;

      // Life Wheel score
      const latestScore = lifeWheelScores[lifeWheelScores.length - 1];
      const prevScore = lifeWheelScores[lifeWheelScores.length - 2];
      const currentScore = latestScore?.scores[area.id] ?? -1;
      const previousScore = prevScore?.scores[area.id] ?? -1;
      const trend = currentScore >= 0 && previousScore >= 0 ? currentScore - previousScore : 0;

      // Streaks
      const bestStreak = areaHabits.reduce((max, h) => Math.max(max, h.streak), 0);

      return {
        area,
        habitCount: areaHabits.length,
        habitRate,
        taskTotal: areaTasks.length,
        taskCompleted: completedTasks.length,
        taskPending: pendingTasks.length,
        overdueCount: overdueTasks.length,
        goalCount: areaGoals.length,
        avgGoalProgress,
        wheelScore: currentScore,
        trend,
        bestStreak,
      };
    });
  }, [habits, tasks, goals, lifeWheelScores, last7Days, todayStr]);

  // Sort: prioritized areas first, then by wheel score
  const priorities = userPreferences?.lifeAreaPriorities || [];
  const sortedStats = [...areaStats].sort((a, b) => {
    const aIdx = priorities.indexOf(a.area.id);
    const bIdx = priorities.indexOf(b.area.id);
    if (aIdx >= 0 && bIdx >= 0) return aIdx - bIdx;
    if (aIdx >= 0) return -1;
    if (bIdx >= 0) return 1;
    return (b.wheelScore || 0) - (a.wheelScore || 0);
  });

  const selected = selectedArea ? areaStats.find((s) => s.area.id === selectedArea) : null;

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" /> Area Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">Tổng quan từng mảng cuộc sống</p>
      </div>

      {/* Area Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {sortedStats.map((stat) => {
          const isPriority = priorities.includes(stat.area.id);
          return (
            <button
              key={stat.area.id}
              onClick={() => setSelectedArea(selectedArea === stat.area.id ? null : stat.area.id)}
              className={cn(
                'flex flex-col items-center gap-1 p-3 rounded-xl border transition-all text-center',
                selectedArea === stat.area.id
                  ? 'border-primary bg-primary/10 ring-1 ring-primary'
                  : 'border-border hover:border-primary/40',
                isPriority && selectedArea !== stat.area.id && 'border-primary/20'
              )}
            >
              <span className="text-2xl">{stat.area.icon}</span>
              <span className="text-xs font-medium">{stat.area.name}</span>
              {stat.wheelScore >= 0 && (
                <div className="flex items-center gap-1">
                  <span className={cn('text-lg font-bold', stat.wheelScore >= 7 ? 'text-green-600' : stat.wheelScore >= 4 ? 'text-amber-600' : 'text-red-600')}>
                    {stat.wheelScore}
                  </span>
                  <span className="text-[10px] text-muted-foreground">/10</span>
                  {stat.trend !== 0 && (
                    stat.trend > 0
                      ? <TrendingUp className="w-3 h-3 text-green-500" />
                      : <TrendingDown className="w-3 h-3 text-red-500" />
                  )}
                </div>
              )}
              {isPriority && <Badge variant="secondary" className="text-[8px] px-1 py-0">Ưu tiên</Badge>}
            </button>
          );
        })}
      </div>

      {/* Selected Area Detail */}
      {selected && (
        <Card className="animate-fade-in">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="text-xl">{selected.area.icon}</span> {selected.area.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Habits */}
              <div className="p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-1.5 mb-1">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  <span className="text-xs font-medium">Habits</span>
                </div>
                <p className="text-lg font-bold">{selected.habitCount}</p>
                {selected.habitRate >= 0 && (
                  <div className="mt-1">
                    <Progress value={selected.habitRate} className="h-1.5" />
                    <p className="text-[10px] text-muted-foreground mt-0.5">{selected.habitRate}% tuần này</p>
                  </div>
                )}
                {selected.bestStreak > 0 && (
                  <p className="text-[10px] text-streak">Best streak: {selected.bestStreak}d</p>
                )}
              </div>

              {/* Tasks */}
              <div className="p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-medium">Tasks</span>
                </div>
                <p className="text-lg font-bold">{selected.taskCompleted}<span className="text-sm text-muted-foreground">/{selected.taskTotal}</span></p>
                {selected.overdueCount > 0 && (
                  <p className="text-[10px] text-destructive">{selected.overdueCount} overdue</p>
                )}
                <p className="text-[10px] text-muted-foreground">{selected.taskPending} đang chờ</p>
              </div>

              {/* Goals */}
              <div className="p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-1.5 mb-1">
                  <Target className="w-3.5 h-3.5 text-accent" />
                  <span className="text-xs font-medium">Goals</span>
                </div>
                <p className="text-lg font-bold">{selected.goalCount}</p>
                {selected.avgGoalProgress >= 0 && (
                  <div className="mt-1">
                    <Progress value={selected.avgGoalProgress} className="h-1.5" />
                    <p className="text-[10px] text-muted-foreground mt-0.5">Avg: {selected.avgGoalProgress}%</p>
                  </div>
                )}
              </div>

              {/* Wheel Score */}
              <div className="p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-1.5 mb-1">
                  <BarChart3 className="w-3.5 h-3.5 text-purple-500" />
                  <span className="text-xs font-medium">Wheel</span>
                </div>
                {selected.wheelScore >= 0 ? (
                  <>
                    <p className={cn('text-lg font-bold', selected.wheelScore >= 7 ? 'text-green-600' : selected.wheelScore >= 4 ? 'text-amber-600' : 'text-red-600')}>
                      {selected.wheelScore}/10
                    </p>
                    {selected.trend !== 0 && (
                      <p className={cn('text-[10px]', selected.trend > 0 ? 'text-green-500' : 'text-red-500')}>
                        {selected.trend > 0 ? '+' : ''}{selected.trend} vs trước
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">N/A</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Cards (when no area selected) */}
      {!selected && (
        <div className="space-y-2">
          {sortedStats.filter((s) => s.habitCount > 0 || s.taskTotal > 0 || s.goalCount > 0).map((stat) => (
            <Card key={stat.area.id} className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setSelectedArea(stat.area.id)}>
              <CardContent className="p-3 flex items-center gap-3">
                <span className="text-xl">{stat.area.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{stat.area.name}</p>
                  <div className="flex gap-3 text-[10px] text-muted-foreground">
                    {stat.habitCount > 0 && <span>{stat.habitCount} habits {stat.habitRate >= 0 ? `(${stat.habitRate}%)` : ''}</span>}
                    {stat.taskPending > 0 && <span>{stat.taskPending} tasks</span>}
                    {stat.goalCount > 0 && <span>{stat.goalCount} goals</span>}
                  </div>
                </div>
                {stat.wheelScore >= 0 && (
                  <div className="text-right shrink-0">
                    <span className={cn('text-sm font-bold', stat.wheelScore >= 7 ? 'text-green-600' : stat.wheelScore >= 4 ? 'text-amber-600' : 'text-red-600')}>
                      {stat.wheelScore}
                    </span>
                    <span className="text-[10px] text-muted-foreground">/10</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
