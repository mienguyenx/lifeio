import { useQuery } from '@tanstack/react-query';
import { activeSupabase as supabase } from '@/integrations/supabase/externalClient';
import { format, subDays, eachDayOfInterval, startOfDay } from 'date-fns';

export interface UserStats {
  goalsCount: number;
  habitsCount: number;
  tasksCount: number;
  journalCount: number;
  completedTasksCount: number;
  activeGoalsCount: number;
}

export interface UserSubscription {
  id: string;
  plan_id: string;
  plan_name: string;
  status: string;
  started_at: string;
  expires_at: string | null;
  cancelled_at: string | null;
}

export interface DailyActivity {
  date: string;
  tasks: number;
  habits: number;
  journals: number;
}

export interface UserAnalytics {
  dailyActivity: DailyActivity[];
  tasksByStatus: { status: string; count: number }[];
  goalsByArea: { area: string; count: number }[];
  habitCompletionRate: number;
  streakData: { current: number; best: number };
}

export function useUserStats(userId: string) {
  return useQuery({
    queryKey: ['admin', 'user-stats', userId],
    queryFn: async () => {
      const [goalsResult, habitsResult, tasksResult, journalResult, completedTasksResult, activeGoalsResult] = await Promise.all([
        supabase.from('goals').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('habits').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('journal_entries').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'done'),
        supabase.from('goals').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'active'),
      ]);

      return {
        goalsCount: goalsResult.count || 0,
        habitsCount: habitsResult.count || 0,
        tasksCount: tasksResult.count || 0,
        journalCount: journalResult.count || 0,
        completedTasksCount: completedTasksResult.count || 0,
        activeGoalsCount: activeGoalsResult.count || 0,
      } as UserStats;
    },
    enabled: !!userId,
  });
}

export function useUserSubscription(userId: string) {
  return useQuery({
    queryKey: ['admin', 'user-subscription', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          id,
          plan_id,
          status,
          started_at,
          expires_at,
          cancelled_at,
          subscription_plans (name)
        `)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        plan_id: data.plan_id,
        plan_name: (data.subscription_plans as { name: string } | null)?.name || 'Unknown',
        status: data.status,
        started_at: data.started_at,
        expires_at: data.expires_at,
        cancelled_at: data.cancelled_at,
      } as UserSubscription;
    },
    enabled: !!userId,
  });
}

export function useUserAnalytics(userId: string, days = 30) {
  return useQuery({
    queryKey: ['admin', 'user-analytics', userId, days],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = subDays(endDate, days - 1);
      const startDateStr = format(startDate, 'yyyy-MM-dd');

      // Get tasks created in date range
      const { data: tasks } = await supabase
        .from('tasks')
        .select('created_at, status')
        .eq('user_id', userId)
        .gte('created_at', startDateStr);

      // Get habit completions in date range
      const { data: habitCompletions } = await supabase
        .from('habit_completions')
        .select('date, habit_id')
        .gte('date', startDateStr)
        .in('habit_id', (
          await supabase.from('habits').select('id').eq('user_id', userId)
        ).data?.map(h => h.id) || []);

      // Get journal entries in date range
      const { data: journals } = await supabase
        .from('journal_entries')
        .select('date')
        .eq('user_id', userId)
        .gte('date', startDateStr);

      // Get goals by area
      const { data: goals } = await supabase
        .from('goals')
        .select('area')
        .eq('user_id', userId);

      // Get habits for streak data
      const { data: habits } = await supabase
        .from('habits')
        .select('streak, best_streak')
        .eq('user_id', userId);

      // Build daily activity data
      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
      const dailyActivity: DailyActivity[] = dateRange.map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return {
          date: format(date, 'dd/MM'),
          tasks: tasks?.filter(t => format(new Date(t.created_at!), 'yyyy-MM-dd') === dateStr).length || 0,
          habits: habitCompletions?.filter(h => h.date === dateStr).length || 0,
          journals: journals?.filter(j => j.date === dateStr).length || 0,
        };
      });

      // Tasks by status
      const statusCounts: Record<string, number> = {};
      tasks?.forEach(t => {
        statusCounts[t.status || 'todo'] = (statusCounts[t.status || 'todo'] || 0) + 1;
      });
      const tasksByStatus = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

      // Goals by area
      const areaCounts: Record<string, number> = {};
      goals?.forEach(g => {
        areaCounts[g.area] = (areaCounts[g.area] || 0) + 1;
      });
      const goalsByArea = Object.entries(areaCounts).map(([area, count]) => ({ area, count }));

      // Habit completion rate (last 7 days)
      const last7Days = habitCompletions?.filter(h => {
        const date = new Date(h.date);
        return date >= subDays(endDate, 7);
      }).length || 0;
      const totalHabits = habits?.length || 1;
      const habitCompletionRate = Math.round((last7Days / (totalHabits * 7)) * 100);

      // Streak data
      const currentStreak = Math.max(...(habits?.map(h => h.streak || 0) || [0]));
      const bestStreak = Math.max(...(habits?.map(h => h.best_streak || 0) || [0]));

      return {
        dailyActivity,
        tasksByStatus,
        goalsByArea,
        habitCompletionRate: Math.min(habitCompletionRate, 100),
        streakData: { current: currentStreak, best: bestStreak },
      } as UserAnalytics;
    },
    enabled: !!userId,
  });
}

export function useUserActivity(userId: string, limit = 10) {
  return useQuery({
    queryKey: ['admin', 'user-activity', userId, limit],
    queryFn: async () => {
      // Get recent goals
      const { data: recentGoals } = await supabase
        .from('goals')
        .select('id, title, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      // Get recent tasks  
      const { data: recentTasks } = await supabase
        .from('tasks')
        .select('id, title, created_at, status')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      // Get recent journal entries
      const { data: recentJournals } = await supabase
        .from('journal_entries')
        .select('id, date, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      return {
        goals: recentGoals || [],
        tasks: recentTasks || [],
        journals: recentJournals || [],
      };
    },
    enabled: !!userId,
  });
}