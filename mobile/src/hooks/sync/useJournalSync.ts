import { useCallback } from 'react';
import { supabase, ensureValidSession } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { addToSyncQueue } from '@/lib/storage';
import type { JournalEntry } from '@/types/lifeos';
import type { Database } from '@/integrations/supabase/types';

type JournalRow = Database['public']['Tables']['journal_entries']['Row'];

function transformJournalFromDB(row: JournalRow): JournalEntry {
  return {
    id: row.id,
    date: row.date,
    content: row.content,
    mood: (row.mood || 3) as JournalEntry['mood'],
    energy: (row.energy || 3) as JournalEntry['energy'],
    areas: row.areas || undefined,
    gratitude: row.gratitude || undefined,
    tags: row.tags || undefined,
    images: row.images || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

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

  const loadJournalEntries = useCallback(async (): Promise<JournalEntry[]> => {
    if (!user) return [];
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .range(0, 199);
      if (error) throw error;
      return (data || []).map(transformJournalFromDB);
    } catch {
      return [];
    }
  }, [user]);

  const saveJournalEntry = useCallback(async (entry: JournalEntry): Promise<boolean> => {
    if (!user) return false;
    const data = transformJournalToDB(entry, user.id);
    if (!isOnline) {
      await addToSyncQueue('create', 'journal_entries', entry.id, data);
      return true;
    }
    try {
      await ensureValidSession();
      const { error } = await supabase.from('journal_entries').upsert(data);
      if (error) throw error;
      return true;
    } catch {
      await addToSyncQueue('create', 'journal_entries', entry.id, data);
      return false;
    }
  }, [user, isOnline]);

  const updateJournalEntry = useCallback(async (id: string, updates: Partial<JournalEntry>): Promise<boolean> => {
    if (!user) return false;
    const data: Record<string, unknown> = {};
    if ('content' in updates) data.content = updates.content;
    if ('mood' in updates) data.mood = updates.mood;
    if ('energy' in updates) data.energy = updates.energy;
    if ('areas' in updates) data.areas = updates.areas || null;
    if ('gratitude' in updates) data.gratitude = updates.gratitude || null;
    if ('tags' in updates) data.tags = updates.tags || null;
    if ('images' in updates) data.images = updates.images || null;

    if (!isOnline) {
      await addToSyncQueue('update', 'journal_entries', id, data);
      return true;
    }
    try {
      await ensureValidSession();
      const { error } = await supabase.from('journal_entries').update(data).eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      return true;
    } catch {
      await addToSyncQueue('update', 'journal_entries', id, data);
      return false;
    }
  }, [user, isOnline]);

  const deleteJournalEntry = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;
    if (!isOnline) {
      await addToSyncQueue('delete', 'journal_entries', id, {});
      return true;
    }
    try {
      await ensureValidSession();
      const { error } = await supabase.from('journal_entries').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      return true;
    } catch {
      await addToSyncQueue('delete', 'journal_entries', id, {});
      return false;
    }
  }, [user, isOnline]);

  return { loadJournalEntries, saveJournalEntry, updateJournalEntry, deleteJournalEntry };
}
