import { create } from 'zustand';
import type { PomodoroState, PomodoroPhase } from '@/types/lifeos';
import { useLifeOSStore } from './useLifeOSStore';

interface PomodoroStore extends PomodoroState {
  start: (taskId?: string, customDuration?: number) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  skip: () => void;
  tick: () => void;
  setTask: (taskId?: string) => void;
  customWorkDuration?: number;
}

const getInitialTime = (phase: PomodoroPhase, customDuration?: number): number => {
  if (phase === 'work' && customDuration) {
    return customDuration * 60;
  }
  const settings = useLifeOSStore.getState().pomodoroSettings;
  switch (phase) {
    case 'work':
      return settings.workDuration * 60;
    case 'break':
      return settings.breakDuration * 60;
    case 'long_break':
      return settings.longBreakDuration * 60;
  }
};

export const usePomodoroStore = create<PomodoroStore>((set, get) => ({
  isRunning: false,
  phase: 'work',
  timeRemaining: getInitialTime('work'),
  sessionsCompleted: 0,
  currentTaskId: undefined,
  customWorkDuration: undefined,

  start: (taskId, customDuration) =>
    set({
      isRunning: true,
      currentTaskId: taskId,
      phase: 'work',
      timeRemaining: getInitialTime('work', customDuration),
      customWorkDuration: customDuration,
    }),

  pause: () => set({ isRunning: false }),

  resume: () => set({ isRunning: true }),

  reset: () =>
    set({
      isRunning: false,
      phase: 'work',
      timeRemaining: getInitialTime('work'),
      sessionsCompleted: 0,
      currentTaskId: undefined,
    }),

  skip: () => {
    const { phase, sessionsCompleted, currentTaskId } = get();
    const settings = useLifeOSStore.getState().pomodoroSettings;

    if (phase === 'work') {
      const newSessionsCompleted = sessionsCompleted + 1;
      const isLongBreak = newSessionsCompleted % settings.sessionsBeforeLongBreak === 0;
      const nextPhase: PomodoroPhase = isLongBreak ? 'long_break' : 'break';

      // Record session
      useLifeOSStore.getState().addPomodoroSession({
        taskId: currentTaskId,
        phase: 'work',
        duration: settings.workDuration,
      });

      // Increment task pomodoro if linked
      if (currentTaskId) {
        useLifeOSStore.getState().incrementTaskPomodoro(currentTaskId);
      }

      set({
        phase: nextPhase,
        timeRemaining: getInitialTime(nextPhase),
        sessionsCompleted: newSessionsCompleted,
        isRunning: false,
      });
    } else {
      set({
        phase: 'work',
        timeRemaining: getInitialTime('work'),
        isRunning: false,
      });
    }
  },

  tick: () => {
    const { timeRemaining, isRunning } = get();
    if (!isRunning) return;

    if (timeRemaining <= 1) {
      get().skip();
      // Trigger notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Pomodoro', {
          body: get().phase === 'work' ? 'Nghỉ ngơi thôi! 🎉' : 'Quay lại làm việc! 💪',
          icon: '/favicon.ico',
        });
      }
      // Play sound
      const audio = new Audio('/notification.mp3');
      audio.play().catch(() => {});
    } else {
      set({ timeRemaining: timeRemaining - 1 });
    }
  },

  setTask: (taskId) => set({ currentTaskId: taskId }),
}));
