import { Flame, CheckCircle2, Play, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface TodayStatsRowProps {
  habitProgress: number;
  completedHabits: number;
  totalHabits: number;
  completedTasks: number;
  todayPomodoros: number;
  topPriorityTask?: { title: string };
}

export function TodayStatsRow({
  habitProgress,
  completedHabits,
  totalHabits,
  completedTasks,
  todayPomodoros,
  topPriorityTask,
}: TodayStatsRowProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-3 text-center">
          <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-primary" />
          <p className="text-lg font-bold">{completedHabits}/{totalHabits}</p>
          <p className="text-[10px] text-muted-foreground"> Habits</p>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
        <CardContent className="p-3 text-center">
          <Target className="w-4 h-4 mx-auto mb-1 text-success" />
          <p className="text-lg font-bold">{completedTasks}</p>
          <p className="text-[10px] text-muted-foreground"> Tasks</p>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-pomodoro-work/10 to-pomodoro-work/5 border-pomodoro-work/20">
        <CardContent className="p-3 text-center">
          <Play className="w-4 h-4 mx-auto mb-1 text-pomodoro-work" />
          <p className="text-lg font-bold">{todayPomodoros}</p>
          <p className="text-[10px] text-muted-foreground"> Pomodoro</p>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
        <CardContent className="p-3 text-center">
          <Flame className="w-4 h-4 mx-auto mb-1 text-warning" />
          <p className="text-lg font-bold">{habitProgress}%</p>
          <p className="text-[10px] text-muted-foreground"> Streak</p>
        </CardContent>
      </Card>
    </div>
  );
}
