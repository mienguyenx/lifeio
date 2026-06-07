import { createHash, randomBytes } from 'node:crypto';

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

// Agent token format: `lifeos_<prefix>_<secret>`. We store only the prefix (for lookup)
// and the sha256 of the full token. The raw token is shown to the user exactly once.
export function generateAgentToken(): { token: string; prefix: string; hash: string } {
  const prefix = randomBytes(6).toString('hex');
  const secret = randomToken(24);
  const token = `lifeos_${prefix}_${secret}`;
  return { token, prefix, hash: sha256(token) };
}

export function parseAgentTokenPrefix(token: string): string | null {
  const match = /^lifeos_([a-f0-9]{12})_/.exec(token);
  return match ? match[1] : null;
}
