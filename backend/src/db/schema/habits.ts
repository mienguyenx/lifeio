import {
  boolean,
  date,
  integer,
  pgTable,
  text,
  time,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { habitFrequency, lifeArea } from './enums';
import { users } from './auth';

export const habits = pgTable('habits', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  area: lifeArea('area').notNull(),
  frequency: habitFrequency('frequency').default('daily'),
  customDays: integer('custom_days').array(),
  targetPerDay: integer('target_per_day').default(1),
  targetUnit: text('target_unit'),
  streak: integer('streak').default(0),
  bestStreak: integer('best_streak').default(0),
  completedDates: text('completed_dates').array(),
  reminderTime: time('reminder_time'),
  reminderEnabled: boolean('reminder_enabled').default(false),
  color: text('color'),
  icon: text('icon'),
  goalId: uuid('goal_id'),
  targetDays: integer('target_days'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const habitCompletions = pgTable('habit_completions', {
  id: uuid('id').defaultRandom().primaryKey(),
  habitId: uuid('habit_id')
    .notNull()
    .references(() => habits.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  count: integer('count').default(1),
  notes: text('notes'),
  completionTime: time('completion_time'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
