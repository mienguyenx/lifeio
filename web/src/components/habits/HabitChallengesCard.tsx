import { useMemo } from 'react';
import { Trophy, Target, Flame, Award, Zap, Star, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import type { Habit, HabitChallenge } from '@/types/lifeos';

interface HabitChallengesCardProps {
  habits: Habit[];
  compact?: boolean;
}

const CHALLENGE_INFO = {
  '21-day': { days: 21, name: '21 Ngày', description: 'Tạo thói quen mới', icon: Target, color: 'text-info' },
  '30-day': { days: 30, name: '30 Ngày', description: 'Củng cố thói quen', icon: Flame, color: 'text-warning' },
  '66-day': { days: 66, name: '66 Ngày', description: 'Thói quen tự động', icon: Trophy, color: 'text-success' },
};

export function HabitChallengesCard({ habits, compact = false }: HabitChallengesCardProps) {
  const updateHabit = useLifeOSStore((s) => s.updateHabit);
  
  const activeChallenges = useMemo(() => 
    habits.filter(h => !h.deletedAt && h.challenge && h.challenge.status === 'active')
  , [habits]);

  const completedChallenges = useMemo(() => 
    habits.filter(h => !h.deletedAt && h.challenge && h.challenge.status === 'completed')
  , [habits]);

  const habitsWithoutChallenge = useMemo(() => 
    habits.filter(h => !h.archivedAt && !h.deletedAt && (!h.challenge || h.challenge.status === 'failed'))
  , [habits]);

  const startChallenge = (habitId: string, type: '21-day' | '30-day' | '66-day') => {
    const challenge: HabitChallenge = {
      id: crypto.randomUUID(),
      habitId,
      type,
      startDate: new Date().toISOString().split('T')[0],
      completedDays: 0,
      status: 'active',
    };
    updateHabit(habitId, { challenge });
  };

  // Calculate progress for active challenges
  const getChallengeProgress = (habit: Habit) => {
    if (!habit.challenge) return { days: 0, percentage: 0 };
    const info = CHALLENGE_INFO[habit.challenge.type];
    const startDate = new Date(habit.challenge.startDate);
    const today = new Date();
    
    // Count completed days since challenge started
    let completedDays = 0;
    for (let i = 0; i < info.days; i++) {
      const checkDate = new Date(startDate);
      checkDate.setDate(checkDate.getDate() + i);
      if (checkDate > today) break;
      const dateStr = checkDate.toISOString().split('T')[0];
      if (habit.completedDates.includes(dateStr)) {
        completedDays++;
      }
    }
    
    return { 
      days: completedDays, 
      percentage: Math.round((completedDays / info.days) * 100) 
    };
  };

  // Get badges earned
  const badges = useMemo(() => {
    const earned: { type: string; count: number; icon: typeof Trophy }[] = [];
    const completed21 = completedChallenges.filter(h => h.challenge?.type === '21-day').length;
    const completed30 = completedChallenges.filter(h => h.challenge?.type === '30-day').length;
    const completed66 = completedChallenges.filter(h => h.challenge?.type === '66-day').length;
    
    if (completed21 > 0) earned.push({ type: '21 Ngày', count: completed21, icon: Award });
    if (completed30 > 0) earned.push({ type: '30 Ngày', count: completed30, icon: Star });
    if (completed66 > 0) earned.push({ type: '66 Ngày', count: completed66, icon: Trophy });
    
    return earned;
  }, [completedChallenges]);

  if (habits.filter(h => !h.archivedAt && !h.deletedAt).length === 0) return null;

  // Compact mode for sidebar - no Card wrapper
  if (compact) {
    return (
      <div className="space-y-3">
        {/* Active Challenges */}
        {activeChallenges.length > 0 && (
          <div className="space-y-2">
            {activeChallenges.slice(0, 2).map((habit) => {
              const info = CHALLENGE_INFO[habit.challenge!.type];
              const progress = getChallengeProgress(habit);
              const Icon = info.icon;
              
              return (
                <div key={habit.id} className="space-y-1 p-2 rounded-lg bg-secondary/50">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 min-w-0">
                      <Icon className={cn('w-3 h-3 shrink-0', info.color)} />
                      <span className="text-xs font-medium truncate">{habit.name}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] h-5 shrink-0">
                      {progress.days}/{info.days}
                    </Badge>
                  </div>
                  <Progress value={progress.percentage} className="h-1.5" />
                </div>
              );
            })}
            {activeChallenges.length > 2 && (
              <p className="text-xs text-muted-foreground text-center">
                +{activeChallenges.length - 2} thử thách khác
              </p>
            )}
          </div>
        )}

        {/* Start New Challenge */}
        {habitsWithoutChallenge.length > 0 && activeChallenges.length === 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Bắt đầu thử thách:</p>
            {habitsWithoutChallenge.slice(0, 2).map((habit) => (
              <div key={habit.id} className="flex items-center gap-1 p-1.5 rounded-lg border min-w-0">
                <span className="text-xs truncate min-w-0 flex-1" title={habit.name}>{habit.name}</span>
                <div className="flex gap-0.5 shrink-0">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-6 w-6 p-0"
                    onClick={() => startChallenge(habit.id, '21-day')}
                    title="21 ngày"
                  >
                    <Zap className="w-3 h-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-6 w-6 p-0"
                    onClick={() => startChallenge(habit.id, '30-day')}
                    title="30 ngày"
                  >
                    <Flame className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {activeChallenges.length === 0 && habitsWithoutChallenge.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">
            Không có thử thách
          </p>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="w-5 h-5 text-warning" />
          Habit Challenges
          {badges.length > 0 && (
            <div className="flex gap-1 ml-auto">
              {badges.map((badge) => (
                <Badge key={badge.type} variant="secondary" className="text-xs gap-1">
                  <badge.icon className="w-3 h-3" />
                  {badge.count}
                </Badge>
              ))}
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Active Challenges */}
        {activeChallenges.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Đang thực hiện</p>
            {activeChallenges.map((habit) => {
              const info = CHALLENGE_INFO[habit.challenge!.type];
              const progress = getChallengeProgress(habit);
              const Icon = info.icon;
              
              return (
                <div key={habit.id} className="space-y-2 p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={cn('w-4 h-4', info.color)} />
                      <span className="font-medium">{habit.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {info.name}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={progress.percentage} className="flex-1 h-2" />
                    <span className="text-xs text-muted-foreground w-16 text-right">
                      {progress.days}/{info.days} ngày
                    </span>
                  </div>
                  {progress.percentage >= 100 && (
                    <div className="flex items-center gap-2 text-success text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      Hoàn thành! Nhận badge {info.name}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Start New Challenge */}
        {habitsWithoutChallenge.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Bắt đầu thử thách mới</p>
            <div className="grid gap-2">
              {habitsWithoutChallenge.slice(0, 3).map((habit) => (
                <div key={habit.id} className="flex items-center gap-2 p-2 rounded-lg border min-w-0">
                  <span className="text-sm truncate min-w-0 flex-1" title={habit.name}>{habit.name}</span>
                  <div className="flex gap-1 shrink-0">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 w-7 p-0 text-xs"
                      onClick={() => startChallenge(habit.id, '21-day')}
                      title="Thử thách 21 ngày"
                    >
                      <Zap className="w-3.5 h-3.5" />
                    </Button>
                    <span className="text-xs text-muted-foreground self-center">21</span>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 w-7 p-0 text-xs"
                      onClick={() => startChallenge(habit.id, '30-day')}
                      title="Thử thách 30 ngày"
                    >
                      <Flame className="w-3.5 h-3.5" />
                    </Button>
                    <span className="text-xs text-muted-foreground self-center">30</span>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 w-7 p-0 text-xs"
                      onClick={() => startChallenge(habit.id, '66-day')}
                      title="Thử thách 66 ngày"
                    >
                      <Trophy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {activeChallenges.length === 0 && habitsWithoutChallenge.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Tất cả habits đang trong thử thách hoặc đã lưu trữ
          </p>
        )}
      </CardContent>
    </Card>
  );
}
