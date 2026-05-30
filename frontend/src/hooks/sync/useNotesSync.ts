import { useCallback } from 'react';
import { activeSupabase as supabase, ensureValidSession } from '@/integrations/supabase/externalClient';
import { useAuth } from '@/hooks/useAuth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useSyncQueue } from './useSyncQueue';
import type { Note, NoteTag } from '@/types/lifeos';
import type { Database } from '@/integrations/supabase/types';

type NoteRow = Database['public']['Tables']['notes']['Row'];
type NoteTagRow = Database['public']['Tables']['note_tags']['Row'];

// Transform Supabase row to local Note type
function transformNoteFromDB(row: NoteRow): Note {
  return {
    id: row.id,
    title: row.title,
    content: row.content || '',
    tags: row.tags || undefined,
    area: row.area || undefined,
    isPinned: row.is_pinned || false,
    isFavorite: row.is_favorite || false,
    color: row.color || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    archivedAt: row.archived_at || undefined,
    deletedAt: row.deleted_at || undefined,
  };
}

// Transform local Note to Supabase format
function transformNoteToDB(note: Partial<Note>, userId: string) {
  return {
    id: note.id,
    user_id: userId,
    title: note.title,
    content: note.content || null,
    tags: note.tags || null,
    area: note.area || null,
    is_pinned: note.isPinned || false,
    is_favorite: note.isFavorite || false,
    color: note.color || null,
    archived_at: note.archivedAt || null,
    deleted_at: note.deletedAt || null,
    updated_at: new Date().toISOString(),
  };
}

export function useNotesSync() {
  const { user } = useAuth();
  const { isOnline } = useOnlineStatus();
  const { queueChange } = useSyncQueue();

  // Load notes from Supabase
  const loadNotes = useCallback(async (): Promise<Note[]> => {
    if (!user) {
      console.log('[NotesSync] No user, skipping load');
      return [];
    }

    try {
      console.log('[NotesSync] Loading notes for user:', user.id);
      await ensureValidSession();
      
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('[NotesSync] Error loading notes:', error);
        throw error;
      }

      console.log('[NotesSync] Loaded', data?.length || 0, 'notes');
      return (data || []).map(transformNoteFromDB);
    } catch (error) {
      console.error('[NotesSync] Error loading notes:', error);
      return [];
    }
  }, [user]);

  // Load note tags from Supabase
  const loadNoteTags = useCallback(async (): Promise<NoteTag[]> => {
    if (!user) {
      console.log('[NotesSync] No user, skipping load note tags');
      return [];
    }

    try {
      console.log('[NotesSync] Loading note tags for user:', user.id);
      await ensureValidSession();
      
      const { data, error } = await supabase
        .from('note_tags')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('[NotesSync] Error loading note tags:', error);
        throw error;
      }

      console.log('[NotesSync] Loaded', data?.length || 0, 'note tags');
      return (data || []).map(t => ({
        id: t.id,
        name: t.name,
        color: t.color,
      }));
    } catch (error) {
      console.error('[NotesSync] Error loading note tags:', error);
      return [];
    }
  }, [user]);

  // Save note to Supabase
  const saveNote = useCallback(async (note: Note): Promise<boolean> => {
    if (!user) return false;

    const data = transformNoteToDB(note, user.id);

    if (!isOnline) {
      await queueChange('create', 'notes', note.id, data);
      return true;
    }

    try {
      await ensureValidSession();
      
      console.log('[NotesSync] Saving note to Supabase:', note.title, data);
      const { error } = await supabase
        .from('notes')
        .upsert(data);

      if (error) {
        console.error('[NotesSync] Error saving note:', error);
        throw error;
      }
      
      console.log('[NotesSync] Successfully saved note to Supabase:', note.title);
      return true;
    } catch (error) {
      console.error('[NotesSync] Error saving note:', error);
      await queueChange('create', 'notes', note.id, data);
      return false;
    }
  }, [user, isOnline, queueChange]);

  // Update note in Supabase
  const updateNote = useCallback(async (id: string, updates: Partial<Note>): Promise<boolean> => {
    if (!user) return false;

    const data = transformNoteToDB(updates, user.id);
    delete data.id;
    delete data.user_id;

    if (!isOnline) {
      await queueChange('update', 'notes', id, data);
      return true;
    }

    try {
      await ensureValidSession();
      
      console.log('[NotesSync] Updating note in Supabase:', id, data);
      const { error } = await supabase
        .from('notes')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('[NotesSync] Error updating note:', error);
        throw error;
      }
      
      console.log('[NotesSync] Successfully updated note in Supabase:', id);
      return true;
    } catch (error) {
      console.error('[NotesSync] Error updating note:', error);
      await queueChange('update', 'notes', id, data);
      return false;
    }
  }, [user, isOnline, queueChange]);

  // Delete note from Supabase
  const deleteNote = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;

    if (!isOnline) {
      await queueChange('delete', 'notes', id, {});
      return true;
    }

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting note:', error);
      await queueChange('delete', 'notes', id, {});
      return false;
    }
  }, [user, isOnline, queueChange]);

  return {
    loadNotes,
    loadNoteTags,
    saveNote,
    updateNote,
    deleteNote,
  };
}
