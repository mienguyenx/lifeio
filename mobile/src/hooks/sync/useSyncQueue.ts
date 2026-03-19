import { useCallback } from 'react';
import { supabase, ensureValidSession } from '@/integrations/supabase/client';
import { getPendingSyncItems, removeSyncItem, addToSyncQueue } from '@/lib/storage';

export function useSyncQueue() {
  const queueChange = useCallback(async (
    action: 'create' | 'update' | 'delete',
    entity: string,
    entityId: string,
    data: unknown
  ) => {
    await addToSyncQueue(action, entity, entityId, data);
  }, []);

  const processSyncQueue = useCallback(async () => {
    const items = await getPendingSyncItems();
    if (items.length === 0) return;

    // Sort by timestamp
    items.sort((a, b) => a.timestamp - b.timestamp);

    const BATCH_SIZE = 10;
    const batch = items.slice(0, BATCH_SIZE);

    for (const item of batch) {
      let success = false;
      let attempts = 0;
      const maxAttempts = 3;

      while (!success && attempts < maxAttempts) {
        try {
          await ensureValidSession();

          if (item.action === 'create' || item.action === 'update') {
            const { error } = await supabase
              .from(item.entity as any)
              .upsert(item.data as any);
            if (error) throw error;
          } else if (item.action === 'delete') {
            const { error } = await supabase
              .from(item.entity as any)
              .delete()
              .eq('id', item.entityId);
            if (error) throw error;
          }

          await removeSyncItem(item.id);
          success = true;
        } catch (error: any) {
          attempts++;
          if (error?.status >= 400 && error?.status < 500) {
            // Client error - remove from queue
            await removeSyncItem(item.id);
            break;
          }
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts)));
          }
        }
      }
    }
  }, []);

  return { queueChange, processSyncQueue };
}
