import { Router, Response } from 'express';
import { supabaseAdmin } from '../supabase';
import type { AuthenticatedRequest } from '../types';

const router = Router();

/**
 * @swagger
 * /api/journal:
 *   get:
 *     summary: List journal entries
 *     tags: [Journal]
 *     security:
 *       - BearerAuth: []
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *       - in: query
 *         name: mood
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: List of journal entries
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const { from, to, mood, page = '1', limit = '50' } = req.query;
  const pageNum = Math.max(1, parseInt(page as string));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
  const offset = (pageNum - 1) * limitNum;

  let query = supabaseAdmin
    .from('journal_entries')
    .select('*', { count: 'exact' })
    .eq('user_id', req.userId!)
    .order('date', { ascending: false })
    .range(offset, offset + limitNum - 1);

  if (from) query = query.gte('date', from as string);
  if (to) query = query.lte('date', to as string);
  if (mood) query = query.eq('mood', parseInt(mood as string));

  const { data, error, count } = await query;

  if (error) {
    res.status(500).json({ success: false, error: error.message });
    return;
  }

  res.json({
    success: true,
    data,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limitNum),
    },
  });
});

/**
 * @swagger
 * /api/journal:
 *   post:
 *     summary: Create a journal entry
 *     tags: [Journal]
 *     security:
 *       - BearerAuth: []
 *       - ApiKeyAuth: []
 */
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  const { date, content, mood, energy, areas, gratitude } = req.body;

  if (!content || !mood) {
    res.status(400).json({ success: false, error: 'content and mood are required' });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('journal_entries')
    .insert({
      user_id: req.userId,
      date: date || new Date().toISOString().split('T')[0],
      content,
      mood,
      energy: energy || 3,
      areas: areas || [],
      gratitude: gratitude || [],
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
 * /api/journal/{id}:
 *   get:
 *     summary: Get a journal entry by ID
 *     tags: [Journal]
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('journal_entries')
    .select('*')
    .eq('id', req.params.id)
    .eq('user_id', req.userId!)
    .single();

  if (error || !data) {
    res.status(404).json({ success: false, error: 'Journal entry not found' });
    return;
  }

  res.json({ success: true, data });
});

/**
 * @swagger
 * /api/journal/{id}:
 *   patch:
 *     summary: Update a journal entry
 *     tags: [Journal]
 */
router.patch('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const updates = req.body;

  const { data, error } = await supabaseAdmin
    .from('journal_entries')
    .update(updates)
    .eq('id', req.params.id)
    .eq('user_id', req.userId!)
    .select()
    .single();

  if (error || !data) {
    res.status(404).json({ success: false, error: 'Journal entry not found or update failed' });
    return;
  }

  res.json({ success: true, data });
});

export default router;
