import type { FastifyPluginAsync } from 'fastify';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '../db';
import { habitCompletions, habits } from '../db/schema';
import { getUserId } from '../lib/context';
import { notFound } from '../lib/errors';

type HabitInsert = typeof habits.$inferInsert;

const habitWritable = {
  name: { type: 'string', minLength: 1 },
  description: { type: 'string', nullable: true },
  area: { type: 'string' },
  frequency: { type: 'string', enum: ['daily', 'weekly', 'custom'] },
  customDays: { type: 'array', items: { type: 'integer' }, nullable: true },
  targetPerDay: { type: 'integer', nullable: true },
  targetUnit: { type: 'string', nullable: true },
  reminderEnabled: { type: 'boolean' },
  color: { type: 'string', nullable: true },
  icon: { type: 'string', nullable: true },
  goalId: { type: 'string', nullable: true },
  targetDays: { type: 'integer', nullable: true },
} as const;

function pickHabitFields(body: Record<string, unknown>): Partial<HabitInsert> {
  const out: Partial<HabitInsert> = {};
  for (const key of Object.keys(habitWritable) as (keyof typeof habitWritable)[]) {
    if (body[key] !== undefined) (out as Record<string, unknown>)[key] = body[key];
  }
  return out;
}

async function ensureHabitOwned(habitId: string, userId: string) {
  const [row] = await db
    .select({ id: habits.id })
    .from(habits)
    .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))
    .limit(1);
  if (!row) throw notFound('Habit not found');
}

const habitRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.authenticate);

  fastify.get(
    '/habits',
    { schema: { tags: ['habits'], summary: 'List habits', security: [{ bearerAuth: [] }] } },
    async (request) => {
      const userId = getUserId(request);
      const rows = await db.select().from(habits).where(eq(habits.userId, userId)).orderBy(desc(habits.createdAt));
      return { data: rows };
    },
  );

  fastify.post<{ Body: Record<string, unknown> }>(
    '/habits',
    {
      schema: {
        tags: ['habits'],
        summary: 'Create a habit',
        security: [{ bearerAuth: [] }],
        body: { type: 'object', required: ['name', 'area'], properties: habitWritable, additionalProperties: false },
      },
    },
    async (request, reply) => {
      const userId = getUserId(request);
      const values = { ...pickHabitFields(request.body), userId } as HabitInsert;
      const [row] = await db.insert(habits).values(values).returning();
      return reply.code(201).send(row);
    },
  );

  fastify.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
    '/habits/:id',
    {
      schema: {
        tags: ['habits'],
        summary: 'Update a habit',
        security: [{ bearerAuth: [] }],
        params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
        body: { type: 'object', properties: habitWritable, additionalProperties: false },
      },
    },
    async (request) => {
      const userId = getUserId(request);
      const [row] = await db
        .update(habits)
        .set(pickHabitFields(request.body))
        .where(and(eq(habits.id, request.params.id), eq(habits.userId, userId)))
        .returning();
      if (!row) throw notFound('Habit not found');
      return row;
    },
  );

  fastify.delete<{ Params: { id: string } }>(
    '/habits/:id',
    {
      schema: {
        tags: ['habits'],
        summary: 'Delete a habit',
        security: [{ bearerAuth: [] }],
        params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
        response: { 204: { type: 'null' } },
      },
    },
    async (request, reply) => {
      const userId = getUserId(request);
      const [row] = await db
        .delete(habits)
        .where(and(eq(habits.id, request.params.id), eq(habits.userId, userId)))
        .returning({ id: habits.id });
      if (!row) throw notFound('Habit not found');
      return reply.code(204).send();
    },
  );

  fastify.get<{ Params: { id: string } }>(
    '/habits/:id/completions',
    {
      schema: {
        tags: ['habits'],
        summary: 'List completions for a habit',
        security: [{ bearerAuth: [] }],
        params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
      },
    },
    async (request) => {
      const userId = getUserId(request);
      await ensureHabitOwned(request.params.id, userId);
      const rows = await db
        .select()
        .from(habitCompletions)
        .where(eq(habitCompletions.habitId, request.params.id))
        .orderBy(desc(habitCompletions.date));
      return { data: rows };
    },
  );

  fastify.post<{ Params: { id: string }; Body: { date: string; count?: number; notes?: string } }>(
    '/habits/:id/completions',
    {
      schema: {
        tags: ['habits'],
        summary: 'Record a habit completion',
        security: [{ bearerAuth: [] }],
        params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
        body: {
          type: 'object',
          required: ['date'],
          properties: {
            date: { type: 'string' },
            count: { type: 'integer' },
            notes: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const userId = getUserId(request);
      await ensureHabitOwned(request.params.id, userId);
      const [row] = await db
        .insert(habitCompletions)
        .values({
          habitId: request.params.id,
          date: request.body.date,
          count: request.body.count ?? 1,
          notes: request.body.notes ?? null,
        })
        .returning();
      return reply.code(201).send(row);
    },
  );
};

export default habitRoutes;
