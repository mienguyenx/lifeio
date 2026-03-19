import { useCallback } from 'react';
import { activeSupabase as supabase, ensureValidSession } from '@/integrations/supabase/externalClient';
import { useAuth } from '@/hooks/useAuth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useSyncQueue } from './useSyncQueue';
import type { Database } from '@/integrations/supabase/types';

export interface Contact {
  id: string;
  name: string;
  relationship: 'family' | 'friend' | 'colleague' | 'mentor' | 'other';
  phone?: string;
  email?: string;
  birthday?: string;
  notes?: string;
  importance: 1 | 2 | 3 | 4 | 5;
  lastContact?: string;
  createdAt: string;
}

export interface Interaction {
  id: string;
  contactId: string;
  type: 'call' | 'message' | 'meeting' | 'video_call' | 'other';
  date: string;
  notes?: string;
  duration?: number;
}

type ContactRow = Database['public']['Tables']['relationships_contacts']['Row'];
type InteractionRow = Database['public']['Tables']['relationships_interactions']['Row'];

// Transform Supabase row to local Contact type
function transformContactFromDB(row: ContactRow): Contact {
  return {
    id: row.id,
    name: row.name,
    relationship: row.relationship as Contact['relationship'],
    phone: row.phone || undefined,
    email: row.email || undefined,
    birthday: row.birthday || undefined,
    notes: row.notes || undefined,
    importance: row.importance as 1 | 2 | 3 | 4 | 5,
    lastContact: row.last_contact || undefined,
    createdAt: row.created_at,
  };
}

// Transform Supabase row to local Interaction type
function transformInteractionFromDB(row: InteractionRow): Interaction {
  return {
    id: row.id,
    contactId: row.contact_id,
    type: row.type as Interaction['type'],
    date: row.date,
    notes: row.notes || undefined,
    duration: row.duration || undefined,
  };
}

// Transform local Contact to Supabase insert/update format
function transformContactToDB(contact: Partial<Contact>, userId: string) {
  return {
    id: contact.id,
    user_id: userId,
    name: contact.name,
    relationship: contact.relationship,
    phone: contact.phone || null,
    email: contact.email || null,
    birthday: contact.birthday || null,
    notes: contact.notes || null,
    importance: contact.importance || 3,
    last_contact: contact.lastContact || null,
  };
}

// Transform local Interaction to Supabase insert/update format
function transformInteractionToDB(interaction: Partial<Interaction>, userId: string) {
  return {
    id: interaction.id,
    user_id: userId,
    contact_id: interaction.contactId,
    type: interaction.type,
    date: interaction.date,
    notes: interaction.notes || null,
    duration: interaction.duration || null,
  };
}

// Transform partial updates only
function transformContactUpdatesToDB(updates: Partial<Contact>): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  
  if ('name' in updates) data.name = updates.name;
  if ('relationship' in updates) data.relationship = updates.relationship;
  if ('phone' in updates) data.phone = updates.phone || null;
  if ('email' in updates) data.email = updates.email || null;
  if ('birthday' in updates) data.birthday = updates.birthday || null;
  if ('notes' in updates) data.notes = updates.notes || null;
  if ('importance' in updates) data.importance = updates.importance;
  if ('lastContact' in updates) data.last_contact = updates.lastContact || null;
  
  return data;
}

function transformInteractionUpdatesToDB(updates: Partial<Interaction>): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  
  if ('contactId' in updates) data.contact_id = updates.contactId;
  if ('type' in updates) data.type = updates.type;
  if ('date' in updates) data.date = updates.date;
  if ('notes' in updates) data.notes = updates.notes || null;
  if ('duration' in updates) data.duration = updates.duration || null;
  
  return data;
}

