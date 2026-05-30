import { date, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { lifeArea } from './enums';
import { users } from './auth';

export const journalEntries = pgTable('journal_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  content: text('content').notNull(),
  mood: integer('mood'),
  energy: integer('energy'),
  areas: lifeArea('areas').array(),
  gratitude: text('gratitude').array(),
  tags: uuid('tags').array(),
  images: text('images').array(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const journalTags = pgTable('journal_tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').notNull(),
});
