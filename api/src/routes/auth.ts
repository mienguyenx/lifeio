import { Router, Response } from 'express';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../supabase';
import type { AuthenticatedRequest } from '../types';

const router = Router();

function generateApiKey(): string {
  return `lio_${crypto.randomBytes(32).toString('hex')}`;
}

function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * @swagger
 * /api/auth/api-keys:
 *   get:
 *     summary: List API keys for the current user
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of API keys (without the actual key values)
 */
router.get('/api-keys', async (req: AuthenticatedRequest, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('api_keys')
    .select('id, name, scopes, created_at, last_used_at, expires_at, is_active')
    .eq('user_id', req.userId!)
    .order('created_at', { ascending: false });

  if (error) {
    res.status(500).json({ success: false, error: error.message });
    return;
  }

  res.json({ success: true, data });
});

/**
 * @swagger
 * /api/auth/api-keys:
 *   post:
 *     summary: Create a new API key
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 description: Friendly name for the API key
 *               scopes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [read, write, delete]
 *                 default: [read]
 *               expires_in_days:
 *                 type: integer
 *                 description: Number of days until expiration (null for no expiry)
 *     responses:
 *       201:
 *         description: API key created (key shown only once)
 */
router.post('/api-keys', async (req: AuthenticatedRequest, res: Response) => {
  const { name, scopes = ['read'], expires_in_days } = req.body;

  if (!name) {
    res.status(400).json({ success: false, error: 'name is required' });
    return;
  }

  const apiKey = generateApiKey();
  const keyHash = hashApiKey(apiKey);
  const expiresAt = expires_in_days
    ? new Date(Date.now() + expires_in_days * 86400000).toISOString()
    : null;

  const { data, error } = await supabaseAdmin
    .from('api_keys')
    .insert({
      id: uuidv4(),
      user_id: req.userId,
      key_hash: keyHash,
      name,
      scopes,
      expires_at: expiresAt,
      is_active: true,
    })
    .select('id, name, scopes, created_at, expires_at')
    .single();

  if (error) {
    res.status(500).json({ success: false, error: error.message });
    return;
  }

  res.status(201).json({
    success: true,
    data: {
      ...data,
      key: apiKey, // Only shown once!
    },
    message: 'Save this API key — it will not be shown again.',
  });
});

/**
 * @swagger
 * /api/auth/api-keys/{id}:
 *   delete:
 *     summary: Revoke an API key
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 */
router.delete('/api-keys/:id', async (req: AuthenticatedRequest, res: Response) => {
  const { error } = await supabaseAdmin
    .from('api_keys')
    .update({ is_active: false })
    .eq('id', req.params.id)
    .eq('user_id', req.userId!);

  if (error) {
    res.status(500).json({ success: false, error: error.message });
    return;
  }

  res.json({ success: true, message: 'API key revoked' });
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: User profile
 */
router.get('/me', async (req: AuthenticatedRequest, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', req.userId!)
    .single();

  if (error || !data) {
    res.status(404).json({ success: false, error: 'Profile not found' });
    return;
  }

  res.json({
    success: true,
    data: {
      id: data.id,
      email: data.email,
      name: data.name,
      avatar_url: data.avatar_url,
      auth_method: req.authMethod,
    },
  });
});

export default router;
