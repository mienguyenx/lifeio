import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import Fastify, { type FastifyInstance } from 'fastify';
import { env } from './env';
import { HttpError } from './lib/errors';
import authPlugin from './plugins/auth';
import agentTokenRoutes from './routes/agentTokens';
import authRoutes from './routes/auth';
import goalRoutes from './routes/goals';
import habitRoutes from './routes/habits';
import healthRoutes from './routes/health';
import journalRoutes from './routes/journal';
import noteRoutes from './routes/notes';
import profileRoutes from './routes/profiles';
import taskRoutes from './routes/tasks';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: { level: env.NODE_ENV === 'production' ? 'info' : 'debug' },
  });

  await app.register(cors, {
    origin: env.CORS_ORIGINS === '*' ? true : env.CORS_ORIGINS.split(',').map((o) => o.trim()),
    credentials: true,
  });

  await app.register(rateLimit, { max: 300, timeWindow: '1 minute' });

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'LifeOS API',
        description: 'Standalone REST API for the LifeOS app and AI agents (replaces Supabase).',
        version: '0.1.0',
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            description: 'JWT access token (users) or `lifeos_...` agent token (AI agents).',
          },
        },
      },
    },
  });

  await app.register(swaggerUi, { routePrefix: '/documentation' });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof HttpError) {
      return reply.code(error.statusCode).send({ error: error.message, statusCode: error.statusCode });
    }
    if (error.validation) {
      return reply.code(400).send({ error: error.message, statusCode: 400 });
    }
    if (error.statusCode && error.statusCode < 500) {
      return reply.code(error.statusCode).send({ error: error.message, statusCode: error.statusCode });
    }
    request.log.error(error);
    return reply.code(500).send({ error: 'Internal Server Error', statusCode: 500 });
  });

  await app.register(authPlugin);

  await app.register(
    async (api) => {
      await api.register(healthRoutes);
      await api.register(authRoutes);
      await api.register(agentTokenRoutes);
      await api.register(profileRoutes);
      await api.register(taskRoutes);
      await api.register(habitRoutes);
      await api.register(goalRoutes);
      await api.register(journalRoutes);
      await api.register(noteRoutes);
    },
    { prefix: '/api/v1' },
  );

  return app;
}
