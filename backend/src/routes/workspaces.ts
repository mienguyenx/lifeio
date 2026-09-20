import type { FastifyPluginAsync } from 'fastify';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { db } from '../db';
import { blocks, pages, workspaceMembers, workspaces } from '../db/schema';
import { getUserId } from '../lib/context';
import { conflict, forbidden, notFound } from '../lib/errors';

type WorkspaceRole = 'owner' | 'editor' | 'viewer';

async function requireWorkspaceAccess(userId: string, workspaceId: string, write = false): Promise<WorkspaceRole> {
  const [membership] = await db
    .select({ role: workspaceMembers.role })
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)))
    .limit(1);
  if (!membership) throw notFound('Workspace not found');
  const role = membership.role as WorkspaceRole;
  if (write && role === 'viewer') throw forbidden('Workspace is read-only');
  return role;
}

async function getAccessiblePage(userId: string, pageId: string, write = false) {
  const [page] = await db.select().from(pages).where(eq(pages.id, pageId)).limit(1);
  if (!page || page.archivedAt) throw notFound('Page not found');
  await requireWorkspaceAccess(userId, page.workspaceId, write);
  return page;
}

const workspacesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.authenticate);

  fastify.get(
    '/workspaces',
    { schema: { tags: ['workspaces'], summary: 'List accessible workspaces', security: [{ bearerAuth: [] }] } },
    async (request) => {
      const userId = getUserId(request);
      const rows = await db
        .select({
          id: workspaces.id,
          name: workspaces.name,
          icon: workspaces.icon,
          ownerId: workspaces.ownerId,
          role: workspaceMembers.role,
          createdAt: workspaces.createdAt,
          updatedAt: workspaces.updatedAt,
        })
        .from(workspaceMembers)
        .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
        .where(eq(workspaceMembers.userId, userId))
        .orderBy(asc(workspaces.createdAt));
      return { data: rows };
    },
  );

  fastify.post<{ Body: { name: string; icon?: string } }>(
    '/workspaces',
    {
      schema: {
        tags: ['workspaces'],
        summary: 'Create a workspace',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['name'],
          properties: { name: { type: 'string', minLength: 1, maxLength: 120 }, icon: { type: 'string', maxLength: 32 } },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const userId = getUserId(request);
      const workspace = await db.transaction(async (tx) => {
        const [created] = await tx
          .insert(workspaces)
          .values({ name: request.body.name.trim(), icon: request.body.icon ?? '🏠', ownerId: userId })
          .returning();
        await tx.insert(workspaceMembers).values({ workspaceId: created.id, userId, role: 'owner' });
        await tx.insert(pages).values({
          workspaceId: created.id,
          createdBy: userId,
          title: 'Getting started',
          icon: '👋',
          position: 0,
        });
        return created;
      });
      return reply.code(201).send(workspace);
    },
  );

  fastify.get<{ Params: { workspaceId: string } }>(
    '/workspaces/:workspaceId/pages',
    {
      schema: {
        tags: ['pages'],
        summary: 'List the page tree for a workspace',
        security: [{ bearerAuth: [] }],
        params: { type: 'object', required: ['workspaceId'], properties: { workspaceId: { type: 'string', format: 'uuid' } } },
      },
    },
    async (request) => {
      const userId = getUserId(request);
      await requireWorkspaceAccess(userId, request.params.workspaceId);
      const rows = await db
        .select()
        .from(pages)
        .where(and(eq(pages.workspaceId, request.params.workspaceId), isNull(pages.archivedAt)))
        .orderBy(asc(pages.position), asc(pages.createdAt));
      return { data: rows };
    },
  );

  fastify.post<{ Params: { workspaceId: string }; Body: { title?: string; icon?: string; parentPageId?: string | null } }>(
    '/workspaces/:workspaceId/pages',
    {
      schema: {
        tags: ['pages'],
        summary: 'Create a page',
        security: [{ bearerAuth: [] }],
        params: { type: 'object', required: ['workspaceId'], properties: { workspaceId: { type: 'string', format: 'uuid' } } },
        body: {
          type: 'object',
          properties: {
            title: { type: 'string', maxLength: 255 },
            icon: { type: 'string', maxLength: 32 },
            parentPageId: { anyOf: [{ type: 'string', format: 'uuid' }, { type: 'null' }] },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const userId = getUserId(request);
      await requireWorkspaceAccess(userId, request.params.workspaceId, true);
      if (request.body.parentPageId) {
        const parent = await getAccessiblePage(userId, request.body.parentPageId);
        if (parent.workspaceId !== request.params.workspaceId) throw forbidden('Parent page belongs to another workspace');
      }
      const [row] = await db
        .insert(pages)
        .values({
          workspaceId: request.params.workspaceId,
          createdBy: userId,
          parentPageId: request.body.parentPageId ?? null,
          title: request.body.title?.trim() || 'Untitled',
          icon: request.body.icon ?? null,
        })
        .returning();
      return reply.code(201).send(row);
    },
  );

  fastify.patch<{ Params: { pageId: string }; Body: { title?: string; icon?: string | null; parentPageId?: string | null; position?: number } }>(
    '/pages/:pageId',
    {
      schema: {
        tags: ['pages'],
        summary: 'Update page metadata',
        security: [{ bearerAuth: [] }],
        params: { type: 'object', required: ['pageId'], properties: { pageId: { type: 'string', format: 'uuid' } } },
        body: {
          type: 'object',
          properties: {
            title: { type: 'string', minLength: 1, maxLength: 255 },
            icon: { anyOf: [{ type: 'string', maxLength: 32 }, { type: 'null' }] },
            parentPageId: { anyOf: [{ type: 'string', format: 'uuid' }, { type: 'null' }] },
            position: { type: 'integer', minimum: 0 },
          },
          additionalProperties: false,
        },
      },
    },
    async (request) => {
      const userId = getUserId(request);
      const current = await getAccessiblePage(userId, request.params.pageId, true);
      if (request.body.parentPageId === current.id) throw conflict('A page cannot be its own parent');
      if (request.body.parentPageId) {
        const parent = await getAccessiblePage(userId, request.body.parentPageId);
        if (parent.workspaceId !== current.workspaceId) throw forbidden('Parent page belongs to another workspace');
      }
      const [row] = await db
        .update(pages)
        .set({ ...request.body, updatedAt: new Date() })
        .where(eq(pages.id, current.id))
        .returning();
      return row;
    },
  );

  fastify.get<{ Params: { pageId: string } }>(
    '/pages/:pageId/blocks',
    {
      schema: {
        tags: ['blocks'],
        summary: 'Get page blocks',
        security: [{ bearerAuth: [] }],
        params: { type: 'object', required: ['pageId'], properties: { pageId: { type: 'string', format: 'uuid' } } },
      },
    },
    async (request) => {
      const userId = getUserId(request);
      const page = await getAccessiblePage(userId, request.params.pageId);
      const rows = await db.select().from(blocks).where(eq(blocks.pageId, page.id)).orderBy(asc(blocks.position));
      return { page, data: rows };
    },
  );

  fastify.put<{
    Params: { pageId: string };
    Body: { baseRevision: number; blocks: Array<{ id?: string; type: string; content: Record<string, unknown>; parentBlockId?: string | null }> };
  }>(
    '/pages/:pageId/blocks',
    {
      schema: {
        tags: ['blocks'],
        summary: 'Atomically replace page blocks',
        security: [{ bearerAuth: [] }],
        params: { type: 'object', required: ['pageId'], properties: { pageId: { type: 'string', format: 'uuid' } } },
        body: {
          type: 'object',
          required: ['baseRevision', 'blocks'],
          properties: {
            baseRevision: { type: 'integer', minimum: 1 },
            blocks: {
              type: 'array',
              maxItems: 2000,
              items: {
                type: 'object',
                required: ['type', 'content'],
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  type: { type: 'string', minLength: 1, maxLength: 64 },
                  content: { type: 'object', additionalProperties: true },
                  parentBlockId: { anyOf: [{ type: 'string', format: 'uuid' }, { type: 'null' }] },
                },
                additionalProperties: false,
              },
            },
          },
          additionalProperties: false,
        },
      },
    },
    async (request) => {
      const userId = getUserId(request);
      const current = await getAccessiblePage(userId, request.params.pageId, true);
      if (current.revision !== request.body.baseRevision) throw conflict('Page changed since it was loaded');

      return db.transaction(async (tx) => {
        const [updated] = await tx
          .update(pages)
          .set({ revision: current.revision + 1, updatedAt: new Date() })
          .where(and(eq(pages.id, current.id), eq(pages.revision, request.body.baseRevision)))
          .returning();
        if (!updated) throw conflict('Page changed since it was loaded');

        await tx.delete(blocks).where(eq(blocks.pageId, current.id));
        if (request.body.blocks.length > 0) {
          await tx.insert(blocks).values(
            request.body.blocks.map((block, position) => ({
              ...(block.id ? { id: block.id } : {}),
              pageId: current.id,
              parentBlockId: block.parentBlockId ?? null,
              type: block.type,
              content: block.content,
              position,
            })),
          );
        }
        const saved = await tx.select().from(blocks).where(eq(blocks.pageId, current.id)).orderBy(asc(blocks.position));
        return { revision: updated.revision, data: saved };
      });
    },
  );
};

export default workspacesRoutes;