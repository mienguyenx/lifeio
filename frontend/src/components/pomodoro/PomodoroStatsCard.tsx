import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { format, startOfDay, startOfWeek, startOfMonth, isAfter, subDays, parseISO, eachDayOfInterval } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Timer, Flame, Calendar, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from 'recharts';

export function PomodoroStatsCard() {
  const pomodoroSessions = useLifeOSStore((s) => s.pomodoroSessions);

  const stats = useMemo(() => {
    const today = startOfDay(new Date());
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const monthStart = startOfMonth(new Date());

    const workSessions = pomodoroSessions.filter(s => s.phase === 'work');

    const todaySessions = workSessions.filter(s => {
      const sessionDate = s.completedAt ? parseISO(s.completedAt) : null;
      return sessionDate && isAfter(sessionDate, today);
    });

    const weekSessions = workSessions.filter(s => {
      const sessionDate = s.completedAt ? parseISO(s.completedAt) : null;
      return sessionDate && isAfter(sessionDate, weekStart);
    });

    const monthSessions = workSessions.filter(s => {
      const sessionDate = s.completedAt ? parseISO(s.completedAt) : null;
      return sessionDate && isAfter(sessionDate, monthStart);
    });

    const todayMinutes = todaySessions.reduce((sum, s) => sum + s.duration, 0);
    const weekMinutes = weekSessions.reduce((sum, s) => sum + s.duration, 0);
    const monthMinutes = monthSessions.reduce((sum, s) => sum + s.duration, 0);

    const dailyGoal = 8;
    const todayProgress = Math.min(100, (todaySessions.length / dailyGoal) * 100);

    const last7Days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date()
    });

    const chartData = last7Days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = startOfDay(subDays(day, -1));
      
      const daySessions = workSessions.filter(s => {
        const sessionDate = s.completedAt ? parseISO(s.completedAt) : null;
        return sessionDate && isAfter(sessionDate, dayStart) && !isAfter(sessionDate, dayEnd);
      });

      return {
        day: format(day, 'EEE', { locale: vi }),
        sessions: daySessions.length
      };
    });

    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const checkDay = startOfDay(subDays(new Date(), i));
      const nextDay = startOfDay(subDays(new Date(), i - 1));
      
      const hasSession = workSessions.some(s => {
        const sessionDate = s.completedAt ? parseISO(s.completedAt) : null;
        return sessionDate && isAfter(sessionDate, checkDay) && !isAfter(sessionDate, nextDay);
      });

      if (hasSession) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    return {
      todayCount: todaySessions.length,
      todayMinutes,
      weekCount: weekSessions.length,
      weekMinutes,
      monthCount: monthSessions.length,
      monthMinutes,
      dailyGoal,
      todayProgress,
      chartData,
      streak
    };
  }, [pomodoroSessions]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3 space-y-3">
        {/* Header + Today Progress */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-pomodoro-work" />
            <span className="font-medium text-sm">Thống kê Pomodoro</span>
          </div>
          <span className="text-sm font-medium">
            🍅 {stats.todayCount}/{stats.dailyGoal} • {formatTime(stats.todayMinutes)}
          </span>
        </div>
        <Progress value={stats.todayProgress} className="h-1.5" />

        {/* Compact Stats Row */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>Tuần này</span>
            <span className="font-semibold text-pomodoro-work ml-1">{stats.weekCount}</span>
            <span className="text-muted-foreground/70">{formatTime(stats.weekMinutes)}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Target className="w-3 h-3" />
            <span>Tháng</span>
            <span className="font-semibold text-primary ml-1">{stats.monthCount}</span>
            <span className="text-muted-foreground/70">{formatTime(stats.monthMinutes)}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Flame className="w-3 h-3" />
            <span>Streak</span>
            <span className="font-semibold text-orange-500 ml-1">{stats.streak}</span>
            <span className="text-muted-foreground/70">ngày</span>
          </div>
        </div>

        {/* Mini Chart */}
        <div className="h-12">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  fontSize: '11px',
                  padding: '4px 8px'
                }}
                formatter={(value: number) => [`${value} 🍅`, '']}
              />
              <Bar 
                dataKey="sessions" 
                fill="hsl(var(--pomodoro-work))" 
                radius={[2, 2, 0, 0]}
                maxBarSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
