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
import { lifeArea, recurringFrequency, taskPriority, taskStatus } from './enums';
import { users } from './auth';

export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  area: lifeArea('area'),
  priority: taskPriority('priority').default('medium'),
  status: taskStatus('status').default('todo'),
  dueDate: date('due_date'),
  estimatedPomodoros: integer('estimated_pomodoros'),
  completedPomodoros: integer('completed_pomodoros').default(0),
  tags: uuid('tags').array(),
  recurringFrequency: recurringFrequency('recurring_frequency'),
  recurringInterval: integer('recurring_interval'),
  recurringWeekDays: integer('recurring_week_days').array(),
  recurringEndDate: date('recurring_end_date'),
  reminderMinutes: integer('reminder_minutes'),
  reminderTime: time('reminder_time'),
  lastReminded: timestamp('last_reminded', { withTimezone: true }),
  archived: boolean('archived').default(false),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  goalId: uuid('goal_id'),
  milestoneId: uuid('milestone_id'),
  position: integer('position'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const subtasks = pgTable('subtasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  taskId: uuid('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  completed: boolean('completed').default(false),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

export const taskTags = pgTable('task_tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').notNull(),
});
