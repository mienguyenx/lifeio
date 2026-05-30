import { Router, Response } from 'express';
import { supabaseAdmin } from '../supabase';
import type { AuthenticatedRequest } from '../types';

const router = Router();

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: List tasks
 *     tags: [Tasks]
 *     security:
 *       - BearerAuth: []
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [todo, in_progress, deferred, done]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *       - in: query
 *         name: area
 *         schema:
 *           type: string
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
 *         description: List of tasks
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const { status, priority, area, page = '1', limit = '50' } = req.query;
  const pageNum = Math.max(1, parseInt(page as string));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
  const offset = (pageNum - 1) * limitNum;

  let query = supabaseAdmin
    .from('tasks')
    .select('*', { count: 'exact' })
    .eq('user_id', req.userId!)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limitNum - 1);

  if (status) query = query.eq('status', status as string);
  if (priority) query = query.eq('priority', priority as string);
  if (area) query = query.eq('area', area as string);

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
 * /api/tasks:
 *   post:
 *     summary: Create a task
 *     tags: [Tasks]
 *     security:
 *       - BearerAuth: []
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *               status:
 *                 type: string
 *                 enum: [todo, in_progress, deferred, done]
 *               area:
 *                 type: string
 *               due_date:
 *                 type: string
 *                 format: date
 *               goal_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Task created
 */
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  const { title, description, priority, status, area, due_date, goal_id } = req.body;

  if (!title) {
    res.status(400).json({ success: false, error: 'title is required' });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('tasks')
    .insert({
      user_id: req.userId,
      title,
      description: description || null,
      priority: priority || 'medium',
      status: status || 'todo',
      area: area || null,
      due_date: due_date || null,
      goal_id: goal_id || null,
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
 * /api/tasks/{id}:
 *   get:
 *     summary: Get a task by ID
 *     tags: [Tasks]
 *     security:
 *       - BearerAuth: []
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task details
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('tasks')
    .select('*')
    .eq('id', req.params.id)
    .eq('user_id', req.userId!)
    .single();

  if (error || !data) {
    res.status(404).json({ success: false, error: 'Task not found' });
    return;
  }

  res.json({ success: true, data });
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   patch:
 *     summary: Update a task
 *     tags: [Tasks]
 *     security:
 *       - BearerAuth: []
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               status:
 *                 type: string
 *               priority:
 *                 type: string
 *     responses:
 *       200:
 *         description: Task updated
 */
router.patch('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const updates = req.body;

  const { data, error } = await supabaseAdmin
    .from('tasks')
    .update(updates)
    .eq('id', req.params.id)
    .eq('user_id', req.userId!)
    .select()
    .single();

  if (error || !data) {
    res.status(404).json({ success: false, error: 'Task not found or update failed' });
    return;
  }

  res.json({ success: true, data });
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Soft-delete a task
 *     tags: [Tasks]
 *     security:
 *       - BearerAuth: []
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task deleted
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('tasks')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .eq('user_id', req.userId!)
    .select()
    .single();

  if (error || !data) {
    res.status(404).json({ success: false, error: 'Task not found' });
    return;
  }

  res.json({ success: true, data });
});

export default router;
