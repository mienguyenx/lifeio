import type { FastifyPluginAsync } from 'fastify';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '../db';
import { journalEntries } from '../db/schema';
import { getUserId } from '../lib/context';
import { notFound } from '../lib/errors';

type JournalInsert = typeof journalEntries.$inferInsert;

const journalWritable = {
  date: { type: 'string' },
  content: { type: 'string', minLength: 1 },
  mood: { type: 'integer', minimum: 1, maximum: 5, nullable: true },
  energy: { type: 'integer', minimum: 1, maximum: 5, nullable: true },
  areas: { type: 'array', items: { type: 'string' }, nullable: true },
  gratitude: { type: 'array', items: { type: 'string' }, nullable: true },
  images: { type: 'array', items: { type: 'string' }, nullable: true },
} as const;

function pickJournalFields(body: Record<string, unknown>): Partial<JournalInsert> {
  const out: Partial<JournalInsert> = {};
  for (const key of Object.keys(journalWritable) as (keyof typeof journalWritable)[]) {
    if (body[key] !== undefined) (out as Record<string, unknown>)[key] = body[key];
  }
  return out;
}

const journalRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.authenticate);

  fastify.get(
    '/journal',
    { schema: { tags: ['journal'], summary: 'List journal entries', security: [{ bearerAuth: [] }] } },
    async (request) => {
      const userId = getUserId(request);
      const rows = await db
        .select()
        .from(journalEntries)
        .where(eq(journalEntries.userId, userId))
        .orderBy(desc(journalEntries.date));
      return { data: rows };
    },
  );

  fastify.post<{ Body: Record<string, unknown> }>(
    '/journal',
    {
      schema: {
        tags: ['journal'],
        summary: 'Create a journal entry',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['date', 'content'],
          properties: journalWritable,
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const userId = getUserId(request);
      const values = { ...pickJournalFields(request.body), userId } as JournalInsert;
      const [row] = await db.insert(journalEntries).values(values).returning();
      return reply.code(201).send(row);
    },
  );

  fastify.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
    '/journal/:id',
    {
      schema: {
        tags: ['journal'],
        summary: 'Update a journal entry',
        security: [{ bearerAuth: [] }],
        params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
        body: { type: 'object', properties: journalWritable, additionalProperties: false },
      },
    },
    async (request) => {
      const userId = getUserId(request);
      const [row] = await db
        .update(journalEntries)
        .set(pickJournalFields(request.body))
        .where(and(eq(journalEntries.id, request.params.id), eq(journalEntries.userId, userId)))
        .returning();
      if (!row) throw notFound('Journal entry not found');
      return row;
    },
  );

  fastify.delete<{ Params: { id: string } }>(
    '/journal/:id',
    {
      schema: {
        tags: ['journal'],
        summary: 'Delete a journal entry',
        security: [{ bearerAuth: [] }],
        params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
        response: { 204: { type: 'null' } },
      },
    },
    async (request, reply) => {
      const userId = getUserId(request);
      const [row] = await db
        .delete(journalEntries)
        .where(and(eq(journalEntries.id, request.params.id), eq(journalEntries.userId, userId)))
        .returning({ id: journalEntries.id });
      if (!row) throw notFound('Journal entry not found');
      return reply.code(204).send();
    },
  );
};

export default journalRoutes;
