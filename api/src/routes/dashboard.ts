import { Router, Response } from 'express';
import { supabaseAdmin } from '../supabase';
import type { AuthenticatedRequest } from '../types';

const router = Router();

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     summary: Get dashboard summary for the current user
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary with counts and recent activity
 */
router.get('/summary', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const today = new Date().toISOString().split('T')[0];

  try {
    const [tasksResult, habitsResult, goalsResult, journalResult] = await Promise.all([
      supabaseAdmin
        .from('tasks')
        .select('id, status, priority, due_date', { count: 'exact' })
        .eq('user_id', userId)
        .is('deleted_at', null),
      supabaseAdmin
        .from('habits')
        .select('id, streak, completed_dates', { count: 'exact' })
        .eq('user_id', userId)
        .is('deleted_at', null),
      supabaseAdmin
        .from('goals')
        .select('id, progress, status', { count: 'exact' })
        .eq('user_id', userId)
        .is('deleted_at', null),
      supabaseAdmin
        .from('journal_entries')
        .select('id, date, mood', { count: 'exact' })
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(7),
    ]);

    const tasks = tasksResult.data || [];
    const habits = habitsResult.data || [];
    const goals = goalsResult.data || [];

    const tasksDone = tasks.filter(t => t.status === 'done').length;
    const tasksOverdue = tasks.filter(t =>
      t.due_date && t.due_date < today && t.status !== 'done'
    ).length;
    const tasksTodo = tasks.filter(t => t.status === 'todo').length;
    const tasksInProgress = tasks.filter(t => t.status === 'in_progress').length;

    const activeGoals = goals.filter(g => g.status === 'active');
    const avgGoalProgress = activeGoals.length > 0
      ? Math.round(activeGoals.reduce((sum, g) => sum + (g.progress || 0), 0) / activeGoals.length)
      : 0;

    const avgStreak = habits.length > 0
      ? Math.round(habits.reduce((sum, h) => sum + (h.streak || 0), 0) / habits.length)
      : 0;

    res.json({
      success: true,
      data: {
        tasks: {
          total: tasksResult.count || 0,
          todo: tasksTodo,
          in_progress: tasksInProgress,
          done: tasksDone,
          overdue: tasksOverdue,
        },
        habits: {
          total: habitsResult.count || 0,
          average_streak: avgStreak,
        },
        goals: {
          total: goalsResult.count || 0,
          active: activeGoals.length,
          average_progress: avgGoalProgress,
        },
        journal: {
          total: journalResult.count || 0,
          recent: journalResult.data || [],
        },
      },
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard data' });
  }
});

export default router;
