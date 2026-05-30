import type { FastifyPluginAsync } from 'fastify';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '../db';
import { goalMilestones, goals } from '../db/schema';
import { getUserId } from '../lib/context';
import { notFound } from '../lib/errors';

type GoalInsert = typeof goals.$inferInsert;

const goalWritable = {
  title: { type: 'string', minLength: 1 },
  description: { type: 'string', nullable: true },
  area: { type: 'string' },
  targetDate: { type: 'string', nullable: true },
  progress: { type: 'integer', minimum: 0, maximum: 100 },
  priority: { type: 'string', enum: ['low', 'medium', 'high'] },
  status: { type: 'string', enum: ['active', 'paused', 'archived'] },
  isFocused: { type: 'boolean' },
  reminderEnabled: { type: 'boolean' },
  isPublic: { type: 'boolean' },
} as const;

function pickGoalFields(body: Record<string, unknown>): Partial<GoalInsert> {
  const out: Partial<GoalInsert> = {};
  for (const key of Object.keys(goalWritable) as (keyof typeof goalWritable)[]) {
    if (body[key] !== undefined) (out as Record<string, unknown>)[key] = body[key];
  }
  return out;
}

async function ensureGoalOwned(goalId: string, userId: string) {
  const [row] = await db
    .select({ id: goals.id })
    .from(goals)
    .where(and(eq(goals.id, goalId), eq(goals.userId, userId)))
    .limit(1);
  if (!row) throw notFound('Goal not found');
}

const goalRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.authenticate);

  fastify.get(
    '/goals',
    { schema: { tags: ['goals'], summary: 'List goals', security: [{ bearerAuth: [] }] } },
    async (request) => {
      const userId = getUserId(request);
      const rows = await db.select().from(goals).where(eq(goals.userId, userId)).orderBy(desc(goals.createdAt));
      return { data: rows };
    },
  );

  fastify.get<{ Params: { id: string } }>(
    '/goals/:id',
    {
      schema: {
        tags: ['goals'],
        summary: 'Get a goal with its milestones',
        security: [{ bearerAuth: [] }],
        params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
      },
    },
    async (request) => {
      const userId = getUserId(request);
      const [row] = await db
        .select()
        .from(goals)
        .where(and(eq(goals.id, request.params.id), eq(goals.userId, userId)))
        .limit(1);
      if (!row) throw notFound('Goal not found');
      const milestones = await db.select().from(goalMilestones).where(eq(goalMilestones.goalId, row.id));
      return { ...row, milestones };
    },
  );

  fastify.post<{ Body: Record<string, unknown> }>(
    '/goals',
    {
      schema: {
        tags: ['goals'],
        summary: 'Create a goal',
        security: [{ bearerAuth: [] }],
        body: { type: 'object', required: ['title', 'area'], properties: goalWritable, additionalProperties: false },
      },
    },
    async (request, reply) => {
      const userId = getUserId(request);
      const values = { ...pickGoalFields(request.body), userId } as GoalInsert;
      const [row] = await db.insert(goals).values(values).returning();
      return reply.code(201).send(row);
    },
  );

  fastify.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
    '/goals/:id',
    {
      schema: {
        tags: ['goals'],
        summary: 'Update a goal',
        security: [{ bearerAuth: [] }],
        params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
        body: { type: 'object', properties: goalWritable, additionalProperties: false },
      },
    },
    async (request) => {
      const userId = getUserId(request);
      const updates = pickGoalFields(request.body);
      if (request.body.status === 'archived') updates.archivedAt = new Date();
      const [row] = await db
        .update(goals)
        .set(updates)
        .where(and(eq(goals.id, request.params.id), eq(goals.userId, userId)))
        .returning();
      if (!row) throw notFound('Goal not found');
      return row;
    },
  );

  fastify.delete<{ Params: { id: string } }>(
    '/goals/:id',
    {
      schema: {
        tags: ['goals'],
        summary: 'Delete a goal',
        security: [{ bearerAuth: [] }],
        params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
        response: { 204: { type: 'null' } },
      },
    },
    async (request, reply) => {
      const userId = getUserId(request);
      const [row] = await db
        .delete(goals)
        .where(and(eq(goals.id, request.params.id), eq(goals.userId, userId)))
        .returning({ id: goals.id });
      if (!row) throw notFound('Goal not found');
      return reply.code(204).send();
    },
  );

  fastify.post<{ Params: { id: string }; Body: { title: string } }>(
    '/goals/:id/milestones',
    {
      schema: {
        tags: ['goals'],
        summary: 'Add a milestone to a goal',
        security: [{ bearerAuth: [] }],
        params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
        body: { type: 'object', required: ['title'], properties: { title: { type: 'string', minLength: 1 } } },
      },
    },
    async (request, reply) => {
      const userId = getUserId(request);
      await ensureGoalOwned(request.params.id, userId);
      const [row] = await db
        .insert(goalMilestones)
        .values({ goalId: request.params.id, title: request.body.title })
        .returning();
      return reply.code(201).send(row);
    },
  );
};

export default goalRoutes;
