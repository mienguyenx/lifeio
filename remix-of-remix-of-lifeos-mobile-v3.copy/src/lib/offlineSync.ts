import { getPendingSyncItems, clearSyncQueue, removeSyncItem, getSyncQueueCount } from './indexedDB';

// Sync status tracking
let isSyncing = false;
let lastSyncTime: number | null = null;
let syncRetryCount = 0;
const MAX_RETRY_COUNT = 3;
const RETRY_DELAY_BASE = 1000; // Base delay in ms, will exponentially increase

// Event emitter for sync status
type SyncEventType = 'start' | 'progress' | 'complete' | 'error';
type SyncEventHandler = (data: { type: SyncEventType; progress?: number; total?: number; error?: Error }) => void;
const syncListeners: Set<SyncEventHandler> = new Set();

export function addSyncListener(handler: SyncEventHandler) {
  syncListeners.add(handler);
  return () => syncListeners.delete(handler);
}

function emitSyncEvent(type: SyncEventType, data: { progress?: number; total?: number; error?: Error } = {}) {
  syncListeners.forEach(handler => handler({ type, ...data }));
}

// Main sync function
export async function syncOfflineData(): Promise<boolean> {
  if (isSyncing) {
    console.log('[Sync] Already syncing, skipping...');
    return false;
  }

  const pendingItems = await getPendingSyncItems();
  
  if (pendingItems.length === 0) {
    console.log('[Sync] No pending items to sync');
    return true;
  }

  isSyncing = true;
  emitSyncEvent('start', { total: pendingItems.length });
  console.log(`[Sync] Starting sync of ${pendingItems.length} items...`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < pendingItems.length; i++) {
    const item = pendingItems[i];
    
    try {
      // Emit progress
      emitSyncEvent('progress', { progress: i + 1, total: pendingItems.length });
      
      // Attempt to sync item
      await syncItemWithRetry(item);
      
      // Remove from queue after successful sync
      if (item.id) {
        await removeSyncItem(item.id);
      }
      
      successCount++;
      console.log(`[Sync] ✓ ${item.action} ${item.entity} ${item.entityId}`);
    } catch (error) {
      failCount++;
      console.error(`[Sync] ✗ Failed:`, item, error);
      // Keep item in queue for next sync attempt
    }
  }

  isSyncing = false;
  lastSyncTime = Date.now();
  
  const allSuccess = failCount === 0;
  
  if (allSuccess) {
    syncRetryCount = 0;
    emitSyncEvent('complete', { progress: successCount, total: pendingItems.length });
    console.log(`[Sync] Complete! ${successCount}/${pendingItems.length} synced`);
  } else {
    emitSyncEvent('error', { 
      progress: successCount, 
      total: pendingItems.length,
      error: new Error(`${failCount} items failed to sync`)
    });
    console.log(`[Sync] Partial: ${successCount} success, ${failCount} failed`);
  }

  return allSuccess;
}

// Sync a single item with retry logic
async function syncItemWithRetry(item: { 
  action: string; 
  entity: string; 
  entityId: string; 
  data: unknown;
  timestamp: number;
}): Promise<void> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= MAX_RETRY_COUNT; attempt++) {
    try {
      // In a real implementation, this would send to your backend
      // For now, we simulate with a small delay
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Example of what real sync would look like:
      // await syncToSupabase(item);
      
      return; // Success
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < MAX_RETRY_COUNT) {
        // Exponential backoff
        const delay = RETRY_DELAY_BASE * Math.pow(2, attempt);
        console.log(`[Sync] Retry ${attempt + 1}/${MAX_RETRY_COUNT} in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Sync failed after retries');
}

// Get sync status
export function getSyncStatus() {
  return {
    isSyncing,
    lastSyncTime,
    retryCount: syncRetryCount,
  };
}

// Conflict resolution strategies
export type ConflictStrategy = 'local-wins' | 'remote-wins' | 'merge' | 'manual';

export interface SyncConflict {
  entity: string;
  entityId: string;
  localData: unknown;
  remoteData: unknown;
  localTimestamp: number;
  remoteTimestamp: number;
}

export function resolveConflict(
  conflict: SyncConflict,
  strategy: ConflictStrategy
): unknown {
  switch (strategy) {
    case 'local-wins':
      return conflict.localData;
    case 'remote-wins':
      return conflict.remoteData;
    case 'merge':
      // Simple merge: combine both objects, local takes precedence
      if (typeof conflict.localData === 'object' && typeof conflict.remoteData === 'object') {
        return { ...conflict.remoteData as object, ...conflict.localData as object };
      }
      // For non-objects, use the most recent
      return conflict.localTimestamp > conflict.remoteTimestamp 
        ? conflict.localData 
        : conflict.remoteData;
    case 'manual':
    default:
      // Return both for manual resolution
      return {
        _conflict: true,
        local: conflict.localData,
        remote: conflict.remoteData,
      };
  }
}

// Register background sync (for supported browsers)
export async function registerBackgroundSync(): Promise<void> {
  if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      // @ts-ignore - BackgroundSync API
      await registration.sync.register('lifeos-sync');
      console.log('Background sync registered');
    } catch (error) {
      console.log('Background sync not supported:', error);
    }
  }
}
