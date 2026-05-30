import { Router, Response } from 'express';
import { supabaseAdmin } from '../supabase';
import type { AuthenticatedRequest } from '../types';

const router = Router();

/**
 * @swagger
 * /api/habits:
 *   get:
 *     summary: List habits
 *     tags: [Habits]
 *     security:
 *       - BearerAuth: []
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: area
 *         schema:
 *           type: string
 *       - in: query
 *         name: frequency
 *         schema:
 *           type: string
 *           enum: [daily, weekly, custom]
 *     responses:
 *       200:
 *         description: List of habits
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const { area, frequency } = req.query;

  let query = supabaseAdmin
    .from('habits')
    .select('*')
    .eq('user_id', req.userId!)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (area) query = query.eq('area', area as string);
  if (frequency) query = query.eq('frequency', frequency as string);

  const { data, error } = await query;

  if (error) {
    res.status(500).json({ success: false, error: error.message });
    return;
  }

  res.json({ success: true, data });
});

/**
 * @swagger
 * /api/habits:
 *   post:
 *     summary: Create a habit
 *     tags: [Habits]
 *     security:
 *       - BearerAuth: []
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, area]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               area:
 *                 type: string
 *               frequency:
 *                 type: string
 *                 enum: [daily, weekly, custom]
 *               target_per_day:
 *                 type: integer
 *               target_unit:
 *                 type: string
 *     responses:
 *       201:
 *         description: Habit created
 */
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  const { name, description, area, frequency, target_per_day, target_unit } = req.body;

  if (!name || !area) {
    res.status(400).json({ success: false, error: 'name and area are required' });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('habits')
    .insert({
      user_id: req.userId,
      name,
      description: description || null,
      area,
      frequency: frequency || 'daily',
      target_per_day: target_per_day || 1,
      target_unit: target_unit || null,
      streak: 0,
      completed_dates: [],
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
 * /api/habits/{id}:
 *   get:
 *     summary: Get a habit by ID
 *     tags: [Habits]
 *     security:
 *       - BearerAuth: []
 *       - ApiKeyAuth: []
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('habits')
    .select('*')
    .eq('id', req.params.id)
    .eq('user_id', req.userId!)
    .single();

  if (error || !data) {
    res.status(404).json({ success: false, error: 'Habit not found' });
    return;
  }

  res.json({ success: true, data });
});

/**
 * @swagger
 * /api/habits/{id}:
 *   patch:
 *     summary: Update a habit
 *     tags: [Habits]
 *     security:
 *       - BearerAuth: []
 *       - ApiKeyAuth: []
 */
router.patch('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const updates = req.body;

  const { data, error } = await supabaseAdmin
    .from('habits')
    .update(updates)
    .eq('id', req.params.id)
    .eq('user_id', req.userId!)
    .select()
    .single();

  if (error || !data) {
    res.status(404).json({ success: false, error: 'Habit not found or update failed' });
    return;
  }

  res.json({ success: true, data });
});

/**
 * @swagger
 * /api/habits/{id}:
 *   delete:
 *     summary: Soft-delete a habit
 *     tags: [Habits]
 *     security:
 *       - BearerAuth: []
 *       - ApiKeyAuth: []
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('habits')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .eq('user_id', req.userId!)
    .select()
    .single();

  if (error || !data) {
    res.status(404).json({ success: false, error: 'Habit not found' });
    return;
  }

  res.json({ success: true, data });
});

export default router;
