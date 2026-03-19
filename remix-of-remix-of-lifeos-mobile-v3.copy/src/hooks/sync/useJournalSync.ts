import { useCallback } from 'react';
import { activeSupabase as supabase, ensureValidSession } from '@/integrations/supabase/externalClient';
import { useAuth } from '@/hooks/useAuth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useSyncQueue } from './useSyncQueue';
import type { JournalEntry, JournalTag } from '@/types/lifeos';
import type { Database } from '@/integrations/supabase/types';

type JournalRow = Database['public']['Tables']['journal_entries']['Row'];
type JournalTagRow = Database['public']['Tables']['journal_tags']['Row'];

// Transform Supabase row to local JournalEntry type
function transformJournalFromDB(row: JournalRow): JournalEntry {
  return {
    id: row.id,
    date: row.date,
    content: row.content,
    mood: (row.mood || 3) as 1 | 2 | 3 | 4 | 5,
    energy: (row.energy || 3) as 1 | 2 | 3 | 4 | 5,
    areas: row.areas || undefined,
    gratitude: row.gratitude || undefined,
    tags: row.tags || undefined,
    images: row.images || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

// Transform local JournalEntry to Supabase format
function transformJournalToDB(entry: Partial<JournalEntry>, userId: string) {
  return {
    id: entry.id,
    user_id: userId,
    date: entry.date,
    content: entry.content,
    mood: entry.mood || 3,
    energy: entry.energy || 3,
    areas: entry.areas || null,
    gratitude: entry.gratitude || null,
    tags: entry.tags || null,
    images: entry.images || null,
  };
}

export function useJournalSync() {
  const { user } = useAuth();
  const { isOnline } = useOnlineStatus();
  const { queueChange } = useSyncQueue();

  // Load journal entries from Supabase
  const loadJournalEntries = useCallback(async (): Promise<JournalEntry[]> => {
    if (!user) {
      console.log('[JournalSync] No user, skipping load');
      return [];
    }

    try {
      await ensureValidSession();
      
      console.log('[JournalSync] Loading journal entries for user:', user.id);
      const { data, error, count } = await supabase
        .from('journal_entries')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[JournalSync] Query error:', error);
        throw error;
      }

      console.log('[JournalSync] Loaded', data?.length || 0, 'journal entries (total in DB:', count || 0, ')');
      if (data && data.length > 0) {
        console.log('[JournalSync] Entry dates:', data.map(e => e.date).join(', '));
        console.log('[JournalSync] Entry IDs:', data.map(e => e.id).join(', '));
      }
      
      return (data || []).map(transformJournalFromDB);
    } catch (error) {
      console.error('[JournalSync] Error loading journal entries:', error);
      return [];
    }
  }, [user]);

  // Load journal tags from Supabase
  const loadJournalTags = useCallback(async (): Promise<JournalTag[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('journal_tags')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      return (data || []).map(t => ({
        id: t.id,
        name: t.name,
        color: t.color,
      }));
    } catch (error) {
      console.error('Error loading journal tags:', error);
      return [];
    }
  }, [user]);

  // Save journal entry to Supabase
  const saveJournalEntry = useCallback(async (entry: JournalEntry): Promise<boolean> => {
    if (!user) return false;

    const data = transformJournalToDB(entry, user.id);

    if (!isOnline) {
      await queueChange('create', 'journal_entries', entry.id, data);
      return true;
    }

    try {
      await ensureValidSession();
      
      // Check if entry with this id already exists
      const { data: existing, error: checkError } = await supabase
        .from('journal_entries')
        .select('id, date')
        .eq('id', entry.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError) {
        console.error('[JournalSync] Error checking existing entry:', checkError);
        throw checkError;
      }

      if (existing) {
        // Update existing entry
        console.log('[JournalSync] Updating existing journal entry:', entry.id, 'date:', existing.date);
        const { error } = await supabase
          .from('journal_entries')
          .update(data)
          .eq('id', entry.id)
          .eq('user_id', user.id);
        
        if (error) {
          console.error('[JournalSync] Update error:', error);
          throw error;
        }
        console.log('[JournalSync] Successfully updated journal entry');
      } else {
        // Insert new entry - always insert, don't check for date conflicts
        // Multiple entries can exist for the same date
        console.log('[JournalSync] Inserting new journal entry:', entry.id, 'date:', entry.date);
        const { error, data: insertedData } = await supabase
          .from('journal_entries')
          .insert(data)
          .select();
        
        if (error) {
          console.error('[JournalSync] Insert error:', error);
          throw error;
        }
        
        console.log('[JournalSync] Successfully inserted journal entry:', insertedData?.[0]?.id);
      }
      
      return true;
    } catch (error) {
      console.error('Error saving journal entry:', error);
      await queueChange('create', 'journal_entries', entry.id, data);
      return false;
    }
  }, [user, isOnline, queueChange]);

  // Update journal entry in Supabase
  const updateJournalEntry = useCallback(async (id: string, updates: Partial<JournalEntry>): Promise<boolean> => {
    if (!user) return false;

    const data = transformJournalToDB(updates, user.id);
    delete data.id;
    delete data.user_id;

    if (!isOnline) {
      await queueChange('update', 'journal_entries', id, data);
      return true;
    }

    try {
      const { error } = await supabase
        .from('journal_entries')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating journal entry:', error);
      await queueChange('update', 'journal_entries', id, data);
      return false;
    }
  }, [user, isOnline, queueChange]);

  // Delete journal entry from Supabase
  const deleteJournalEntry = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;

    if (!isOnline) {
      await queueChange('delete', 'journal_entries', id, {});
      return true;
    }

    try {
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      await queueChange('delete', 'journal_entries', id, {});
      return false;
    }
  }, [user, isOnline, queueChange]);

  return {
    loadJournalEntries,
    loadJournalTags,
    saveJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
  };
}
