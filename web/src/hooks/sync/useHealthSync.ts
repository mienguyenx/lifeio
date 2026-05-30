import { useCallback } from 'react';
import { activeSupabase as supabase, ensureValidSession } from '@/integrations/supabase/externalClient';
import { useAuth } from '@/hooks/useAuth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useSyncQueue } from './useSyncQueue';
import type { Database } from '@/integrations/supabase/types';

export interface HealthLog {
  id: string;
  date: string;
  type: 'weight' | 'sleep' | 'water' | 'exercise' | 'mood' | 'steps';
  value: number;
  unit: string;
  notes?: string;
}

type HealthLogRow = Database['public']['Tables']['health_logs']['Row'];

// Transform Supabase row to local HealthLog type
function transformHealthLogFromDB(row: HealthLogRow): HealthLog {
  return {
    id: row.id,
    date: row.date,
    type: row.type as HealthLog['type'],
    value: Number(row.value),
    unit: row.unit,
    notes: row.notes || undefined,
  };
}

// Transform local HealthLog to Supabase insert/update format
function transformHealthLogToDB(log: Partial<HealthLog>, userId: string) {
  return {
    id: log.id,
    user_id: userId,
    date: log.date,
    type: log.type,
    value: log.value,
    unit: log.unit,
    notes: log.notes || null,
  };
}

// Transform partial updates only
function transformHealthLogUpdatesToDB(updates: Partial<HealthLog>): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  
  if ('date' in updates) data.date = updates.date;
  if ('type' in updates) data.type = updates.type;
  if ('value' in updates) data.value = updates.value;
  if ('unit' in updates) data.unit = updates.unit;
  if ('notes' in updates) data.notes = updates.notes || null;
  
  return data;
}

export function useHealthSync() {
  const { user } = useAuth();
  const { isOnline } = useOnlineStatus();
  const { queueChange } = useSyncQueue();

  // Load health logs from Supabase
  const loadHealthLogs = useCallback(async (): Promise<HealthLog[]> => {
    if (!user) {
      console.log('[HealthSync] No user, skipping load');
      return [];
    }

    try {
      console.log('[HealthSync] Loading health logs for user:', user.id);
      await ensureValidSession();
      
      const { data, error } = await supabase
        .from('health_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[HealthSync] Error loading health logs:', error);
        throw error;
      }

      console.log('[HealthSync] Loaded', data?.length || 0, 'health logs');
      return (data || []).map(transformHealthLogFromDB);
    } catch (error) {
      console.error('[HealthSync] Error loading health logs:', error);
      return [];
    }
  }, [user]);

  // Save health log to Supabase
  const saveHealthLog = useCallback(async (log: HealthLog): Promise<boolean> => {
    if (!user) return false;

    const data = transformHealthLogToDB(log, user.id);

    if (!isOnline) {
      await queueChange('create', 'health_logs', log.id, data);
      return true;
    }

    try {
      await ensureValidSession();
      
      console.log('[HealthSync] Saving health log to Supabase:', log.type, log.value, data);
      const { error } = await supabase
        .from('health_logs')
        .upsert(data);

      if (error) {
        console.error('[HealthSync] Error saving health log:', error);
        throw error;
      }
      
      console.log('[HealthSync] Successfully saved health log to Supabase:', log.type);
      return true;
    } catch (error) {
      console.error('[HealthSync] Error saving health log:', error);
      await queueChange('create', 'health_logs', log.id, data);
      return false;
    }
  }, [user, isOnline, queueChange]);

  // Update health log in Supabase
  const updateHealthLog = useCallback(async (id: string, updates: Partial<HealthLog>): Promise<boolean> => {
    if (!user) return false;

    const data = transformHealthLogUpdatesToDB(updates);

    if (!isOnline) {
      await queueChange('update', 'health_logs', id, data);
      return true;
    }

    try {
      await ensureValidSession();
      
      const { error } = await supabase
        .from('health_logs')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating health log:', error);
      await queueChange('update', 'health_logs', id, data);
      return false;
    }
  }, [user, isOnline, queueChange]);

  // Delete health log from Supabase
  const deleteHealthLog = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;

    if (!isOnline) {
      await queueChange('delete', 'health_logs', id, {});
      return true;
    }

    try {
      await ensureValidSession();
      
      const { error } = await supabase
        .from('health_logs')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting health log:', error);
      await queueChange('delete', 'health_logs', id, {});
      return false;
    }
  }, [user, isOnline, queueChange]);

  return {
    loadHealthLogs,
    saveHealthLog,
    updateHealthLog,
    deleteHealthLog,
  };
}

