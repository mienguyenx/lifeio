import { useEffect, useRef } from 'react';
import { useTasksSync } from './useTasksSync';
import { useSyncQueue } from './useSyncQueue';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { saveToStorage, getFromStorage } from '@/lib/storage';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import type { Task, TaskTag } from '@/types/lifeos';

export function useDataSync() {
  const { isOnline, checkConnection } = useOnlineStatus();
  const { loadTasks, loadTaskTags } = useTasksSync();
  const { processSyncQueue } = useSyncQueue();
  const isLoadingRef = useRef(false);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setTasks = useLifeOSStore(s => s.setTasks);
  const setTaskTags = useLifeOSStore(s => s.setTaskTags);

  const loadAllData = async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    try {
      // Phase 1: Load from cache (fast)
      const cachedTasks = await getFromStorage<Task[]>('tasks');
      const cachedTags = await getFromStorage<TaskTag[]>('taskTags');
      if (cachedTasks) setTasks(cachedTasks);
      if (cachedTags) setTaskTags(cachedTags);

      // Phase 2: Load from Supabase (online)
      const online = await checkConnection();
      if (online) {
        await processSyncQueue();

        const [tasks, tags] = await Promise.all([
          loadTasks(),
          loadTaskTags(),
        ]);

        setTasks(tasks);
        setTaskTags(tags);

        // Cache the data
        await Promise.all([
          saveToStorage('tasks', tasks),
          saveToStorage('taskTags', tags),
        ]);
      }
    } catch (error) {
      console.error('[useDataSync] Error loading data:', error);
    } finally {
      isLoadingRef.current = false;
    }
  };

  // Auto sync every 30s when online
  useEffect(() => {
    if (!isOnline) return;

    const doSync = async () => {
      try {
        await processSyncQueue();
      } catch {}
    };

    syncTimerRef.current = setInterval(doSync, 30_000);

    return () => {
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
    };
  }, [isOnline, processSyncQueue]);

  return { loadAllData, processSyncQueue };
}
