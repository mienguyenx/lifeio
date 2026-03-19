import { useCallback, useEffect, useState } from 'react';
import { addToSyncQueue, getPendingSyncItems, removeSyncItem, clearSyncQueue, getSyncQueueCount } from '@/lib/indexedDB';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { activeSupabase as supabase } from '@/integrations/supabase/externalClient';
import { useAuth } from '@/hooks/useAuth';

export type SyncAction = 'create' | 'update' | 'delete';
export type SyncEntity = 'habits' | 'tasks' | 'goals' | 'journal_entries' | 'notes' | 'daily_intentions' | 'life_wheel_scores' | 'weekly_reviews' | 'health_logs' | 'finance_transactions' | 'learning_courses' | 'learning_books' | 'relationships_contacts' | 'relationships_interactions';

interface SyncItem {
  id?: number;
  action: SyncAction;
  entity: SyncEntity;
  entityId: string;
  data: unknown;
  timestamp: number;
}

export function useSyncQueue() {
  const { isOnline, refreshPendingCount } = useOnlineStatus();
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Add item to sync queue (for offline changes)
  const queueChange = useCallback(async (
    action: SyncAction,
    entity: SyncEntity,
    entityId: string,
    data: unknown
  ) => {
    await addToSyncQueue(action, entity, entityId, data);
    const count = await getSyncQueueCount();
    setPendingCount(count);
    // Refresh pending count in useOnlineStatus immediately
    await refreshPendingCount();
  }, [refreshPendingCount]);

  // Helper for exponential backoff delay
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Process single sync item with retry logic
  const processSyncItem = useCallback(async (item: SyncItem, retries = 3): Promise<boolean> => {
    if (!user) return false;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const { action, entity, entityId, data } = item;
        const dataWithUser = { ...(data as object), user_id: user.id };

        switch (action) {
          case 'create': {
            const { error } = await supabase
              .from(entity)
              .insert(dataWithUser as never);
            if (error) throw error;
            break;
          }
          case 'update': {
            const { error } = await supabase
              .from(entity)
              .update(data as never)
              .eq('id', entityId as never)
              .eq('user_id', user.id as never);
            if (error) throw error;
            break;
          }
          case 'delete': {
            const { error } = await supabase
              .from(entity)
              .delete()
              .eq('id', entityId as never)
              .eq('user_id', user.id as never);
            if (error) throw error;
            break;
          }
        }

        // Remove from queue after successful sync
        if (item.id) {
          await removeSyncItem(item.id);
        }
        return true;
      } catch (error) {
        if (attempt === retries - 1) {
          console.error(`[SyncQueue] Sync item failed after ${retries} attempts:`, item, error);
          return false;
        }
        const delayMs = 1000 * Math.pow(2, attempt); // 1s, 2s, 4s
        console.warn(`[SyncQueue] Retrying sync item (attempt ${attempt + 1}/${retries}) after ${delayMs}ms...`);
        await delay(delayMs);
      }
    }
    return false;
  }, [user]);

  // Process all pending sync items
  const processQueue = useCallback(async (): Promise<number> => {
    if (!isOnline || !user || isSyncing) {
      console.log('[SyncQueue] Cannot process - offline:', !isOnline, 'no user:', !user, 'syncing:', isSyncing);
      return 0;
    }

    setIsSyncing(true);
    let successCount = 0;

    try {
      const items = await getPendingSyncItems();
      
      if (items.length === 0) {
        console.log('[SyncQueue] No items to sync');
        return 0;
      }

      console.log(`[SyncQueue] Processing ${items.length} items in batches...`);
      
      // Process items in batches of 10 for better performance
      const BATCH_SIZE = 10;
      for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = items.slice(i, i + BATCH_SIZE);
        console.log(`[SyncQueue] Processing batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} items)...`);
        
        // Process batch in parallel
        const batchResults = await Promise.allSettled(
          batch.map(item => processSyncItem(item as SyncItem))
        );
        
        // Count successes
        batchResults.forEach((result, index) => {
          const item = batch[index];
          if (result.status === 'fulfilled' && result.value) {
            successCount++;
            console.log(`[SyncQueue] ✓ Synced ${item.action} ${item.entity} ${item.entityId}`);
          } else {
            console.warn(`[SyncQueue] ✗ Failed to sync ${item.action} ${item.entity} ${item.entityId}`);
          }
        });
      }

      const count = await getSyncQueueCount();
      setPendingCount(count);
      // Refresh pending count in useOnlineStatus immediately
      await refreshPendingCount();
      
      console.log(`[SyncQueue] Completed: ${successCount}/${items.length} synced, ${count} remaining`);
    } catch (error) {
      console.error('[SyncQueue] Queue processing error:', error);
      throw error; // Re-throw to let caller handle
    } finally {
      setIsSyncing(false);
    }

    return successCount;
  }, [isOnline, user, isSyncing, processSyncItem, refreshPendingCount]);

  // Clear all pending items
  const clearQueue = useCallback(async () => {
    await clearSyncQueue();
    setPendingCount(0);
    // Refresh pending count in useOnlineStatus immediately
    await refreshPendingCount();
  }, [refreshPendingCount]);

  // Update pending count on mount
  useEffect(() => {
    getSyncQueueCount().then(setPendingCount);
  }, []);

  // Auto-process queue when coming online
  useEffect(() => {
    if (isOnline && user && pendingCount > 0) {
      processQueue();
    }
  }, [isOnline, user, pendingCount, processQueue]);

  return {
    queueChange,
    processQueue,
    clearQueue,
    pendingCount,
    isSyncing,
  };
}
