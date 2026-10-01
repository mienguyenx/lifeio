import { useCallback, useMemo, useRef } from 'react';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useSyncedStore } from '@/hooks/useSyncedStore';
import type { Habit, HabitChallenge } from '@/types/lifeos';
import type { ChallengeType } from '../types/habit.types';
import { isDoneOn, lastNDays, rateIn, todayKey } from '../utils/habit.utils';

/** Dữ liệu + hành động cho module Habits — bọc useLifeOSStore/useSyncedStore, không thêm logic nghiệp vụ mới. */
export function useHabits() {
  const habits = useLifeOSStore((s) => s.habits);
  const goals = useLifeOSStore((s) => s.goals);
  const synced = useSyncedStore();
  const processing = useRef(new Set<string>());

  const active = useMemo(() => habits.filter((h) => !h.archivedAt && !h.deletedAt), [habits]);
  const archived = useMemo(() => habits.filter((h) => h.archivedAt && !h.deletedAt), [habits]);

  const today = todayKey();
  const last30 = useMemo(() => lastNDays(30), [today]); // eslint-disable-line react-hooks/exhaustive-deps

  const stats = useMemo(() => {
    const completedToday = active.filter((h) => isDoneOn(h, today)).length;
    return {
      total: active.length,
      completedToday,
      pctToday: active.length ? Math.round((completedToday / active.length) * 100) : 0,
      currentStreak: active.reduce((m, h) => Math.max(m, h.streak), 0),
      bestStreak: active.reduce((m, h) => Math.max(m, h.bestStreak || h.streak), 0),
      totalStreak: active.reduce((s, h) => s + h.streak, 0),
      rate30: active.length ? Math.round(active.reduce((s, h) => s + rateIn(h, last30), 0) / active.length) : 0,
    };
  }, [active, today, last30]);

  /** +1 (chống bấm đúp 300ms như trang cũ). */
  const increment = useCallback((h: Habit, date: string, note?: string) => {
    if (processing.current.has(h.id)) return;
    processing.current.add(h.id);
    synced.incrementHabitCompletion(h.id, date, note);
    setTimeout(() => processing.current.delete(h.id), 300);
  }, [synced]);

  /** Bấm nút check: habit 1 lần → bật/tắt; nhiều lần → +1 (đã đủ thì không làm gì). */
  const check = useCallback((h: Habit, date: string) => {
    const target = h.targetPerDay || 1;
    if (isDoneOn(h, date)) {
      if (target === 1) synced.decrementHabitCompletion(h.id, date);
      return;
    }
    increment(h, date);
  }, [increment, synced]);

  const startChallenge = useCallback((habitId: string, type: ChallengeType) => {
    const challenge: HabitChallenge = { id: crypto.randomUUID(), habitId, type, startDate: todayKey(), completedDays: 0, status: 'active' };
    synced.updateHabit(habitId, { challenge });
  }, [synced]);

  return {
    habits, active, archived, goals, stats, today, last30,
    increment, check, startChallenge,
    decrement: (h: Habit, date: string) => synced.decrementHabitCompletion(h.id, date),
    addHabit: synced.addHabit,
    updateHabit: synced.updateHabit,
    deleteHabit: synced.deleteHabit,
    archiveHabit: synced.archiveHabit,
    unarchiveHabit: synced.unarchiveHabit,
  };
}
export type HabitsApi = ReturnType<typeof useHabits>;
