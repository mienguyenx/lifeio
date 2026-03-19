import { useCallback } from 'react';
import { activeSupabase as supabase, ensureValidSession } from '@/integrations/supabase/externalClient';
import { useAuth } from '@/hooks/useAuth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useSyncQueue } from './useSyncQueue';
import type { 
  LifeWheelScore, WeeklyReview, DailyIntention, PomodoroSession,
  JournalTag, NoteTag, ChatMessage
} from '@/types/lifeos';
import type { Database } from '@/integrations/supabase/types';

type LifeWheelScoreRow = Database['public']['Tables']['life_wheel_scores']['Row'];
type WeeklyReviewRow = Database['public']['Tables']['weekly_reviews']['Row'];
type DailyIntentionRow = Database['public']['Tables']['daily_intentions']['Row'];
type PomodoroSessionRow = Database['public']['Tables']['pomodoro_sessions']['Row'];
type JournalTagRow = Database['public']['Tables']['journal_tags']['Row'];
type NoteTagRow = Database['public']['Tables']['note_tags']['Row'];
type ChatMessageRow = Database['public']['Tables']['chat_messages']['Row'];

// Transform functions
function transformLifeWheelFromDB(row: LifeWheelScoreRow): LifeWheelScore {
  return {
    id: row.id,
    date: row.date,
    scores: row.scores as Record<string, number>,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function transformWeeklyReviewFromDB(row: WeeklyReviewRow): WeeklyReview {
  return {
    id: row.id,
    weekStart: row.week_start,
    wins: row.wins || [],
    challenges: row.challenges || [],
    lessonsLearned: row.lessons_learned || [],
    nextWeekFocus: row.next_week_focus || [],
    overallRating: (row.overall_rating || 3) as 1 | 2 | 3 | 4 | 5,
    areaRatings: row.area_ratings as Record<string, number> || undefined,
    gratitude: row.gratitude || undefined,
    highlight: row.highlight || undefined,
    lowlight: row.lowlight || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function transformDailyIntentionFromDB(row: DailyIntentionRow): DailyIntention {
  return {
    id: row.id,
    date: row.date,
    intention: row.intention,
    reflection: row.reflection || undefined,
    completed: row.completed || false,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function transformPomodoroSessionFromDB(row: PomodoroSessionRow): PomodoroSession {
  return {
    id: row.id,
    taskId: row.task_id || undefined,
    phase: row.phase,
    duration: row.duration,
    completedAt: row.completed_at || new Date().toISOString(),
  };
}

export function useAdditionalSync() {
  const { user } = useAuth();
  const { isOnline } = useOnlineStatus();
  const { queueChange } = useSyncQueue();

  // ==================== LIFE WHEEL ====================
  const loadLifeWheelScores = useCallback(async (): Promise<LifeWheelScore[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('life_wheel_scores')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      return (data || []).map(transformLifeWheelFromDB);
    } catch (error) {
      console.error('Error loading life wheel scores:', error);
      return [];
    }
  }, [user]);

  const saveLifeWheelScore = useCallback(async (score: LifeWheelScore): Promise<boolean> => {
    if (!user) return false;

    const data = {
      id: score.id,
      user_id: user.id,
      date: score.date,
      scores: score.scores,
    };

    if (!isOnline) {
      await queueChange('create', 'life_wheel_scores', score.id, data);
      return true;
    }

    try {
      const { error } = await supabase
        .from('life_wheel_scores')
        .upsert(data);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving life wheel score:', error);
      await queueChange('create', 'life_wheel_scores', score.id, data);
      return false;
    }
  }, [user, isOnline, queueChange]);

  const deleteLifeWheelScore = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('life_wheel_scores')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting life wheel score:', error);
      return false;
    }
  }, [user]);

  // ==================== WEEKLY REVIEWS ====================
  const loadWeeklyReviews = useCallback(async (): Promise<WeeklyReview[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('weekly_reviews')
        .select('*')
        .eq('user_id', user.id)
        .order('week_start', { ascending: false });

      if (error) throw error;
      return (data || []).map(transformWeeklyReviewFromDB);
    } catch (error) {
      console.error('Error loading weekly reviews:', error);
      return [];
    }
  }, [user]);

  const saveWeeklyReview = useCallback(async (review: WeeklyReview): Promise<boolean> => {
    if (!user) return false;

    const data = {
      id: review.id,
      user_id: user.id,
      week_start: review.weekStart,
      wins: review.wins || [],
      challenges: review.challenges || [],
      lessons_learned: review.lessonsLearned || [],
      next_week_focus: review.nextWeekFocus || [],
      overall_rating: review.overallRating || 3,
      area_ratings: review.areaRatings || null,
      gratitude: review.gratitude || null,
      highlight: review.highlight || null,
      lowlight: review.lowlight || null,
    };

    if (!isOnline) {
      await queueChange('create', 'weekly_reviews', review.id, data);
      return true;
    }

    try {
      const { error } = await supabase
        .from('weekly_reviews')
        .upsert(data);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving weekly review:', error);
      await queueChange('create', 'weekly_reviews', review.id, data);
      return false;
    }
  }, [user, isOnline, queueChange]);

  const deleteWeeklyReview = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('weekly_reviews')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting weekly review:', error);
      return false;
    }
  }, [user]);

  // ==================== DAILY INTENTIONS ====================
  const loadDailyIntentions = useCallback(async (): Promise<DailyIntention[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('daily_intentions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      return (data || []).map(transformDailyIntentionFromDB);
    } catch (error) {
      console.error('Error loading daily intentions:', error);
      return [];
    }
  }, [user]);

  const saveDailyIntention = useCallback(async (intention: DailyIntention): Promise<boolean> => {
    if (!user) return false;

    const data = {
      id: intention.id,
      user_id: user.id,
      date: intention.date,
      intention: intention.intention,
      reflection: intention.reflection || null,
      completed: intention.completed || false,
    };

    if (!isOnline) {
      await queueChange('create', 'daily_intentions', intention.id, data);
      return true;
    }

    try {
      const { error } = await supabase
        .from('daily_intentions')
        .upsert(data);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving daily intention:', error);
      await queueChange('create', 'daily_intentions', intention.id, data);
      return false;
    }
  }, [user, isOnline, queueChange]);

  const updateDailyIntention = useCallback(async (id: string, updates: Partial<DailyIntention>): Promise<boolean> => {
    if (!user) return false;

    const data: Record<string, unknown> = {};
    if ('intention' in updates) data.intention = updates.intention;
    if ('reflection' in updates) data.reflection = updates.reflection || null;
    if ('completed' in updates) data.completed = updates.completed || false;

    try {
      const { error } = await supabase
        .from('daily_intentions')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating daily intention:', error);
      return false;
    }
  }, [user]);

  // ==================== POMODORO SESSIONS ====================
  const loadPomodoroSessions = useCallback(async (): Promise<PomodoroSession[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('pomodoro_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(transformPomodoroSessionFromDB);
    } catch (error) {
      console.error('Error loading pomodoro sessions:', error);
      return [];
    }
  }, [user]);

  const savePomodoroSession = useCallback(async (session: PomodoroSession): Promise<boolean> => {
    if (!user) return false;

    const data = {
      id: session.id,
      user_id: user.id,
      task_id: session.taskId || null,
      phase: session.phase,
      duration: session.duration,
      completed_at: session.completedAt,
    };

    try {
      const { error } = await supabase
        .from('pomodoro_sessions')
        .insert(data);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving pomodoro session:', error);
      return false;
    }
  }, [user]);

  // ==================== JOURNAL TAGS ====================
  const loadJournalTags = useCallback(async (): Promise<JournalTag[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('journal_tags')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return (data || []).map((t: JournalTagRow) => ({
        id: t.id,
        name: t.name,
        color: t.color,
      }));
    } catch (error) {
      console.error('Error loading journal tags:', error);
      return [];
    }
  }, [user]);

  const saveJournalTag = useCallback(async (tag: JournalTag): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('journal_tags')
        .upsert({
          id: tag.id,
          user_id: user.id,
          name: tag.name,
          color: tag.color,
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving journal tag:', error);
      return false;
    }
  }, [user]);

  const deleteJournalTag = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('journal_tags')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting journal tag:', error);
      return false;
    }
  }, [user]);

  // ==================== NOTE TAGS ====================
  const loadNoteTags = useCallback(async (): Promise<NoteTag[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('note_tags')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return (data || []).map((t: NoteTagRow) => ({
        id: t.id,
        name: t.name,
        color: t.color,
      }));
    } catch (error) {
      console.error('Error loading note tags:', error);
      return [];
    }
  }, [user]);

  const saveNoteTag = useCallback(async (tag: NoteTag): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('note_tags')
        .upsert({
          id: tag.id,
          user_id: user.id,
          name: tag.name,
          color: tag.color,
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving note tag:', error);
      return false;
    }
  }, [user]);

  const deleteNoteTag = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('note_tags')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting note tag:', error);
      return false;
    }
  }, [user]);

  // ==================== CHAT MESSAGES ====================
  const loadChatMessages = useCallback(async (): Promise<ChatMessage[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []).map((m: ChatMessageRow) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        isFavorite: m.is_favorite || false,
        createdAt: m.created_at || new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Error loading chat messages:', error);
      return [];
    }
  }, [user]);

  const saveChatMessage = useCallback(async (message: ChatMessage): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          id: message.id,
          user_id: user.id,
          role: message.role,
          content: message.content,
          is_favorite: message.isFavorite || false,
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving chat message:', error);
      return false;
    }
  }, [user]);

  const updateChatMessage = useCallback(async (id: string, updates: Partial<ChatMessage>): Promise<boolean> => {
    if (!user) return false;

    const data: Record<string, unknown> = {};
    if ('isFavorite' in updates) data.is_favorite = updates.isFavorite;
    if ('content' in updates) data.content = updates.content;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating chat message:', error);
      return false;
    }
  }, [user]);

  const clearChatMessages = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error clearing chat messages:', error);
      return false;
    }
  }, [user]);

  return {
    // Life Wheel
    loadLifeWheelScores,
    saveLifeWheelScore,
    deleteLifeWheelScore,
    
    // Weekly Reviews
    loadWeeklyReviews,
    saveWeeklyReview,
    deleteWeeklyReview,
    
    // Daily Intentions
    loadDailyIntentions,
    saveDailyIntention,
    updateDailyIntention,
    
    // Pomodoro
    loadPomodoroSessions,
    savePomodoroSession,

    // Journal Tags
    loadJournalTags,
    saveJournalTag,
    deleteJournalTag,

    // Note Tags
    loadNoteTags,
    saveNoteTag,
    deleteNoteTag,

    // Chat Messages
    loadChatMessages,
    saveChatMessage,
    updateChatMessage,
    clearChatMessages,
  };
}
