import { useEffect, useRef, useCallback } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import { registerBackgroundSync } from '@/lib/offlineSync';
import { getSyncQueueCount } from '@/lib/indexedDB';
import { useSyncQueue } from '@/hooks/sync/useSyncQueue';
import { toast } from 'sonner';

interface AutoSyncOptions {
  /** Sync interval in milliseconds (default: 30000 = 30s) */
  syncInterval?: number;
  /** Whether to sync immediately when coming back online (default: true) */
  syncOnReconnect?: boolean;
  /** Whether to show toast notifications (default: true) */
  showNotifications?: boolean;
  /** Whether to sync when tab becomes visible (default: true) */
  syncOnVisibility?: boolean;
}

export function useAutoSync(options: AutoSyncOptions = {}) {
  const {
    syncInterval = 30000,
    syncOnReconnect = true,
    showNotifications = true,
    syncOnVisibility = true,
  } = options;

  const { isOnline, wasOffline, refreshPendingCount } = useOnlineStatus();
  const { processQueue, isSyncing } = useSyncQueue();
  const isSyncingRef = useRef(false);
  const lastSyncRef = useRef<number>(0);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const consecutiveFailuresRef = useRef(0);
  const maxRetriesRef = useRef(5); // Max 5 consecutive failures before backing off

  // Perform sync
  const performSync = useCallback(async (silent = false) => {
    // Prevent multiple simultaneous syncs
    if (isSyncingRef.current || isSyncing || !isOnline) {
      console.log('[AutoSync] Sync skipped - already syncing or offline');
      return false;
    }

    try {
      const pendingCount = await getSyncQueueCount();
      if (pendingCount === 0) {
        console.log('[AutoSync] No pending items to sync');
        return true;
      }

      isSyncingRef.current = true;
      
      if (!silent && showNotifications) {
        toast.loading(`Đang đồng bộ ${pendingCount} thay đổi...`, { id: 'sync' });
      }

      console.log('[AutoSync] Starting sync of', pendingCount, 'items...');
      
      // Use processQueue from useSyncQueue instead of syncOfflineData
      const syncedCount = await processQueue();
      await refreshPendingCount();
      lastSyncRef.current = Date.now();

      console.log('[AutoSync] Sync completed:', syncedCount, 'items synced');

      // Reset failure count on success
      if (syncedCount > 0) {
        consecutiveFailuresRef.current = 0;
      }

      if (!silent && showNotifications) {
        if (syncedCount > 0) {
          toast.success(`Đã đồng bộ ${syncedCount} thay đổi!`, { id: 'sync' });
        } else {
          toast.error('Không thể đồng bộ dữ liệu', { id: 'sync' });
        }
      }

      return syncedCount > 0;
    } catch (error) {
      console.error('[AutoSync] Sync failed:', error);
      
      // Increment failure count
      consecutiveFailuresRef.current += 1;
      
      // Only show error notification if not too many failures (avoid spam)
      if (!silent && showNotifications && consecutiveFailuresRef.current <= 3) {
        toast.error('Lỗi đồng bộ dữ liệu', { 
          id: 'sync',
          description: error instanceof Error ? error.message : 'Vui lòng thử lại sau'
        });
      }
      
      return false;
    } finally {
      isSyncingRef.current = false;
    }
  }, [isOnline, showNotifications, refreshPendingCount, processQueue, isSyncing]);

  // Force sync (public method)
  const forceSync = useCallback(() => {
    return performSync(false);
  }, [performSync]);

  // Sync when coming back online
  useEffect(() => {
    if (syncOnReconnect && isOnline && wasOffline) {
      console.log('[AutoSync] Back online, syncing...');
      performSync(false);
    }
  }, [isOnline, wasOffline, syncOnReconnect, performSync]);

  // Periodic sync with exponential backoff on failures
  useEffect(() => {
    if (!isOnline) {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
      // Reset failure count when going offline
      consecutiveFailuresRef.current = 0;
      return;
    }

    // Calculate interval with exponential backoff
    // Base interval: syncInterval (default 30s)
    // After failures: 30s, 60s, 120s, 240s, 480s (max 8 minutes)
    const calculateInterval = () => {
      if (consecutiveFailuresRef.current === 0) {
        return syncInterval;
      }
      const backoffMultiplier = Math.min(Math.pow(2, consecutiveFailuresRef.current - 1), 16); // Max 16x
      return syncInterval * backoffMultiplier;
    };

    const scheduleNextSync = async () => {
      // Check if there are pending items before scheduling
      const pendingCount = await getSyncQueueCount();
      
      if (pendingCount === 0) {
        // No pending items - use longer interval (5 minutes) to avoid unnecessary checks
        const idleInterval = 5 * 60 * 1000; // 5 minutes
        console.log(`[AutoSync] No pending items, scheduling next check in ${idleInterval}ms`);
        
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
        }
        
        syncIntervalRef.current = setTimeout(() => {
          scheduleNextSync();
        }, idleInterval);
        return;
      }
      
      // Has pending items - use normal interval with backoff
      const interval = calculateInterval();
      console.log(`[AutoSync] Scheduling next sync in ${interval}ms (failures: ${consecutiveFailuresRef.current}, pending: ${pendingCount})`);
      
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      
      syncIntervalRef.current = setTimeout(() => {
        performSync(true).then(() => {
          // Schedule next sync after completion
          scheduleNextSync();
        });
      }, interval);
    };

    // Start first sync immediately, then schedule next ones
    scheduleNextSync();

    return () => {
      if (syncIntervalRef.current) {
        clearTimeout(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
    };
  }, [isOnline, syncInterval, performSync]);

  // Sync on visibility change
  useEffect(() => {
    if (!syncOnVisibility) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isOnline) {
        // Only sync if enough time has passed since last sync
        const timeSinceLastSync = Date.now() - lastSyncRef.current;
        if (timeSinceLastSync > 10000) { // 10 seconds
          performSync(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [syncOnVisibility, isOnline, performSync]);

  // Register background sync on mount
  useEffect(() => {
    registerBackgroundSync();
  }, []);

  // Listen for service worker sync messages
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_REQUIRED') {
        console.log('[AutoSync] SW requested sync');
        performSync(true);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [performSync]);

  return {
    forceSync,
    isSyncing: isSyncingRef.current,
    lastSyncTime: lastSyncRef.current,
  };
}
