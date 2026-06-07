import type { FastifyPluginAsync } from 'fastify';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '../db';
import { notes } from '../db/schema';
import { getUserId } from '../lib/context';
import { notFound } from '../lib/errors';

type NoteInsert = typeof notes.$inferInsert;

const noteWritable = {
  title: { type: 'string', minLength: 1 },
  content: { type: 'string', nullable: true },
  area: { type: 'string', nullable: true },
  isPinned: { type: 'boolean' },
  isFavorite: { type: 'boolean' },
  color: { type: 'string', nullable: true },
} as const;

function pickNoteFields(body: Record<string, unknown>): Partial<NoteInsert> {
  const out: Partial<NoteInsert> = {};
  for (const key of Object.keys(noteWritable) as (keyof typeof noteWritable)[]) {
    if (body[key] !== undefined) (out as Record<string, unknown>)[key] = body[key];
  }
  return out;
}

const noteRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.authenticate);

  fastify.get(
    '/notes',
    { schema: { tags: ['notes'], summary: 'List notes', security: [{ bearerAuth: [] }] } },
    async (request) => {
      const userId = getUserId(request);
      const rows = await db.select().from(notes).where(eq(notes.userId, userId)).orderBy(desc(notes.updatedAt));
      return { data: rows };
    },
  );

  fastify.post<{ Body: Record<string, unknown> }>(
    '/notes',
    {
      schema: {
        tags: ['notes'],
        summary: 'Create a note',
        security: [{ bearerAuth: [] }],
        body: { type: 'object', required: ['title'], properties: noteWritable, additionalProperties: false },
      },
    },
    async (request, reply) => {
      const userId = getUserId(request);
      const values = { ...pickNoteFields(request.body), userId } as NoteInsert;
      const [row] = await db.insert(notes).values(values).returning();
      return reply.code(201).send(row);
    },
  );

  fastify.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
    '/notes/:id',
    {
      schema: {
        tags: ['notes'],
        summary: 'Update a note',
        security: [{ bearerAuth: [] }],
        params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
        body: { type: 'object', properties: noteWritable, additionalProperties: false },
      },
    },
    async (request) => {
      const userId = getUserId(request);
      const updates = { ...pickNoteFields(request.body), updatedAt: new Date() };
      const [row] = await db
        .update(notes)
        .set(updates)
        .where(and(eq(notes.id, request.params.id), eq(notes.userId, userId)))
        .returning();
      if (!row) throw notFound('Note not found');
      return row;
    },
  );

  fastify.delete<{ Params: { id: string } }>(
    '/notes/:id',
    {
      schema: {
        tags: ['notes'],
        summary: 'Delete a note',
        security: [{ bearerAuth: [] }],
        params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
        response: { 204: { type: 'null' } },
      },
    },
    async (request, reply) => {
      const userId = getUserId(request);
      const [row] = await db
        .delete(notes)
        .where(and(eq(notes.id, request.params.id), eq(notes.userId, userId)))
        .returning({ id: notes.id });
      if (!row) throw notFound('Note not found');
      return reply.code(204).send();
    },
  );
};

export default noteRoutes;
