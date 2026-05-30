import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import { supabaseAdmin } from '../supabase';
import type { AuthenticatedRequest } from '../types';

function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

async function authenticateWithSupabase(token: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

async function authenticateWithApiKey(apiKey: string): Promise<{ userId: string; scopes: string[] } | null> {
  const keyHash = hashApiKey(apiKey);
  const { data, error } = await supabaseAdmin
    .from('api_keys')
    .select('user_id, scopes, is_active, expires_at')
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .single();

  if (error || !data) return null;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null;

  // Update last_used_at
  await supabaseAdmin
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('key_hash', keyHash);

  return { userId: data.user_id, scopes: data.scopes || ['read'] };
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  const apiKeyHeader = req.headers['x-api-key'] as string | undefined;

  try {
    // Option 1: API Key authentication
    if (apiKeyHeader) {
      const result = await authenticateWithApiKey(apiKeyHeader);
      if (!result) {
        res.status(401).json({ success: false, error: 'Invalid or expired API key' });
        return;
      }
      req.userId = result.userId;
      req.authMethod = 'apikey';
      next();
      return;
    }

    // Option 2: Bearer token (Supabase JWT)
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const userId = await authenticateWithSupabase(token);
      if (!userId) {
        res.status(401).json({ success: false, error: 'Invalid or expired token' });
        return;
      }
      req.userId = userId;
      req.authMethod = 'supabase';
      next();
      return;
    }

    res.status(401).json({
      success: false,
      error: 'Authentication required. Use Bearer token or X-API-Key header.',
    });
  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).json({ success: false, error: 'Authentication failed' });
  }
}
