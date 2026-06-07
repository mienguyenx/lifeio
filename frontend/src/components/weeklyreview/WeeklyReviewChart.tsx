import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Habit, Task, PomodoroSession } from '@/types/lifeos';
import { format, startOfWeek, addDays } from 'date-fns';
import { vi } from 'date-fns/locale';

interface WeeklyReviewChartProps {
  weekStart: Date;
  habits: Habit[];
  tasks: Task[];
  pomodoroSessions: PomodoroSession[];
}

const DAY_NAMES = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export function WeeklyReviewChart({ weekStart, habits, tasks, pomodoroSessions }: WeeklyReviewChartProps) {
  const chartData = useMemo(() => {
    const data = [];
    
    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Count habits completed on this date
      const habitsCompleted = habits.reduce((sum, habit) => {
        return sum + (habit.completedDates.includes(dateStr) ? 1 : 0);
      }, 0);
      
      // Count tasks completed on this date
      const tasksCompleted = tasks.filter(
        (t) => t.completedAt && t.completedAt.startsWith(dateStr)
      ).length;
      
      // Count pomodoros completed on this date
      const pomodoros = pomodoroSessions.filter(
        (s) => s.phase === 'work' && s.completedAt.startsWith(dateStr)
      ).length;
      
      data.push({
        day: DAY_NAMES[i],
        date: format(date, 'dd/MM', { locale: vi }),
        habits: habitsCompleted,
        tasks: tasksCompleted,
        pomodoros,
      });
    }
    
    return data;
  }, [weekStart, habits, tasks, pomodoroSessions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">📊 Hoạt động trong tuần</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="day" className="text-xs fill-muted-foreground" />
              <YAxis className="text-xs fill-muted-foreground" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = {
                    habits: 'Habits',
                    tasks: 'Tasks',
                    pomodoros: 'Pomodoros',
                  };
                  return [value, labels[name] || name];
                }}
              />
              <Legend />
              <Bar dataKey="habits" name="Habits" fill="hsl(var(--success))" radius={[2, 2, 0, 0]} />
              <Bar dataKey="tasks" name="Tasks" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
              <Bar dataKey="pomodoros" name="🍅" fill="hsl(var(--destructive))" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
