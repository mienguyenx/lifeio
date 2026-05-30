import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { startOfWeek, endOfWeek, subWeeks, format, parseISO, isWithinInterval, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { TrendingUp, Download } from 'lucide-react';
import { exportToCSV } from '@/utils/exportReport';
import { toast } from 'sonner';

type ViewMode = 'weekly' | 'monthly';

export function ProductivityChart() {
  const tasks = useLifeOSStore((s) => s.tasks);
  const habits = useLifeOSStore((s) => s.habits);
  const goals = useLifeOSStore((s) => s.goals);
  const pomodoroSessions = useLifeOSStore((s) => s.pomodoroSessions);
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');

  const handleExport = () => {
    exportToCSV({ tasks, habits, goals, pomodoroSessions });
    toast.success('Đã xuất báo cáo thành công!');
  };

  const chartData = useMemo(() => {
    const now = new Date();
    
    if (viewMode === 'weekly') {
      // Last 8 weeks data
      const weeks = [];
      for (let i = 7; i >= 0; i--) {
        const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
        const weekEnd = endOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
        
        const completed = tasks.filter(t => 
          t.status === 'done' && 
          t.completedAt && 
          isWithinInterval(parseISO(t.completedAt), { start: weekStart, end: weekEnd })
        ).length;
        
        weeks.push({
          name: format(weekStart, 'dd/MM', { locale: vi }),
          completed,
          label: `Tuần ${format(weekStart, 'dd/MM')} - ${format(weekEnd, 'dd/MM')}`
        });
      }
      return weeks;
    } else {
      // Last 6 months data
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(now, i));
        const monthEnd = endOfMonth(subMonths(now, i));
        
        const completed = tasks.filter(t => 
          t.status === 'done' && 
          t.completedAt && 
          isWithinInterval(parseISO(t.completedAt), { start: monthStart, end: monthEnd })
        ).length;
        
        months.push({
          name: format(monthStart, 'MMM', { locale: vi }),
          completed,
          label: format(monthStart, 'MMMM yyyy', { locale: vi })
        });
      }
      return months;
    }
  }, [tasks, viewMode]);

  const maxValue = Math.max(...chartData.map(d => d.completed), 1);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Xu hướng hoàn thành
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-secondary rounded-lg p-0.5">
              <Button
                variant={viewMode === 'weekly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('weekly')}
                className="h-6 text-xs px-2"
              >
                Tuần
              </Button>
              <Button
                variant={viewMode === 'monthly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('monthly')}
                className="h-6 text-xs px-2"
              >
                Tháng
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="h-6 text-xs px-2 gap-1"
            >
              <Download className="w-3 h-3" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10 }} 
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 10 }} 
                tickLine={false}
                axisLine={false}
                domain={[0, maxValue + 2]}
                className="fill-muted-foreground"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-popover border rounded-lg shadow-lg p-2 text-xs">
                        <p className="font-medium">{payload[0].payload.label}</p>
                        <p className="text-primary">{payload[0].value} task hoàn thành</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="completed" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
