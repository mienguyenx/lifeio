import { pgEnum } from 'drizzle-orm/pg-core';

// Mirrors the enum types from the original Supabase schema so existing data
// remains compatible when migrated into the new standalone Postgres database.

export const appRole = pgEnum('app_role', ['admin', 'moderator', 'user']);

export const lifeArea = pgEnum('life_area', [
  'health',
  'relationships',
  'career',
  'finance',
  'personal',
  'fun',
  'environment',
  'spirituality',
  'learning',
  'contribution',
]);

export const taskPriority = pgEnum('task_priority', ['low', 'medium', 'high']);

export const taskStatus = pgEnum('task_status', ['todo', 'in_progress', 'deferred', 'done']);

export const recurringFrequency = pgEnum('recurring_frequency', ['daily', 'weekly', 'monthly']);

export const habitFrequency = pgEnum('habit_frequency', ['daily', 'weekly', 'custom']);

export const goalStatus = pgEnum('goal_status', ['active', 'paused', 'archived']);
