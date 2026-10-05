import { createPublicKey, createVerify, type JsonWebKey } from 'node:crypto';

// Xác thực Google ID token (Google Identity Services) — không cần thư viện ngoài.
// Kiểm tra chữ ký RS256 bằng JWKS của Google, iss, aud (client id), exp, email_verified.

const JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const ISSUERS = new Set(['accounts.google.com', 'https://accounts.google.com']);

interface Jwk extends JsonWebKey { kid: string; alg?: string }
let jwksCache: { keys: Map<string, Jwk>; expiresAt: number } | null = null;

async function getKeys(force = false): Promise<Map<string, Jwk>> {
  if (!force && jwksCache && jwksCache.expiresAt > Date.now()) return jwksCache.keys;
  const res = await fetch(JWKS_URL);
  if (!res.ok) throw new Error(`Google JWKS ${res.status}`);
  const body = (await res.json()) as { keys: Jwk[] };
  const maxAge = Number(/max-age=(\d+)/.exec(res.headers.get('cache-control') ?? '')?.[1] ?? 3600);
  const keys = new Map(body.keys.map((k) => [k.kid, k]));
  jwksCache = { keys, expiresAt: Date.now() + Math.min(maxAge, 86400) * 1000 };
  return keys;
}

const b64url = (s: string) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

export interface GoogleProfile {
  sub: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  picture?: string;
}

export class GoogleTokenError extends Error {}

export async function verifyGoogleIdToken(token: string, audiences: string[], now = Date.now()): Promise<GoogleProfile> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new GoogleTokenError('Malformed token');
  const [h, p, s] = parts;
  let header: { alg?: string; kid?: string };
  let payload: Record<string, unknown>;
  try {
    header = JSON.parse(b64url(h).toString('utf8'));
    payload = JSON.parse(b64url(p).toString('utf8'));
  } catch {
    throw new GoogleTokenError('Malformed token');
  }
  if (header.alg !== 'RS256' || !header.kid) throw new GoogleTokenError('Unsupported token');

  let jwk = (await getKeys()).get(header.kid);
  if (!jwk) jwk = (await getKeys(true)).get(header.kid); // Google xoay khoá
  if (!jwk) throw new GoogleTokenError('Unknown signing key');
  const key = createPublicKey({ key: jwk, format: 'jwk' });
  const ok = createVerify('RSA-SHA256').update(`${h}.${p}`).verify(key, b64url(s));
  if (!ok) throw new GoogleTokenError('Bad signature');

  if (!ISSUERS.has(String(payload.iss))) throw new GoogleTokenError('Bad issuer');
  const aud = String(payload.aud);
  if (!audiences.includes(aud)) throw new GoogleTokenError('Bad audience');
  const exp = Number(payload.exp);
  if (!Number.isFinite(exp) || exp * 1000 < now - 60_000) throw new GoogleTokenError('Token expired');
  const email = typeof payload.email === 'string' ? payload.email.toLowerCase().trim() : '';
  if (!email) throw new GoogleTokenError('No email in token');
  return {
    sub: String(payload.sub),
    email,
    emailVerified: payload.email_verified === true || payload.email_verified === 'true',
    name: typeof payload.name === 'string' ? payload.name : undefined,
    picture: typeof payload.picture === 'string' ? payload.picture : undefined,
  };
}
