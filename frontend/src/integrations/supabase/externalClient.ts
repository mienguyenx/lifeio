import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { SupabaseSyncStorage, setupStorageSync } from '@/utils/syncStorage';

// Sử dụng Supabase Local được public qua Traefik
// Domain: supabase.hoanong.com
export const EXTERNAL_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const EXTERNAL_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Check if external Supabase is configured
export const isExternalSupabaseConfigured = Boolean(
  EXTERNAL_SUPABASE_URL && EXTERNAL_SUPABASE_ANON_KEY
);

// Check if using local Supabase
export const isLocalSupabase = EXTERNAL_SUPABASE_URL.includes('localhost') || EXTERNAL_SUPABASE_URL.includes('127.0.0.1');

// Setup storage sync for extension (listen for changes)
if (typeof window !== 'undefined') {
  setupStorageSync();
}

// Create sync storage adapter (synchronous interface for Supabase)
const syncStorage = new SupabaseSyncStorage();

// Create Supabase Local client (required - no fallback)
if (!EXTERNAL_SUPABASE_URL || !EXTERNAL_SUPABASE_ANON_KEY) {
  throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY must be set');
}

export const externalSupabase = createClient<Database>(EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_ANON_KEY, {
  auth: {
    storage: syncStorage as any, // Use sync storage adapter (synchronous interface)
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'external-supabase-auth',
    detectSessionInUrl: true,
  },
});

// Helper to get the active Supabase client
// Always uses Supabase Local (configured via environment variables)
export const getActiveSupabase = () => {
  if (!externalSupabase) {
    throw new Error('Supabase Local is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY');
  }
  console.log('Using Supabase Local:', EXTERNAL_SUPABASE_URL);
  return externalSupabase;
};

// Export a single instance for convenience
export const activeSupabase = getActiveSupabase();

// Session cache to avoid redundant checks
interface SessionCache {
  isValid: boolean;
  timestamp: number;
}

let sessionCache: SessionCache | null = null;
const SESSION_CACHE_TTL = 30000; // 30 seconds

// Helper function to ensure valid session before making requests
// Now with caching to reduce redundant checks
export async function ensureValidSession(): Promise<boolean> {
  
  // Check cache first (but only if cache is positive - negative cache can block login)
  if (sessionCache && sessionCache.isValid) {
    const now = Date.now();
    const cacheAge = now - sessionCache.timestamp;
    if (cacheAge < SESSION_CACHE_TTL) {
      return true; // Only use cache if it's positive
    }
  }
  
  // If cache is negative or expired, always check fresh
  try {
    const { data: { session }, error } = await externalSupabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      // Don't cache negative results - they might be temporary (e.g., during login)
      return false;
    }
    
    if (!session) {
      console.log('No session found');
      // Don't cache negative results - session might be created soon
      return false;
    }
    
    // Check if token is about to expire (within 5 minutes)
    const expiresAt = session.expires_at;
    if (expiresAt) {
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = expiresAt - now;
      
      if (timeUntilExpiry < 300) { // Less than 5 minutes
        console.log('Token expiring soon, refreshing...');
        const { data, error: refreshError } = await externalSupabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('Error refreshing session:', refreshError);
          sessionCache = { isValid: false, timestamp: Date.now() };
          return false;
        }
        
        if (data.session) {
          console.log('Session refreshed successfully');
          sessionCache = { isValid: true, timestamp: Date.now() };
          return true;
        }
      }
    }
    
    sessionCache = { isValid: true, timestamp: Date.now() };
    return true;
  } catch (error) {
    console.error('Error ensuring valid session:', error);
    sessionCache = { isValid: false, timestamp: Date.now() };
    return false;
  }
}

// Clear session cache (useful when session changes)
export function clearSessionCache(): void {
  sessionCache = null;
}

// Wrapper function to make authenticated requests with auto-refresh
export async function withAuth<T>(
  operation: (client: SupabaseClient<Database>) => Promise<T>
): Promise<T> {
  // Ensure valid session before operation
  await ensureValidSession();
  
  return operation(externalSupabase);
}
