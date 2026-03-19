import { useEffect, useRef } from 'react';
import { saveToIndexedDB, getFromIndexedDB } from '@/lib/indexedDB';
import { syncOfflineData, registerBackgroundSync } from '@/lib/offlineSync';

const STORE_KEY = 'lifeos-storage';
const SYNC_DEBOUNCE = 1000;

export function useOfflineStorage<T>(
  storeName: string,
  getData: () => T,
  setData: (data: T) => void
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  // Load data from IndexedDB on mount
  useEffect(() => {
    async function loadFromIndexedDB() {
      try {
        const savedData = await getFromIndexedDB<T>(`${STORE_KEY}-${storeName}`);
        if (savedData && !isInitializedRef.current) {
          setData(savedData);
          isInitializedRef.current = true;
        }
      } catch (error) {
        console.error('Error loading from IndexedDB:', error);
      }
    }

    loadFromIndexedDB();
    registerBackgroundSync();

    // Listen for sync messages from service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'SYNC_REQUIRED') {
          syncOfflineData();
        }
      });
    }
  }, [storeName, setData]);

  // Save to IndexedDB when data changes (debounced)
  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        const data = getData();
        await saveToIndexedDB(`${STORE_KEY}-${storeName}`, data);
      } catch (error) {
        console.error('Error saving to IndexedDB:', error);
      }
    }, SYNC_DEBOUNCE);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [getData, storeName]);
}

// Hook to sync entire store state
export function useStoreSync(getState: () => unknown) {
  const previousStateRef = useRef<string>('');

  useEffect(() => {
    const syncToIndexedDB = async () => {
      try {
        const state = getState();
        const stateString = JSON.stringify(state);
        
        // Only save if state has changed
        if (stateString !== previousStateRef.current) {
          previousStateRef.current = stateString;
          await saveToIndexedDB(STORE_KEY, state);
        }
      } catch (error) {
        console.error('Error syncing to IndexedDB:', error);
      }
    };

    // Sync every 2 seconds if there are changes
    const interval = setInterval(syncToIndexedDB, 2000);

    // Also sync on visibility change (when user leaves/returns)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        syncToIndexedDB();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Sync before page unload
    const handleBeforeUnload = () => {
      syncToIndexedDB();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [getState]);
}
