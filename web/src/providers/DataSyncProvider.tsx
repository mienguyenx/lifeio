import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useDataSync, SyncStatus } from '@/hooks/sync/useDataSync';
import { useAuth } from '@/hooks/useAuth';

interface DataSyncContextType {
  syncState: {
    status: SyncStatus;
    lastSyncTime: Date | null;
    error: string | null;
  };
  pendingCount: number;
  forceRefresh: () => Promise<boolean>;
  syncPendingChanges: () => Promise<number>;
  isInitialLoading: boolean;
  hasCachedData: boolean;
}

const DataSyncContext = createContext<DataSyncContextType | undefined>(undefined);

export function DataSyncProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const {
    syncState,
    pendingCount,
    forceRefresh,
    syncPendingChanges,
    isInitialLoading,
    hasCachedData,
  } = useDataSync();

  return (
    <DataSyncContext.Provider value={{
      syncState,
      pendingCount,
      forceRefresh,
      syncPendingChanges,
      isInitialLoading,
      hasCachedData,
    }}>
      {children}
    </DataSyncContext.Provider>
  );
}

export function useDataSyncContext() {
  const context = useContext(DataSyncContext);
  if (context === undefined) {
    throw new Error('useDataSyncContext must be used within a DataSyncProvider');
  }
  return context;
}