export function useRelationshipsSync() {
  const { user } = useAuth();
  const { isOnline } = useOnlineStatus();
  const { queueChange } = useSyncQueue();

  // Load contacts from Supabase
  const loadContacts = useCallback(async (): Promise<Contact[]> => {
    if (!user) {
      console.log('[RelationshipsSync] No user, skipping load contacts');
      return [];
    }

    try {
      console.log('[RelationshipsSync] Loading contacts for user:', user.id);
      await ensureValidSession();
      
      const { data, error } = await supabase
        .from('relationships_contacts')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[RelationshipsSync] Error loading contacts:', error);
        throw error;
      }

      console.log('[RelationshipsSync] Loaded', data?.length || 0, 'contacts');
      return (data || []).map(transformContactFromDB);
    } catch (error) {
      console.error('[RelationshipsSync] Error loading contacts:', error);
      return [];
    }
  }, [user]);

  // Load interactions from Supabase
  const loadInteractions = useCallback(async (): Promise<Interaction[]> => {
    if (!user) {
      console.log('[RelationshipsSync] No user, skipping load interactions');
      return [];
    }

    try {
      console.log('[RelationshipsSync] Loading interactions for user:', user.id);
      await ensureValidSession();
      
      const { data, error } = await supabase
        .from('relationships_interactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[RelationshipsSync] Error loading interactions:', error);
        throw error;
      }

      console.log('[RelationshipsSync] Loaded', data?.length || 0, 'interactions');
      return (data || []).map(transformInteractionFromDB);
    } catch (error) {
      console.error('[RelationshipsSync] Error loading interactions:', error);
      return [];
    }
  }, [user]);

  // Save contact to Supabase
  const saveContact = useCallback(async (contact: Contact): Promise<boolean> => {
    if (!user) return false;

    const data = transformContactToDB(contact, user.id);

    if (!isOnline) {
      await queueChange('create', 'relationships_contacts', contact.id, data);
      return true;
    }

    try {
      await ensureValidSession();
      
      console.log('[RelationshipsSync] Saving contact to Supabase:', contact.name, data);
      const { error } = await supabase
        .from('relationships_contacts')
        .upsert(data);

      if (error) {
        console.error('[RelationshipsSync] Error saving contact:', error);
        throw error;
      }
      
      console.log('[RelationshipsSync] Successfully saved contact to Supabase:', contact.name);
      return true;
    } catch (error) {
      console.error('[RelationshipsSync] Error saving contact:', error);
      await queueChange('create', 'relationships_contacts', contact.id, data);
      return false;
    }
  }, [user, isOnline, queueChange]);

  // Update contact in Supabase
  const updateContact = useCallback(async (id: string, updates: Partial<Contact>): Promise<boolean> => {
    if (!user) return false;

    const data = transformContactUpdatesToDB(updates);

    if (!isOnline) {
      await queueChange('update', 'relationships_contacts', id, data);
      return true;
    }

    try {
      await ensureValidSession();
      
      const { error } = await supabase
        .from('relationships_contacts')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating contact:', error);
      await queueChange('update', 'relationships_contacts', id, data);
      return false;
    }
  }, [user, isOnline, queueChange]);

  // Delete contact from Supabase (soft delete)
  const deleteContact = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;

    if (!isOnline) {
      await queueChange('update', 'relationships_contacts', id, { deleted_at: new Date().toISOString() });
      return true;
    }

    try {
      await ensureValidSession();
      
      const { error } = await supabase
        .from('relationships_contacts')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting contact:', error);
      await queueChange('update', 'relationships_contacts', id, { deleted_at: new Date().toISOString() });
      return false;
    }
  }, [user, isOnline, queueChange]);

  // Save interaction to Supabase
  const saveInteraction = useCallback(async (interaction: Interaction): Promise<boolean> => {
    if (!user) return false;

    const data = transformInteractionToDB(interaction, user.id);

    if (!isOnline) {
      await queueChange('create', 'relationships_interactions', interaction.id, data);
      return true;
    }

    try {
      await ensureValidSession();
      
      console.log('[RelationshipsSync] Saving interaction to Supabase:', interaction.type, data);
      const { error } = await supabase
        .from('relationships_interactions')
        .insert(data);

      if (error) {
        console.error('[RelationshipsSync] Error saving interaction:', error);
        throw error;
      }

      // Update last_contact on the contact
      if (interaction.contactId) {
        await supabase
          .from('relationships_contacts')
          .update({ last_contact: interaction.date })
          .eq('id', interaction.contactId)
          .eq('user_id', user.id);
      }

      console.log('[RelationshipsSync] Successfully saved interaction to Supabase:', interaction.type);
      return true;
    } catch (error) {
      console.error('[RelationshipsSync] Error saving interaction:', error);
      await queueChange('create', 'relationships_interactions', interaction.id, data);
      return false;
    }
  }, [user, isOnline, queueChange]);

  // Update interaction in Supabase
  const updateInteraction = useCallback(async (id: string, updates: Partial<Interaction>): Promise<boolean> => {
    if (!user) return false;

    const data = transformInteractionUpdatesToDB(updates);

    if (!isOnline) {
      await queueChange('update', 'relationships_interactions', id, data);
      return true;
    }

    try {
      await ensureValidSession();
      
      const { error } = await supabase
        .from('relationships_interactions')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating interaction:', error);
      await queueChange('update', 'relationships_interactions', id, data);
      return false;
    }
  }, [user, isOnline, queueChange]);

  // Delete interaction from Supabase
  const deleteInteraction = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;

    if (!isOnline) {
      await queueChange('delete', 'relationships_interactions', id, {});
      return true;
    }

    try {
      await ensureValidSession();
      
      const { error } = await supabase
        .from('relationships_interactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting interaction:', error);
      await queueChange('delete', 'relationships_interactions', id, {});
      return false;
    }
  }, [user, isOnline, queueChange]);

  return {
    loadContacts,
    loadInteractions,
    saveContact,
    updateContact,
    deleteContact,
    saveInteraction,
    updateInteraction,
    deleteInteraction,
  };
}

