import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { lifeArea } from './enums';
import { users } from './auth';

export const notes = pgTable('notes', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  content: text('content'),
  tags: uuid('tags').array(),
  area: lifeArea('area'),
  isPinned: boolean('is_pinned').default(false),
  isFavorite: boolean('is_favorite').default(false),
  color: text('color'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const noteTags = pgTable('note_tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').notNull(),
});
