// Postgres RPC compatibility endpoints under /api/v1/rpc/*. The frontend's
// Supabase shim maps `supabase.rpc(name, args)` here. The AI key-usage RPCs only
// tracked the (admin-only, not-yet-ported) api_keys table, so they are no-ops in
// the new env-based AI model.

import type { FastifyPluginAsync } from 'fastify';
import { badRequest } from '../lib/errors';

const NOOP_RPCS = new Set(['increment_api_key_usage', 'record_api_key_error']);

const rpcRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.authenticate);

  fastify.post<{ Params: { fn: string }; Body: Record<string, unknown> }>(
    '/rpc/:fn',
    { schema: { tags: ['rpc'], summary: 'Postgres RPC compatibility shim', security: [{ bearerAuth: [] }] } },
    async (request, reply) => {
      const { fn } = request.params;
      if (NOOP_RPCS.has(fn)) {
        return reply.send({ data: null, error: null });
      }
      throw badRequest(`RPC '${fn}' is not available`);
    },
  );
};

export default rpcRoutes;
