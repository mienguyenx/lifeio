import { useMemo } from 'react';
import { TrendingUp, Flame, CheckCircle2, Calendar, Target } from 'lucide-react';
import { startOfWeek, endOfWeek, parseISO, isWithinInterval, subWeeks } from 'date-fns';
import { useLifeOSStore } from '@/stores/useLifeOSStore';

export function ProductivityStats() {
  const tasks = useLifeOSStore((s) => s.tasks);

  const stats = useMemo(() => {
    const now = new Date();
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

    const completedThisWeek = tasks.filter(t => 
      t.status === 'done' && 
      t.completedAt && 
      isWithinInterval(parseISO(t.completedAt), { start: thisWeekStart, end: thisWeekEnd })
    ).length;

    const completedLastWeek = tasks.filter(t => 
      t.status === 'done' && 
      t.completedAt && 
      isWithinInterval(parseISO(t.completedAt), { start: lastWeekStart, end: lastWeekEnd })
    ).length;

    const weeklyChange = completedLastWeek > 0 
      ? Math.round(((completedThisWeek - completedLastWeek) / completedLastWeek) * 100)
      : completedThisWeek > 0 ? 100 : 0;

    const recurringTasks = tasks.filter(t => t.recurring);
    const recurringStreaks = recurringTasks.reduce((acc, task) => {
      const completedOfSameTitle = tasks.filter(
        t => t.title === task.title && t.status === 'done' && t.completedAt
      );
      
      if (completedOfSameTitle.length > 0) {
        const sorted = completedOfSameTitle.sort((a, b) => 
          parseISO(b.completedAt!).getTime() - parseISO(a.completedAt!).getTime()
        );
        
        let streak = 0;
        const today = new Date();
        
        for (let i = 0; i < sorted.length; i++) {
          const completedDate = parseISO(sorted[i].completedAt!);
          const daysDiff = Math.floor((today.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24));
          const frequency = task.recurring?.frequency || 'daily';
          const maxDays = frequency === 'daily' ? 2 : frequency === 'weekly' ? 8 : 35;
          
          if (daysDiff <= maxDays * (i + 1)) {
            streak++;
          } else {
            break;
          }
        }
        
        if (streak > 0 && !acc.find(s => s.title === task.title)) {
          acc.push({ title: task.title, streak, frequency: task.recurring?.frequency || 'daily' });
        }
      }
      
      return acc;
    }, [] as Array<{ title: string; streak: number; frequency: string }>);

    const topStreaks = recurringStreaks.sort((a, b) => b.streak - a.streak).slice(0, 3);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const completedThisMonth = tasks.filter(t => 
      t.status === 'done' && 
      t.completedAt && 
      parseISO(t.completedAt) >= monthStart
    ).length;

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      completedThisWeek,
      weeklyChange,
      topStreaks,
      completedThisMonth,
      completionRate
    };
  }, [tasks]);

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {/* Tasks this week */}
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 shrink-0">
        <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs text-muted-foreground">Tuần này</span>
        <span className="text-sm font-bold">{stats.completedThisWeek}</span>
        {stats.weeklyChange !== 0 && (
          <span className={`text-[10px] ${stats.weeklyChange > 0 ? 'text-success' : 'text-destructive'}`}>
            {stats.weeklyChange > 0 ? '↑' : '↓'}{Math.abs(stats.weeklyChange)}%
          </span>
        )}
      </div>

      {/* This month */}
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-success/10 shrink-0">
        <Calendar className="w-3.5 h-3.5 text-success" />
        <span className="text-xs text-muted-foreground">Tháng này</span>
        <span className="text-sm font-bold">{stats.completedThisMonth}</span>
      </div>

      {/* Completion rate */}
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-warning/10 shrink-0">
        <Target className="w-3.5 h-3.5 text-warning" />
        <span className="text-xs text-muted-foreground">Hoàn thành</span>
        <span className="text-sm font-bold">{stats.completionRate}%</span>
      </div>

      {/* Best streak */}
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-destructive/10 shrink-0">
        <Flame className="w-3.5 h-3.5 text-destructive" />
        <span className="text-xs text-muted-foreground">Streak</span>
        <span className="text-sm font-bold">
          {stats.topStreaks.length > 0 ? stats.topStreaks[0].streak : 0}
        </span>
      </div>
    </div>
  );
}
