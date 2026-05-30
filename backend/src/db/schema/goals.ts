import {
  boolean,
  date,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { goalStatus, lifeArea, taskPriority } from './enums';
import { users } from './auth';

export const goals = pgTable('goals', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  area: lifeArea('area').notNull(),
  targetDate: date('target_date'),
  progress: integer('progress').default(0),
  priority: taskPriority('priority').default('medium'),
  status: goalStatus('status').default('active'),
  isFocused: boolean('is_focused').default(false),
  focusedAt: timestamp('focused_at', { withTimezone: true }),
  reminderDays: integer('reminder_days').default(7),
  reminderEnabled: boolean('reminder_enabled').default(false),
  lastReminded: timestamp('last_reminded', { withTimezone: true }),
  currentStreak: integer('current_streak').default(0),
  bestStreak: integer('best_streak').default(0),
  lastActivityDate: date('last_activity_date'),
  isPublic: boolean('is_public').default(false),
  shareCode: text('share_code'),
  pushEnabled: boolean('push_enabled').default(false),
  pushDeadline: boolean('push_deadline').default(false),
  pushWeekly: boolean('push_weekly').default(false),
  dependencies: uuid('dependencies').array(),
  dependents: uuid('dependents').array(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const goalMilestones = pgTable('goal_milestones', {
  id: uuid('id').defaultRandom().primaryKey(),
  goalId: uuid('goal_id')
    .notNull()
    .references(() => goals.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  completed: boolean('completed').default(false),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  taskId: uuid('task_id'),
});
