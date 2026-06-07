import { useState, useEffect, useCallback, useRef } from 'react';
import { getSyncQueueCount } from '@/lib/indexedDB';
import { API_URL } from '@/integrations/api/httpClient';

interface OnlineStatus {
  isOnline: boolean;
  wasOffline: boolean;
  pendingSyncCount: number;
  lastOnlineAt: Date | null;
}

// Cache ping results to avoid excessive requests
let pingCache: { result: boolean; timestamp: number } | null = null;
const PING_CACHE_DURATION = 10000; // 10 seconds
const PING_TIMEOUT = 5000; // 5 seconds

// Ping the LifeOS REST API to check actual connectivity.
// This is a best-effort check - failures don't necessarily mean offline.
async function pingApi(): Promise<boolean> {
  // Check cache first
  if (pingCache && Date.now() - pingCache.timestamp < PING_CACHE_DURATION) {
    return pingCache.result;
  }

  if (!API_URL) {
    // If no API URL configured, assume online
    return true;
  }

  try {
    // Ping the API health endpoint with a shorter timeout for mobile
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PING_TIMEOUT);

    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
      mode: 'cors',
    });

    clearTimeout(timeoutId);

    // Any HTTP response means we can reach the API
    const isOnline = response.status >= 200 && response.status < 600;

    // Update cache
    pingCache = { result: isOnline, timestamp: Date.now() };

    return isOnline;
  } catch (error) {
    // Network error - but don't cache as offline, let navigator.onLine decide
    // Ping failures can happen for many reasons (CORS, timeout, etc.) that don't mean offline
    console.log('[OnlineStatus] Ping test failed (non-fatal):', error);
    // Don't cache failure - let next check try again
    return true; // Return true to not block sync - let actual sync attempt determine if offline
  }
}

export function useOnlineStatus() {
  const [status, setStatus] = useState<OnlineStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    wasOffline: false,
    pendingSyncCount: 0,
    lastOnlineAt: null,
  });

  const isCheckingRef = useRef(false);
  const lastCheckRef = useRef<number>(0);

  const updatePendingCount = useCallback(async () => {
    try {
      const count = await getSyncQueueCount();
      setStatus(prev => ({ ...prev, pendingSyncCount: count }));
    } catch (error) {
      console.error('Error getting sync queue count:', error);
    }
  }, []);

  const checkOnlineStatus = useCallback(async (force = false) => {
    // Prevent multiple simultaneous checks
    if (isCheckingRef.current && !force) return;
    
    // Don't check too frequently (min 2 seconds between checks)
    const now = Date.now();
    if (!force && now - lastCheckRef.current < 2000) return;
    
    isCheckingRef.current = true;
    lastCheckRef.current = now;

    try {
      // Check navigator.onLine first (fast check)
      const navigatorOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      
      if (!navigatorOnline) {
        // If navigator says offline, trust it
        setStatus(prev => ({
          ...prev,
          isOnline: false,
        }));
        return;
      }

      // If navigator says online, try to verify with ping test
      // But don't block if ping fails - ping is just a hint, navigator.onLine is authoritative
      let pingOnline = navigatorOnline; // Default to navigator.onLine
      
      try {
        const pingResult = await Promise.race([
          pingApi(),
          new Promise<boolean>((resolve) => {
            // Timeout after 3 seconds - if ping takes too long, assume online
            setTimeout(() => resolve(navigatorOnline), 3000);
          })
        ]);
        pingOnline = pingResult;
      } catch (pingError) {
        // If ping fails, trust navigator.onLine
        console.log('[OnlineStatus] Ping test failed, trusting navigator.onLine:', pingError);
        pingOnline = navigatorOnline;
      }
      
      // Use navigator.onLine as primary, ping as secondary verification
      // Only mark offline if BOTH say offline
      const finalOnlineStatus = navigatorOnline && (pingOnline || navigatorOnline);
      
      setStatus(prev => {
        const wasOffline = !prev.isOnline && finalOnlineStatus;
        return {
          ...prev,
          isOnline: finalOnlineStatus,
          wasOffline,
          lastOnlineAt: finalOnlineStatus ? new Date() : prev.lastOnlineAt,
        };
      });

      // Refresh pending count when coming back online
      if (finalOnlineStatus) {
        await updatePendingCount();
      }
    } catch (error) {
      console.error('[OnlineStatus] Error checking online status:', error);
      // On error, fall back to navigator.onLine (trust the browser)
      const navigatorOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      setStatus(prev => ({
        ...prev,
        isOnline: navigatorOnline,
      }));
    } finally {
      isCheckingRef.current = false;
    }
  }, [updatePendingCount]);

  useEffect(() => {
    const handleOnline = () => {
      // When navigator says online, verify with ping
      checkOnlineStatus(true);
    };

    const handleOffline = () => {
      // When navigator says offline, trust it immediately
      setStatus(prev => ({
        ...prev,
        isOnline: false,
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    updatePendingCount();
    checkOnlineStatus(true);

    // Periodically check online status and pending count
    const interval = setInterval(() => {
      checkOnlineStatus();
      updatePendingCount();
    }, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [checkOnlineStatus, updatePendingCount]);

  return {
    ...status,
    refreshPendingCount: updatePendingCount,
  };
}
