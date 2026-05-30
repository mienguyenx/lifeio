import { Router, Response } from 'express';
import { supabaseAdmin } from '../supabase';
import type { AuthenticatedRequest } from '../types';

const router = Router();

/**
 * @swagger
 * /api/goals:
 *   get:
 *     summary: List goals
 *     tags: [Goals]
 *     security:
 *       - BearerAuth: []
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: area
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, paused, archived]
 *     responses:
 *       200:
 *         description: List of goals
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const { area, status } = req.query;

  let query = supabaseAdmin
    .from('goals')
    .select('*')
    .eq('user_id', req.userId!)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (area) query = query.eq('area', area as string);
  if (status) query = query.eq('status', status as string);

  const { data, error } = await query;

  if (error) {
    res.status(500).json({ success: false, error: error.message });
    return;
  }

  res.json({ success: true, data });
});

/**
 * @swagger
 * /api/goals:
 *   post:
 *     summary: Create a goal
 *     tags: [Goals]
 *     security:
 *       - BearerAuth: []
 *       - ApiKeyAuth: []
 */
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  const { title, description, area, target_date, priority } = req.body;

  if (!title || !area) {
    res.status(400).json({ success: false, error: 'title and area are required' });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('goals')
    .insert({
      user_id: req.userId,
      title,
      description: description || null,
      area,
      target_date: target_date || null,
      priority: priority || 'medium',
      progress: 0,
      milestones: [],
      status: 'active',
    })
    .select()
    .single();

  if (error) {
    res.status(500).json({ success: false, error: error.message });
    return;
  }

  res.status(201).json({ success: true, data });
});

/**
 * @swagger
 * /api/goals/{id}:
 *   get:
 *     summary: Get a goal by ID
 *     tags: [Goals]
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('goals')
    .select('*')
    .eq('id', req.params.id)
    .eq('user_id', req.userId!)
    .single();

  if (error || !data) {
    res.status(404).json({ success: false, error: 'Goal not found' });
    return;
  }

  res.json({ success: true, data });
});

/**
 * @swagger
 * /api/goals/{id}:
 *   patch:
 *     summary: Update a goal
 *     tags: [Goals]
 */
router.patch('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const updates = req.body;

  const { data, error } = await supabaseAdmin
    .from('goals')
    .update(updates)
    .eq('id', req.params.id)
    .eq('user_id', req.userId!)
    .select()
    .single();

  if (error || !data) {
    res.status(404).json({ success: false, error: 'Goal not found or update failed' });
    return;
  }

  res.json({ success: true, data });
});

/**
 * @swagger
 * /api/goals/{id}:
 *   delete:
 *     summary: Soft-delete a goal
 *     tags: [Goals]
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('goals')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .eq('user_id', req.userId!)
    .select()
    .single();

  if (error || !data) {
    res.status(404).json({ success: false, error: 'Goal not found' });
    return;
  }

  res.json({ success: true, data });
});

export default router;
