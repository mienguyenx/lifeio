import { useCallback, useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useHabitsSync } from './useHabitsSync';
import { useGoalsSync } from './useGoalsSync';
import { useTasksSync } from './useTasksSync';
import { useJournalSync } from './useJournalSync';
import { useNotesSync } from './useNotesSync';
import { useAdditionalSync } from './useAdditionalSync';
import { useProfileSync } from './useProfileSync';
import { useHealthSync } from './useHealthSync';
import { useFinanceSync } from './useFinanceSync';
import { useLearningSync } from './useLearningSync';
import { useRelationshipsSync } from './useRelationshipsSync';
import { useSyncQueue } from './useSyncQueue';
import { saveToIndexedDB, getFromIndexedDB } from '@/lib/indexedDB';
import { toast } from 'sonner';
import { isExternalSupabaseConfigured, ensureValidSession } from '@/integrations/supabase/externalClient';

// Helper function for exponential backoff retry
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const retryLoad = async <T>(
  loadFn: () => Promise<T>,
  retries = 3,
  entityName = 'data'
): Promise<T> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await loadFn();
    } catch (error) {
      if (i === retries - 1) {
        console.error(`[DataSync] Failed to load ${entityName} after ${retries} attempts:`, error);
        throw error;
      }
      const delayMs = 1000 * Math.pow(2, i); // 1s, 2s, 4s
      console.warn(`[DataSync] Retrying ${entityName} load (attempt ${i + 1}/${retries}) after ${delayMs}ms...`);
      await delay(delayMs);
    }
  }
  throw new Error(`Failed to load ${entityName} after ${retries} attempts`);
};

export type SyncStatus = 'idle' | 'loading' | 'syncing' | 'success' | 'error';

interface DataSyncState {
  status: SyncStatus;
  lastSyncTime: Date | null;
  error: string | null;
  usingExternalSupabase: boolean;
}

