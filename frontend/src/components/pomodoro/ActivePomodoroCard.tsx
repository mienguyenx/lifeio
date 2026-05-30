import { useEffect } from 'react';
import { Play, Pause, SkipForward, Square, Timer } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { usePomodoroStore } from '@/stores/usePomodoroStore';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { cn } from '@/lib/utils';

export function ActivePomodoroCard() {
  const { isRunning, phase, timeRemaining, sessionsCompleted, currentTaskId, pause, resume, skip, reset, tick } = usePomodoroStore();
  const tasks = useLifeOSStore((s) => s.tasks);
  const pomodoroSettings = useLifeOSStore((s) => s.pomodoroSettings);

  const currentTask = currentTaskId ? tasks.find(t => t.id === currentTaskId) : null;

  // Timer tick
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isRunning, tick]);

  // Don't show if no session is active
  if (!isRunning && timeRemaining === pomodoroSettings.workDuration * 60 && sessionsCompleted === 0) {
    return null;
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalTime = phase === 'work' 
    ? pomodoroSettings.workDuration * 60 
    : phase === 'break' 
      ? pomodoroSettings.breakDuration * 60 
      : pomodoroSettings.longBreakDuration * 60;
  
  const progress = ((totalTime - timeRemaining) / totalTime) * 100;

  const phaseLabel = phase === 'work' ? 'Làm việc' : phase === 'break' ? 'Nghỉ ngắn' : 'Nghỉ dài';
  const phaseColor = phase === 'work' ? 'text-pomodoro-work' : 'text-success';
  const phaseBg = phase === 'work' ? 'from-pomodoro-work/20 to-pomodoro-work/5' : 'from-success/20 to-success/5';

  return (
    <Card className={cn('bg-gradient-to-br border-2', phaseBg, phase === 'work' ? 'border-pomodoro-work/30' : 'border-success/30')}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Timer Display */}
          <div className="relative">
            <div className={cn('w-20 h-20 rounded-full flex items-center justify-center border-4', phase === 'work' ? 'border-pomodoro-work/30 bg-pomodoro-work/10' : 'border-success/30 bg-success/10')}>
              <span className={cn('text-2xl font-bold font-mono', phaseColor)}>
                {formatTime(timeRemaining)}
              </span>
            </div>
            {isRunning && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-pomodoro-work rounded-full animate-pulse" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Timer className={cn('w-4 h-4', phaseColor)} />
              <span className={cn('font-semibold', phaseColor)}>{phaseLabel}</span>
              <span className="text-xs text-muted-foreground">• Session {sessionsCompleted + 1}</span>
            </div>
            
            {currentTask && (
              <p className="text-sm text-muted-foreground truncate mb-2">
                📋 {currentTask.title}
              </p>
            )}

            <Progress value={progress} className="h-2" />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            {isRunning ? (
              <Button variant="outline" size="icon" onClick={pause} className="h-10 w-10">
                <Pause className="w-5 h-5" />
              </Button>
            ) : (
              <Button variant="outline" size="icon" onClick={resume} className="h-10 w-10">
                <Play className="w-5 h-5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={skip} className="h-10 w-10">
              <SkipForward className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={reset} className="h-10 w-10 text-destructive">
              <Square className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
