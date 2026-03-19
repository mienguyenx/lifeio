import { useEffect, useState, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, X, Volume2, VolumeX, Bell, ChevronUp, ChevronDown } from 'lucide-react';
import { usePomodoroStore } from '@/stores/usePomodoroStore';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function PomodoroWidget() {
  const { isRunning, phase, timeRemaining, sessionsCompleted, currentTaskId, pause, resume, skip, reset, tick } =
    usePomodoroStore();
  const tasks = useLifeOSStore((s) => s.tasks);
  const pomodoroSettings = useLifeOSStore((s) => s.pomodoroSettings);
  const currentTask = tasks.find((t) => t.id === currentTaskId);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const tickingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        toast.success('Đã bật thông báo!');
      }
    }
  };

  // Timer tick
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isRunning, tick]);

  // Ticking sound when time is running low (last 10 seconds)
  const playTickSound = useCallback(() => {
    if (!soundEnabled) return;
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const audioContext = audioContextRef.current;
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Short tick sound
      oscillator.frequency.value = 1200;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.15;
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.08);
    } catch (e) {
      console.log('Audio not supported');
    }
  }, [soundEnabled]);

  // Play ticking sound in last 10 seconds
  useEffect(() => {
    if (isRunning && timeRemaining <= 10 && timeRemaining > 0 && soundEnabled) {
      playTickSound();
    }
  }, [timeRemaining, isRunning, soundEnabled, playTickSound]);

  // Play sound and vibrate on phase change
  useEffect(() => {
    if (timeRemaining === getPhaseTime(phase) && sessionsCompleted > 0) {
      // Phase just changed
      if (soundEnabled) {
        playNotificationSound();
      }
      
      // Vibrate on mobile
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }

      // Show notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🍅 Pomodoro', {
          body: phase === 'work' ? 'Quay lại làm việc! 💪' : 'Nghỉ ngơi thôi! 🎉',
          icon: '/favicon.ico',
          tag: 'pomodoro',
        });
      }
    }
  }, [phase, timeRemaining, soundEnabled, sessionsCompleted]);

  // Cleanup audio context
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (tickingIntervalRef.current) {
        clearInterval(tickingIntervalRef.current);
      }
    };
  }, []);

  const getPhaseTime = (p: typeof phase) => {
    switch (p) {
      case 'work': return pomodoroSettings.workDuration * 60;
      case 'break': return pomodoroSettings.breakDuration * 60;
      case 'long_break': return pomodoroSettings.longBreakDuration * 60;
    }
  };

  const playNotificationSound = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const audioContext = audioContextRef.current;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = phase === 'work' ? 800 : 600;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.5);
      
      // Second beep
      setTimeout(() => {
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.frequency.value = phase === 'work' ? 1000 : 800;
        osc2.type = 'sine';
        gain2.gain.value = 0.3;
        osc2.start();
        osc2.stop(audioContext.currentTime + 0.3);
      }, 200);
    } catch (e) {
      console.log('Audio not supported');
    }
  };

  const handleToggleCollapse = () => {
    setIsAnimating(true);
    setIsCollapsed(!isCollapsed);
    setTimeout(() => setIsAnimating(false), 400);
  };

  // Don't show if not started
  if (!isRunning && sessionsCompleted === 0 && timeRemaining === getPhaseTime('work')) {
    return null;
  }

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const progress = 1 - (timeRemaining / getPhaseTime(phase));
  const isLowTime = timeRemaining <= 10;

  const phaseColors = {
    work: 'from-pomodoro-work to-pomodoro-work/80',
    break: 'from-pomodoro-break to-pomodoro-break/80',
    long_break: 'from-pomodoro-long-break to-pomodoro-long-break/80',
  };

  const phaseLabels = {
    work: '🍅 Làm việc',
    break: '☕ Nghỉ ngắn',
    long_break: '🌴 Nghỉ dài',
  };

  // Collapsed mini view - positioned at top
  if (isCollapsed) {
    return (
      <div
        className={cn(
          'fixed top-2 left-1/2 -translate-x-1/2 z-50 overflow-hidden cursor-pointer',
          'transition-all duration-400 ease-out',
          isAnimating ? 'animate-scale-in' : ''
        )}
        onClick={handleToggleCollapse}
        style={{
          animation: isAnimating ? 'collapse-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' : undefined
        }}
      >
        <div 
          className={cn(
            'rounded-full shadow-lg border border-white/20 backdrop-blur-sm',
            'transform transition-all duration-300'
          )}
        >
          {/* Progress ring */}
          <div className="relative">
            <svg className="w-16 h-16 -rotate-90 transform">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className="text-white/20"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${progress * 176} 176`}
                strokeLinecap="round"
                className={cn(
                  'text-white transition-all duration-1000',
                  isLowTime && isRunning && 'animate-pulse'
                )}
              />
            </svg>
            <div 
              className={cn(
                'absolute inset-0 rounded-full flex items-center justify-center bg-gradient-to-br',
                phaseColors[phase]
              )}
            >
              <span className={cn(
                'text-sm font-bold tabular-nums text-primary-foreground',
                isLowTime && isRunning && 'animate-pulse'
              )}>
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>
        
        {/* Expand hint */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
          <ChevronDown className="w-4 h-4 text-foreground/50 animate-bounce" />
        </div>
      </div>
    );
  }

  // Full view - positioned at top on mobile, right on desktop
  return (
    <div
      className={cn(
        'fixed z-50 overflow-hidden',
        'border border-white/20 backdrop-blur-sm',
        // Mobile: top center, Desktop: bottom right
        'top-2 left-1/2 -translate-x-1/2 md:top-auto md:left-auto md:translate-x-0 md:bottom-6 md:right-4',
        // Animation
        'transition-all duration-400 ease-out',
        isAnimating ? 'animate-scale-in' : ''
      )}
      style={{
        borderRadius: '1rem',
        animation: isAnimating ? 'expand-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' : undefined
      }}
    >
      {/* Progress bar with glow effect */}
      <div className="h-1 bg-black/20 relative overflow-hidden">
        <div 
          className={cn(
            'h-full bg-white/50 transition-all duration-1000',
            isLowTime && isRunning && 'bg-white animate-pulse'
          )}
          style={{ width: `${progress * 100}%` }}
        />
        {isLowTime && isRunning && (
          <div 
            className="absolute top-0 left-0 h-full bg-white/80 blur-sm"
            style={{ width: `${progress * 100}%` }}
          />
        )}
      </div>

      <div 
        className={cn(
          'p-3 text-primary-foreground bg-gradient-to-br transition-all duration-300',
          phaseColors[phase]
        )}
      >
        <div className="flex items-center gap-3">
          {/* Timer Display with pulse effect when low time */}
          <div className="text-center min-w-[90px] relative">
            <div className={cn(
              'text-3xl font-bold tabular-nums tracking-tight transition-all duration-300',
              isLowTime && isRunning && 'scale-110 animate-pulse'
            )}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            <div className="text-xs opacity-90 font-medium">{phaseLabels[phase]}</div>
            
            {/* Glow effect when low time */}
            {isLowTime && isRunning && (
              <div className="absolute inset-0 bg-white/10 rounded-lg blur-xl animate-pulse pointer-events-none" />
            )}
          </div>

          {/* Controls with hover animations */}
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className={cn(
                'h-9 w-9 text-primary-foreground hover:bg-white/20',
                'transition-all duration-200 hover:scale-110 active:scale-95'
              )}
              onClick={isRunning ? pause : resume}
            >
              {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9 text-primary-foreground hover:bg-white/20 transition-all duration-200 hover:scale-110 active:scale-95"
              onClick={skip}
              title="Bỏ qua"
            >
              <SkipForward className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className={cn(
                'h-9 w-9 text-primary-foreground hover:bg-white/20 transition-all duration-200 hover:scale-110 active:scale-95',
                !soundEnabled && 'opacity-50'
              )}
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            {/* Collapse button */}
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9 text-primary-foreground hover:bg-white/20 transition-all duration-200 hover:scale-110 active:scale-95"
              onClick={handleToggleCollapse}
              title="Thu gọn"
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9 text-primary-foreground hover:bg-white/20 transition-all duration-200 hover:scale-110 active:scale-95"
              onClick={reset}
              title="Đóng"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Task Name & Sessions */}
        <div className="mt-2 flex items-center justify-between text-xs opacity-90">
          <span className="truncate max-w-[140px] font-medium">
            {currentTask?.title || 'Không có task'}
          </span>
          <div className="flex items-center gap-2">
            <span className="bg-white/20 px-2 py-0.5 rounded-full transition-all duration-200 hover:bg-white/30">
              🍅 {sessionsCompleted}
            </span>
            {notificationPermission !== 'granted' && (
              <button
                onClick={requestNotificationPermission}
                className="bg-white/20 px-2 py-0.5 rounded-full hover:bg-white/30 transition-all duration-200"
                title="Bật thông báo"
              >
                <Bell className="w-3 h-3 inline" />
              </button>
            )}
          </div>
        </div>

        {/* Estimated progress for task */}
        {currentTask?.estimatedPomodoros && currentTask.estimatedPomodoros > 0 && (
          <div className="mt-2 pt-2 border-t border-white/20">
            <div className="flex items-center justify-between text-xs">
              <span>Tiến độ task</span>
              <span>{currentTask.completedPomodoros}/{currentTask.estimatedPomodoros} 🍅</span>
            </div>
            <div className="h-1.5 bg-white/20 rounded-full mt-1 overflow-hidden">
              <div 
                className="h-full bg-white/60 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.min(100, (currentTask.completedPomodoros / currentTask.estimatedPomodoros) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Custom keyframes for animations */}
      <style>{`
        @keyframes expand-in {
          0% {
            transform: translateX(-50%) scale(0.5);
            opacity: 0;
            border-radius: 50%;
          }
          50% {
            transform: translateX(-50%) scale(1.05);
          }
          100% {
            transform: translateX(-50%) scale(1);
            opacity: 1;
            border-radius: 1rem;
          }
        }
        
        @keyframes collapse-in {
          0% {
            transform: translateX(-50%) scale(1.2);
            opacity: 0;
          }
          50% {
            transform: translateX(-50%) scale(0.95);
          }
          100% {
            transform: translateX(-50%) scale(1);
            opacity: 1;
          }
        }
        
        @media (min-width: 768px) {
          @keyframes expand-in {
            0% {
              transform: scale(0.5);
              opacity: 0;
              border-radius: 50%;
            }
            50% {
              transform: scale(1.05);
            }
            100% {
              transform: scale(1);
              opacity: 1;
              border-radius: 1rem;
            }
          }
        }
      `}</style>
    </div>
  );
}
