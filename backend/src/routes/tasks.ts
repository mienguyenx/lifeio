import type { FastifyPluginAsync } from 'fastify';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '../db';
import { subtasks, tasks } from '../db/schema';
import { getUserId } from '../lib/context';
import { notFound } from '../lib/errors';

type TaskInsert = typeof tasks.$inferInsert;

const taskWritable = {
  title: { type: 'string', minLength: 1 },
  description: { type: 'string', nullable: true },
  area: { type: 'string', nullable: true },
  priority: { type: 'string', enum: ['low', 'medium', 'high'] },
  status: { type: 'string', enum: ['todo', 'in_progress', 'deferred', 'done'] },
  dueDate: { type: 'string', nullable: true },
  estimatedPomodoros: { type: 'integer', nullable: true },
  goalId: { type: 'string', nullable: true },
  milestoneId: { type: 'string', nullable: true },
  position: { type: 'integer', nullable: true },
} as const;

function pickTaskFields(body: Record<string, unknown>): Partial<TaskInsert> {
  const out: Partial<TaskInsert> = {};
  for (const key of Object.keys(taskWritable) as (keyof typeof taskWritable)[]) {
    if (body[key] !== undefined) {
      (out as Record<string, unknown>)[key] = body[key];
    }
  }
  return out;
}

const taskRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.authenticate);

  fastify.get(
    '/tasks',
    { schema: { tags: ['tasks'], summary: 'List tasks', security: [{ bearerAuth: [] }] } },
    async (request) => {
      const userId = getUserId(request);
      const rows = await db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(desc(tasks.createdAt));
      return { data: rows };
    },
  );

  fastify.get<{ Params: { id: string } }>(
    '/tasks/:id',
    {
      schema: {
        tags: ['tasks'],
        summary: 'Get a task',
        security: [{ bearerAuth: [] }],
        params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
      },
    },
    async (request) => {
      const userId = getUserId(request);
      const [row] = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, request.params.id), eq(tasks.userId, userId)))
        .limit(1);
      if (!row) throw notFound('Task not found');
      const subs = await db.select().from(subtasks).where(eq(subtasks.taskId, row.id));
      return { ...row, subtasks: subs };
    },
  );

  fastify.post<{ Body: Record<string, unknown> }>(
    '/tasks',
    {
      schema: {
        tags: ['tasks'],
        summary: 'Create a task',
        security: [{ bearerAuth: [] }],
        body: { type: 'object', required: ['title'], properties: taskWritable, additionalProperties: false },
      },
    },
    async (request, reply) => {
      const userId = getUserId(request);
      const values = { ...pickTaskFields(request.body), userId } as TaskInsert;
      const [row] = await db.insert(tasks).values(values).returning();
      return reply.code(201).send(row);
    },
  );

  fastify.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
    '/tasks/:id',
    {
      schema: {
        tags: ['tasks'],
        summary: 'Update a task',
        security: [{ bearerAuth: [] }],
        params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
        body: { type: 'object', properties: taskWritable, additionalProperties: false },
      },
    },
    async (request) => {
      const userId = getUserId(request);
      const updates = pickTaskFields(request.body);
      if (request.body.status === 'done') updates.completedAt = new Date();
      const [row] = await db
        .update(tasks)
        .set(updates)
        .where(and(eq(tasks.id, request.params.id), eq(tasks.userId, userId)))
        .returning();
      if (!row) throw notFound('Task not found');
      return row;
    },
  );

  fastify.delete<{ Params: { id: string } }>(
    '/tasks/:id',
    {
      schema: {
        tags: ['tasks'],
        summary: 'Delete a task',
        security: [{ bearerAuth: [] }],
        params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
        response: { 204: { type: 'null' } },
      },
    },
    async (request, reply) => {
      const userId = getUserId(request);
      const [row] = await db
        .delete(tasks)
        .where(and(eq(tasks.id, request.params.id), eq(tasks.userId, userId)))
        .returning({ id: tasks.id });
      if (!row) throw notFound('Task not found');
      return reply.code(204).send();
    },
  );
};

export default taskRoutes;
