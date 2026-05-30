// Compatibility shim for the former "external Supabase" client. Everything now
// points at the standalone LifeOS REST API (see src/integrations/api/). Exported
// names are preserved so the rest of the app keeps working unchanged.
import { apiClient } from '@/integrations/api/client';
import {
  API_URL,
  ensureValidSession as ensureValidSessionImpl,
} from '@/integrations/api/httpClient';
import { setupStorageSync } from '@/utils/syncStorage';

export const EXTERNAL_SUPABASE_URL = API_URL;
export const EXTERNAL_SUPABASE_ANON_KEY = 'lifeos-rest-api';

export const isExternalSupabaseConfigured = true;
export const isLocalSupabase =
  API_URL.includes('localhost') || API_URL.includes('127.0.0.1');

// Keep cross-context (extension) storage sync wiring.
if (typeof window !== 'undefined') {
  setupStorageSync();
}

export const externalSupabase = apiClient;

export const getActiveSupabase = () => apiClient;

// Single active client instance for convenience.
export const activeSupabase = apiClient;

// Ensures the access token is valid (refreshing if near expiry) before a request.
export async function ensureValidSession(): Promise<boolean> {
  return ensureValidSessionImpl();
}

// Retained for API compatibility; the new client manages its own token state.
export function clearSessionCache(): void {
  /* no-op */
}

// Wrapper to run an operation after ensuring a valid session.
export async function withAuth<T>(operation: (client: typeof apiClient) => Promise<T>): Promise<T> {
  await ensureValidSession();
  return operation(apiClient);
}
