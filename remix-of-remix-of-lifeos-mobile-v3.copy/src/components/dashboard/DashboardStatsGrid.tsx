import { Target, CheckCircle2, Sparkles, Zap, BookOpen, FileText, Clock, Flame } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { cn } from '@/lib/utils';

// Static color classes to ensure Tailwind includes them
const colorClasses = {
  primary: { bg: 'bg-primary/10', text: 'text-primary' },
  success: { bg: 'bg-success/10', text: 'text-success' },
  warning: { bg: 'bg-warning/10', text: 'text-warning' },
  destructive: { bg: 'bg-destructive/10', text: 'text-destructive' },
  info: { bg: 'bg-info/10', text: 'text-info' },
  secondary: { bg: 'bg-muted', text: 'text-muted-foreground' },
};

type ColorKey = keyof typeof colorClasses;

export default function DashboardStatsGrid() {
  const habits = useLifeOSStore((s) => s.habits);
  const tasks = useLifeOSStore((s) => s.tasks);
  const goals = useLifeOSStore((s) => s.goals);
  const journalEntries = useLifeOSStore((s) => s.journalEntries);
  const notes = useLifeOSStore((s) => s.notes);
  const pomodoroSessions = useLifeOSStore((s) => s.pomodoroSessions);

  const todayStr = new Date().toISOString().split('T')[0];
  
  // Habits stats
  const activeHabits = habits.filter((h) => !h.archivedAt && !h.deletedAt);
  const todayHabits = activeHabits.filter((h) =>
    h.frequency === 'daily' || h.customDays?.includes(new Date().getDay())
  );
  const completedHabitsToday = todayHabits.filter((h) => h.completedDates.includes(todayStr));
  
  // Calculate best streak
  const bestStreak = activeHabits.reduce((max, h) => Math.max(max, h.streak || 0), 0);

  // Tasks stats
  const activeTasks = tasks.filter((t) => !t.deletedAt);
  const completedTasksToday = activeTasks.filter((t) => t.completedAt?.startsWith(todayStr));
  const pendingTasks = activeTasks.filter((t) => t.status !== 'done');
  const overdueTasks = pendingTasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date());

  // Goals stats
  const activeGoals = goals.filter((g) => !g.deletedAt && g.progress < 100);
  const completedGoals = goals.filter((g) => !g.deletedAt && g.progress >= 100);
  const avgGoalProgress = activeGoals.length > 0 
    ? Math.round(activeGoals.reduce((sum, g) => sum + g.progress, 0) / activeGoals.length) 
    : 0;

  // Journal stats
  const todayJournal = journalEntries.filter((j) => j.date.startsWith(todayStr));
  const latestJournal = journalEntries.slice(-1)[0];
  const mood = latestJournal?.mood || 3;
  const energy = latestJournal?.energy || 3;

  // Notes stats
  const activeNotes = notes.filter((n) => !n.deletedAt);

  // Pomodoro stats
  const todayPomodoros = pomodoroSessions.filter((s) => s.completedAt.startsWith(todayStr));
  const totalFocusMinutes = todayPomodoros.reduce((sum, s) => sum + (s.duration || 25), 0);

  const stats: {
    label: string;
    value: string;
    icon: React.ElementType;
    color: ColorKey;
    sublabel: string;
  }[] = [
    {
      label: 'Thói quen',
      value: `${completedHabitsToday.length}/${todayHabits.length}`,
      icon: Target,
      color: 'primary',
      sublabel: `🔥 Streak: ${bestStreak} ngày`
    },
    {
      label: 'Tasks hôm nay',
      value: completedTasksToday.length.toString(),
      icon: CheckCircle2,
      color: 'success',
      sublabel: `${pendingTasks.length} đang chờ${overdueTasks.length > 0 ? ` • ${overdueTasks.length} quá hạn` : ''}`
    },
    {
      label: 'Goals',
      value: activeGoals.length.toString(),
      icon: Sparkles,
      color: 'warning',
      sublabel: `${avgGoalProgress}% tiến độ TB • ${completedGoals.length} hoàn thành`
    },
    {
      label: 'Năng lượng',
      value: `${energy * 20}%`,
      icon: Zap,
      color: 'destructive',
      sublabel: `Tâm trạng: ${['😢', '😕', '😐', '🙂', '😊'][mood - 1] || '😐'}`
    },
    {
      label: 'Nhật ký',
      value: todayJournal.length > 0 ? '✓' : '—',
      icon: BookOpen,
      color: 'info',
      sublabel: `${journalEntries.length} entries`
    },
    {
      label: 'Ghi chú',
      value: activeNotes.length.toString(),
      icon: FileText,
      color: 'secondary',
      sublabel: 'notes'
    },
    {
      label: 'Focus hôm nay',
      value: `${totalFocusMinutes}`,
      icon: Clock,
      color: 'primary',
      sublabel: `${todayPomodoros.length} phiên`
    },
    {
      label: 'Streaks',
      value: bestStreak.toString(),
      icon: Flame,
      color: 'warning',
      sublabel: 'ngày liên tiếp'
    }
  ];

  return (
    <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-2">
      {stats.map((stat) => {
        const colors = colorClasses[stat.color];
        return (
          <Card key={stat.label} className="overflow-hidden">
            <CardContent className="p-2 sm:p-3">
              <div className="flex flex-col items-center text-center gap-0.5 sm:gap-1">
                <div className={cn("w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center", colors.bg)}>
                  <stat.icon className={cn("w-3 h-3 sm:w-4 sm:h-4", colors.text)} />
                </div>
                <p className="text-sm sm:text-lg font-bold leading-tight">{stat.value}</p>
                <p className="text-[9px] sm:text-[10px] text-muted-foreground leading-tight">{stat.label}</p>
                <p className="text-[8px] sm:text-[9px] text-muted-foreground truncate w-full leading-tight hidden sm:block">{stat.sublabel}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}