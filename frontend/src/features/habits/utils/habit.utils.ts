import { getTodayDateString } from '@/utils/dateUtils';
import { LIFE_AREAS, type Habit } from '@/types/lifeos';
import type { ChallengeType, HabitFormValue } from '../types/habit.types';

/* Ngày dạng yyyy-MM-dd theo múi giờ app (GMT+7, giống store). Tính toán thuần chuỗi để tránh lệch TZ. */
export const todayKey = () => getTodayDateString();
export function addDaysKey(key: string, n: number) {
  const [y, m, d] = key.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
}
export const weekdayOf = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = CN
};
export const lastNDays = (n: number, end = todayKey()) => Array.from({ length: n }, (_, i) => addDaysKey(end, i - (n - 1)));
export function weekOf(key: string) {
  const offset = (weekdayOf(key) + 6) % 7; // T2 = 0
  return Array.from({ length: 7 }, (_, i) => addDaysKey(key, i - offset));
}
export const dayNum = (key: string) => Number(key.slice(8, 10));
export const WEEKDAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export const targetOf = (h: Habit) => h.targetPerDay || 1;
export const countOn = (h: Habit, date: string) => {
  const c = h.completions?.find((x) => x.date === date);
  return c?.count || (h.completedDates.includes(date) ? 1 : 0);
};
export const isDoneOn = (h: Habit, date: string) => countOn(h, date) >= targetOf(h);
export const rateIn = (h: Habit, days: string[]) => (days.length ? Math.round((days.filter((d) => isDoneOn(h, d)).length / days.length) * 100) : 0);

export const areaInfo = (h: Pick<Habit, 'area'>) => LIFE_AREAS.find((a) => a.id === h.area);
/** Màu chủ đạo: habit.color (nếu người dùng chọn) → màu lĩnh vực. */
export const habitColor = (h: Pick<Habit, 'area' | 'color'>) => h.color || `hsl(var(--area-${h.area}))`;
export const habitTint = (h: Pick<Habit, 'area' | 'color'>, a = 0.14) =>
  h.color ? `color-mix(in srgb, ${h.color} ${Math.round(a * 100)}%, transparent)` : `hsl(var(--area-${h.area}) / ${a})`;

export const FREQUENCY_LABEL: Record<Habit['frequency'], string> = { daily: 'Hàng ngày', weekly: 'Hàng tuần', custom: 'Tùy chỉnh' };

export function progressLabel(h: Habit, date: string) {
  const t = targetOf(h), n = countOn(h, date);
  if (t > 1) return `${n}/${t} ${h.targetUnit || 'lần'}`;
  return n >= 1 ? 'Đã hoàn thành' : 'Chưa thực hiện';
}

/* Thử thách — cùng model & cách tính với HabitChallengesCard */
export const CHALLENGES: Record<ChallengeType, { days: number; name: string; desc: string; emoji: string }> = {
  '21-day': { days: 21, name: 'Thử thách 21 ngày', desc: 'Tạo thói quen mới', emoji: '🌱' },
  '30-day': { days: 30, name: 'Thử thách 30 ngày', desc: 'Củng cố thói quen', emoji: '🔥' },
  '66-day': { days: 66, name: 'Thử thách 66 ngày', desc: 'Biến thành thói quen tự động', emoji: '🏆' },
};
export function challengeProgress(h: Habit) {
  if (!h.challenge) return { days: 0, total: 0, pct: 0 };
  const total = CHALLENGES[h.challenge.type].days;
  const today = todayKey();
  let days = 0;
  for (let i = 0; i < total; i++) {
    const d = addDaysKey(h.challenge.startDate, i);
    if (d > today) break;
    if (h.completedDates.includes(d)) days++;
  }
  return { days, total, pct: Math.round((days / total) * 100) };
}

export const EMPTY_FORM: HabitFormValue = {
  name: '', description: '', icon: '💧', color: '', area: 'health', frequency: 'daily', customDays: [],
  targetPerDay: 1, targetUnit: '', reminderEnabled: false, reminderTime: '', goalId: '', targetDays: 30, minimumVersion: '',
};

export function formFromHabit(h: Habit): HabitFormValue {
  return {
    name: h.name, description: h.description ?? '', icon: h.icon ?? areaInfo(h)?.icon ?? '✨', color: h.color ?? '',
    area: h.area, frequency: h.frequency, customDays: h.customDays ?? [], targetPerDay: h.targetPerDay || 1,
    targetUnit: h.targetUnit ?? '', reminderEnabled: !!h.reminderEnabled, reminderTime: h.reminderTime ?? '',
    goalId: h.goalId ?? '', targetDays: h.targetDays ?? 30, minimumVersion: h.minimumVersion ?? '',
  };
}

export function habitFromForm(f: HabitFormValue) {
  return {
    name: f.name.trim(),
    description: f.description.trim() || undefined,
    icon: f.icon || undefined,
    color: f.color || undefined,
    area: f.area,
    frequency: f.frequency,
    customDays: f.frequency === 'weekly' ? f.customDays : undefined,
    targetPerDay: f.targetPerDay > 1 ? f.targetPerDay : undefined,
    targetUnit: f.targetUnit || undefined,
    reminderTime: f.reminderTime || undefined,
    reminderEnabled: f.reminderTime ? f.reminderEnabled : undefined,
    goalId: f.goalId || undefined,
    targetDays: f.goalId ? f.targetDays : undefined,
    minimumVersion: f.minimumVersion.trim() || undefined,
  };
}
