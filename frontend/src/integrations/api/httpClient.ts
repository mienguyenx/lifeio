// Lightweight HTTP client for the LifeOS REST API. Handles bearer-token storage,
// transparent access-token refresh on 401, and a small auth-event emitter that the
// Supabase-compatible shim uses to drive `onAuthStateChange`.

export const API_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || 'http://localhost:4000/api/v1';

const SESSION_KEY = 'lifeos.session';

export interface ApiUser {
  id: string;
  email: string | null;
  app_metadata: Record<string, unknown>;
  user_metadata: Record<string, unknown>;
  aud: string;
  created_at: string;
}

export interface ApiSession {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
  expires_at: number; // unix seconds
  expires_in: number;
  user: ApiUser;
}

export type AuthEvent =
  | 'INITIAL_SESSION'
  | 'SIGNED_IN'
  | 'SIGNED_UP'
  | 'SIGNED_OUT'
  | 'TOKEN_REFRESHED'
  | 'USER_UPDATED';

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: string;
}

type Listener = (event: AuthEvent, session: ApiSession | null) => void;

const listeners = new Set<Listener>();
let currentSession: ApiSession | null = loadSession();

function decodeJwtExp(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' ? payload.exp : Math.floor(Date.now() / 1000) + 900;
  } catch {
    return Math.floor(Date.now() / 1000) + 900;
  }
}

function buildUser(raw: { id: string; email?: string | null }): ApiUser {
  return {
    id: raw.id,
    email: raw.email ?? null,
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '',
  };
}

export function buildSession(tokens: {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email?: string | null };
}): ApiSession {
  const exp = decodeJwtExp(tokens.accessToken);
  return {
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    token_type: 'bearer',
    expires_at: exp,
    expires_in: Math.max(0, exp - Math.floor(Date.now() / 1000)),
    user: buildUser(tokens.user),
  };
}

function loadSession(): ApiSession | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ApiSession;
  } catch {
    return null;
  }
}

export function getSession(): ApiSession | null {
  return currentSession;
}

export function setSession(session: ApiSession | null, event: AuthEvent): void {
  currentSession = session;
  if (typeof localStorage !== 'undefined') {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  }
  for (const l of listeners) {
    try {
      l(event, session);
    } catch (err) {
      console.error('[api] auth listener error', err);
    }
  }
}

export function onAuthChange(listener: Listener): () => void {
  listeners.add(listener);
  // Mirror Supabase: emit the current session asynchronously on subscribe.
  setTimeout(() => listener('INITIAL_SESSION', currentSession), 0);
  return () => listeners.delete(listener);
}

let refreshPromise: Promise<boolean> | null = null;

export async function refreshSession(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  const session = currentSession;
  if (!session?.refresh_token) return false;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken: session.refresh_token }),
      });
      if (!res.ok) {
        setSession(null, 'SIGNED_OUT');
        return false;
      }
      const data = (await res.json()) as {
        accessToken: string;
        refreshToken: string;
        user: { id: string; email: string };
      };
      setSession(buildSession(data), 'TOKEN_REFRESHED');
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

export async function ensureValidSession(): Promise<boolean> {
  const session = currentSession;
  if (!session) return false;
  const now = Math.floor(Date.now() / 1000);
  if (session.expires_at - now < 60) {
    return refreshSession();
  }
  return true;
}

export interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
  retryOn401?: boolean;
}

export class HttpError extends Error {
  code?: string;
  status: number;
  details?: string;
  constructor(err: ApiError) {
    super(err.message);
    this.name = 'HttpError';
    this.code = err.code;
    this.status = err.status ?? 0;
    this.details = err.details;
  }
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, retryOn401 = true } = options;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (auth && currentSession?.access_token) headers.authorization = `Bearer ${currentSession.access_token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && auth && retryOn401 && currentSession?.refresh_token) {
    const refreshed = await refreshSession();
    if (refreshed) return apiFetch<T>(path, { ...options, retryOn401: false });
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const json = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message = (json && (json.error || json.message)) || res.statusText || 'Request failed';
    throw new HttpError({ message, status: res.status, code: json?.code });
  }
  return json as T;
}
