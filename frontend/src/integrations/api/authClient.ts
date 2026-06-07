// Supabase-`auth`-compatible surface backed by the LifeOS auth endpoints (JWT).

import {
  apiFetch,
  buildSession,
  getSession as getStoredSession,
  onAuthChange,
  refreshSession as doRefresh,
  setSession,
  type ApiSession,
  type AuthEvent,
} from './httpClient';

interface SignupLoginResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string };
}

interface AuthResult {
  data: { user: ApiSession['user'] | null; session: ApiSession | null };
  error: { message: string; status?: number } | null;
}

function ok(session: ApiSession): AuthResult {
  return { data: { user: session.user, session }, error: null };
}

function fail(err: unknown): AuthResult {
  const message = err instanceof Error ? err.message : 'Authentication failed';
  const status = (err as { status?: number })?.status;
  return { data: { user: null, session: null }, error: { message, status } };
}

export const authClient = {
  async getSession() {
    return { data: { session: getStoredSession() }, error: null };
  },

  async getUser() {
    const session = getStoredSession();
    return { data: { user: session?.user ?? null }, error: null };
  },

  async signUp(params: {
    email: string;
    password: string;
    options?: { data?: { name?: string; full_name?: string } };
  }): Promise<AuthResult> {
    try {
      const name = params.options?.data?.name ?? params.options?.data?.full_name;
      const res = await apiFetch<SignupLoginResponse>('/auth/signup', {
        method: 'POST',
        auth: false,
        body: { email: params.email, password: params.password, ...(name ? { name } : {}) },
      });
      const session = buildSession(res);
      setSession(session, 'SIGNED_UP');
      return ok(session);
    } catch (err) {
      return fail(err);
    }
  },

  async signInWithPassword(params: { email: string; password: string }): Promise<AuthResult> {
    try {
      const res = await apiFetch<SignupLoginResponse>('/auth/login', {
        method: 'POST',
        auth: false,
        body: { email: params.email, password: params.password },
      });
      const session = buildSession(res);
      setSession(session, 'SIGNED_IN');
      return ok(session);
    } catch (err) {
      return fail(err);
    }
  },

  async signOut() {
    const session = getStoredSession();
    try {
      if (session?.refresh_token) {
        await apiFetch('/auth/logout', {
          method: 'POST',
          auth: false,
          body: { refreshToken: session.refresh_token },
        });
      }
    } catch {
      // Ignore network errors on logout — the local session is cleared regardless.
    }
    setSession(null, 'SIGNED_OUT');
    return { error: null };
  },

  async resetPasswordForEmail(email: string, _options?: { redirectTo?: string }) {
    try {
      await apiFetch('/auth/reset-password/request', {
        method: 'POST',
        auth: false,
        body: { email },
      });
      return { data: {}, error: null };
    } catch (err) {
      return { data: null, error: { message: err instanceof Error ? err.message : 'Reset failed' } };
    }
  },

  async updateUser(attributes: { email?: string; password?: string; currentPassword?: string }) {
    try {
      if (!attributes.currentPassword) {
        return {
          data: { user: null },
          error: { message: 'Updating credentials requires the current password.' },
        };
      }
      const res = await apiFetch<{ id: string; email: string }>('/auth/update', {
        method: 'POST',
        body: {
          currentPassword: attributes.currentPassword,
          ...(attributes.email ? { email: attributes.email } : {}),
          ...(attributes.password ? { password: attributes.password } : {}),
        },
      });
      const current = getStoredSession();
      const user = current ? { ...current.user, email: res.email } : null;
      if (current && user) setSession({ ...current, user }, 'USER_UPDATED');
      return { data: { user }, error: null };
    } catch (err) {
      return { data: { user: null }, error: { message: err instanceof Error ? err.message : 'Update failed' } };
    }
  },

  async refreshSession() {
    const refreshed = await doRefresh();
    return { data: { session: refreshed ? getStoredSession() : null }, error: refreshed ? null : { message: 'Refresh failed' } };
  },

  onAuthStateChange(callback: (event: AuthEvent, session: ApiSession | null) => void) {
    const unsubscribe = onAuthChange(callback);
    return { data: { subscription: { unsubscribe } } };
  },
};
