import type { FastifyRequest } from 'fastify';
import { unauthorized } from './errors';

export function getUserId(request: FastifyRequest): string {
  if (!request.user) throw unauthorized();
  return request.user.id;
}
