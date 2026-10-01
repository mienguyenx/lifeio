import type { Habit, HabitChallenge, LifeArea } from '@/types/lifeos';

export type { Habit, HabitChallenge };
export type HabitFrequency = Habit['frequency'];
export type HabitTab = 'today' | 'insights' | 'challenges';
export type ChallengeType = HabitChallenge['type'];

/** Form state — đúng các trường mà store/sync đang hỗ trợ. */
export interface HabitFormValue {
  name: string;
  description: string;
  icon: string;
  color: string;
  area: LifeArea;
  frequency: HabitFrequency;
  customDays: number[];
  targetPerDay: number;
  targetUnit: string;
  reminderEnabled: boolean;
  reminderTime: string;
  goalId: string;
  targetDays: number;
  minimumVersion: string;
}
