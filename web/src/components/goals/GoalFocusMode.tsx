import { Focus, Target, CheckCircle2, Clock, Calendar, X, Zap } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { Goal, LIFE_AREAS } from '@/types/lifeos';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface GoalFocusModeProps {
  onViewGoal: (goal: Goal) => void;
}

export function GoalFocusMode({ onViewGoal }: GoalFocusModeProps) {
  const goals = useLifeOSStore(s => s.goals);
  const updateGoal = useLifeOSStore(s => s.updateGoal);

  const focusedGoal = goals.find(g => g.isFocused && !g.completedAt);
  const activeGoals = goals.filter(g => !g.completedAt && g.status !== 'archived');

  const handleSetFocus = (goalId: string) => {
    // Remove focus from all other goals
    goals.forEach(g => {
      if (g.isFocused && g.id !== goalId) {
        updateGoal(g.id, { isFocused: false, focusedAt: undefined });
      }
    });
    
    // Set focus on selected goal
    updateGoal(goalId, { isFocused: true, focusedAt: new Date().toISOString() });
    toast.success('🎯 Đã bật Focus Mode');
  };

  const handleRemoveFocus = () => {
    if (focusedGoal) {
      updateGoal(focusedGoal.id, { isFocused: false, focusedAt: undefined });
      toast.success('Đã tắt Focus Mode');
    }
  };

  if (!focusedGoal) {
    return (
      <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Focus className="w-4 h-4 text-primary" />
            Focus Mode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Chọn một goal để tập trung hoàn thành
          </p>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {activeGoals.slice(0, 5).map(goal => {
              const area = LIFE_AREAS.find(a => a.id === goal.area);
              return (
                <div 
                  key={goal.id}
                  onClick={() => handleSetFocus(goal.id)}
                  className="flex items-center gap-2 p-2 rounded-lg border cursor-pointer hover:bg-primary/10 hover:border-primary/50 transition-all"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: `hsl(var(--${area?.color}) / 0.2)`, color: `hsl(var(--${area?.color}))` }}
                  >
                    {goal.progress}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{goal.title}</p>
                    <p className="text-xs text-muted-foreground">{area?.icon} {area?.name}</p>
                  </div>
                  <Zap className="w-4 h-4 text-muted-foreground" />
                </div>
              );
            })}
            {activeGoals.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                Chưa có goal nào đang hoạt động
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const area = LIFE_AREAS.find(a => a.id === focusedGoal.area);
  const completedMilestones = focusedGoal.milestones.filter(m => m.completed).length;
  const hasTargetDate = !!focusedGoal.targetDate;
  const targetDate = hasTargetDate ? parseISO(focusedGoal.targetDate!) : null;
  const daysRemaining = targetDate ? differenceInDays(targetDate, new Date()) : null;
  const focusedDays = focusedGoal.focusedAt 
    ? differenceInDays(new Date(), parseISO(focusedGoal.focusedAt)) 
    : 0;

  return (
    <Card className="border-2 border-primary bg-gradient-to-br from-primary/10 to-primary/5 animate-fade-in">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Focus className="w-4 h-4 text-primary animate-pulse" />
            Focus Mode
            <Badge variant="default" className="bg-primary text-xs">
              {focusedDays} ngày
            </Badge>
          </span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRemoveFocus}>
            <X className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Goal Info */}
        <div 
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => onViewGoal(focusedGoal)}
        >
          <div className="relative w-14 h-14 shrink-0">
            <svg className="w-14 h-14 transform -rotate-90">
              <circle cx="28" cy="28" r="24" stroke="hsl(var(--secondary))" strokeWidth="5" fill="none" />
              <circle
                cx="28" cy="28" r="24"
                stroke="hsl(var(--primary))"
                strokeWidth="5"
                fill="none"
                strokeDasharray={`${(focusedGoal.progress / 100) * 150.8} 150.8`}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
              {focusedGoal.progress}%
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base">{focusedGoal.title}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs" style={{ color: `hsl(var(--${area?.color}))` }}>
                {area?.icon} {area?.name}
              </span>
              {hasTargetDate && daysRemaining !== null && (
                <span className={cn(
                  "text-xs flex items-center gap-1",
                  daysRemaining <= 7 ? "text-warning" : "text-muted-foreground"
                )}>
                  <Calendar className="w-3 h-3" />
                  {daysRemaining <= 0 ? 'Đến hạn!' : `${daysRemaining} ngày`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Tiến độ</span>
            <span>{completedMilestones}/{focusedGoal.milestones.length} milestones</span>
          </div>
          <Progress value={focusedGoal.progress} className="h-2" />
        </div>

        {/* Next Milestone */}
        {focusedGoal.milestones.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">Milestone tiếp theo:</p>
            {focusedGoal.milestones.filter(m => !m.completed).slice(0, 2).map(milestone => (
              <div key={milestone.id} className="flex items-center gap-2 text-sm py-1">
                <div className="w-2 h-2 rounded-full bg-primary/50" />
                <span className="truncate">{milestone.title}</span>
              </div>
            ))}
            {focusedGoal.milestones.every(m => m.completed) && (
              <div className="flex items-center gap-2 text-sm text-success">
                <CheckCircle2 className="w-4 h-4" />
                <span>Tất cả milestones đã hoàn thành!</span>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            size="sm" 
            className="flex-1"
            onClick={() => onViewGoal(focusedGoal)}
          >
            <Target className="w-4 h-4 mr-1" /> Xem chi tiết
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
