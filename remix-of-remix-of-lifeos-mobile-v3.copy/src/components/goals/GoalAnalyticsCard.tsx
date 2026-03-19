import { useMemo } from 'react';
import { Target, TrendingUp, AlertTriangle, CheckCircle2, Clock, Flag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { differenceInDays, parseISO, isPast } from 'date-fns';
import type { Goal } from '@/types/lifeos';
import { LIFE_AREAS } from '@/types/lifeos';

interface GoalAnalyticsCardProps {
  goals: Goal[];
}

export function GoalAnalyticsCard({ goals }: GoalAnalyticsCardProps) {
  const analytics = useMemo(() => {
    const activeGoals = goals.filter(g => !g.completedAt);
    const completedGoals = goals.filter(g => g.completedAt);
    const today = new Date();

    // Urgency stats
    let overdueCount = 0;
    let approachingCount = 0;
    let onTrackCount = 0;

    activeGoals.forEach(g => {
      if (!g.targetDate) {
        onTrackCount++;
        return;
      }
      const targetDate = parseISO(g.targetDate);
      const daysRemaining = differenceInDays(targetDate, today);
      
      if (isPast(targetDate)) {
        overdueCount++;
      } else if (daysRemaining <= 7) {
        approachingCount++;
      } else {
        onTrackCount++;
      }
    });

    // Progress distribution
    const progressBuckets = {
      low: activeGoals.filter(g => g.progress < 25).length,
      medium: activeGoals.filter(g => g.progress >= 25 && g.progress < 50).length,
      good: activeGoals.filter(g => g.progress >= 50 && g.progress < 75).length,
      high: activeGoals.filter(g => g.progress >= 75 && g.progress < 100).length,
    };

    // Area distribution
    const areaStats = LIFE_AREAS.map(area => ({
      ...area,
      count: goals.filter(g => g.area === area.id).length,
      completed: goals.filter(g => g.area === area.id && g.completedAt).length,
      avgProgress: Math.round(
        activeGoals.filter(g => g.area === area.id).reduce((sum, g) => sum + g.progress, 0) / 
        (activeGoals.filter(g => g.area === area.id).length || 1)
      ),
    })).filter(a => a.count > 0).sort((a, b) => b.count - a.count);

    // Average progress
    const avgProgress = activeGoals.length > 0
      ? Math.round(activeGoals.reduce((sum, g) => sum + g.progress, 0) / activeGoals.length)
      : 0;

    // Completion rate
    const completionRate = goals.length > 0
      ? Math.round((completedGoals.length / goals.length) * 100)
      : 0;

    return {
      total: goals.length,
      active: activeGoals.length,
      completed: completedGoals.length,
      overdueCount,
      approachingCount,
      onTrackCount,
      progressBuckets,
      areaStats,
      avgProgress,
      completionRate,
    };
  }, [goals]);

  if (goals.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Phân tích Goals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Overview */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2 rounded-lg bg-secondary">
            <Target className="w-4 h-4 mx-auto text-primary mb-1" />
            <p className="text-lg font-bold">{analytics.active}</p>
            <p className="text-[10px] text-muted-foreground">Đang làm</p>
          </div>
          <div className="p-2 rounded-lg bg-success/10">
            <CheckCircle2 className="w-4 h-4 mx-auto text-success mb-1" />
            <p className="text-lg font-bold text-success">{analytics.completed}</p>
            <p className="text-[10px] text-muted-foreground">Hoàn thành</p>
          </div>
          <div className="p-2 rounded-lg bg-destructive/10">
            <AlertTriangle className="w-4 h-4 mx-auto text-destructive mb-1" />
            <p className="text-lg font-bold text-destructive">{analytics.overdueCount}</p>
            <p className="text-[10px] text-muted-foreground">Quá hạn</p>
          </div>
          <div className="p-2 rounded-lg bg-warning/10">
            <Clock className="w-4 h-4 mx-auto text-warning mb-1" />
            <p className="text-lg font-bold text-warning">{analytics.approachingCount}</p>
            <p className="text-[10px] text-muted-foreground">Sắp hạn</p>
          </div>
        </div>

        {/* Progress Overview */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Tiến độ trung bình</span>
            <span className="font-medium">{analytics.avgProgress}%</span>
          </div>
          <Progress value={analytics.avgProgress} className="h-2" />
        </div>

        {/* Progress Distribution */}
        <div>
          <p className="text-sm text-muted-foreground mb-2">Phân bổ tiến độ</p>
          <div className="flex gap-1 h-6">
            {analytics.progressBuckets.low > 0 && (
              <div 
                className="bg-destructive/60 rounded flex items-center justify-center text-[10px] text-destructive-foreground"
                style={{ flex: analytics.progressBuckets.low }}
                title={`< 25%: ${analytics.progressBuckets.low} goals`}
              >
                {analytics.progressBuckets.low}
              </div>
            )}
            {analytics.progressBuckets.medium > 0 && (
              <div 
                className="bg-warning/60 rounded flex items-center justify-center text-[10px]"
                style={{ flex: analytics.progressBuckets.medium }}
                title={`25-50%: ${analytics.progressBuckets.medium} goals`}
              >
                {analytics.progressBuckets.medium}
              </div>
            )}
            {analytics.progressBuckets.good > 0 && (
              <div 
                className="bg-primary/60 rounded flex items-center justify-center text-[10px] text-primary-foreground"
                style={{ flex: analytics.progressBuckets.good }}
                title={`50-75%: ${analytics.progressBuckets.good} goals`}
              >
                {analytics.progressBuckets.good}
              </div>
            )}
            {analytics.progressBuckets.high > 0 && (
              <div 
                className="bg-success/60 rounded flex items-center justify-center text-[10px] text-success-foreground"
                style={{ flex: analytics.progressBuckets.high }}
                title={`75-100%: ${analytics.progressBuckets.high} goals`}
              >
                {analytics.progressBuckets.high}
              </div>
            )}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Area Distribution */}
        {analytics.areaStats.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Phân bổ theo lĩnh vực</p>
            <div className="space-y-2">
              {analytics.areaStats.slice(0, 5).map((area) => (
                <div key={area.id} className="flex items-center gap-2">
                  <span className="text-sm">{area.icon}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs">
                      <span>{area.name}</span>
                      <span className="text-muted-foreground">{area.completed}/{area.count}</span>
                    </div>
                    <Progress value={area.avgProgress} className="h-1 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completion Rate */}
        <div className="pt-2 border-t flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Tỷ lệ hoàn thành tổng</span>
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-success" />
            <span className="font-bold text-success">{analytics.completionRate}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
