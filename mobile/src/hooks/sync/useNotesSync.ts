import { useCallback } from 'react';
import { supabase, ensureValidSession } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { addToSyncQueue } from '@/lib/storage';
import type { Note } from '@/types/lifeos';
import type { Database } from '@/integrations/supabase/types';

type NoteRow = Database['public']['Tables']['notes']['Row'];

function transformNoteFromDB(row: NoteRow): Note {
  return {
    id: row.id,
    title: row.title,
    content: row.content || '',
    tags: row.tags || undefined,
    area: row.area || undefined,
    isPinned: row.is_pinned || undefined,
    isFavorite: row.is_favorite || undefined,
    color: row.color || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    archivedAt: row.archived_at || undefined,
    deletedAt: row.deleted_at || undefined,
  };
}

function transformNoteToDB(note: Partial<Note>, userId: string) {
  return {
    id: note.id,
    user_id: userId,
    title: note.title,
    content: note.content || null,
    tags: note.tags || null,
    area: note.area || null,
    is_pinned: note.isPinned || null,
    is_favorite: note.isFavorite || null,
    color: note.color || null,
    archived_at: note.archivedAt || null,
    deleted_at: note.deletedAt || null,
    updated_at: note.updatedAt || new Date().toISOString(),
  };
}

export function useNotesSync() {
  const { user } = useAuth();
  const { isOnline } = useOnlineStatus();

  const loadNotes = useCallback(async (): Promise<Note[]> => {
    if (!user) return [];
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .range(0, 499);
      if (error) throw error;
      return (data || []).map(transformNoteFromDB);
    } catch {
      return [];
    }
  }, [user]);

  const saveNote = useCallback(async (note: Note): Promise<boolean> => {
    if (!user) return false;
    const data = transformNoteToDB(note, user.id);
    if (!isOnline) {
      await addToSyncQueue('create', 'notes', note.id, data);
      return true;
    }
    try {
      await ensureValidSession();
      const { error } = await supabase.from('notes').upsert(data);
      if (error) throw error;
      return true;
    } catch {
      await addToSyncQueue('create', 'notes', note.id, data);
      return false;
    }
  }, [user, isOnline]);

  const updateNote = useCallback(async (id: string, updates: Partial<Note>): Promise<boolean> => {
    if (!user) return false;
    const data: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if ('title' in updates) data.title = updates.title;
    if ('content' in updates) data.content = updates.content || null;
    if ('tags' in updates) data.tags = updates.tags || null;
    if ('area' in updates) data.area = updates.area || null;
    if ('isPinned' in updates) data.is_pinned = updates.isPinned || null;
    if ('isFavorite' in updates) data.is_favorite = updates.isFavorite || null;
    if ('color' in updates) data.color = updates.color || null;
    if ('archivedAt' in updates) data.archived_at = updates.archivedAt || null;
    if ('deletedAt' in updates) data.deleted_at = updates.deletedAt || null;

    if (!isOnline) {
      await addToSyncQueue('update', 'notes', id, data);
      return true;
    }
    try {
      await ensureValidSession();
      const { error } = await supabase.from('notes').update(data).eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      return true;
    } catch {
      await addToSyncQueue('update', 'notes', id, data);
      return false;
    }
  }, [user, isOnline]);

  const deleteNote = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;
    if (!isOnline) {
      await addToSyncQueue('delete', 'notes', id, {});
      return true;
    }
    try {
      await ensureValidSession();
      const { error } = await supabase.from('notes').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      return true;
    } catch {
      await addToSyncQueue('delete', 'notes', id, {});
      return false;
    }
  }, [user, isOnline]);

  return { loadNotes, saveNote, updateNote, deleteNote };
}
