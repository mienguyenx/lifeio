import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Habit, Task, PomodoroSession, Goal, JournalEntry, WeeklyReview } from '@/types/lifeos';
import { TrendingUp, TrendingDown, Flame, Target, BookOpen, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WeeklyReviewInsightsProps {
  weekDates: string[];
  habits: Habit[];
  tasks: Task[];
  pomodoroSessions: PomodoroSession[];
  goals: Goal[];
  journalEntries: JournalEntry[];
  previousReview?: WeeklyReview;
}

export function WeeklyReviewInsights({
  weekDates,
  habits,
  tasks,
  pomodoroSessions,
  goals,
  journalEntries,
  previousReview,
}: WeeklyReviewInsightsProps) {
  const insights = useMemo(() => {
    // Habit insights
    const activeHabits = habits.filter((h) => !h.archivedAt);
    const habitCompletionRates = activeHabits.map((habit) => {
      const completed = weekDates.filter((d) => habit.completedDates.includes(d)).length;
      return {
        habit,
        rate: (completed / weekDates.length) * 100,
        completed,
      };
    });
    
    const topHabits = [...habitCompletionRates].sort((a, b) => b.rate - a.rate).slice(0, 3);
    const needsAttention = habitCompletionRates.filter((h) => h.rate < 50).slice(0, 3);
    
    // Calculate average habit completion rate
    const avgHabitRate = habitCompletionRates.length > 0
      ? habitCompletionRates.reduce((sum, h) => sum + h.rate, 0) / habitCompletionRates.length
      : 0;
    
    // Task insights
    const weekTasks = tasks.filter((t) => weekDates.some((d) => t.createdAt.startsWith(d) || (t.dueDate && t.dueDate >= weekDates[0] && t.dueDate <= weekDates[6])));
    const completedTasks = weekTasks.filter((t) => t.status === 'done');
    const taskCompletionRate = weekTasks.length > 0 ? (completedTasks.length / weekTasks.length) * 100 : 0;
    
    // Pomodoro insights
    const weekPomodoros = pomodoroSessions.filter(
      (s) => s.phase === 'work' && weekDates.some((d) => s.completedAt.startsWith(d))
    );
    const totalFocusMinutes = weekPomodoros.reduce((sum, s) => sum + s.duration, 0);
    const avgPomodorosPerDay = weekPomodoros.length / 7;
    
    // Most productive day
    const dayStats = weekDates.map((date, index) => {
      const habitsCount = habits.reduce((sum, h) => sum + (h.completedDates.includes(date) ? 1 : 0), 0);
      const tasksCount = tasks.filter((t) => t.completedAt && t.completedAt.startsWith(date)).length;
      const pomodorosCount = pomodoroSessions.filter((s) => s.phase === 'work' && s.completedAt.startsWith(date)).length;
      return {
        date,
        dayName: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][index],
        total: habitsCount + tasksCount + pomodorosCount,
      };
    });
    const mostProductiveDay = dayStats.sort((a, b) => b.total - a.total)[0];
    
    // Mood insights from journal
    const weekJournals = journalEntries.filter((j) => weekDates.includes(j.date));
    const avgMood = weekJournals.length > 0
      ? weekJournals.reduce((sum, j) => sum + j.mood, 0) / weekJournals.length
      : 0;
    const avgEnergy = weekJournals.length > 0
      ? weekJournals.reduce((sum, j) => sum + j.energy, 0) / weekJournals.length
      : 0;
    
    // Goal progress
    const activeGoals = goals.filter((g) => g.status !== 'archived' && !g.completedAt);
    const goalsWithProgress = activeGoals.filter((g) => g.progress > 0);
    
    return {
      topHabits,
      needsAttention,
      avgHabitRate,
      taskCompletionRate,
      completedTasks: completedTasks.length,
      totalTasks: weekTasks.length,
      totalFocusMinutes,
      avgPomodorosPerDay,
      mostProductiveDay,
      avgMood,
      avgEnergy,
      journalCount: weekJournals.length,
      activeGoals: activeGoals.length,
      goalsWithProgress: goalsWithProgress.length,
    };
  }, [weekDates, habits, tasks, pomodoroSessions, goals, journalEntries]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain className="w-5 h-5 text-info" />
          Phân tích tuần
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Top Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-success/10">
            <div className="flex items-center gap-2 text-success mb-1">
              <Flame className="w-4 h-4" />
              <span className="text-xs font-medium">Habit Rate</span>
            </div>
            <p className="text-2xl font-bold">{insights.avgHabitRate.toFixed(0)}%</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/10">
            <div className="flex items-center gap-2 text-primary mb-1">
              <Target className="w-4 h-4" />
              <span className="text-xs font-medium">Task Done</span>
            </div>
            <p className="text-2xl font-bold">{insights.completedTasks}/{insights.totalTasks}</p>
          </div>
        </div>

        {/* Top Habits */}
        {insights.topHabits.length > 0 && (
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-1">
              🏆 Habits xuất sắc
            </h4>
            <div className="space-y-1">
              {insights.topHabits.map(({ habit, rate }) => (
                <div key={habit.id} className="flex items-center justify-between text-sm">
                  <span>{habit.name}</span>
                  <Badge variant="secondary" className={cn(
                    rate >= 80 ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                  )}>
                    {rate.toFixed(0)}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Needs Attention */}
        {insights.needsAttention.length > 0 && (
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-1">
              ⚠️ Cần chú ý
            </h4>
            <div className="space-y-1">
              {insights.needsAttention.map(({ habit, rate }) => (
                <div key={habit.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{habit.name}</span>
                  <Badge variant="outline" className="text-destructive">
                    {rate.toFixed(0)}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Focus Time */}
        <div className="p-3 rounded-lg bg-secondary/50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">🍅 Focus time</span>
            <span className="font-medium">{Math.round(insights.totalFocusMinutes / 60)}h {insights.totalFocusMinutes % 60}m</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm text-muted-foreground">📅 Ngày năng suất nhất</span>
            <span className="font-medium">{insights.mostProductiveDay?.dayName}</span>
          </div>
        </div>

        {/* Mood & Energy */}
        {insights.journalCount > 0 && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Mood:</span>
              <span className="text-lg">
                {insights.avgMood >= 4 ? '😊' : insights.avgMood >= 3 ? '😐' : '😔'}
                <span className="text-sm font-medium ml-1">{insights.avgMood.toFixed(1)}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Energy:</span>
              <span className="text-lg">
                {insights.avgEnergy >= 4 ? '⚡' : insights.avgEnergy >= 3 ? '🔋' : '🪫'}
                <span className="text-sm font-medium ml-1">{insights.avgEnergy.toFixed(1)}</span>
              </span>
            </div>
          </div>
        )}

        {/* Journal reminder */}
        {insights.journalCount < 3 && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            Viết nhật ký thường xuyên hơn để có insights tốt hơn!
          </p>
        )}
      </CardContent>
    </Card>
  );
}
