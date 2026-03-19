import { useMemo } from 'react';
import { Brain, TrendingUp, TrendingDown, AlertTriangle, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { LIFE_AREAS, type Habit } from '@/types/lifeos';

interface HabitPrediction {
  habitId: string;
  habitName: string;
  area: string;
  predictedCompletion: number; // 0-100
  trend: 'up' | 'down' | 'stable';
  riskLevel: 'low' | 'medium' | 'high';
  suggestion: string;
}

interface HabitPredictionCardProps {
  habits: Habit[];
  compact?: boolean;
}

export function HabitPredictionCard({ habits, compact = false }: HabitPredictionCardProps) {
  const predictions = useMemo(() => {
    const today = new Date();
    const todayDayOfWeek = today.getDay(); // 0 = Sunday
    
    return habits
      .filter(h => !h.archivedAt && !h.deletedAt)
      .map((habit): HabitPrediction => {
        // Get last 30 days
        const last30Days = Array.from({ length: 30 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          return date.toISOString().split('T')[0];
        });
        
        // Get last 7 days and previous 7 days for trend analysis
        const last7Days = last30Days.slice(0, 7);
        const prev7Days = last30Days.slice(7, 14);
        
        const last7Completions = last7Days.filter(d => habit.completedDates.includes(d)).length;
        const prev7Completions = prev7Days.filter(d => habit.completedDates.includes(d)).length;
        
        // Day-of-week pattern analysis
        const dayPatterns: Record<number, { completed: number; total: number }> = {};
        for (let i = 0; i < 7; i++) dayPatterns[i] = { completed: 0, total: 0 };
        
        last30Days.forEach((dateStr) => {
          const date = new Date(dateStr);
          const dayOfWeek = date.getDay();
          dayPatterns[dayOfWeek].total++;
          if (habit.completedDates.includes(dateStr)) {
            dayPatterns[dayOfWeek].completed++;
          }
        });
        
        // Calculate today's pattern-based prediction
        const todayPattern = dayPatterns[todayDayOfWeek];
        const dayPrediction = todayPattern.total > 0 
          ? (todayPattern.completed / todayPattern.total) * 100 
          : 50;
        
        // Calculate recent momentum (exponential weighted)
        const recentRate = (last7Completions / 7) * 100;
        
        // Combined prediction (60% recent momentum + 40% day pattern)
        const predictedCompletion = Math.round(recentRate * 0.6 + dayPrediction * 0.4);
        
        // Trend analysis
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (last7Completions > prev7Completions + 1) trend = 'up';
        else if (last7Completions < prev7Completions - 1) trend = 'down';
        
        // Risk level
        let riskLevel: 'low' | 'medium' | 'high' = 'low';
        if (predictedCompletion < 30) riskLevel = 'high';
        else if (predictedCompletion < 60) riskLevel = 'medium';
        
        // Generate suggestion based on analysis
        let suggestion = '';
        if (riskLevel === 'high' && trend === 'down') {
          suggestion = 'Cần chú ý! Tỷ lệ đang giảm. Thử giảm mục tiêu tạm thời.';
        } else if (riskLevel === 'high') {
          suggestion = 'Khó khăn với habit này? Thử kết hợp với habit khác.';
        } else if (trend === 'up') {
          suggestion = 'Đang tiến bộ tốt! Tiếp tục duy trì.';
        } else if (trend === 'down') {
          suggestion = 'Tỷ lệ giảm nhẹ. Đặt reminder để không quên.';
        } else if (habit.streak >= 7) {
          suggestion = 'Streak ấn tượng! Đừng phá vỡ chuỗi ngày.';
        } else {
          suggestion = todayPattern.completed > todayPattern.total * 0.7 
            ? `Thường hoàn thành tốt vào ${getDayName(todayDayOfWeek)}.`
            : 'Cố gắng duy trì đều đặn mỗi ngày.';
        }
        
        const area = LIFE_AREAS.find(a => a.id === habit.area);
        
        return {
          habitId: habit.id,
          habitName: habit.name,
          area: area?.name || habit.area,
          predictedCompletion,
          trend,
          riskLevel,
          suggestion,
        };
      })
      .sort((a, b) => a.predictedCompletion - b.predictedCompletion); // Show at-risk habits first
  }, [habits]);

  const atRiskHabits = predictions.filter(p => p.riskLevel !== 'low');
  const topPredictions = compact ? predictions.slice(0, 3) : predictions.slice(0, 5);

  if (habits.filter(h => !h.archivedAt).length === 0) return null;

  // Compact mode for sidebar - no Card wrapper
  if (compact) {
    return (
      <div className="space-y-3">
        {/* At-risk summary */}
        {atRiskHabits.length > 0 && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-warning/10 text-warning">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            <p className="text-xs">
              {atRiskHabits.length} habit cần chú ý
            </p>
          </div>
        )}

        {/* Predictions list */}
        <div className="space-y-2">
          {topPredictions.map((pred) => (
            <div key={pred.habitId} className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-xs font-medium truncate">{pred.habitName}</span>
                  {pred.trend === 'up' && <TrendingUp className="w-3 h-3 text-success shrink-0" />}
                  {pred.trend === 'down' && <TrendingDown className="w-3 h-3 text-destructive shrink-0" />}
                </div>
                <span className={cn(
                  'text-xs font-medium shrink-0',
                  pred.predictedCompletion >= 70 ? 'text-success' :
                  pred.predictedCompletion >= 40 ? 'text-warning' : 'text-destructive'
                )}>
                  {pred.predictedCompletion}%
                </span>
              </div>
              <Progress 
                value={pred.predictedCompletion} 
                className={cn(
                  'h-1.5',
                  pred.riskLevel === 'high' && '[&>div]:bg-destructive',
                  pred.riskLevel === 'medium' && '[&>div]:bg-warning'
                )}
              />
            </div>
          ))}
        </div>

        {predictions.length > 3 && (
          <p className="text-xs text-muted-foreground text-center">
            +{predictions.length - 3} habits khác
          </p>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Brain className="w-5 h-5 text-primary" />
          AI Habit Predictor
          <Badge variant="outline" className="ml-auto text-xs">Beta</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* At-risk summary */}
        {atRiskHabits.length > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 text-warning">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <p className="text-sm">
              {atRiskHabits.length} habit{atRiskHabits.length > 1 ? 's' : ''} cần chú ý hôm nay
            </p>
          </div>
        )}

        {/* Predictions list */}
        <div className="space-y-3">
          {topPredictions.map((pred) => (
            <div key={pred.habitId} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium truncate">{pred.habitName}</span>
                  {pred.trend === 'up' && <TrendingUp className="w-4 h-4 text-success shrink-0" />}
                  {pred.trend === 'down' && <TrendingDown className="w-4 h-4 text-destructive shrink-0" />}
                </div>
                <span className={cn(
                  'text-sm font-medium shrink-0',
                  pred.predictedCompletion >= 70 ? 'text-success' :
                  pred.predictedCompletion >= 40 ? 'text-warning' : 'text-destructive'
                )}>
                  {pred.predictedCompletion}%
                </span>
              </div>
              <Progress 
                value={pred.predictedCompletion} 
                className={cn(
                  'h-2',
                  pred.riskLevel === 'high' && '[&>div]:bg-destructive',
                  pred.riskLevel === 'medium' && '[&>div]:bg-warning'
                )}
              />
              <div className="flex items-start gap-1.5">
                <Sparkles className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">{pred.suggestion}</p>
              </div>
            </div>
          ))}
        </div>

        {predictions.length > 5 && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            Và {predictions.length - 5} habits khác...
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function getDayName(dayIndex: number): string {
  const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  return days[dayIndex];
}
