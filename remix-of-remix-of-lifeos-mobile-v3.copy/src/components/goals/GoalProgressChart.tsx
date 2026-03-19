import { useMemo } from 'react';
import { format, parseISO, subDays, eachDayOfInterval, startOfDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Calendar } from 'lucide-react';
import { Goal, GoalProgressEntry, LIFE_AREAS } from '@/types/lifeos';

interface GoalProgressChartProps {
  goal: Goal;
  days?: number;
}

export function GoalProgressChart({ goal, days = 30 }: GoalProgressChartProps) {
  const area = LIFE_AREAS.find(a => a.id === goal.area);
  
  const chartData = useMemo(() => {
    const today = startOfDay(new Date());
    const startDate = subDays(today, days - 1);
    const dateRange = eachDayOfInterval({ start: startDate, end: today });
    
    // Create a map of progress by date
    const progressMap = new Map<string, number>();
    
    // Add initial progress at creation date
    const createdDate = startOfDay(parseISO(goal.createdAt));
    progressMap.set(format(createdDate, 'yyyy-MM-dd'), 0);
    
    // Add progress history entries
    if (goal.progressHistory) {
      goal.progressHistory.forEach(entry => {
        progressMap.set(entry.date, entry.progress);
      });
    }
    
    // Add milestones completion as progress points
    goal.milestones.forEach(milestone => {
      if (milestone.completed && milestone.completedAt) {
        const completedDate = format(parseISO(milestone.completedAt), 'yyyy-MM-dd');
        const completedCount = goal.milestones.filter(
          m => m.completed && m.completedAt && format(parseISO(m.completedAt), 'yyyy-MM-dd') <= completedDate
        ).length;
        const progressAtDate = Math.round((completedCount / goal.milestones.length) * 100);
        progressMap.set(completedDate, Math.max(progressMap.get(completedDate) || 0, progressAtDate));
      }
    });
    
    // Build chart data with interpolation
    let lastKnownProgress = 0;
    return dateRange.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      if (progressMap.has(dateStr)) {
        lastKnownProgress = progressMap.get(dateStr)!;
      }
      
      // For today, use current progress
      if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
        lastKnownProgress = goal.progress;
      }
      
      return {
        date: dateStr,
        dateLabel: format(date, 'dd/MM', { locale: vi }),
        progress: lastKnownProgress,
      };
    });
  }, [goal, days]);

  const progressChange = chartData.length > 1 
    ? chartData[chartData.length - 1].progress - chartData[0].progress 
    : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Tiến độ theo thời gian
          </span>
          <span className={`text-xs px-2 py-1 rounded-full ${
            progressChange > 0 ? 'bg-success/20 text-success' : 
            progressChange < 0 ? 'bg-destructive/20 text-destructive' : 
            'bg-muted text-muted-foreground'
          }`}>
            {progressChange > 0 ? '+' : ''}{progressChange}% ({days} ngày)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={`gradient-${goal.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={`hsl(var(--${area?.color || 'primary'}))`} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={`hsl(var(--${area?.color || 'primary'}))`} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis 
                dataKey="dateLabel" 
                tick={{ fontSize: 10 }} 
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={[0, 100]} 
                tick={{ fontSize: 10 }} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number) => [`${value}%`, 'Tiến độ']}
                labelFormatter={(label) => `Ngày ${label}`}
              />
              <Area
                type="monotone"
                dataKey="progress"
                stroke={`hsl(var(--${area?.color || 'primary'}))`}
                strokeWidth={2}
                fill={`url(#gradient-${goal.id})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Progress milestones timeline */}
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Mốc tiến độ
          </p>
          <div className="flex flex-wrap gap-2">
            {goal.milestones.filter(m => m.completed).slice(-5).map(milestone => (
              <span 
                key={milestone.id} 
                className="text-xs px-2 py-1 bg-success/20 text-success rounded-full"
              >
                ✓ {milestone.title.length > 20 ? milestone.title.slice(0, 20) + '...' : milestone.title}
              </span>
            ))}
            {goal.milestones.filter(m => m.completed).length === 0 && (
              <span className="text-xs text-muted-foreground">Chưa có milestone hoàn thành</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
