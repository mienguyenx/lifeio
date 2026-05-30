import { useMemo } from 'react';
import { Flame, TrendingUp, Calendar, Award } from 'lucide-react';
import { format, parseISO, differenceInDays, isYesterday, isToday, subDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { Goal } from '@/types/lifeos';

interface GoalStreaksCardProps {
  goals: Goal[];
}

export function GoalStreaksCard({ goals }: GoalStreaksCardProps) {
  const activeGoals = goals.filter(g => !g.completedAt && g.status !== 'archived');

  const streakData = useMemo(() => {
    return activeGoals.map(goal => {
      const activities = goal.activities || [];
      const lastActivity = goal.lastActivityDate;
      
      let streak = goal.currentStreak || 0;
      let isActiveToday = false;
      
      if (lastActivity) {
        const lastDate = parseISO(lastActivity);
        isActiveToday = isToday(lastDate);
        const wasYesterday = isYesterday(lastDate);
        
        // If no activity today or yesterday, streak is broken
        if (!isActiveToday && !wasYesterday) {
          streak = 0;
        }
      }
      
      return {
        goal,
        streak,
        bestStreak: goal.bestStreak || 0,
        isActiveToday,
        lastActivity,
      };
    }).sort((a, b) => b.streak - a.streak);
  }, [activeGoals]);

  const totalStreak = streakData.reduce((sum, d) => sum + d.streak, 0);
  const goalsWithStreak = streakData.filter(d => d.streak > 0).length;
  const activeToday = streakData.filter(d => d.isActiveToday).length;

  // Last 7 days activity heatmap
  const weekActivity = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const activityCount = activeGoals.filter(g => 
        g.activities?.some(a => a.date === dateStr)
      ).length;
      days.push({
        date,
        dateStr,
        count: activityCount,
        dayName: format(date, 'EEE', { locale: vi }),
      });
    }
    return days;
  }, [activeGoals]);

  const maxActivity = Math.max(...weekActivity.map(d => d.count), 1);

  if (activeGoals.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Flame className="w-5 h-5 text-warning" />
          Goal Streaks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-warning/10 rounded-lg p-2">
            <p className="text-xl font-bold text-warning">{totalStreak}</p>
            <p className="text-[10px] text-muted-foreground">Tổng streak</p>
          </div>
          <div className="bg-success/10 rounded-lg p-2">
            <p className="text-xl font-bold text-success">{goalsWithStreak}</p>
            <p className="text-[10px] text-muted-foreground">Goals streak</p>
          </div>
          <div className="bg-primary/10 rounded-lg p-2">
            <p className="text-xl font-bold text-primary">{activeToday}</p>
            <p className="text-[10px] text-muted-foreground">Hôm nay</p>
          </div>
        </div>

        {/* Week Heatmap */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Hoạt động 7 ngày qua</p>
          <div className="flex gap-1">
            {weekActivity.map((day, i) => (
              <div key={i} className="flex-1 text-center">
                <div 
                  className={cn(
                    "h-8 rounded-md flex items-center justify-center text-xs font-medium transition-colors",
                    day.count === 0 && "bg-muted/50 text-muted-foreground",
                    day.count > 0 && day.count < maxActivity / 2 && "bg-warning/30 text-warning",
                    day.count >= maxActivity / 2 && "bg-warning text-warning-foreground"
                  )}
                >
                  {day.count}
                </div>
                <p className="text-[9px] text-muted-foreground mt-1">{day.dayName}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Top Streaks */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Top streaks</p>
          {streakData.slice(0, 5).map(({ goal, streak, bestStreak, isActiveToday }) => (
            <div key={goal.id} className="flex items-center gap-2">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                streak > 0 ? "bg-warning/20 text-warning" : "bg-muted text-muted-foreground"
              )}>
                {streak}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{goal.title}</p>
                <div className="flex items-center gap-2">
                  <Progress value={(streak / Math.max(bestStreak, 7)) * 100} className="h-1 flex-1" />
                  {bestStreak > 0 && (
                    <span className="text-[9px] text-muted-foreground">
                      Best: {bestStreak}
                    </span>
                  )}
                </div>
              </div>
              {isActiveToday && (
                <Badge variant="secondary" className="bg-success/20 text-success text-[9px] h-5">
                  ✓
                </Badge>
              )}
              {streak >= 7 && (
                <Award className="w-4 h-4 text-warning" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
