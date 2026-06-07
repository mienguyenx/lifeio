import type { FastifyPluginAsync } from 'fastify';
import { and, eq } from 'drizzle-orm';
import { db } from '../db';
import { agentTokens } from '../db/schema';
import { generateAgentToken } from '../lib/tokens';
import { getUserId } from '../lib/context';
import { notFound } from '../lib/errors';

const agentTokenRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/agent-tokens',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['agent-tokens'],
        summary: 'List your AI-agent API tokens (secrets are never returned)',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request) => {
      const userId = getUserId(request);
      const rows = await db
        .select({
          id: agentTokens.id,
          name: agentTokens.name,
          prefix: agentTokens.prefix,
          lastUsedAt: agentTokens.lastUsedAt,
          expiresAt: agentTokens.expiresAt,
          revokedAt: agentTokens.revokedAt,
          createdAt: agentTokens.createdAt,
        })
        .from(agentTokens)
        .where(eq(agentTokens.userId, userId));
      return { data: rows };
    },
  );

  fastify.post<{ Body: { name: string; expiresInDays?: number } }>(
    '/agent-tokens',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['agent-tokens'],
        summary: 'Create an AI-agent API token (the secret is shown once)',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', minLength: 1 },
            expiresInDays: { type: 'integer', minimum: 1 },
          },
        },
      },
    },
    async (request, reply) => {
      const userId = getUserId(request);
      const { token, prefix, hash } = generateAgentToken();
      const expiresAt = request.body.expiresInDays
        ? new Date(Date.now() + request.body.expiresInDays * 24 * 60 * 60 * 1000)
        : null;
      const [row] = await db
        .insert(agentTokens)
        .values({ userId, name: request.body.name, prefix, tokenHash: hash, expiresAt })
        .returning({ id: agentTokens.id, name: agentTokens.name, prefix: agentTokens.prefix, expiresAt: agentTokens.expiresAt });
      return reply.code(201).send({ ...row, token });
    },
  );

  fastify.delete<{ Params: { id: string } }>(
    '/agent-tokens/:id',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['agent-tokens'],
        summary: 'Revoke an AI-agent API token',
        security: [{ bearerAuth: [] }],
        params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
        response: { 204: { type: 'null' } },
      },
    },
    async (request, reply) => {
      const userId = getUserId(request);
      const [row] = await db
        .update(agentTokens)
        .set({ revokedAt: new Date() })
        .where(and(eq(agentTokens.id, request.params.id), eq(agentTokens.userId, userId)))
        .returning({ id: agentTokens.id });
      if (!row) throw notFound('Token not found');
      return reply.code(204).send();
    },
  );
};

export default agentTokenRoutes;
