import { eq } from 'drizzle-orm';
import { db } from '../db';
import { refreshTokens } from '../db/schema';
import { env } from '../env';
import { signAccessToken } from './jwt';
import { randomToken, sha256 } from './tokens';

export interface IssuedSession {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
}

function refreshExpiry(): Date {
  return new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export async function issueSession(userId: string, email: string): Promise<IssuedSession> {
  const accessToken = signAccessToken({ sub: userId, email });
  const refreshToken = randomToken(48);
  await db.insert(refreshTokens).values({
    userId,
    tokenHash: sha256(refreshToken),
    expiresAt: refreshExpiry(),
  });
  return { accessToken, refreshToken, tokenType: 'Bearer' };
}

export async function revokeRefreshToken(refreshToken: string): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.tokenHash, sha256(refreshToken)));
}
