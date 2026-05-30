import type { FastifyPluginAsync } from 'fastify';
import { sql } from 'drizzle-orm';
import { db } from '../db';

const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/health',
    {
      schema: {
        tags: ['system'],
        summary: 'Liveness/readiness probe',
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              db: { type: 'string' },
              uptime: { type: 'number' },
            },
          },
        },
      },
    },
    async () => {
      let dbStatus = 'ok';
      try {
        await db.execute(sql`select 1`);
      } catch {
        dbStatus = 'error';
      }
      return { status: 'ok', db: dbStatus, uptime: process.uptime() };
    },
  );
};

export default healthRoutes;
