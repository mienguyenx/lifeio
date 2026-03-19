import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Calendar, ArrowRight, BarChart3 } from 'lucide-react';
import { format, subMonths, isAfter, isBefore, parseISO, differenceInDays, startOfMonth, endOfMonth } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Goal } from '@/types/lifeos';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';

interface GoalPerformanceComparisonProps {
  goals: Goal[];
}

type PeriodType = 'last_month' | 'last_3_months' | 'last_6_months';

interface PeriodStats {
  completed: number;
  avgDays: number;
  avgProgress: number;
  totalProgress: number;
}

export function GoalPerformanceComparison({ goals }: GoalPerformanceComparisonProps) {
  const [comparePeriod, setComparePeriod] = useState<PeriodType>('last_month');
  
  const completedGoals = goals.filter(g => g.completedAt);

  const getPeriodDates = (period: PeriodType, isCurrentPeriod: boolean) => {
    const now = new Date();
    let months: number;
    switch (period) {
      case 'last_month': months = 1; break;
      case 'last_3_months': months = 3; break;
      case 'last_6_months': months = 6; break;
    }
    
    if (isCurrentPeriod) {
      return {
        start: subMonths(now, months),
        end: now,
      };
    } else {
      return {
        start: subMonths(now, months * 2),
        end: subMonths(now, months),
      };
    }
  };

  const getStatsForPeriod = (start: Date, end: Date): PeriodStats => {
    const periodGoals = completedGoals.filter(g => {
      const completedDate = parseISO(g.completedAt!);
      return isAfter(completedDate, start) && isBefore(completedDate, end);
    });

    const totalDays = periodGoals.reduce((sum, g) => {
      return sum + differenceInDays(parseISO(g.completedAt!), parseISO(g.createdAt));
    }, 0);

    return {
      completed: periodGoals.length,
      avgDays: periodGoals.length > 0 ? Math.round(totalDays / periodGoals.length) : 0,
      avgProgress: periodGoals.length > 0 
        ? Math.round(periodGoals.reduce((sum, g) => sum + g.progress, 0) / periodGoals.length)
        : 0,
      totalProgress: periodGoals.reduce((sum, g) => sum + g.progress, 0),
    };
  };

  const comparison = useMemo(() => {
    const currentDates = getPeriodDates(comparePeriod, true);
    const previousDates = getPeriodDates(comparePeriod, false);
    
    const current = getStatsForPeriod(currentDates.start, currentDates.end);
    const previous = getStatsForPeriod(previousDates.start, previousDates.end);
    
    const calculateChange = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 100);
    };

    return {
      current,
      previous,
      changes: {
        completed: calculateChange(current.completed, previous.completed),
        avgDays: previous.avgDays > 0 ? calculateChange(previous.avgDays, current.avgDays) : 0, // Inverted: less days is better
        avgProgress: calculateChange(current.avgProgress, previous.avgProgress),
      },
      currentLabel: format(currentDates.start, 'MMM', { locale: vi }) + ' - ' + format(currentDates.end, 'MMM yyyy', { locale: vi }),
      previousLabel: format(previousDates.start, 'MMM', { locale: vi }) + ' - ' + format(previousDates.end, 'MMM yyyy', { locale: vi }),
    };
  }, [comparePeriod, completedGoals]);

  // Monthly trend data
  const monthlyTrend = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(new Date(), i));
      const monthEnd = endOfMonth(subMonths(new Date(), i));
      
      const monthGoals = completedGoals.filter(g => {
        const completedDate = parseISO(g.completedAt!);
        return isAfter(completedDate, monthStart) && isBefore(completedDate, monthEnd);
      });
      
      months.push({
        month: format(monthStart, 'MMM', { locale: vi }),
        completed: monthGoals.length,
        avgProgress: monthGoals.length > 0 
          ? Math.round(monthGoals.reduce((sum, g) => sum + g.progress, 0) / monthGoals.length)
          : 0,
      });
    }
    return months;
  }, [completedGoals]);

  const TrendIcon = ({ value }: { value: number }) => {
    if (value > 0) return <TrendingUp className="w-4 h-4 text-success" />;
    if (value < 0) return <TrendingDown className="w-4 h-4 text-destructive" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const periodLabels: Record<PeriodType, string> = {
    'last_month': 'Tháng trước',
    'last_3_months': '3 tháng trước',
    'last_6_months': '6 tháng trước',
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            So sánh hiệu suất
          </CardTitle>
          <Select value={comparePeriod} onValueChange={(v: PeriodType) => setComparePeriod(v)}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_month">So với tháng trước</SelectItem>
              <SelectItem value="last_3_months">So với 3 tháng trước</SelectItem>
              <SelectItem value="last_6_months">So với 6 tháng trước</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Period Labels */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span>{comparison.previousLabel}</span>
          <ArrowRight className="w-3 h-3" />
          <span className="font-medium text-foreground">{comparison.currentLabel}</span>
        </div>

        {/* Comparison Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendIcon value={comparison.changes.completed} />
              <span className={cn(
                "text-xs font-medium",
                comparison.changes.completed > 0 && "text-success",
                comparison.changes.completed < 0 && "text-destructive"
              )}>
                {comparison.changes.completed > 0 ? '+' : ''}{comparison.changes.completed}%
              </span>
            </div>
            <p className="text-lg font-bold">{comparison.current.completed}</p>
            <p className="text-[9px] text-muted-foreground">Hoàn thành</p>
            <p className="text-[9px] text-muted-foreground">(trước: {comparison.previous.completed})</p>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendIcon value={comparison.changes.avgDays} />
              <span className={cn(
                "text-xs font-medium",
                comparison.changes.avgDays > 0 && "text-success",
                comparison.changes.avgDays < 0 && "text-destructive"
              )}>
                {comparison.changes.avgDays > 0 ? '+' : ''}{comparison.changes.avgDays}%
              </span>
            </div>
            <p className="text-lg font-bold">{comparison.current.avgDays}</p>
            <p className="text-[9px] text-muted-foreground">Ngày TB</p>
            <p className="text-[9px] text-muted-foreground">(trước: {comparison.previous.avgDays})</p>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendIcon value={comparison.changes.avgProgress} />
              <span className={cn(
                "text-xs font-medium",
                comparison.changes.avgProgress > 0 && "text-success",
                comparison.changes.avgProgress < 0 && "text-destructive"
              )}>
                {comparison.changes.avgProgress > 0 ? '+' : ''}{comparison.changes.avgProgress}%
              </span>
            </div>
            <p className="text-lg font-bold">{comparison.current.avgProgress}%</p>
            <p className="text-[9px] text-muted-foreground">Tiến độ TB</p>
            <p className="text-[9px] text-muted-foreground">(trước: {comparison.previous.avgProgress}%)</p>
          </div>
        </div>

        {/* Trend Chart */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Xu hướng 6 tháng</p>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={monthlyTrend}>
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip 
                contentStyle={{ fontSize: 11 }}
                formatter={(value, name) => [
                  value, 
                  name === 'completed' ? 'Hoàn thành' : 'Tiến độ TB'
                ]}
              />
              <Line 
                type="monotone" 
                dataKey="completed" 
                stroke="hsl(var(--success))" 
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Summary */}
        <div className="text-center pt-2 border-t">
          {comparison.changes.completed > 0 ? (
            <Badge variant="secondary" className="bg-success/20 text-success">
              <TrendingUp className="w-3 h-3 mr-1" />
              Hiệu suất tăng {comparison.changes.completed}%
            </Badge>
          ) : comparison.changes.completed < 0 ? (
            <Badge variant="secondary" className="bg-destructive/20 text-destructive">
              <TrendingDown className="w-3 h-3 mr-1" />
              Hiệu suất giảm {Math.abs(comparison.changes.completed)}%
            </Badge>
          ) : (
            <Badge variant="secondary">
              <Minus className="w-3 h-3 mr-1" />
              Hiệu suất ổn định
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
