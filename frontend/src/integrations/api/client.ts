// Assembles a Supabase-JS-compatible client object backed by the LifeOS REST API.
// Only the surface actually used by the app is implemented:
//   client.auth.*            -> JWT auth endpoints
//   client.from(table)...    -> generic data gateway (/db/*)
//   client.functions.invoke  -> backend AI/email endpoints (/functions/*)
//   client.rpc               -> backend RPC shim (/rpc/*)

import { authClient } from './authClient';
import { QueryBuilder } from './queryBuilder';
import { API_URL, apiFetch, HttpError } from './httpClient';

export interface ApiResult<T> {
  data: T | null;
  error: { message: string; status?: number } | null;
}

export interface LifeOSApiClient {
  auth: typeof authClient;
  from: (table: string) => QueryBuilder;
  rpc: <T = unknown>(fn: string, args?: Record<string, unknown>) => Promise<ApiResult<T>>;
  functions: {
    invoke: <T = unknown>(name: string, options?: { body?: unknown }) => Promise<ApiResult<T>>;
  };
}

function toError(err: unknown): { message: string; status?: number } {
  if (err instanceof HttpError) return { message: err.message, status: err.status };
  if (err instanceof Error) return { message: err.message };
  return { message: 'Request failed' };
}

async function invokeFunction<T>(name: string, options?: { body?: unknown }): Promise<ApiResult<T>> {
  try {
    const data = await apiFetch<T>(`/functions/${name}`, { method: 'POST', body: options?.body ?? {} });
    return { data, error: null };
  } catch (err) {
    const error = toError(err);
    console.warn(`[api] functions.invoke('${name}') failed: ${error.message}`);
    return { data: null, error };
  }
}

async function callRpc<T>(fn: string, args?: Record<string, unknown>): Promise<ApiResult<T>> {
  try {
    // Backend RPC shim returns Supabase-style { data, error }.
    const res = await apiFetch<ApiResult<T>>(`/rpc/${fn}`, { method: 'POST', body: args ?? {} });
    return { data: res?.data ?? null, error: res?.error ?? null };
  } catch (err) {
    const error = toError(err);
    console.warn(`[api] rpc('${fn}') failed: ${error.message}`);
    return { data: null, error };
  }
}

export function createApiClient(): LifeOSApiClient {
  return {
    auth: authClient,
    from: (table: string) => new QueryBuilder(table),
    rpc: callRpc,
    functions: {
      invoke: invokeFunction,
    },
  };
}

export const apiClient = createApiClient();
export { API_URL };
