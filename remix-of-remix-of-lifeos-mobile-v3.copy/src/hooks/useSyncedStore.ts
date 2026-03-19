import { useCallback } from 'react';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useTasksSync } from '@/hooks/sync/useTasksSync';
import { useHabitsSync } from '@/hooks/sync/useHabitsSync';
import { useGoalsSync } from '@/hooks/sync/useGoalsSync';
import { useJournalSync } from '@/hooks/sync/useJournalSync';
import { useNotesSync } from '@/hooks/sync/useNotesSync';
import { useAdditionalSync } from '@/hooks/sync/useAdditionalSync';
import { useAuth } from '@/hooks/useAuth';
import { isExternalSupabaseConfigured } from '@/integrations/supabase/externalClient';
import type { 
  Task, Habit, Goal, JournalEntry, Note, Subtask, TaskTag,
  LifeWheelScore, WeeklyReview, DailyIntention, PomodoroSession, LifeArea,
  JournalTag, NoteTag, ChatMessage
} from '@/types/lifeos';

/**
 * Hook that wraps store actions to automatically sync with Supabase
 * when external Supabase is configured
 */
export function useSyncedStore() {
  const { user } = useAuth();
  const store = useLifeOSStore();
  const tasksSync = useTasksSync();
  const habitsSync = useHabitsSync();
  const goalsSync = useGoalsSync();
  const journalSync = useJournalSync();
  const notesSync = useNotesSync();
  const additionalSync = useAdditionalSync();

  // Check if we should sync to Supabase
  const shouldSync = isExternalSupabaseConfigured && user;

  // ================== TASKS ==================
  const addTask = useCallback(async (task: Omit<Task, 'id' | 'completedPomodoros' | 'createdAt' | 'subtasks'>) => {
    // First add to local store
    store.addTask(task);
    
    // Get the newly created task from store
    const tasks = useLifeOSStore.getState().tasks;
    const newTask = tasks[tasks.length - 1];
    
    // Sync to Supabase if configured
    if (shouldSync && newTask) {
      console.log('Syncing new task to Supabase:', newTask.title);
      await tasksSync.saveTask(newTask);
    }
  }, [store, tasksSync, shouldSync]);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    // First update local store
    store.updateTask(id, updates);
    
    // Sync to Supabase if configured
    if (shouldSync) {
      console.log('Syncing task update to Supabase:', id);
      await tasksSync.updateTask(id, updates);
    }
  }, [store, tasksSync, shouldSync]);

  const deleteTask = useCallback(async (id: string) => {
    // First delete from local store (soft delete)
    store.deleteTask(id);
    
    // Sync to Supabase if configured (soft delete)
    if (shouldSync) {
      console.log('Syncing task soft delete to Supabase:', id);
      await tasksSync.updateTask(id, { deletedAt: new Date().toISOString() });
    }
  }, [store, tasksSync, shouldSync]);

  const permanentDeleteTask = useCallback(async (id: string) => {
    // First delete from local store
    store.permanentDeleteTask(id);
    
    // Sync to Supabase if configured
    if (shouldSync) {
      console.log('Syncing task permanent delete to Supabase:', id);
      await tasksSync.deleteTask(id);
    }
  }, [store, tasksSync, shouldSync]);

  const restoreTask = useCallback(async (id: string) => {
    // First restore in local store
    store.restoreTask(id);
    
    // Sync to Supabase if configured (remove deletedAt)
    if (shouldSync) {
      console.log('Syncing task restore to Supabase:', id);
      await tasksSync.updateTask(id, { deletedAt: undefined });
    }
  }, [store, tasksSync, shouldSync]);

  // ================== SUBTASKS ==================
  const addSubtask = useCallback(async (taskId: string, title: string) => {
    store.addSubtask(taskId, title);
    
    // Get the newly created subtask from store
    const task = useLifeOSStore.getState().tasks.find(t => t.id === taskId);
    const newSubtask = task?.subtasks[task.subtasks.length - 1];
    
    if (shouldSync && newSubtask) {
      console.log('Syncing new subtask to Supabase:', title);
      await tasksSync.addSubtask(taskId, newSubtask);
    }
  }, [store, tasksSync, shouldSync]);

  const toggleSubtask = useCallback(async (taskId: string, subtaskId: string) => {
    // Get current state before toggle
    const task = useLifeOSStore.getState().tasks.find(t => t.id === taskId);
    const subtask = task?.subtasks.find(s => s.id === subtaskId);
    const newCompleted = !subtask?.completed;
    
    store.toggleSubtask(taskId, subtaskId);
    
    if (shouldSync) {
      console.log('Syncing subtask toggle to Supabase:', subtaskId);
      await tasksSync.toggleSubtask(subtaskId, newCompleted);
    }
  }, [store, tasksSync, shouldSync]);

  const deleteSubtask = useCallback(async (taskId: string, subtaskId: string) => {
    store.deleteSubtask(taskId, subtaskId);
    
    if (shouldSync) {
      console.log('Syncing subtask delete to Supabase:', subtaskId);
      await tasksSync.deleteSubtask(subtaskId);
    }
  }, [store, tasksSync, shouldSync]);

  // ================== TASK TAGS ==================
  const addTaskTag = useCallback(async (name: string, color: string): Promise<string> => {
    store.addTaskTag(name, color);
    
    const tags = useLifeOSStore.getState().taskTags;
    const newTag = tags[tags.length - 1];
    
    if (shouldSync && newTag) {
      console.log('Syncing new task tag to Supabase:', name);
      await tasksSync.saveTaskTag(newTag);
    }
    return newTag?.id || '';
  }, [store, tasksSync, shouldSync]);

  const updateTaskTag = useCallback(async (id: string, updates: Partial<TaskTag>) => {
    store.updateTaskTag(id, updates);
    
    if (shouldSync) {
      const tag = useLifeOSStore.getState().taskTags.find(t => t.id === id);
      if (tag) {
        console.log('Syncing task tag update to Supabase:', id);
        await tasksSync.saveTaskTag(tag);
      }
    }
  }, [store, tasksSync, shouldSync]);

  const deleteTaskTag = useCallback(async (id: string) => {
    store.deleteTaskTag(id);
    
    if (shouldSync) {
      console.log('Syncing task tag delete to Supabase:', id);
      await tasksSync.deleteTaskTag(id);
    }
  }, [store, tasksSync, shouldSync]);

  // ================== HABITS ==================
  const addHabit = useCallback(async (habit: Omit<Habit, 'id' | 'streak' | 'completedDates' | 'createdAt'>) => {
    store.addHabit(habit);
    
    const habits = useLifeOSStore.getState().habits;
    const newHabit = habits[habits.length - 1];
    
    if (shouldSync && newHabit) {
      console.log('Syncing new habit to Supabase:', newHabit.name);
      await habitsSync.saveHabit(newHabit);
    }
  }, [store, habitsSync, shouldSync]);

  const updateHabit = useCallback(async (id: string, updates: Partial<Habit>) => {
    store.updateHabit(id, updates);
    
    if (shouldSync) {
      console.log('Syncing habit update to Supabase:', id);
      await habitsSync.updateHabit(id, updates);
    }
  }, [store, habitsSync, shouldSync]);

  const toggleHabitCompletion = useCallback(async (id: string, date: string, note?: string) => {
    store.toggleHabitCompletion(id, date, note);
    
    if (shouldSync) {
      // Get updated habit from store
      const habit = useLifeOSStore.getState().habits.find(h => h.id === id);
      if (habit) {
        console.log('Syncing habit completion to Supabase:', id);
        await habitsSync.updateHabit(id, {
          completedDates: habit.completedDates,
          streak: habit.streak,
          bestStreak: habit.bestStreak,
        });
        // Also sync the completion record
        const completion = habit.completions?.find(c => c.date === date);
        if (completion) {
          await habitsSync.toggleCompletion(id, date, completion.count, completion.notes);
        }
      }
    }
  }, [store, habitsSync, shouldSync]);

  const incrementHabitCompletion = useCallback(async (id: string, date: string, note?: string) => {
    store.incrementHabitCompletion(id, date, note);
    
    if (shouldSync) {
      const habit = useLifeOSStore.getState().habits.find(h => h.id === id);
      if (habit) {
        console.log('Syncing habit increment to Supabase:', id);
        await habitsSync.updateHabit(id, {
          completedDates: habit.completedDates,
          streak: habit.streak,
          bestStreak: habit.bestStreak,
        });
        const completion = habit.completions?.find(c => c.date === date);
        if (completion) {
          // Sử dụng upsertCompletion để update count thay vì toggle
          await habitsSync.upsertCompletion(id, date, completion.count, completion.notes);
        }
      }
    }
  }, [store, habitsSync, shouldSync]);

  const decrementHabitCompletion = useCallback(async (id: string, date: string) => {
    store.decrementHabitCompletion(id, date);
    
    if (shouldSync) {
      const habit = useLifeOSStore.getState().habits.find(h => h.id === id);
      if (habit) {
        console.log('Syncing habit decrement to Supabase:', id);
        await habitsSync.updateHabit(id, {
          completedDates: habit.completedDates,
          streak: habit.streak,
          bestStreak: habit.bestStreak,
        });
        const completion = habit.completions?.find(c => c.date === date);
        if (completion) {
          // Sử dụng upsertCompletion để update count thay vì toggle
          await habitsSync.upsertCompletion(id, date, completion.count, completion.notes);
        } else {
          // Nếu completion bị xóa (count = 0), xóa khỏi Supabase
          await habitsSync.deleteCompletion(id, date);
        }
      }
    }
  }, [store, habitsSync, shouldSync]);

  const archiveHabit = useCallback(async (id: string) => {
    store.archiveHabit(id);
    
    if (shouldSync) {
      console.log('Syncing habit archive to Supabase:', id);
      await habitsSync.updateHabit(id, { archivedAt: new Date().toISOString() });
    }
  }, [store, habitsSync, shouldSync]);

  const unarchiveHabit = useCallback(async (id: string) => {
    store.unarchiveHabit(id);
    
    if (shouldSync) {
      console.log('Syncing habit unarchive to Supabase:', id);
      await habitsSync.updateHabit(id, { archivedAt: undefined });
    }
  }, [store, habitsSync, shouldSync]);

  const restoreHabit = useCallback(async (id: string) => {
    store.restoreHabit(id);
    
    if (shouldSync) {
      console.log('Syncing habit restore to Supabase:', id);
      await habitsSync.updateHabit(id, { deletedAt: undefined });
    }
  }, [store, habitsSync, shouldSync]);

  const permanentDeleteHabit = useCallback(async (id: string) => {
    // First delete from local store
    store.permanentDeleteHabit(id);
    
    // Sync to Supabase if configured
    if (shouldSync) {
      console.log('[TrashSync] Syncing habit permanent delete to Supabase:', id);
      await habitsSync.deleteHabit(id);
    }
  }, [store, habitsSync, shouldSync]);

  const deleteHabit = useCallback(async (id: string) => {
    // First update local store immediately
    store.deleteHabit(id);
    
    // Force store update to ensure UI reflects the change
    const updatedHabits = useLifeOSStore.getState().habits;
    const deletedHabit = updatedHabits.find(h => h.id === id);
    if (deletedHabit && !deletedHabit.deletedAt) {
      // If deletedAt wasn't set, set it again
      store.updateHabit(id, { deletedAt: new Date().toISOString() });
    }
    
    if (shouldSync) {
      console.log('Syncing habit soft delete to Supabase:', id);
      try {
        const result = await habitsSync.updateHabit(id, { deletedAt: new Date().toISOString() });
        if (!result) {
          console.error('Failed to sync habit soft delete, retrying...');
          // Retry once
          await new Promise(resolve => setTimeout(resolve, 500));
          const retryResult = await habitsSync.updateHabit(id, { deletedAt: new Date().toISOString() });
          if (!retryResult) {
            console.error('Failed to sync habit soft delete after retry');
            throw new Error('Không thể đồng bộ xóa habit lên server');
          }
        }
      } catch (error) {
        console.error('Error syncing habit delete:', error);
        // Don't throw - local delete should still work
      }
    }
  }, [store, habitsSync, shouldSync]);

  // ================== GOALS ==================
  const addGoal = useCallback(async (goal: Omit<Goal, 'id' | 'progress' | 'milestones' | 'createdAt'> & { milestones?: string[] }) => {
    store.addGoal(goal);
    
    const goals = useLifeOSStore.getState().goals;
    const newGoal = goals[goals.length - 1];
    
    if (shouldSync && newGoal) {
      console.log('Syncing new goal to Supabase:', newGoal.title);
      await goalsSync.saveGoal(newGoal);
    }
  }, [store, goalsSync, shouldSync]);

  const updateGoal = useCallback(async (id: string, updates: Partial<Goal>) => {
    store.updateGoal(id, updates);
    
    if (shouldSync) {
      console.log('Syncing goal update to Supabase:', id);
      await goalsSync.updateGoal(id, updates);
    }
  }, [store, goalsSync, shouldSync]);

  const deleteGoal = useCallback(async (id: string) => {
    store.deleteGoal(id);
    
    if (shouldSync) {
      console.log('Syncing goal soft delete to Supabase:', id);
      await goalsSync.updateGoal(id, { deletedAt: new Date().toISOString() });
    }
  }, [store, goalsSync, shouldSync]);

  const restoreGoal = useCallback(async (id: string) => {
    store.restoreGoal(id);
    
    if (shouldSync) {
      console.log('Syncing goal restore to Supabase:', id);
      await goalsSync.updateGoal(id, { deletedAt: undefined });
    }
  }, [store, goalsSync, shouldSync]);

  const permanentDeleteGoal = useCallback(async (id: string) => {
    // First delete from local store
    store.permanentDeleteGoal(id);
    
    // Sync to Supabase if configured
    if (shouldSync) {
      console.log('[TrashSync] Syncing goal permanent delete to Supabase:', id);
      await goalsSync.deleteGoal(id);
    }
  }, [store, goalsSync, shouldSync]);

  const toggleMilestone = useCallback(async (goalId: string, milestoneId: string) => {
    // Get current milestone state before toggle
    const goal = useLifeOSStore.getState().goals.find(g => g.id === goalId);
    const milestone = goal?.milestones.find(m => m.id === milestoneId);
    const newCompleted = !milestone?.completed;
    
    store.toggleMilestone(goalId, milestoneId);
    
    if (shouldSync) {
      console.log('Syncing milestone toggle to Supabase:', milestoneId);
      await goalsSync.toggleMilestone(milestoneId, newCompleted);
      
      // Also update goal progress
      const updatedGoal = useLifeOSStore.getState().goals.find(g => g.id === goalId);
      if (updatedGoal) {
        await goalsSync.updateGoal(goalId, { 
          progress: updatedGoal.progress,
          milestones: updatedGoal.milestones
        });
      }
    }
  }, [store, goalsSync, shouldSync]);

  // ================== JOURNAL ==================
  const addJournalEntry = useCallback(async (entry: Omit<JournalEntry, 'id' | 'createdAt'>) => {
    // Generate ID before adding to store so we can use it for sync
    const newId = crypto.randomUUID();
    const newEntryWithId: JournalEntry = {
      ...entry,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    
    // Add to store (will add to beginning of array)
    store.addJournalEntry(entry);
    
    if (shouldSync) {
      console.log('[JournalSync] Syncing new journal entry to Supabase:', newEntryWithId.date, 'ID:', newEntryWithId.id);
      const success = await journalSync.saveJournalEntry(newEntryWithId);
      if (!success) {
        console.error('[JournalSync] Failed to save journal entry to Supabase');
      }
    }
  }, [store, journalSync, shouldSync]);

  const updateJournalEntry = useCallback(async (id: string, updates: Partial<JournalEntry>) => {
    store.updateJournalEntry(id, updates);
    
    if (shouldSync) {
      console.log('Syncing journal entry update to Supabase:', id);
      await journalSync.updateJournalEntry(id, updates);
    }
  }, [store, journalSync, shouldSync]);

  const deleteJournalEntry = useCallback(async (id: string) => {
    store.deleteJournalEntry(id);
    
    if (shouldSync) {
      console.log('Syncing journal entry delete to Supabase:', id);
      await journalSync.deleteJournalEntry(id);
    }
  }, [store, journalSync, shouldSync]);

  // ================== NOTES ==================
  const addNote = useCallback(async (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Add to store immediately for optimistic update
    store.addNote(note);
    
    // Get the newly created note from store
    // Note: store.addNote prepends to array, so new note is at index 0
    const notes = useLifeOSStore.getState().notes;
    const newNote = notes[0]; // Get first note (newest)
    
    if (shouldSync && newNote) {
      console.log('[SyncedStore] Syncing new note to Supabase:', newNote.title, newNote.id);
      try {
        const success = await notesSync.saveNote(newNote);
        if (!success) {
          console.error('[SyncedStore] Failed to sync note to Supabase:', newNote.id);
          // Note: The note is still in local store, it will be queued for sync
        } else {
          console.log('[SyncedStore] Successfully synced note to Supabase:', newNote.id);
        }
      } catch (error) {
        console.error('[SyncedStore] Error syncing note to Supabase:', error);
        // Note: The note is still in local store, it will be queued for sync
      }
    }
  }, [store, notesSync, shouldSync]);

  const updateNote = useCallback(async (id: string, updates: Partial<Note>) => {
    store.updateNote(id, updates);
    
    if (shouldSync) {
      console.log('Syncing note update to Supabase:', id);
      await notesSync.updateNote(id, updates);
    }
  }, [store, notesSync, shouldSync]);

  const deleteNote = useCallback(async (id: string) => {
    store.deleteNote(id);
    
    if (shouldSync) {
      console.log('Syncing note soft delete to Supabase:', id);
      await notesSync.updateNote(id, { deletedAt: new Date().toISOString() });
    }
  }, [store, notesSync, shouldSync]);

  const restoreNote = useCallback(async (id: string) => {
    store.restoreNote(id);
    
    if (shouldSync) {
      console.log('Syncing note restore to Supabase:', id);
      await notesSync.updateNote(id, { deletedAt: undefined });
    }
  }, [store, notesSync, shouldSync]);

  const permanentDeleteNote = useCallback(async (id: string) => {
    // First delete from local store
    store.permanentDeleteNote(id);
    
    // Sync to Supabase if configured
    if (shouldSync) {
      console.log('[TrashSync] Syncing note permanent delete to Supabase:', id);
      await notesSync.deleteNote(id);
    }
  }, [store, notesSync, shouldSync]);

  const toggleNotePin = useCallback(async (id: string) => {
    const note = useLifeOSStore.getState().notes.find(n => n.id === id);
    store.toggleNotePin(id);
    
    if (shouldSync && note) {
      console.log('Syncing note pin toggle to Supabase:', id);
      await notesSync.updateNote(id, { isPinned: !note.isPinned });
    }
  }, [store, notesSync, shouldSync]);

  const toggleNoteFavorite = useCallback(async (id: string) => {
    const note = useLifeOSStore.getState().notes.find(n => n.id === id);
    store.toggleNoteFavorite(id);
    
    if (shouldSync && note) {
      console.log('Syncing note favorite toggle to Supabase:', id);
      await notesSync.updateNote(id, { isFavorite: !note.isFavorite });
    }
  }, [store, notesSync, shouldSync]);

  const archiveNote = useCallback(async (id: string) => {
    store.archiveNote(id);
    
    if (shouldSync) {
      console.log('Syncing note archive to Supabase:', id);
      await notesSync.updateNote(id, { archivedAt: new Date().toISOString() });
    }
  }, [store, notesSync, shouldSync]);

  const unarchiveNote = useCallback(async (id: string) => {
    store.unarchiveNote(id);
    
    if (shouldSync) {
      console.log('Syncing note unarchive to Supabase:', id);
      await notesSync.updateNote(id, { archivedAt: undefined });
    }
  }, [store, notesSync, shouldSync]);

  // ================== LIFE WHEEL ==================
  const addLifeWheelScore = useCallback(async (scores: Record<string, number>) => {
    store.addLifeWheelScore(scores as Record<LifeArea, number>);
    
    const allScores = useLifeOSStore.getState().lifeWheelScores;
    const newScore = allScores[0]; // New score is added at the beginning
    
    if (shouldSync && newScore) {
      console.log('Syncing new life wheel score to Supabase:', newScore.date);
      await additionalSync.saveLifeWheelScore(newScore);
    }
  }, [store, additionalSync, shouldSync]);

  const deleteLifeWheelScore = useCallback(async (id: string) => {
    store.deleteLifeWheelScore(id);
    
    if (shouldSync) {
      console.log('Syncing life wheel score delete to Supabase:', id);
      await additionalSync.deleteLifeWheelScore(id);
    }
  }, [store, additionalSync, shouldSync]);

  // ================== WEEKLY REVIEW ==================
  const addWeeklyReview = useCallback(async (review: Omit<WeeklyReview, 'id' | 'createdAt'>) => {
    store.addWeeklyReview(review);
    
    const reviews = useLifeOSStore.getState().weeklyReviews;
    const newReview = reviews[reviews.length - 1];
    
    if (shouldSync && newReview) {
      console.log('Syncing new weekly review to Supabase:', newReview.weekStart);
      await additionalSync.saveWeeklyReview(newReview);
    }
  }, [store, additionalSync, shouldSync]);

  const updateWeeklyReview = useCallback(async (id: string, updates: Partial<WeeklyReview>) => {
    store.updateWeeklyReview(id, updates);
    
    if (shouldSync) {
      const review = useLifeOSStore.getState().weeklyReviews.find(r => r.id === id);
      if (review) {
        console.log('Syncing weekly review update to Supabase:', id);
        await additionalSync.saveWeeklyReview({ ...review, ...updates });
      }
    }
  }, [store, additionalSync, shouldSync]);

  const deleteWeeklyReview = useCallback(async (id: string) => {
    store.deleteWeeklyReview(id);
    
    if (shouldSync) {
      console.log('Syncing weekly review delete to Supabase:', id);
      await additionalSync.deleteWeeklyReview(id);
    }
  }, [store, additionalSync, shouldSync]);

  // ================== DAILY INTENTIONS ==================
  const addDailyIntention = useCallback(async (intentionText: string) => {
    store.addDailyIntention(intentionText);
    
    const intentions = useLifeOSStore.getState().dailyIntentions;
    const newIntention = intentions[intentions.length - 1];
    
    if (shouldSync && newIntention) {
      console.log('Syncing new daily intention to Supabase:', newIntention.date);
      await additionalSync.saveDailyIntention(newIntention);
    }
  }, [store, additionalSync, shouldSync]);

  const updateDailyIntention = useCallback(async (id: string, updates: Partial<DailyIntention>) => {
    store.updateDailyIntention(id, updates);
    
    if (shouldSync) {
      console.log('Syncing daily intention update to Supabase:', id);
      await additionalSync.updateDailyIntention(id, updates);
    }
  }, [store, additionalSync, shouldSync]);

  const completeDailyIntention = useCallback(async (id: string) => {
    store.completeDailyIntention(id);
    
    if (shouldSync) {
      console.log('Syncing daily intention complete to Supabase:', id);
      await additionalSync.updateDailyIntention(id, { completed: true });
    }
  }, [store, additionalSync, shouldSync]);

  // ================== POMODORO ==================
  const addPomodoroSession = useCallback(async (session: Omit<PomodoroSession, 'id'>) => {
    store.addPomodoroSession(session);
    
    const sessions = useLifeOSStore.getState().pomodoroSessions;
    const newSession = sessions[sessions.length - 1];
    
    if (shouldSync && newSession) {
      console.log('Syncing new pomodoro session to Supabase');
      await additionalSync.savePomodoroSession(newSession);
    }
  }, [store, additionalSync, shouldSync]);

  // ================== JOURNAL TAGS ==================
  const addJournalTag = useCallback(async (name: string, color: string) => {
    const id = store.addJournalTag(name, color);
    
    const tag = useLifeOSStore.getState().journalTags.find(t => t.id === id);
    if (shouldSync && tag) {
      console.log('Syncing new journal tag to Supabase:', name);
      await additionalSync.saveJournalTag(tag);
    }
    return id;
  }, [store, additionalSync, shouldSync]);

  const updateJournalTag = useCallback(async (id: string, updates: Partial<JournalTag>) => {
    store.updateJournalTag(id, updates);
    
    if (shouldSync) {
      const tag = useLifeOSStore.getState().journalTags.find(t => t.id === id);
      if (tag) {
        console.log('Syncing journal tag update to Supabase:', id);
        await additionalSync.saveJournalTag(tag);
      }
    }
  }, [store, additionalSync, shouldSync]);

  const deleteJournalTag = useCallback(async (id: string) => {
    store.deleteJournalTag(id);
    
    if (shouldSync) {
      console.log('Syncing journal tag delete to Supabase:', id);
      await additionalSync.deleteJournalTag(id);
    }
  }, [store, additionalSync, shouldSync]);

  // ================== NOTE TAGS ==================
  const addNoteTag = useCallback(async (name: string, color: string) => {
    const id = store.addNoteTag(name, color);
    
    const tag = useLifeOSStore.getState().noteTags.find(t => t.id === id);
    if (shouldSync && tag) {
      console.log('Syncing new note tag to Supabase:', name);
      await additionalSync.saveNoteTag(tag);
    }
    return id;
  }, [store, additionalSync, shouldSync]);

  const updateNoteTag = useCallback(async (id: string, updates: Partial<NoteTag>) => {
    store.updateNoteTag(id, updates);
    
    if (shouldSync) {
      const tag = useLifeOSStore.getState().noteTags.find(t => t.id === id);
      if (tag) {
        console.log('Syncing note tag update to Supabase:', id);
        await additionalSync.saveNoteTag(tag);
      }
    }
  }, [store, additionalSync, shouldSync]);

  const deleteNoteTag = useCallback(async (id: string) => {
    store.deleteNoteTag(id);
    
    if (shouldSync) {
      console.log('Syncing note tag delete to Supabase:', id);
      await additionalSync.deleteNoteTag(id);
    }
  }, [store, additionalSync, shouldSync]);

  // ================== CHAT MESSAGES ==================
  const addChatMessage = useCallback(async (message: Omit<ChatMessage, 'id' | 'createdAt'>) => {
    store.addChatMessage(message);
    
    const messages = useLifeOSStore.getState().chatMessages;
    const newMessage = messages[messages.length - 1];
    
    if (shouldSync && newMessage) {
      console.log('Syncing new chat message to Supabase');
      await additionalSync.saveChatMessage(newMessage);
    }
  }, [store, additionalSync, shouldSync]);

  const toggleMessageFavorite = useCallback(async (id: string) => {
    const message = useLifeOSStore.getState().chatMessages.find(m => m.id === id);
    store.toggleMessageFavorite(id);
    
    if (shouldSync && message) {
      console.log('Syncing message favorite toggle to Supabase:', id);
      await additionalSync.updateChatMessage(id, { isFavorite: !message.isFavorite });
    }
  }, [store, additionalSync, shouldSync]);

  const clearChatHistory = useCallback(async () => {
    store.clearChatHistory();
    
    if (shouldSync) {
      console.log('Syncing clear chat history to Supabase');
      await additionalSync.clearChatMessages();
    }
  }, [store, additionalSync, shouldSync]);

  // ================== TRASH ==================
  const emptyTrash = useCallback(async () => {
    try {
      // Get all trashed items before deleting
      const state = useLifeOSStore.getState();
      const trashedNotes = state.notes.filter(n => n.deletedAt);
      const trashedTasks = state.tasks.filter(t => t.deletedAt);
      const trashedGoals = state.goals.filter(g => g.deletedAt);
      const trashedHabits = state.habits.filter(h => h.deletedAt);
      
      const totalItems = trashedNotes.length + trashedTasks.length + trashedGoals.length + trashedHabits.length;
      
      if (totalItems === 0) {
        console.log('[TrashSync] No items to delete');
        return { success: true, deleted: 0 };
      }
      
      console.log('[TrashSync] Emptying trash - deleting', {
        notes: trashedNotes.length,
        tasks: trashedTasks.length,
        goals: trashedGoals.length,
        habits: trashedHabits.length,
        total: totalItems,
      }, 'items from Supabase');
      
      // Delete from local store first (optimistic update)
      store.emptyTrash();
      
      // Sync to Supabase if configured
      if (shouldSync) {
        // Delete all trashed items from database using permanent delete
        const deletePromises: Promise<boolean>[] = [];
        
        // Use permanent delete functions
        trashedNotes.forEach(note => {
          deletePromises.push(notesSync.deleteNote(note.id).catch(err => {
            console.error(`[TrashSync] Failed to delete note ${note.id}:`, err);
            return false;
          }));
        });
        
        trashedTasks.forEach(task => {
          deletePromises.push(tasksSync.deleteTask(task.id).catch(err => {
            console.error(`[TrashSync] Failed to delete task ${task.id}:`, err);
            return false;
          }));
        });
        
        trashedGoals.forEach(goal => {
          deletePromises.push(goalsSync.deleteGoal(goal.id).catch(err => {
            console.error(`[TrashSync] Failed to delete goal ${goal.id}:`, err);
            return false;
          }));
        });
        
        trashedHabits.forEach(habit => {
          deletePromises.push(habitsSync.deleteHabit(habit.id).catch(err => {
            console.error(`[TrashSync] Failed to delete habit ${habit.id}:`, err);
            return false;
          }));
        });
        
        // Wait for all deletions to complete
        const results = await Promise.allSettled(deletePromises);
        const successCount = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
        const failCount = results.length - successCount;
        
        console.log('[TrashSync] Empty trash completed:', {
          total: results.length,
          success: successCount,
          failed: failCount,
        });
        
        if (failCount > 0) {
          console.error('[TrashSync] Some items failed to delete from Supabase:', failCount);
          // Don't throw error, just log - items are already removed from local store
        }
        
        return { success: true, deleted: successCount, failed: failCount };
      }
      
      return { success: true, deleted: totalItems };
    } catch (error) {
      console.error('[TrashSync] Error emptying trash:', error);
      throw error;
    }
  }, [store, notesSync, tasksSync, goalsSync, habitsSync, shouldSync]);

  return {
    // Synced task actions
    addTask,
    updateTask,
    deleteTask,
    permanentDeleteTask,
    restoreTask,
    
    // Synced subtask actions
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    
    // Synced task tag actions
    addTaskTag,
    updateTaskTag,
    deleteTaskTag,
    
    // Synced habit actions
    addHabit,
    updateHabit,
    toggleHabitCompletion,
    incrementHabitCompletion,
    decrementHabitCompletion,
    archiveHabit,
    unarchiveHabit,
    restoreHabit,
    deleteHabit,
    permanentDeleteHabit,
    
    // Synced goal actions
    addGoal,
    updateGoal,
    deleteGoal,
    restoreGoal,
    permanentDeleteGoal,
    toggleMilestone,
    
    // Synced journal actions
    addJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
    
    // Synced note actions
    addNote,
    updateNote,
    deleteNote,
    restoreNote,
    permanentDeleteNote,
    toggleNotePin,
    toggleNoteFavorite,
    archiveNote,
    unarchiveNote,
    
    // Synced life wheel actions
    addLifeWheelScore,
    deleteLifeWheelScore,
    
    // Synced weekly review actions
    addWeeklyReview,
    updateWeeklyReview,
    deleteWeeklyReview,
    
    // Synced daily intention actions
    addDailyIntention,
    updateDailyIntention,
    completeDailyIntention,
    
    // Synced pomodoro actions
    addPomodoroSession,

    // Synced journal tag actions
    addJournalTag,
    updateJournalTag,
    deleteJournalTag,

    // Synced note tag actions
    addNoteTag,
    updateNoteTag,
    deleteNoteTag,

    // Synced chat message actions
    addChatMessage,
    toggleMessageFavorite,
    clearChatHistory,
    
    // Pass through non-synced store values
    tasks: store.tasks,
    habits: store.habits,
    goals: store.goals,
    journalEntries: store.journalEntries,
    notes: store.notes,
    lifeWheelScores: store.lifeWheelScores,
    weeklyReviews: store.weeklyReviews,
    dailyIntentions: store.dailyIntentions,
    pomodoroSessions: store.pomodoroSessions,
    taskTags: store.taskTags,
    journalTags: store.journalTags,
    noteTags: store.noteTags,
    chatMessages: store.chatMessages,
    
    // Flag indicating if sync is active
    isSyncEnabled: shouldSync,
  };
}
