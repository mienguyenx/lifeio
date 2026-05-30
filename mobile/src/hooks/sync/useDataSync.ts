import { useEffect, useRef } from 'react';
import { useTasksSync } from './useTasksSync';
import { useHabitsSync } from './useHabitsSync';
import { useGoalsSync } from './useGoalsSync';
import { useJournalSync } from './useJournalSync';
import { useNotesSync } from './useNotesSync';
import { useSyncQueue } from './useSyncQueue';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { saveToStorage, getFromStorage } from '@/lib/storage';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import type { Task, TaskTag, Habit, Goal, JournalEntry, Note } from '@/types/lifeos';

export function useDataSync() {
  const { isOnline, checkConnection } = useOnlineStatus();
  const { loadTasks, loadTaskTags } = useTasksSync();
  const { loadHabits } = useHabitsSync();
  const { loadGoals } = useGoalsSync();
  const { loadJournalEntries } = useJournalSync();
  const { loadNotes } = useNotesSync();
  const { processSyncQueue } = useSyncQueue();
  const isLoadingRef = useRef(false);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setTasks = useLifeOSStore(s => s.setTasks);
  const setTaskTags = useLifeOSStore(s => s.setTaskTags);
  const store = useLifeOSStore;

  const loadAllData = async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    try {
      // Phase 1: Load from cache (fast)
      const [cachedTasks, cachedTags, cachedHabits, cachedGoals, cachedJournal, cachedNotes] = await Promise.all([
        getFromStorage<Task[]>('tasks'),
        getFromStorage<TaskTag[]>('taskTags'),
        getFromStorage<Habit[]>('habits'),
        getFromStorage<Goal[]>('goals'),
        getFromStorage<JournalEntry[]>('journalEntries'),
        getFromStorage<Note[]>('notes'),
      ]);
      if (cachedTasks) setTasks(cachedTasks);
      if (cachedTags) setTaskTags(cachedTags);
      if (cachedHabits) store.setState({ habits: cachedHabits });
      if (cachedGoals) store.setState({ goals: cachedGoals });
      if (cachedJournal) store.setState({ journalEntries: cachedJournal });
      if (cachedNotes) store.setState({ notes: cachedNotes });

      // Phase 2: Load from Supabase (online)
      const online = await checkConnection();
      if (online) {
        await processSyncQueue();

        const [tasks, tags, habits, goals, journalEntries, notes] = await Promise.all([
          loadTasks(),
          loadTaskTags(),
          loadHabits(),
          loadGoals(),
          loadJournalEntries(),
          loadNotes(),
        ]);

        setTasks(tasks);
        setTaskTags(tags);
        if (habits.length > 0) store.setState({ habits });
        if (goals.length > 0) store.setState({ goals });
        if (journalEntries.length > 0) store.setState({ journalEntries });
        if (notes.length > 0) store.setState({ notes });

        // Cache all data
        await Promise.all([
          saveToStorage('tasks', tasks),
          saveToStorage('taskTags', tags),
          saveToStorage('habits', habits),
          saveToStorage('goals', goals),
          saveToStorage('journalEntries', journalEntries),
          saveToStorage('notes', notes),
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
