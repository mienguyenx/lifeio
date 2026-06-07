import type { FastifyPluginAsync } from 'fastify';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../db';
import { passwordResetTokens, profiles, refreshTokens, userRoles, users, userSettings } from '../db/schema';
import { hashPassword, verifyPassword } from '../lib/password';
import { issueSession, revokeRefreshToken } from '../lib/session';
import { randomToken, sha256 } from '../lib/tokens';
import { badRequest, conflict, unauthorized } from '../lib/errors';
import { getUserId } from '../lib/context';
import { env } from '../env';

const sessionResponse = {
  type: 'object',
  properties: {
    accessToken: { type: 'string' },
    refreshToken: { type: 'string' },
    tokenType: { type: 'string' },
    user: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        email: { type: 'string' },
      },
    },
  },
} as const;

const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post<{ Body: { email: string; password: string; name?: string } }>(
    '/auth/signup',
    {
      schema: {
        tags: ['auth'],
        summary: 'Register a new user',
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            name: { type: 'string' },
          },
        },
        response: { 201: sessionResponse },
      },
    },
    async (request, reply) => {
      const email = request.body.email.toLowerCase().trim();
      const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
      if (existing.length > 0) throw conflict('Email already registered');

      const passwordHash = await hashPassword(request.body.password);
      const [user] = await db.insert(users).values({ email, passwordHash }).returning();
      await db.insert(profiles).values({ id: user.id, email, name: request.body.name ?? null });
      await db.insert(userRoles).values({ userId: user.id, role: 'user' });
      await db.insert(userSettings).values({ userId: user.id });

      const session = await issueSession(user.id, user.email);
      return reply.code(201).send({ ...session, user: { id: user.id, email: user.email } });
    },
  );

  fastify.post<{ Body: { email: string; password: string } }>(
    '/auth/login',
    {
      schema: {
        tags: ['auth'],
        summary: 'Login with email and password',
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
        response: { 200: sessionResponse },
      },
    },
    async (request) => {
      const email = request.body.email.toLowerCase().trim();
      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (!user) throw unauthorized('Invalid credentials');
      const ok = await verifyPassword(user.passwordHash, request.body.password);
      if (!ok) throw unauthorized('Invalid credentials');
      const session = await issueSession(user.id, user.email);
      return { ...session, user: { id: user.id, email: user.email } };
    },
  );

  fastify.post<{ Body: { refreshToken: string } }>(
    '/auth/refresh',
    {
      schema: {
        tags: ['auth'],
        summary: 'Exchange a refresh token for a new session (rotates the refresh token)',
        body: {
          type: 'object',
          required: ['refreshToken'],
          properties: { refreshToken: { type: 'string' } },
        },
        response: { 200: sessionResponse },
      },
    },
    async (request) => {
      const hash = sha256(request.body.refreshToken);
      const [row] = await db
        .select()
        .from(refreshTokens)
        .where(and(eq(refreshTokens.tokenHash, hash), isNull(refreshTokens.revokedAt)))
        .limit(1);
      if (!row || row.expiresAt.getTime() < Date.now()) throw unauthorized('Invalid refresh token');

      await db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.id, row.id));
      const [user] = await db.select().from(users).where(eq(users.id, row.userId)).limit(1);
      if (!user) throw unauthorized('Invalid refresh token');
      const session = await issueSession(user.id, user.email);
      return { ...session, user: { id: user.id, email: user.email } };
    },
  );

  fastify.post<{ Body: { refreshToken: string } }>(
    '/auth/logout',
    {
      schema: {
        tags: ['auth'],
        summary: 'Revoke a refresh token',
        body: {
          type: 'object',
          required: ['refreshToken'],
          properties: { refreshToken: { type: 'string' } },
        },
        response: { 204: { type: 'null' } },
      },
    },
    async (request, reply) => {
      await revokeRefreshToken(request.body.refreshToken);
      return reply.code(204).send();
    },
  );

  fastify.get(
    '/auth/me',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['auth'],
        summary: 'Get the currently authenticated user',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request) => {
      const userId = getUserId(request);
      const [user] = await db
        .select({ id: users.id, email: users.email, emailVerified: users.emailVerified, createdAt: users.createdAt })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      const [profile] = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
      const [role] = await db.select({ role: userRoles.role }).from(userRoles).where(eq(userRoles.userId, userId)).limit(1);
      return { user, profile: profile ?? null, role: role?.role ?? 'user' };
    },
  );

  fastify.post<{ Body: { currentPassword: string; email?: string; password?: string } }>(
    '/auth/update',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['auth'],
        summary: 'Update email and/or password',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['currentPassword'],
          properties: {
            currentPassword: { type: 'string' },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
          },
        },
      },
    },
    async (request) => {
      const userId = getUserId(request);
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user) throw unauthorized();
      const ok = await verifyPassword(user.passwordHash, request.body.currentPassword);
      if (!ok) throw unauthorized('Current password is incorrect');

      const updates: Partial<typeof users.$inferInsert> = { updatedAt: new Date() };
      if (request.body.email) updates.email = request.body.email.toLowerCase().trim();
      if (request.body.password) updates.passwordHash = await hashPassword(request.body.password);
      const [updated] = await db.update(users).set(updates).where(eq(users.id, userId)).returning();
      return { id: updated.id, email: updated.email };
    },
  );

  fastify.post<{ Body: { email: string } }>(
    '/auth/reset-password/request',
    {
      schema: {
        tags: ['auth'],
        summary: 'Request a password reset token (emailing is handled in a later phase)',
        body: {
          type: 'object',
          required: ['email'],
          properties: { email: { type: 'string', format: 'email' } },
        },
      },
    },
    async (request) => {
      const email = request.body.email.toLowerCase().trim();
      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      // Always respond 200 to avoid leaking which emails are registered.
      if (!user) return { ok: true };
      const token = randomToken(32);
      await db.insert(passwordResetTokens).values({
        userId: user.id,
        tokenHash: sha256(token),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });
      // TODO(phase-3): send token via email. For now expose only outside production.
      if (env.NODE_ENV !== 'production') return { ok: true, resetToken: token };
      return { ok: true };
    },
  );

  fastify.post<{ Body: { token: string; newPassword: string } }>(
    '/auth/reset-password/confirm',
    {
      schema: {
        tags: ['auth'],
        summary: 'Confirm a password reset using the token',
        body: {
          type: 'object',
          required: ['token', 'newPassword'],
          properties: {
            token: { type: 'string' },
            newPassword: { type: 'string', minLength: 8 },
          },
        },
      },
    },
    async (request) => {
      const hash = sha256(request.body.token);
      const [row] = await db
        .select()
        .from(passwordResetTokens)
        .where(and(eq(passwordResetTokens.tokenHash, hash), isNull(passwordResetTokens.usedAt)))
        .limit(1);
      if (!row || row.expiresAt.getTime() < Date.now()) throw badRequest('Invalid or expired token');
      const passwordHash = await hashPassword(request.body.newPassword);
      await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, row.userId));
      await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, row.id));
      // Revoke all refresh tokens for safety.
      await db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.userId, row.userId));
      return { ok: true };
    },
  );
};

export default authRoutes;
