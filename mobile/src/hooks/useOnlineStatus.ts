import { useEffect, useState, useCallback, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isWifi, setIsWifi] = useState(false);
  const pingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkConnection = useCallback(async () => {
    const state = await NetInfo.fetch();
    const connected = state.isConnected ?? false;
    const wifi = state.type === 'wifi';
    setIsOnline(connected);
    setIsWifi(wifi);
    return connected;
  }, []);

  useEffect(() => {
    // Initial check
    checkConnection();

    // Subscribe to changes
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected ?? false;
      setIsOnline(connected);
      setIsWifi(state.type === 'wifi');
    });

    // Periodic check every 30s
    pingTimer.current = setInterval(() => {
      checkConnection();
    }, 30_000);

    return () => {
      unsubscribe();
      if (pingTimer.current) clearInterval(pingTimer.current);
    };
  }, [checkConnection]);

  return { isOnline, isWifi, checkConnection };
}
