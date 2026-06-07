import { boolean, date, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { appRole } from './enums';
import { users } from './auth';

export const profiles = pgTable('profiles', {
  id: uuid('id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  email: text('email'),
  phone: text('phone'),
  birthday: date('birthday'),
  timezone: text('timezone').default('Asia/Ho_Chi_Minh'),
  bio: text('bio'),
  lifePurpose: text('life_purpose'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const userRoles = pgTable('user_roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  role: appRole('role').notNull().default('user'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const userSettings = pgTable('user_settings', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  pomodoroWorkDuration: integer('pomodoro_work_duration').default(25),
  pomodoroBreakDuration: integer('pomodoro_break_duration').default(5),
  pomodoroLongBreakDuration: integer('pomodoro_long_break_duration').default(15),
  pomodoroSessionsBeforeLongBreak: integer('pomodoro_sessions_before_long_break').default(4),
  trashAutoCleanupDays: integer('trash_auto_cleanup_days').default(30),
  trashEnabled: boolean('trash_enabled').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
