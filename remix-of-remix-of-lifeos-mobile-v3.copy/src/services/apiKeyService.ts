import { activeSupabase as supabase } from '@/integrations/supabase/externalClient';

export interface APIKeyInfo {
  id: string;
  api_key: string;
  name: string;
}

/**
 * Get active API key for a provider
 * Returns primary key if available, otherwise returns least used active key
 */
export async function getActiveAPIKey(provider: 'gemini' | 'perplexity'): Promise<APIKeyInfo | null> {
  try {
    // Try to get primary key first
    const { data: primaryKey, error: primaryError } = await supabase
      .from('api_keys')
      .select('id, api_key, name')
      .eq('provider', provider)
      .eq('is_active', true)
      .eq('is_primary', true)
      .single();

    if (!primaryError && primaryKey) {
      return primaryKey as APIKeyInfo;
    }

    // If no primary, get least used active key
    const { data: keys, error } = await supabase
      .from('api_keys')
      .select('id, api_key, name')
      .eq('provider', provider)
      .eq('is_active', true)
      .order('usage_count', { ascending: true })
      .order('last_used_at', { ascending: true, nullsFirst: true })
      .limit(1);

    if (error) {
      console.error('Error fetching API key:', error);
      return null;
    }

    return keys && keys.length > 0 ? (keys[0] as APIKeyInfo) : null;
  } catch (error) {
    console.error('Error in getActiveAPIKey:', error);
    return null;
  }
}

/**
 * Get next available API key (for rotation when limit is reached)
 */
export async function getNextAPIKey(
  provider: 'gemini' | 'perplexity',
  excludeId?: string
): Promise<APIKeyInfo | null> {
  try {
    let query = supabase
      .from('api_keys')
      .select('id, api_key, name')
      .eq('provider', provider)
      .eq('is_active', true)
      .order('usage_count', { ascending: true })
      .order('last_used_at', { ascending: true, nullsFirst: true });

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data: keys, error } = await query.limit(1);

    if (error) {
      console.error('Error fetching next API key:', error);
      return null;
    }

    return keys && keys.length > 0 ? (keys[0] as APIKeyInfo) : null;
  } catch (error) {
    console.error('Error in getNextAPIKey:', error);
    return null;
  }
}

/**
 * Check if API key has reached its limit
 */
export async function checkAPIKeyLimit(keyId: string): Promise<{
  hasReachedLimit: boolean;
  reason?: 'daily' | 'monthly';
}> {
  try {
    const { data: key, error } = await supabase
      .from('api_keys')
      .select('limit_per_day, limit_per_month, current_usage_today, current_usage_month')
      .eq('id', keyId)
      .single();

    if (error || !key) {
      return { hasReachedLimit: false };
    }

    if (key.limit_per_day && key.current_usage_today >= key.limit_per_day) {
      return { hasReachedLimit: true, reason: 'daily' };
    }

    if (key.limit_per_month && key.current_usage_month >= key.limit_per_month) {
      return { hasReachedLimit: true, reason: 'monthly' };
    }

    return { hasReachedLimit: false };
  } catch (error) {
    console.error('Error checking API key limit:', error);
    return { hasReachedLimit: false };
  }
}

/**
 * Increment API key usage
 */
export async function incrementAPIKeyUsage(keyId: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('increment_api_key_usage', {
      _key_id: keyId,
    });

    if (error) {
      console.error('Error incrementing API key usage:', error);
      // Fallback: manual update
      await supabase
        .from('api_keys')
        .update({
          usage_count: supabase.raw('usage_count + 1'),
          current_usage_today: supabase.raw('current_usage_today + 1'),
          current_usage_month: supabase.raw('current_usage_month + 1'),
          last_used_at: new Date().toISOString(),
        })
        .eq('id', keyId);
    }
  } catch (error) {
    console.error('Error in incrementAPIKeyUsage:', error);
  }
}

/**
 * Record API key error
 */
export async function recordAPIKeyError(keyId: string, errorMessage: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('record_api_key_error', {
      _key_id: keyId,
      _error_message: errorMessage,
    });

    if (error) {
      console.error('Error recording API key error:', error);
      // Fallback: manual update
      const { data: key } = await supabase
        .from('api_keys')
        .select('error_count')
        .eq('id', keyId)
        .single();

      await supabase
        .from('api_keys')
        .update({
          last_error: errorMessage,
          error_count: (key?.error_count || 0) + 1,
          is_active: (key?.error_count || 0) + 1 >= 5 ? false : undefined,
        })
        .eq('id', keyId);
    }
  } catch (error) {
    console.error('Error in recordAPIKeyError:', error);
  }
}

/**
 * Get API key with automatic rotation if limit is reached
 */
export async function getAPIKeyWithRotation(
  provider: 'gemini' | 'perplexity',
  currentKeyId?: string
): Promise<APIKeyInfo | null> {
  // If we have a current key, check if it's still valid
  if (currentKeyId) {
    const limitCheck = await checkAPIKeyLimit(currentKeyId);
    if (!limitCheck.hasReachedLimit) {
      const currentKey = await getActiveAPIKey(provider);
      if (currentKey && currentKey.id === currentKeyId) {
        return currentKey;
      }
    }
    // Current key has reached limit, get next one
    return getNextAPIKey(provider, currentKeyId);
  }

  // No current key, get active key
  return getActiveAPIKey(provider);
}