export function useDataSync() {
  const { user, session } = useAuth();
  const { isOnline } = useOnlineStatus();
  const store = useLifeOSStore();
  const { pendingCount, processQueue } = useSyncQueue();
  
  const habitsSync = useHabitsSync();
  const goalsSync = useGoalsSync();
  const tasksSync = useTasksSync();
  const journalSync = useJournalSync();
  const notesSync = useNotesSync();
  const additionalSync = useAdditionalSync();
  const profileSync = useProfileSync();
  const healthSync = useHealthSync();
  const financeSync = useFinanceSync();
  const learningSync = useLearningSync();
  const relationshipsSync = useRelationshipsSync();
  
  const [syncState, setSyncState] = useState<DataSyncState>({
    status: 'idle',
    lastSyncTime: null,
    error: null,
    usingExternalSupabase: isExternalSupabaseConfigured,
  });

  const initialLoadDone = useRef(false);
  const isLoadingRef = useRef(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [hasCachedData, setHasCachedData] = useState(false);

  // Load all data from Supabase (background sync after cache is loaded)
  const loadAllData = useCallback(async () => {
    if (!user) {
      console.log('[DataSync] No user, skipping load');
      return false;
    }
    
    // Prevent multiple simultaneous loads
    if (isLoadingRef.current) {
      console.log('[DataSync] Load already in progress, skipping');
      return false;
    }
    
    // If offline, only use cache (already loaded)
    if (!isOnline) {
      console.log('[DataSync] Offline, using cache only');
      return hasCachedData;
    }
    
    isLoadingRef.current = true;
    setSyncState(prev => ({ ...prev, status: 'loading', error: null }));
    
    try {
      // Check session (but don't block if session is missing - might be during login)
      if (isExternalSupabaseConfigured) {
        const hasValidSession = await ensureValidSession();
        if (!hasValidSession) {
          console.warn('[DataSync] No valid session found, but continuing to load data (may be during login)');
        }
      }
      
      console.log('[DataSync] Loading data from Supabase Local');
      
      // Phase 2: Batch loading with priority groups for optimal performance
      // Priority 1: Critical data (load first, parallel) - User sees these immediately
      console.log('[DataSync] Priority 1: Loading critical data...');
      const criticalLoads = await Promise.allSettled([
        retryLoad(() => habitsSync.loadHabits(), 3, 'habits'),
        retryLoad(() => tasksSync.loadTasks(), 3, 'tasks'),
        retryLoad(() => goalsSync.loadGoals(), 3, 'goals'),
        retryLoad(() => notesSync.loadNotes(), 3, 'notes'),
      ]);
      
      // Priority 2: Important data (load after Priority 1) - Tags and journal
      console.log('[DataSync] Priority 2: Loading important data...');
      const importantLoads = await Promise.allSettled([
        retryLoad(() => journalSync.loadJournalEntries(), 2, 'journal'),
        retryLoad(() => tasksSync.loadTaskTags(), 2, 'taskTags'),
        retryLoad(() => journalSync.loadJournalTags(), 2, 'journalTags'),
        retryLoad(() => notesSync.loadNoteTags(), 2, 'noteTags'),
        retryLoad(() => profileSync.loadProfile(), 2, 'profile'),
        retryLoad(() => profileSync.loadPersonalValues(), 2, 'personalValues'),
        retryLoad(() => profileSync.loadLifeRoles(), 2, 'lifeRoles'),
        retryLoad(() => profileSync.loadLifeVisions(), 2, 'lifeVisions'),
        retryLoad(() => profileSync.loadPersonalTraits(), 2, 'personalTraits'),
        retryLoad(() => profileSync.loadLifeMilestones(), 2, 'lifeMilestones'),
      ]);
      
      // Priority 3: Background data (load last) - Less frequently accessed
      console.log('[DataSync] Priority 3: Loading background data...');
      const backgroundLoads = await Promise.allSettled([
        retryLoad(() => additionalSync.loadLifeWheelScores(), 2, 'lifeWheelScores'),
        retryLoad(() => additionalSync.loadWeeklyReviews(), 2, 'weeklyReviews'),
        retryLoad(() => additionalSync.loadMonthlyReviews(), 2, 'monthlyReviews'),
        retryLoad(() => additionalSync.loadYearlyPlannings(), 2, 'yearlyPlannings'),
        retryLoad(() => additionalSync.loadYearlyReviews(), 2, 'yearlyReviews'),
        retryLoad(() => additionalSync.loadDailyIntentions(), 2, 'dailyIntentions'),
        retryLoad(() => additionalSync.loadPomodoroSessions(), 2, 'pomodoroSessions'),
        retryLoad(() => additionalSync.loadChatMessages(), 2, 'chatMessages'),
        retryLoad(() => healthSync.loadHealthLogs(), 2, 'healthLogs'),
        retryLoad(() => financeSync.loadTransactions(), 2, 'financeTransactions'),
        retryLoad(() => learningSync.loadCourses(), 2, 'learningCourses'),
        retryLoad(() => learningSync.loadBooks(), 2, 'learningBooks'),
        retryLoad(() => relationshipsSync.loadContacts(), 2, 'relationshipsContacts'),
        retryLoad(() => relationshipsSync.loadInteractions(), 2, 'relationshipsInteractions'),
      ]);
      
      // Combine all results in order
      const loadResults = [
        ...criticalLoads,
        ...importantLoads,
        ...backgroundLoads,
      ];

      // Extract successful results in priority order
      // Priority 1 (Critical): habits, tasks, goals, notes
      const [
        habitsResult,
        tasksResult,
        goalsResult,
        notesResult,
      ] = criticalLoads;
      
      // Priority 2 (Important): journal, tags, profile
      const [
        journalEntriesResult,
        taskTagsResult,
        journalTagsResult,
        noteTagsResult,
        profileResult,
        personalValuesResult,
        lifeRolesResult,
        lifeVisionsResult,
        personalTraitsResult,
        lifeMilestonesResult,
      ] = importantLoads;
      
      // Priority 3 (Background): additional data
      const [
        lifeWheelScoresResult,
        weeklyReviewsResult,
        monthlyReviewsResult,
        yearlyPlanningsResult,
        yearlyReviewsResult,
        dailyIntentionsResult,
        pomodoroSessionsResult,
        chatMessagesResult,
        healthLogsResult,
        financeTransactionsResult,
        learningCoursesResult,
        learningBooksResult,
        relationshipsContactsResult,
        relationshipsInteractionsResult,
      ] = backgroundLoads;

      // Get current state to preserve data on failure
      const currentState = useLifeOSStore.getState();

      // Update store with loaded data - only update if we got new data
      // This prevents clearing data when load fails
      const newState: Partial<typeof currentState> = {};
      
      if (habitsResult.status === 'fulfilled' && Array.isArray(habitsResult.value)) {
        newState.habits = habitsResult.value;
      }
      if (goalsResult.status === 'fulfilled' && Array.isArray(goalsResult.value)) {
        newState.goals = goalsResult.value;
      }
      if (tasksResult.status === 'fulfilled' && Array.isArray(tasksResult.value)) {
        newState.tasks = tasksResult.value;
      }
      if (journalEntriesResult.status === 'fulfilled' && Array.isArray(journalEntriesResult.value)) {
        newState.journalEntries = journalEntriesResult.value;
      }
      if (notesResult.status === 'fulfilled' && Array.isArray(notesResult.value)) {
        newState.notes = notesResult.value;
      }
      if (taskTagsResult.status === 'fulfilled' && Array.isArray(taskTagsResult.value)) {
        newState.taskTags = taskTagsResult.value;
      }
      if (journalTagsResult.status === 'fulfilled' && Array.isArray(journalTagsResult.value)) {
        newState.journalTags = journalTagsResult.value;
      }
      if (noteTagsResult.status === 'fulfilled' && Array.isArray(noteTagsResult.value)) {
        newState.noteTags = noteTagsResult.value;
      }
      if (lifeWheelScoresResult.status === 'fulfilled' && Array.isArray(lifeWheelScoresResult.value)) {
        newState.lifeWheelScores = lifeWheelScoresResult.value;
      }
      if (weeklyReviewsResult.status === 'fulfilled' && Array.isArray(weeklyReviewsResult.value)) {
        newState.weeklyReviews = weeklyReviewsResult.value;
      }
      if (monthlyReviewsResult.status === 'fulfilled' && Array.isArray(monthlyReviewsResult.value)) {
        newState.monthlyReviews = monthlyReviewsResult.value;
      }
      if (yearlyPlanningsResult.status === 'fulfilled' && Array.isArray(yearlyPlanningsResult.value)) {
        newState.yearlyPlannings = yearlyPlanningsResult.value;
      }
      if (yearlyReviewsResult.status === 'fulfilled' && Array.isArray(yearlyReviewsResult.value)) {
        newState.yearlyReviews = yearlyReviewsResult.value;
      }
      if (dailyIntentionsResult.status === 'fulfilled' && Array.isArray(dailyIntentionsResult.value)) {
        newState.dailyIntentions = dailyIntentionsResult.value;
      }
      if (pomodoroSessionsResult.status === 'fulfilled' && Array.isArray(pomodoroSessionsResult.value)) {
        newState.pomodoroSessions = pomodoroSessionsResult.value;
      }
      if (chatMessagesResult.status === 'fulfilled' && Array.isArray(chatMessagesResult.value)) {
        newState.chatMessages = chatMessagesResult.value;
      }
      if (healthLogsResult.status === 'fulfilled' && Array.isArray(healthLogsResult.value)) {
        newState.healthLogs = healthLogsResult.value;
      }
      if (financeTransactionsResult.status === 'fulfilled' && Array.isArray(financeTransactionsResult.value)) {
        newState.financeTransactions = financeTransactionsResult.value;
      }
      if (learningCoursesResult.status === 'fulfilled' && Array.isArray(learningCoursesResult.value)) {
        newState.learningCourses = learningCoursesResult.value;
      }
      if (learningBooksResult.status === 'fulfilled' && Array.isArray(learningBooksResult.value)) {
        newState.learningBooks = learningBooksResult.value;
      }
      if (relationshipsContactsResult.status === 'fulfilled' && Array.isArray(relationshipsContactsResult.value)) {
        newState.relationshipsContacts = relationshipsContactsResult.value;
      }
      if (relationshipsInteractionsResult.status === 'fulfilled' && Array.isArray(relationshipsInteractionsResult.value)) {
        newState.relationshipsInteractions = relationshipsInteractionsResult.value;
      }

      // Update user profile data - only if loaded successfully
      if (profileResult.status === 'fulfilled' && profileResult.value) {
        const profile = profileResult.value;
        const personalValues = personalValuesResult.status === 'fulfilled' ? personalValuesResult.value : [];
        const lifeRoles = lifeRolesResult.status === 'fulfilled' ? lifeRolesResult.value : [];
        const lifeVisions = lifeVisionsResult.status === 'fulfilled' ? lifeVisionsResult.value : [];
        const personalTraits = personalTraitsResult.status === 'fulfilled' ? personalTraitsResult.value : [];
        const lifeMilestones = lifeMilestonesResult.status === 'fulfilled' ? lifeMilestonesResult.value : [];
        
      useLifeOSStore.setState(state => ({
        user: { 
          ...state.user,
            ...profile,
            // Only update arrays if we got new data
            personalValues: personalValues.length > 0 ? personalValues : state.user?.personalValues,
            lifeRoles: lifeRoles.length > 0 ? lifeRoles : state.user?.lifeRoles,
            visions: lifeVisions.length > 0 ? lifeVisions : state.user?.visions,
            traits: personalTraits.length > 0 ? personalTraits : state.user?.traits,
            milestones: lifeMilestones.length > 0 ? lifeMilestones : state.user?.milestones,
        }
      }));
      }

      // Only update store if we have new data
      if (Object.keys(newState).length > 0) {
        useLifeOSStore.setState(newState);
      }

      // Cache to IndexedDB for offline access - only cache successfully loaded data
      const cachePromises: Promise<void>[] = [];
      
      if (habitsResult.status === 'fulfilled') cachePromises.push(saveToIndexedDB('habits', habitsResult.value));
      if (goalsResult.status === 'fulfilled') cachePromises.push(saveToIndexedDB('goals', goalsResult.value));
      if (tasksResult.status === 'fulfilled') cachePromises.push(saveToIndexedDB('tasks', tasksResult.value));
      if (journalEntriesResult.status === 'fulfilled') cachePromises.push(saveToIndexedDB('journalEntries', journalEntriesResult.value));
      if (notesResult.status === 'fulfilled') cachePromises.push(saveToIndexedDB('notes', notesResult.value));
      if (taskTagsResult.status === 'fulfilled') cachePromises.push(saveToIndexedDB('taskTags', taskTagsResult.value));
      if (journalTagsResult.status === 'fulfilled') cachePromises.push(saveToIndexedDB('journalTags', journalTagsResult.value));
      if (noteTagsResult.status === 'fulfilled') cachePromises.push(saveToIndexedDB('noteTags', noteTagsResult.value));
      if (lifeWheelScoresResult.status === 'fulfilled') cachePromises.push(saveToIndexedDB('lifeWheelScores', lifeWheelScoresResult.value));
      if (weeklyReviewsResult.status === 'fulfilled') cachePromises.push(saveToIndexedDB('weeklyReviews', weeklyReviewsResult.value));
      if (dailyIntentionsResult.status === 'fulfilled') cachePromises.push(saveToIndexedDB('dailyIntentions', dailyIntentionsResult.value));
      if (pomodoroSessionsResult.status === 'fulfilled') cachePromises.push(saveToIndexedDB('pomodoroSessions', pomodoroSessionsResult.value));
      if (chatMessagesResult.status === 'fulfilled') cachePromises.push(saveToIndexedDB('chatMessages', chatMessagesResult.value));
      if (profileResult.status === 'fulfilled') cachePromises.push(saveToIndexedDB('profile', profileResult.value));
      if (personalValuesResult.status === 'fulfilled') cachePromises.push(saveToIndexedDB('personalValues', personalValuesResult.value));
      if (lifeRolesResult.status === 'fulfilled') cachePromises.push(saveToIndexedDB('lifeRoles', lifeRolesResult.value));
      if (lifeVisionsResult.status === 'fulfilled') cachePromises.push(saveToIndexedDB('lifeVisions', lifeVisionsResult.value));
      if (personalTraitsResult.status === 'fulfilled') cachePromises.push(saveToIndexedDB('personalTraits', personalTraitsResult.value));
      if (lifeMilestonesResult.status === 'fulfilled') cachePromises.push(saveToIndexedDB('lifeMilestones', lifeMilestonesResult.value));
      if (healthLogsResult.status === 'fulfilled') cachePromises.push(saveToIndexedDB('healthLogs', healthLogsResult.value));
      if (financeTransactionsResult.status === 'fulfilled') cachePromises.push(saveToIndexedDB('financeTransactions', financeTransactionsResult.value));
      if (learningCoursesResult.status === 'fulfilled') cachePromises.push(saveToIndexedDB('learningCourses', learningCoursesResult.value));
      if (learningBooksResult.status === 'fulfilled') cachePromises.push(saveToIndexedDB('learningBooks', learningBooksResult.value));
      if (relationshipsContactsResult.status === 'fulfilled') cachePromises.push(saveToIndexedDB('relationshipsContacts', relationshipsContactsResult.value));
      if (relationshipsInteractionsResult.status === 'fulfilled') cachePromises.push(saveToIndexedDB('relationshipsInteractions', relationshipsInteractionsResult.value));
      
      await Promise.allSettled(cachePromises);

      setSyncState({
        status: 'success',
        lastSyncTime: new Date(),
        error: null,
        usingExternalSupabase: isExternalSupabaseConfigured,
      });

      // Count successful loads
      const successCount = loadResults.filter(r => r.status === 'fulfilled').length;
      const failCount = loadResults.filter(r => r.status === 'rejected').length;
      
      console.log(`[DataSync] Load completed: ${successCount} succeeded, ${failCount} failed`);
      
      if (failCount > 0) {
        console.warn('[DataSync] Some data failed to load, keeping existing data for failed items');
      }

      setSyncState({
        status: successCount > 0 ? 'success' : 'error',
        lastSyncTime: successCount > 0 ? new Date() : null,
        error: failCount > 0 ? `${failCount} items failed to load` : null,
        usingExternalSupabase: isExternalSupabaseConfigured,
      });

      // Return true if at least some data loaded successfully
      return successCount > 0;
    } catch (error) {
      console.error('[DataSync] Error loading data:', error);
      
      // Don't clear existing data on error - keep what we have
      setSyncState({
        status: 'error',
        lastSyncTime: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        usingExternalSupabase: isExternalSupabaseConfigured,
      });
      
      // Return false but don't clear store - data from cache should still be visible
      return false;
    } finally {
      isLoadingRef.current = false;
    }
  }, [user, isOnline, hasCachedData, habitsSync, goalsSync, tasksSync, journalSync, notesSync, additionalSync, profileSync, healthSync, financeSync, learningSync, relationshipsSync]);

  // Load data from IndexedDB (offline fallback) - Phase 1: Cache loading
  const loadFromCache = useCallback(async (): Promise<boolean> => {
    try {
      console.log('[DataSync] Phase 1: Loading from cache...');
      const startTime = Date.now();
      
      const [
        habits, 
        goals, 
        tasks, 
        journalEntries, 
        notes,
        taskTags,
        journalTags,
        noteTags,
        lifeWheelScores,
        weeklyReviews,
        dailyIntentions,
        pomodoroSessions,
        chatMessages,
        profile,
        healthLogs,
        financeTransactions,
        learningCourses,
        learningBooks,
        relationshipsContacts,
        relationshipsInteractions,
        personalValues,
        lifeRoles,
        lifeVisions,
        personalTraits,
        lifeMilestones,
      ] = await Promise.all([
        getFromIndexedDB('habits'),
        getFromIndexedDB('goals'),
        getFromIndexedDB('tasks'),
        getFromIndexedDB('journalEntries'),
        getFromIndexedDB('notes'),
        getFromIndexedDB('taskTags'),
        getFromIndexedDB('journalTags'),
        getFromIndexedDB('noteTags'),
        getFromIndexedDB('lifeWheelScores'),
        getFromIndexedDB('weeklyReviews'),
        getFromIndexedDB('dailyIntentions'),
        getFromIndexedDB('pomodoroSessions'),
        getFromIndexedDB('chatMessages'),
        getFromIndexedDB('profile'),
        getFromIndexedDB('healthLogs'),
        getFromIndexedDB('financeTransactions'),
        getFromIndexedDB('learningCourses'),
        getFromIndexedDB('learningBooks'),
        getFromIndexedDB('relationshipsContacts'),
        getFromIndexedDB('relationshipsInteractions'),
        getFromIndexedDB('personalValues'),
        getFromIndexedDB('lifeRoles'),
        getFromIndexedDB('lifeVisions'),
        getFromIndexedDB('personalTraits'),
        getFromIndexedDB('lifeMilestones'),
      ]);

      // Check if we have any cached data
      const hasData = !!(habits || goals || tasks || journalEntries || notes || profile);
      setHasCachedData(hasData);

      // Update store with cached data immediately (synchronous updates)
      if (habits) useLifeOSStore.setState({ habits: habits as any });
      if (goals) useLifeOSStore.setState({ goals: goals as any });
      if (tasks) useLifeOSStore.setState({ tasks: tasks as any });
      if (journalEntries) useLifeOSStore.setState({ journalEntries: journalEntries as any });
      if (notes) useLifeOSStore.setState({ notes: notes as any });
      if (taskTags) useLifeOSStore.setState({ taskTags: taskTags as any });
      if (journalTags) useLifeOSStore.setState({ journalTags: journalTags as any });
      if (noteTags) useLifeOSStore.setState({ noteTags: noteTags as any });
      if (lifeWheelScores) useLifeOSStore.setState({ lifeWheelScores: lifeWheelScores as any });
      if (weeklyReviews) useLifeOSStore.setState({ weeklyReviews: weeklyReviews as any });
      if (dailyIntentions) useLifeOSStore.setState({ dailyIntentions: dailyIntentions as any });
      if (pomodoroSessions) useLifeOSStore.setState({ pomodoroSessions: pomodoroSessions as any });
      if (chatMessages) useLifeOSStore.setState({ chatMessages: chatMessages as any });
      if (healthLogs) useLifeOSStore.setState({ healthLogs: healthLogs as any });
      if (financeTransactions) useLifeOSStore.setState({ financeTransactions: financeTransactions as any });
      if (learningCourses) useLifeOSStore.setState({ learningCourses: learningCourses as any });
      if (learningBooks) useLifeOSStore.setState({ learningBooks: learningBooks as any });
      if (relationshipsContacts) useLifeOSStore.setState({ relationshipsContacts: relationshipsContacts as any });
      if (relationshipsInteractions) useLifeOSStore.setState({ relationshipsInteractions: relationshipsInteractions as any });

      // Update user profile data from cache - replace completely
      if (profile || personalValues || lifeRoles || lifeVisions || personalTraits || lifeMilestones) {
        useLifeOSStore.setState(state => ({
          user: { 
            ...state.user,
            ...(profile || {}),
            // Replace arrays completely - if empty/null from cache, set to undefined to clear old data
            personalValues: personalValues && Array.isArray(personalValues) && personalValues.length > 0 ? personalValues : undefined,
            lifeRoles: lifeRoles && Array.isArray(lifeRoles) && lifeRoles.length > 0 ? lifeRoles : undefined,
            visions: lifeVisions && Array.isArray(lifeVisions) && lifeVisions.length > 0 ? lifeVisions : undefined,
            traits: personalTraits && Array.isArray(personalTraits) && personalTraits.length > 0 ? personalTraits : undefined,
            milestones: lifeMilestones && Array.isArray(lifeMilestones) && lifeMilestones.length > 0 ? lifeMilestones : undefined,
          }
        }));
      }

      const loadTime = Date.now() - startTime;
      console.log(`[DataSync] Phase 1: Cache loaded in ${loadTime}ms, hasData: ${hasData}`);
      
      return hasData;
    } catch (error) {
      console.error('[DataSync] Error loading from cache:', error);
      setHasCachedData(false);
      return false;
    }
  }, []);

  // Sync pending changes to server
  const syncPendingChanges = useCallback(async () => {
    if (!user || !isOnline || pendingCount === 0) return 0;

    setSyncState(prev => ({ ...prev, status: 'syncing' }));
    
    try {
      const synced = await processQueue();
      
      setSyncState(prev => ({
        ...prev,
        status: 'success',
        lastSyncTime: new Date(),
        error: null,
      }));

      if (synced > 0) {
        toast.success(`Đã đồng bộ ${synced} thay đổi`);
      }

      return synced;
    } catch (error) {
      console.error('Error syncing changes:', error);
      setSyncState(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
      return 0;
    }
  }, [user, isOnline, pendingCount, processQueue]);

  // Force refresh all data
  const forceRefresh = useCallback(async () => {
    if (!user) return false;

    toast.loading('Đang tải dữ liệu...');
    const success = await loadAllData();
    
    if (success) {
      toast.success('Đã tải dữ liệu thành công');
    } else {
      toast.error('Không thể tải dữ liệu');
    }

    return success;
  }, [user, loadAllData]);

  // Initial load when user logs in - Phase 1: Cache, Phase 2: Background sync
  useEffect(() => {
    // Check if area data was just cleared - skip auto-load if so
    const areaDataCleared = sessionStorage.getItem('lifeos-area-data-cleared');
    if (areaDataCleared) {
      const clearedTime = parseInt(areaDataCleared, 10);
      const now = Date.now();
      // If cleared within last 5 seconds, skip auto-load to prevent reloading deleted data
      if (now - clearedTime < 5000) {
        console.log('[DataSync] Skipping auto-load - area data was just cleared');
        sessionStorage.removeItem('lifeos-area-data-cleared');
        return;
      } else {
        sessionStorage.removeItem('lifeos-area-data-cleared');
      }
    }
    
    if (user && session && !initialLoadDone.current) {
      initialLoadDone.current = true;
      setIsInitialLoading(true);
      
      // Phase 1: Load from cache FIRST (synchronous, blocks until cache is loaded)
      // This ensures UI shows data immediately
      const initializeData = async () => {
        console.log('[DataSync] Initial load - Phase 1: Loading from cache...');
        const cacheLoaded = await loadFromCache();
        
        setIsInitialLoading(false);
        
        if (cacheLoaded) {
          console.log('[DataSync] Phase 1 complete: Cache loaded, UI should show data now');
        } else {
          console.log('[DataSync] Phase 1 complete: No cache found');
        }
        
        // Phase 2: Background sync from Supabase (non-blocking)
        // This happens AFTER cache is loaded, so UI is already showing data
      if (isOnline) {
          console.log('[DataSync] Phase 2: Starting background sync from Supabase...');
          // Don't await - let it run in background
          loadAllData().catch(error => {
            console.error('[DataSync] Background sync failed:', error);
          });
      } else {
          console.log('[DataSync] Phase 2: Offline - using cache only');
      }
      };
      
      initializeData();
    }
    
    // Reset when user logs out
    if (!user) {
      initialLoadDone.current = false;
      setIsInitialLoading(false);
      setHasCachedData(false);
    }
  }, [user, session, isOnline, loadAllData, loadFromCache]);

  // Sync when coming back online
  useEffect(() => {
    if (isOnline && user && pendingCount > 0) {
      syncPendingChanges();
    }
  }, [isOnline, user, pendingCount, syncPendingChanges]);

  return {
    syncState,
    pendingCount,
    loadAllData,
    loadFromCache,
    syncPendingChanges,
    forceRefresh,
    isInitialLoading,
    hasCachedData,
    habitsSync,
    goalsSync,
    tasksSync,
    journalSync,
    notesSync,
    additionalSync,
    profileSync,
  };
}
