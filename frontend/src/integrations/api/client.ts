// Assembles a Supabase-JS-compatible client object backed by the LifeOS REST API.
// Only the surface actually used by the app is implemented:
//   client.auth.*            -> JWT auth endpoints
//   client.from(table)...    -> generic data gateway (/db/*)
//   client.functions.invoke  -> deferred to Phase 3 (edge-function replacement)
//   client.rpc               -> deferred to Phase 3

import { authClient } from './authClient';
import { QueryBuilder } from './queryBuilder';
import { API_URL } from './httpClient';

export interface LifeOSApiClient {
  auth: typeof authClient;
  from: (table: string) => QueryBuilder;
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: null; error: { message: string } }>;
  functions: {
    invoke: (
      name: string,
      options?: { body?: unknown },
    ) => Promise<{ data: null; error: { message: string } }>;
  };
}

function notYetAvailable(kind: string, name: string) {
  const message = `${kind} '${name}' is not available yet (deferred to Phase 3).`;
  console.warn(`[api] ${message}`);
  return Promise.resolve({ data: null, error: { message } });
}

export function createApiClient(): LifeOSApiClient {
  return {
    auth: authClient,
    from: (table: string) => new QueryBuilder(table),
    rpc: (fn: string) => notYetAvailable('RPC', fn),
    functions: {
      invoke: (name: string) => notYetAvailable('Edge function', name),
    },
  };
}

export const apiClient = createApiClient();
export { API_URL };
