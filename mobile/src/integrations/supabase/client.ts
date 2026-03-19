import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// AsyncStorage adapter for Supabase auth session
const AsyncStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const value = await AsyncStorage.getItem(key);
      return value;
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      // silently fail
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // silently fail
    }
  },
};

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Session cache to avoid redundant checks
let sessionCache: { session: unknown; expiresAt: number } | null = null;
const SESSION_CACHE_TTL = 30_000; // 30 seconds

export async function ensureValidSession(): Promise<void> {
  const now = Date.now();
  if (sessionCache && sessionCache.expiresAt > now) return;

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      sessionCache = { session: null, expiresAt: now + SESSION_CACHE_TTL };
      return;
    }

    const expiresAt = sessionData.session.expires_at
      ? sessionData.session.expires_at * 1000
      : now + 3600_000;

    // If expires in less than 5 minutes, refresh
    if (expiresAt - now < 5 * 60_000) {
      await supabase.auth.refreshSession();
    }

    sessionCache = { session: sessionData.session, expiresAt: now + SESSION_CACHE_TTL };
  } catch {
    // ignore
  }
}

export function clearSessionCache(): void {
  sessionCache = null;
}

export async function withAuth<T>(operation: () => Promise<T>): Promise<T> {
  await ensureValidSession();
  return operation();
}
