import type { FastifyPluginAsync } from 'fastify';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { profiles, userSettings } from '../db/schema';
import { getUserId } from '../lib/context';
import { notFound } from '../lib/errors';

type ProfileInsert = typeof profiles.$inferInsert;
type SettingsInsert = typeof userSettings.$inferInsert;

const profileWritable = {
  name: { type: 'string', nullable: true },
  avatarUrl: { type: 'string', nullable: true },
  phone: { type: 'string', nullable: true },
  birthday: { type: 'string', nullable: true },
  timezone: { type: 'string', nullable: true },
  bio: { type: 'string', nullable: true },
  lifePurpose: { type: 'string', nullable: true },
} as const;

const settingsWritable = {
  pomodoroWorkDuration: { type: 'integer' },
  pomodoroBreakDuration: { type: 'integer' },
  pomodoroLongBreakDuration: { type: 'integer' },
  pomodoroSessionsBeforeLongBreak: { type: 'integer' },
  trashAutoCleanupDays: { type: 'integer' },
  trashEnabled: { type: 'boolean' },
} as const;

function pick<T>(body: Record<string, unknown>, keys: readonly string[]): Partial<T> {
  const out: Partial<T> = {};
  for (const key of keys) {
    if (body[key] !== undefined) (out as Record<string, unknown>)[key] = body[key];
  }
  return out;
}

const profileRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.authenticate);

  fastify.get(
    '/profile',
    { schema: { tags: ['profile'], summary: 'Get your profile', security: [{ bearerAuth: [] }] } },
    async (request) => {
      const userId = getUserId(request);
      const [row] = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
      if (!row) throw notFound('Profile not found');
      return row;
    },
  );

  fastify.patch<{ Body: Record<string, unknown> }>(
    '/profile',
    {
      schema: {
        tags: ['profile'],
        summary: 'Update your profile',
        security: [{ bearerAuth: [] }],
        body: { type: 'object', properties: profileWritable, additionalProperties: false },
      },
    },
    async (request) => {
      const userId = getUserId(request);
      const updates = { ...pick<ProfileInsert>(request.body, Object.keys(profileWritable)), updatedAt: new Date() };
      const [row] = await db.update(profiles).set(updates).where(eq(profiles.id, userId)).returning();
      if (!row) throw notFound('Profile not found');
      return row;
    },
  );

  fastify.get(
    '/settings',
    { schema: { tags: ['profile'], summary: 'Get your settings', security: [{ bearerAuth: [] }] } },
    async (request) => {
      const userId = getUserId(request);
      const [row] = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
      if (!row) {
        const [created] = await db.insert(userSettings).values({ userId }).returning();
        return created;
      }
      return row;
    },
  );

  fastify.patch<{ Body: Record<string, unknown> }>(
    '/settings',
    {
      schema: {
        tags: ['profile'],
        summary: 'Update your settings',
        security: [{ bearerAuth: [] }],
        body: { type: 'object', properties: settingsWritable, additionalProperties: false },
      },
    },
    async (request) => {
      const userId = getUserId(request);
      const updates = { ...pick<SettingsInsert>(request.body, Object.keys(settingsWritable)), updatedAt: new Date() };
      const [row] = await db.update(userSettings).set(updates).where(eq(userSettings.userId, userId)).returning();
      if (!row) throw notFound('Settings not found');
      return row;
    },
  );
};

export default profileRoutes;
