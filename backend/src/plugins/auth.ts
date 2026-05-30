import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../db';
import { agentTokens } from '../db/schema';
import { verifyAccessToken } from '../lib/jwt';
import { parseAgentTokenPrefix, sha256 } from '../lib/tokens';
import { unauthorized } from '../lib/errors';

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  via: 'jwt' | 'agent';
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

function extractBearer(request: FastifyRequest): string | null {
  const header = request.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim();
}

async function resolveUser(token: string): Promise<AuthenticatedUser> {
  if (token.startsWith('lifeos_')) {
    const prefix = parseAgentTokenPrefix(token);
    if (!prefix) throw unauthorized('Invalid agent token');
    const [row] = await db
      .select()
      .from(agentTokens)
      .where(and(eq(agentTokens.prefix, prefix), isNull(agentTokens.revokedAt)))
      .limit(1);
    if (!row || row.tokenHash !== sha256(token)) throw unauthorized('Invalid agent token');
    if (row.expiresAt && row.expiresAt.getTime() < Date.now()) throw unauthorized('Agent token expired');
    await db
      .update(agentTokens)
      .set({ lastUsedAt: new Date() })
      .where(eq(agentTokens.id, row.id));
    return { id: row.userId, email: null, via: 'agent' };
  }

  try {
    const payload = verifyAccessToken(token);
    return { id: payload.sub, email: payload.email, via: 'jwt' };
  } catch {
    throw unauthorized('Invalid or expired access token');
  }
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate('authenticate', async function (request: FastifyRequest) {
    const token = extractBearer(request);
    if (!token) throw unauthorized('Missing Bearer token');
    request.user = await resolveUser(token);
  });
};

export default fp(authPlugin, { name: 'auth' });
