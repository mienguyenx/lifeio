import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Habit, Task, Subtask, TaskTag, PomodoroSettings, PomodoroSession, UserProfile, Goal, JournalEntry, JournalTag, LifeWheelScore, WeeklyReview, MonthlyReview, YearlyPlanning, YearlyReview, ChatMessage, AISettings, LifeArea, HabitCompetition, Note, NoteTag, DailyIntention, SavedConversation, TrashSettings, UserPreferences, MorningCheckinEntry, EveningReviewEntry, AIMemoryEvent, DecisionLog } from '@/types/lifeos';
import { sampleHabits, sampleTasks, samplePomodoroSessions, sampleUser } from '@/data/sampleData';
import { sampleGoals, sampleJournalEntries, sampleLifeWheelScores, sampleWeeklyReviews, sampleChatMessages, sampleNotes, sampleDailyIntentions } from '@/data/sampleDataExtended';
import type { HealthLog } from '@/hooks/sync/useHealthSync';
import type { FinanceTransaction } from '@/hooks/sync/useFinanceSync';
import type { Course, Book } from '@/hooks/sync/useLearningSync';
import type { Contact, Interaction } from '@/hooks/sync/useRelationshipsSync';

interface LifeOSStore {
  // User
  user: UserProfile;
  setUser: (user: Partial<UserProfile>) => void;

  // Habits
  habits: Habit[];
  addHabit: (habit: Omit<Habit, 'id' | 'streak' | 'completedDates' | 'createdAt'>) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void; // Soft delete - move to trash
  restoreHabit: (id: string) => void; // Restore from trash
  permanentDeleteHabit: (id: string) => void; // Hard delete
  toggleHabitCompletion: (id: string, date: string, note?: string) => void;
  incrementHabitCompletion: (id: string, date: string, note?: string) => void;
  decrementHabitCompletion: (id: string, date: string) => void;
  deleteHabitCompletion: (id: string, date: string) => void;
  archiveHabit: (id: string) => void;
  unarchiveHabit: (id: string) => void;

  // Habit Competitions
  habitCompetitions: HabitCompetition[];
  addHabitCompetition: (competition: Omit<HabitCompetition, 'id' | 'status' | 'createdAt'>) => void;
  completeHabitCompetition: (id: string, winnerId: string) => void;
  deleteHabitCompetition: (id: string) => void;

  // Tasks
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'completedPomodoros' | 'createdAt' | 'subtasks'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void; // Soft delete - move to trash
  restoreTask: (id: string) => void; // Restore from trash
  permanentDeleteTask: (id: string) => void; // Hard delete
  incrementTaskPomodoro: (id: string) => void;
  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;
  archiveTask: (id: string) => void;
  unarchiveTask: (id: string) => void;
  autoArchiveOldTasks: () => void;
  reorderTasks: (taskId: string, targetTaskId: string, position: 'before' | 'after') => void;
  
  // Task Tags
  taskTags: TaskTag[];
  addTaskTag: (name: string, color: string) => string;
  updateTaskTag: (id: string, updates: Partial<TaskTag>) => void;
  deleteTaskTag: (id: string) => void;

  // Goals
  goals: Goal[];
  addGoal: (goal: Omit<Goal, 'id' | 'progress' | 'milestones' | 'createdAt'> & { milestones?: string[] }) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void; // Soft delete - move to trash
  restoreGoal: (id: string) => void; // Restore from trash
  permanentDeleteGoal: (id: string) => void; // Hard delete
  toggleMilestone: (goalId: string, milestoneId: string) => void;

  // Journal
  journalEntries: JournalEntry[];
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt'>) => void;
  updateJournalEntry: (id: string, updates: Partial<JournalEntry>) => void;
  deleteJournalEntry: (id: string) => void;
  
  // Journal Tags
  journalTags: JournalTag[];
  addJournalTag: (name: string, color: string) => string;
  updateJournalTag: (id: string, updates: Partial<JournalTag>) => void;
  deleteJournalTag: (id: string) => void;

  // Life Wheel
  lifeWheelScores: LifeWheelScore[];
  addLifeWheelScore: (scores: Record<LifeArea, number>) => void;
  deleteLifeWheelScore: (id: string) => void;
  clearLifeWheelHistory: () => void;

  // Weekly Reviews
  weeklyReviews: WeeklyReview[];
  addWeeklyReview: (review: Omit<WeeklyReview, 'id' | 'createdAt'>) => void;
  updateWeeklyReview: (id: string, updates: Partial<WeeklyReview>) => void;
  deleteWeeklyReview: (id: string) => void;
  clearWeeklyReviewHistory: () => void;

  // Monthly Reviews
  monthlyReviews: MonthlyReview[];
  addMonthlyReview: (review: Omit<MonthlyReview, 'id' | 'createdAt'>) => void;
  updateMonthlyReview: (id: string, updates: Partial<MonthlyReview>) => void;
  deleteMonthlyReview: (id: string) => void;

  // Yearly Planning
  yearlyPlannings: YearlyPlanning[];
  addYearlyPlanning: (planning: Omit<YearlyPlanning, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateYearlyPlanning: (id: string, updates: Partial<YearlyPlanning>) => void;
  deleteYearlyPlanning: (id: string) => void;

  // Yearly Reviews
  yearlyReviews: YearlyReview[];
  addYearlyReview: (review: Omit<YearlyReview, 'id' | 'createdAt'>) => void;
  updateYearlyReview: (id: string, updates: Partial<YearlyReview>) => void;
  deleteYearlyReview: (id: string) => void;

  // AI Chat
  chatMessages: ChatMessage[];
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'createdAt'>) => void;
  clearChatHistory: () => void;
  toggleMessageFavorite: (id: string) => void;
  savedConversations: SavedConversation[];
  saveConversation: (title: string) => void;
  deleteSavedConversation: (id: string) => void;
  loadSavedConversation: (id: string) => void;
  aiSettings: AISettings;
  setAISettings: (settings: Partial<AISettings>) => void;

  // Notes
  notes: Note[];
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void; // Soft delete - move to trash
  restoreNote: (id: string) => void; // Restore from trash
  permanentDeleteNote: (id: string) => void; // Hard delete
  emptyTrash: () => void; // Delete all items in trash (notes, tasks, goals, habits)
  emptyNotesTrash: () => void; // Delete only notes from trash (legacy)
  toggleNotePin: (id: string) => void;
  toggleNoteFavorite: (id: string) => void;
  archiveNote: (id: string) => void;
  unarchiveNote: (id: string) => void;
  
  // Trash Settings
  trashSettings: TrashSettings;
  setTrashSettings: (settings: Partial<TrashSettings>) => void;
  noteTags: NoteTag[];
  addNoteTag: (name: string, color: string) => string;
  updateNoteTag: (id: string, updates: Partial<NoteTag>) => void;
  deleteNoteTag: (id: string) => void;

  // Daily Intentions
  dailyIntentions: DailyIntention[];
  addDailyIntention: (intention: string) => void;
  updateDailyIntention: (id: string, updates: Partial<DailyIntention>) => void;
  completeDailyIntention: (id: string) => void;
  getTodayIntention: () => DailyIntention | undefined;

  // App Settings
  notificationSoundEnabled: boolean;
  setNotificationSoundEnabled: (enabled: boolean) => void;
  pushNotificationsEnabled: boolean;
  setPushNotificationsEnabled: (enabled: boolean) => void;
  goalSidebarTabOrder: string[];
  setGoalSidebarTabOrder: (order: string[]) => void;
  mainSidebarMenuOrder: string[];
  setMainSidebarMenuOrder: (order: string[]) => void;
  mobileMenuOrder: string[];
  setMobileMenuOrder: (order: string[]) => void;

  // Pomodoro
  pomodoroSettings: PomodoroSettings;
  setPomodoroSettings: (settings: Partial<PomodoroSettings>) => void;
  pomodoroSessions: PomodoroSession[];
  addPomodoroSession: (session: Omit<PomodoroSession, 'id' | 'completedAt'>) => void;

  // Health Module
  healthLogs: HealthLog[];
  addHealthLog: (log: HealthLog) => void;
  updateHealthLog: (id: string, updates: Partial<HealthLog>) => void;
  deleteHealthLog: (id: string) => void;

  // Finance Module
  financeTransactions: FinanceTransaction[];
  addFinanceTransaction: (transaction: FinanceTransaction) => void;
  updateFinanceTransaction: (id: string, updates: Partial<FinanceTransaction>) => void;
  deleteFinanceTransaction: (id: string) => void;

  // Learning Module
  learningCourses: Course[];
  learningBooks: Book[];
  addLearningCourse: (course: Course) => void;
  updateLearningCourse: (id: string, updates: Partial<Course>) => void;
  deleteLearningCourse: (id: string) => void;
  addLearningBook: (book: Book) => void;
  updateLearningBook: (id: string, updates: Partial<Book>) => void;
  deleteLearningBook: (id: string) => void;

  // Relationships Module
  relationshipsContacts: Contact[];
  relationshipsInteractions: Interaction[];
  addRelationshipContact: (contact: Contact) => void;
  updateRelationshipContact: (id: string, updates: Partial<Contact>) => void;
  deleteRelationshipContact: (id: string) => void;
  addRelationshipInteraction: (interaction: Interaction) => void;
  updateRelationshipInteraction: (id: string, updates: Partial<Interaction>) => void;
  deleteRelationshipInteraction: (id: string) => void;

  // User Preferences
  userPreferences: UserPreferences;
  setUserPreferences: (prefs: Partial<UserPreferences>) => void;

  // Morning Checkins
  morningCheckins: MorningCheckinEntry[];
  addMorningCheckin: (entry: Omit<MorningCheckinEntry, 'id' | 'createdAt'>) => void;
  updateMorningCheckin: (id: string, updates: Partial<MorningCheckinEntry>) => void;

  // Evening Reviews
  eveningReviews: EveningReviewEntry[];
  addEveningReview: (entry: Omit<EveningReviewEntry, 'id' | 'createdAt'>) => void;
  updateEveningReview: (id: string, updates: Partial<EveningReviewEntry>) => void;

  // AI Memory
  aiMemories: AIMemoryEvent[];
  addAIMemory: (memory: Omit<AIMemoryEvent, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAIMemory: (id: string, updates: Partial<AIMemoryEvent>) => void;
  deleteAIMemory: (id: string) => void;

  // Decision Logs
  decisionLogs: DecisionLog[];
  addDecisionLog: (log: Omit<DecisionLog, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateDecisionLog: (id: string, updates: Partial<DecisionLog>) => void;
  deleteDecisionLog: (id: string) => void;

  // Data management
  loadSampleData: () => void;
  clearAllData: () => void;
}

export const useLifeOSStore = create<LifeOSStore>()(
  persist(
    (set, get) => ({
      // User
      user: { name: 'User' },
      setUser: (updates) => set((state) => ({ user: { ...state.user, ...updates } })),

      // Habits - Khởi tạo với empty array, không dùng sample data
      habits: [],
      addHabit: (habit) =>
        set((state) => ({
          habits: [...state.habits, { ...habit, id: crypto.randomUUID(), streak: 0, completedDates: [], completions: [], createdAt: new Date().toISOString() }],
        })),
      updateHabit: (id, updates) =>
        set((state) => ({ habits: state.habits.map((h) => (h.id === id ? { ...h, ...updates } : h)) })),
      deleteHabit: (id) =>
        set((state) => ({ habits: state.habits.map((h) => (h.id === id ? { ...h, deletedAt: new Date().toISOString() } : h)) })),
      restoreHabit: (id) =>
        set((state) => ({ habits: state.habits.map((h) => (h.id === id ? { ...h, deletedAt: undefined } : h)) })),
      permanentDeleteHabit: (id) =>
        set((state) => ({ habits: state.habits.filter((h) => h.id !== id) })),
      
      // Helper function to calculate goal progress from linked tasks and habits
      toggleHabitCompletion: (id, date, note) =>
        set((state) => {
          let newHabits = state.habits.map((h) => {
            if (h.id !== id) return h;
            
            // Kiểm tra completion dựa trên count, không chỉ completedDates
            // Với habit có target > 1, cần kiểm tra count >= target
            const target = h.targetPerDay || 1;
            const existingCompletion = h.completions?.find(c => c.date === date);
            const currentCount = existingCompletion?.count || 0;
            const isCompleted = target > 1 
              ? currentCount >= target 
              : h.completedDates.includes(date);
            
            // Nếu habit có target > 1 và đã đạt target, không toggle (giữ nguyên)
            if (target > 1 && isCompleted) {
              return h; // Không thay đổi gì
            }
            
            const newCompletedDates = isCompleted ? h.completedDates.filter((d) => d !== date) : [...h.completedDates, date];
            
            // Update completions array
            let newCompletions = [...(h.completions || [])];
            if (isCompleted) {
              newCompletions = newCompletions.filter(c => c.date !== date);
            } else {
              newCompletions.push({ date, count: 1, notes: note, time: new Date().toISOString() });
            }
            
            // Calculate streak
            const today = new Date();
            let streak = 0;
            for (let i = 0; i < 365; i++) {
              const checkDate = new Date(today);
              checkDate.setDate(checkDate.getDate() - i);
              const dateStr = checkDate.toISOString().split('T')[0];
              if (newCompletedDates.includes(dateStr)) streak++;
              else if (i > 0) break;
            }
            
            const bestStreak = Math.max(h.bestStreak || 0, streak);
            return { ...h, completedDates: newCompletedDates, completions: newCompletions, streak, bestStreak };
          });

          // Sync goal progress if habit is linked to a goal
          const habit = state.habits.find(h => h.id === id);
          let newGoals = state.goals;
          
          if (habit?.goalId) {
            const linkedTasks = state.tasks.filter(t => t.goalId === habit.goalId && !t.deletedAt);
            const linkedHabits = newHabits.filter(h => h.goalId === habit.goalId && !h.deletedAt);
            const goal = state.goals.find(g => g.id === habit.goalId);
            
            if (goal) {
              // Calculate combined progress
              const milestoneProgress = goal.milestones.length > 0
                ? (goal.milestones.filter(m => m.completed).length / goal.milestones.length) * 100
                : 0;
              const taskProgress = linkedTasks.length > 0
                ? (linkedTasks.filter(t => t.status === 'done').length / linkedTasks.length) * 100
                : 0;
              
              // Habit progress calculation
              const habitProgressValues = linkedHabits.map(h => {
                const targetDays = h.targetDays || 30;
                return Math.min(100, (h.completedDates.length / targetDays) * 100);
              });
              const habitProgress = habitProgressValues.length > 0
                ? habitProgressValues.reduce((a, b) => a + b, 0) / habitProgressValues.length
                : 0;
              
              // Weighted progress calculation
              let totalWeight = 0;
              let weightedSum = 0;
              if (goal.milestones.length > 0) { weightedSum += milestoneProgress * 0.4; totalWeight += 0.4; }
              if (linkedTasks.length > 0) { weightedSum += taskProgress * 0.35; totalWeight += 0.35; }
              if (linkedHabits.length > 0) { weightedSum += habitProgress * 0.25; totalWeight += 0.25; }
              
              const newProgress = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
              const isCompleted = newProgress >= 100;
              
              newGoals = state.goals.map(g => {
                if (g.id === habit.goalId) {
                  return { 
                    ...g, 
                    progress: newProgress,
                    completedAt: isCompleted && !g.completedAt ? new Date().toISOString() : (isCompleted ? g.completedAt : undefined)
                  };
                }
                return g;
              });
            }
          }

          return { habits: newHabits, goals: newGoals };
        }),
      
      incrementHabitCompletion: (id, date, note) =>
        set((state) => ({
          habits: state.habits.map((h) => {
            if (h.id !== id) return h;
            
            let newCompletions = [...(h.completions || [])];
            const existingIndex = newCompletions.findIndex(c => c.date === date);
            
            if (existingIndex >= 0) {
              newCompletions[existingIndex] = {
                ...newCompletions[existingIndex],
                count: newCompletions[existingIndex].count + 1,
                notes: note || newCompletions[existingIndex].notes,
                time: new Date().toISOString(),
              };
            } else {
              newCompletions.push({ date, count: 1, notes: note, time: new Date().toISOString() });
            }
            
            // Add to completedDates if not already there
            const newCompletedDates = h.completedDates.includes(date) 
              ? h.completedDates 
              : [...h.completedDates, date];
            
            // Calculate streak
            const today = new Date();
            let streak = 0;
            for (let i = 0; i < 365; i++) {
              const checkDate = new Date(today);
              checkDate.setDate(checkDate.getDate() - i);
              const dateStr = checkDate.toISOString().split('T')[0];
              if (newCompletedDates.includes(dateStr)) streak++;
              else if (i > 0) break;
            }
            
            const bestStreak = Math.max(h.bestStreak || 0, streak);
            return { ...h, completedDates: newCompletedDates, completions: newCompletions, streak, bestStreak };
          }),
        })),
      
      decrementHabitCompletion: (id, date) =>
        set((state) => ({
          habits: state.habits.map((h) => {
            if (h.id !== id) return h;
            
            let newCompletions = [...(h.completions || [])];
            const existingIndex = newCompletions.findIndex(c => c.date === date);
            
            if (existingIndex >= 0) {
              if (newCompletions[existingIndex].count <= 1) {
                newCompletions = newCompletions.filter(c => c.date !== date);
              } else {
                newCompletions[existingIndex] = {
                  ...newCompletions[existingIndex],
                  count: newCompletions[existingIndex].count - 1,
                };
              }
            }
            
            // Remove from completedDates if count is 0
            const completion = newCompletions.find(c => c.date === date);
            const newCompletedDates = completion 
              ? h.completedDates 
              : h.completedDates.filter(d => d !== date);
            
            // Calculate streak
            const today = new Date();
            let streak = 0;
            for (let i = 0; i < 365; i++) {
              const checkDate = new Date(today);
              checkDate.setDate(checkDate.getDate() - i);
              const dateStr = checkDate.toISOString().split('T')[0];
              if (newCompletedDates.includes(dateStr)) streak++;
              else if (i > 0) break;
            }
            
            const bestStreak = Math.max(h.bestStreak || 0, streak);
            return { ...h, completedDates: newCompletedDates, completions: newCompletions, streak, bestStreak };
          }),
        })),
      
      deleteHabitCompletion: (id, date) =>
        set((state) => ({
          habits: state.habits.map((h) => {
            if (h.id !== id) return h;
            
            // Remove from completions array
            const newCompletions = (h.completions || []).filter(c => c.date !== date);
            
            // Remove from completedDates
            const newCompletedDates = h.completedDates.filter(d => d !== date);
            
            // Recalculate streak
            const today = new Date();
            let streak = 0;
            for (let i = 0; i < 365; i++) {
              const checkDate = new Date(today);
              checkDate.setDate(checkDate.getDate() - i);
              const dateStr = checkDate.toISOString().split('T')[0];
              if (newCompletedDates.includes(dateStr)) streak++;
              else if (i > 0) break;
            }
            
            return { ...h, completedDates: newCompletedDates, completions: newCompletions, streak };
          }),
        })),
      
      archiveHabit: (id) =>
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === id ? { ...h, archivedAt: new Date().toISOString() } : h
          ),
        })),
      
      unarchiveHabit: (id) =>
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === id ? { ...h, archivedAt: undefined } : h
          ),
        })),

      // Habit Competitions
      habitCompetitions: [],
      addHabitCompetition: (competition) =>
        set((state) => ({
          habitCompetitions: [
            ...state.habitCompetitions,
            {
              ...competition,
              id: crypto.randomUUID(),
              status: 'active' as const,
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      completeHabitCompetition: (id, winnerId) =>
        set((state) => ({
          habitCompetitions: state.habitCompetitions.map((c) =>
            c.id === id
              ? { ...c, status: 'completed' as const, winnerId, completedAt: new Date().toISOString() }
              : c
          ),
        })),
      deleteHabitCompetition: (id) =>
        set((state) => ({
          habitCompetitions: state.habitCompetitions.filter((c) => c.id !== id),
        })),

      // Tasks - Khởi tạo với empty array, không dùng sample data
      tasks: [],
      addTask: (task) =>
        set((state) => ({ tasks: [...state.tasks, { ...task, id: crypto.randomUUID(), completedPomodoros: 0, subtasks: [], createdAt: new Date().toISOString() }] })),
      updateTask: (id, updates) =>
        set((state) => {
          const task = state.tasks.find((t) => t.id === id);
          let newTasks = state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t));
          let newGoals = state.goals;
          
          // Auto-create next recurring task when marked as done
          if (task && updates.status === 'done' && task.recurring && task.dueDate) {
            const currentDue = new Date(task.dueDate);
            let nextDue = new Date(currentDue);
            
            switch (task.recurring.frequency) {
              case 'daily':
                nextDue.setDate(nextDue.getDate() + (task.recurring.interval || 1));
                break;
              case 'weekly':
                nextDue.setDate(nextDue.getDate() + 7 * (task.recurring.interval || 1));
                break;
              case 'monthly':
                nextDue.setMonth(nextDue.getMonth() + (task.recurring.interval || 1));
                break;
            }
            
            const newTask: Task = {
              ...task,
              id: crypto.randomUUID(),
              status: 'todo',
              dueDate: nextDue.toISOString().split('T')[0],
              completedPomodoros: 0,
              subtasks: (task.subtasks || []).map((s) => ({ ...s, id: crypto.randomUUID(), completed: false, completedAt: undefined })),
              createdAt: new Date().toISOString(),
            };
            
            newTasks = [...newTasks, newTask];
          }
          
          // Auto-sync goal progress when task with goalId is completed/uncompleted
          const wasCompleted = task?.status === 'done';
          const willBeCompleted = updates.status === 'done';
          if (task?.goalId && (willBeCompleted || (wasCompleted && updates.status !== undefined && updates.status !== 'done'))) {
            const linkedTasks = newTasks.filter(t => t.goalId === task.goalId && !t.deletedAt);
            const linkedHabits = state.habits.filter(h => h.goalId === task.goalId && !h.deletedAt);
            const goal = state.goals.find(g => g.id === task.goalId);
            
            if (goal) {
              // Calculate combined progress including habits
              const milestoneProgress = goal.milestones.length > 0
                ? (goal.milestones.filter(m => m.completed).length / goal.milestones.length) * 100
                : 0;
              const taskProgress = linkedTasks.length > 0
                ? (linkedTasks.filter(t => t.status === 'done').length / linkedTasks.length) * 100
                : 0;
              
              // Habit progress calculation
              const habitProgressValues = linkedHabits.map(h => {
                const targetDays = h.targetDays || 30;
                return Math.min(100, (h.completedDates.length / targetDays) * 100);
              });
              const habitProgress = habitProgressValues.length > 0
                ? habitProgressValues.reduce((a, b) => a + b, 0) / habitProgressValues.length
                : 0;
              
              // Weighted progress calculation
              let totalWeight = 0;
              let weightedSum = 0;
              if (goal.milestones.length > 0) { weightedSum += milestoneProgress * 0.4; totalWeight += 0.4; }
              if (linkedTasks.length > 0) { weightedSum += taskProgress * 0.35; totalWeight += 0.35; }
              if (linkedHabits.length > 0) { weightedSum += habitProgress * 0.25; totalWeight += 0.25; }
              
              const newProgress = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
              const isCompleted = newProgress >= 100;
              
              newGoals = state.goals.map(g => {
                if (g.id === task.goalId) {
                  return { 
                    ...g, 
                    progress: newProgress,
                    completedAt: isCompleted && !g.completedAt ? new Date().toISOString() : (isCompleted ? g.completedAt : undefined)
                  };
                }
                return g;
              });
            }
          }
          
          return { tasks: newTasks, goals: newGoals };
        }),
      deleteTask: (id) =>
        set((state) => ({ tasks: state.tasks.map((t) => (t.id === id ? { ...t, deletedAt: new Date().toISOString() } : t)) })),
      restoreTask: (id) =>
        set((state) => ({ tasks: state.tasks.map((t) => (t.id === id ? { ...t, deletedAt: undefined } : t)) })),
      permanentDeleteTask: (id) =>
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) })),
      incrementTaskPomodoro: (id) =>
        set((state) => ({ tasks: state.tasks.map((t) => (t.id === id ? { ...t, completedPomodoros: t.completedPomodoros + 1 } : t)) })),
      addSubtask: (taskId, title) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? { ...t, subtasks: [...(t.subtasks || []), { id: crypto.randomUUID(), title, completed: false }] }
              : t
          ),
        })),
      toggleSubtask: (taskId, subtaskId) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  subtasks: (t.subtasks || []).map((s) =>
                    s.id === subtaskId ? { ...s, completed: !s.completed, completedAt: !s.completed ? new Date().toISOString() : undefined } : s
                  ),
                }
              : t
          ),
        })),
      deleteSubtask: (taskId, subtaskId) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, subtasks: (t.subtasks || []).filter((s) => s.id !== subtaskId) } : t
          ),
        })),
      archiveTask: (id) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, archived: true, archivedAt: new Date().toISOString() } : t
          ),
        })),
      unarchiveTask: (id) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, archived: false, archivedAt: undefined } : t
          ),
        })),
      autoArchiveOldTasks: () =>
        set((state) => {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          return {
            tasks: state.tasks.map((t) => {
              if (
                t.status === 'done' &&
                t.completedAt &&
                !t.archived &&
                new Date(t.completedAt) < thirtyDaysAgo
              ) {
                return { ...t, archived: true, archivedAt: new Date().toISOString() };
              }
              return t;
            }),
          };
        }),
      reorderTasks: (taskId, targetTaskId, position) =>
        set((state) => {
          const draggedTask = state.tasks.find(t => t.id === taskId);
          const targetTask = state.tasks.find(t => t.id === targetTaskId);
          
          if (!draggedTask || !targetTask || draggedTask.status !== targetTask.status) {
            return state;
          }
          
          // Get tasks in the same column
          const columnTasks = state.tasks
            .filter(t => t.status === draggedTask.status && !t.archived && !t.deletedAt)
            .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
          
          // Calculate new position
          const targetIndex = columnTasks.findIndex(t => t.id === targetTaskId);
          let newPosition: number;
          
          if (position === 'before') {
            const prevTask = columnTasks[targetIndex - 1];
            newPosition = prevTask 
              ? ((prevTask.position ?? 0) + (targetTask.position ?? 0)) / 2
              : (targetTask.position ?? 0) - 1;
          } else {
            const nextTask = columnTasks[targetIndex + 1];
            newPosition = nextTask 
              ? ((targetTask.position ?? 0) + (nextTask.position ?? 0)) / 2
              : (targetTask.position ?? 0) + 1;
          }
          
          return {
            tasks: state.tasks.map(t => 
              t.id === taskId ? { ...t, position: newPosition } : t
            ),
          };
        }),

      // Task Tags
      taskTags: [
        { id: 'tag-urgent', name: 'Khẩn cấp', color: '0 84% 60%' },
        { id: 'tag-meeting', name: 'Họp', color: '217 91% 60%' },
        { id: 'tag-review', name: 'Review', color: '142 71% 45%' },
      ],
      addTaskTag: (name, color) => {
        const id = crypto.randomUUID();
        set((state) => ({ taskTags: [...state.taskTags, { id, name, color }] }));
        return id;
      },
      updateTaskTag: (id, updates) =>
        set((state) => ({ taskTags: state.taskTags.map((t) => (t.id === id ? { ...t, ...updates } : t)) })),
      deleteTaskTag: (id) =>
        set((state) => ({
          taskTags: state.taskTags.filter((t) => t.id !== id),
          tasks: state.tasks.map((t) => ({ ...t, tags: (t.tags || []).filter((tagId) => tagId !== id) })),
        })),

      // Goals - Khởi tạo với empty array, không dùng sample data
      goals: [],
      addGoal: (goal) =>
        set((state) => ({
          goals: [...state.goals, {
            ...goal,
            id: crypto.randomUUID(),
            progress: 0,
            milestones: (goal.milestones || []).map((title) => ({ id: crypto.randomUUID(), title, completed: false })),
            createdAt: new Date().toISOString(),
          }],
        })),
      updateGoal: (id, updates) =>
        set((state) => ({ goals: state.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)) })),
      deleteGoal: (id) =>
        set((state) => ({ goals: state.goals.map((g) => (g.id === id ? { ...g, deletedAt: new Date().toISOString() } : g)) })),
      restoreGoal: (id) =>
        set((state) => ({ goals: state.goals.map((g) => (g.id === id ? { ...g, deletedAt: undefined } : g)) })),
      permanentDeleteGoal: (id) =>
        set((state) => ({ goals: state.goals.filter((g) => g.id !== id) })),
      toggleMilestone: (goalId, milestoneId) =>
        set((state) => ({
          goals: state.goals.map((g) => {
            if (g.id !== goalId) return g;
            const milestones = g.milestones.map((m) =>
              m.id === milestoneId ? { ...m, completed: !m.completed, completedAt: !m.completed ? new Date().toISOString() : undefined } : m
            );
            const completedCount = milestones.filter((m) => m.completed).length;
            const progress = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;
            return { ...g, milestones, progress };
          }),
        })),

      // Journal - Khởi tạo với empty array, không dùng sample data
      journalEntries: [],
      addJournalEntry: (entry) =>
        set((state) => ({ journalEntries: [{ ...entry, id: crypto.randomUUID(), createdAt: new Date().toISOString() }, ...state.journalEntries] })),
      updateJournalEntry: (id, updates) =>
        set((state) => ({ journalEntries: state.journalEntries.map((e) => (e.id === id ? { ...e, ...updates } : e)) })),
      deleteJournalEntry: (id) =>
        set((state) => ({ journalEntries: state.journalEntries.filter((e) => e.id !== id) })),
      
      // Journal Tags
      journalTags: [
        { id: 'jtag-work', name: 'Công việc', color: '217 91% 60%' },
        { id: 'jtag-personal', name: 'Cá nhân', color: '142 71% 45%' },
        { id: 'jtag-travel', name: 'Du lịch', color: '25 95% 53%' },
        { id: 'jtag-health', name: 'Sức khỏe', color: '0 84% 60%' },
      ],
      addJournalTag: (name, color) => {
        const id = crypto.randomUUID();
        set((state) => ({ journalTags: [...state.journalTags, { id, name, color }] }));
        return id;
      },
      updateJournalTag: (id, updates) =>
        set((state) => ({ journalTags: state.journalTags.map((t) => (t.id === id ? { ...t, ...updates } : t)) })),
      deleteJournalTag: (id) =>
        set((state) => ({
          journalTags: state.journalTags.filter((t) => t.id !== id),
          journalEntries: state.journalEntries.map((e) => ({ ...e, tags: (e.tags || []).filter((tagId) => tagId !== id) })),
        })),

      // Life Wheel - Khởi tạo với empty array, không dùng sample data
      lifeWheelScores: [],
      addLifeWheelScore: (scores) =>
        set((state) => ({
          lifeWheelScores: [{ id: crypto.randomUUID(), date: new Date().toISOString().split('T')[0], scores, createdAt: new Date().toISOString() }, ...state.lifeWheelScores],
        })),
      deleteLifeWheelScore: (id) =>
        set((state) => ({ lifeWheelScores: state.lifeWheelScores.filter((s) => s.id !== id) })),
      clearLifeWheelHistory: () =>
        set((state) => ({ lifeWheelScores: state.lifeWheelScores.slice(0, 1) })),

      // Weekly Reviews - Khởi tạo với empty array, không dùng sample data
      weeklyReviews: [],
      addWeeklyReview: (review) =>
        set((state) => {
          const newReview = { ...review, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
          // Auto-create LifeWheelScore when area ratings are provided
          if (review.areaRatings) {
            const newScore = {
              id: crypto.randomUUID(),
              date: review.weekStart,
              scores: review.areaRatings,
              createdAt: new Date().toISOString(),
            };
            return {
              weeklyReviews: [newReview, ...state.weeklyReviews],
              lifeWheelScores: [newScore, ...state.lifeWheelScores.filter(s => s.date !== review.weekStart)],
            };
          }
          return { weeklyReviews: [newReview, ...state.weeklyReviews] };
        }),
      updateWeeklyReview: (id, updates) =>
        set((state) => {
          const review = state.weeklyReviews.find(r => r.id === id);
          // Update LifeWheelScore when area ratings are updated
          if (updates.areaRatings && review) {
            const existingScoreIndex = state.lifeWheelScores.findIndex(s => s.date === review.weekStart);
            let newScores = [...state.lifeWheelScores];
            if (existingScoreIndex >= 0) {
              newScores[existingScoreIndex] = { ...newScores[existingScoreIndex], scores: updates.areaRatings };
            } else {
              newScores = [{
                id: crypto.randomUUID(),
                date: review.weekStart,
                scores: updates.areaRatings,
                createdAt: new Date().toISOString(),
              }, ...newScores];
            }
            return {
              weeklyReviews: state.weeklyReviews.map((r) => (r.id === id ? { ...r, ...updates } : r)),
              lifeWheelScores: newScores,
            };
          }
          return { weeklyReviews: state.weeklyReviews.map((r) => (r.id === id ? { ...r, ...updates } : r)) };
        }),
      deleteWeeklyReview: (id) =>
        set((state) => ({ weeklyReviews: state.weeklyReviews.filter((r) => r.id !== id) })),
      clearWeeklyReviewHistory: () =>
        set({ weeklyReviews: [] }),

      // Monthly Reviews
      monthlyReviews: [],
      addMonthlyReview: (review) =>
        set((state) => ({
          monthlyReviews: [{ ...review, id: crypto.randomUUID(), createdAt: new Date().toISOString() }, ...state.monthlyReviews],
        })),
      updateMonthlyReview: (id, updates) =>
        set((state) => ({
          monthlyReviews: state.monthlyReviews.map((r) => (r.id === id ? { ...r, ...updates } : r)),
        })),
      deleteMonthlyReview: (id) =>
        set((state) => ({ monthlyReviews: state.monthlyReviews.filter((r) => r.id !== id) })),

      // Yearly Planning
      yearlyPlannings: [],
      addYearlyPlanning: (planning) =>
        set((state) => ({
          yearlyPlannings: [{ ...planning, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...state.yearlyPlannings],
        })),
      updateYearlyPlanning: (id, updates) =>
        set((state) => ({
          yearlyPlannings: state.yearlyPlannings.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p)),
        })),
      deleteYearlyPlanning: (id) =>
        set((state) => ({ yearlyPlannings: state.yearlyPlannings.filter((p) => p.id !== id) })),

      // Yearly Reviews
      yearlyReviews: [],
      addYearlyReview: (review) =>
        set((state) => ({
          yearlyReviews: [{ ...review, id: crypto.randomUUID(), createdAt: new Date().toISOString() }, ...state.yearlyReviews],
        })),
      updateYearlyReview: (id, updates) =>
        set((state) => ({
          yearlyReviews: state.yearlyReviews.map((r) => (r.id === id ? { ...r, ...updates } : r)),
        })),
      deleteYearlyReview: (id) =>
        set((state) => ({ yearlyReviews: state.yearlyReviews.filter((r) => r.id !== id) })),

      // AI Chat - Khởi tạo với empty array, không dùng sample data
      chatMessages: [],
      addChatMessage: (message) =>
        set((state) => ({ chatMessages: [...state.chatMessages, { ...message, id: crypto.randomUUID(), createdAt: new Date().toISOString() }] })),
      clearChatHistory: () => set({ chatMessages: [] }),
      toggleMessageFavorite: (id) =>
        set((state) => ({
          chatMessages: state.chatMessages.map((m) => (m.id === id ? { ...m, isFavorite: !m.isFavorite } : m)),
        })),
      savedConversations: [],
      saveConversation: (title) =>
        set((state) => ({
          savedConversations: [
            { id: crypto.randomUUID(), title, messages: [...state.chatMessages], createdAt: new Date().toISOString() },
            ...state.savedConversations,
          ],
        })),
      deleteSavedConversation: (id) =>
        set((state) => ({ savedConversations: state.savedConversations.filter((c) => c.id !== id) })),
      loadSavedConversation: (id) =>
        set((state) => {
          const conversation = state.savedConversations.find((c) => c.id === id);
          return conversation ? { chatMessages: [...conversation.messages] } : {};
        }),
      aiSettings: {},
      setAISettings: (settings) => set((state) => ({ aiSettings: { ...state.aiSettings, ...settings } })),

      // Notes
      notes: [],
      addNote: (note) =>
        set((state) => ({
          notes: [{ ...note, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...state.notes],
        })),
      updateNote: (id, updates) =>
        set((state) => ({
          notes: state.notes.map((n) => (n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n)),
        })),
      deleteNote: (id) =>
        set((state) => ({
          notes: state.notes.map((n) => (n.id === id ? { ...n, deletedAt: new Date().toISOString() } : n)),
        })),
      restoreNote: (id) =>
        set((state) => ({
          notes: state.notes.map((n) => (n.id === id ? { ...n, deletedAt: undefined, updatedAt: new Date().toISOString() } : n)),
        })),
      permanentDeleteNote: (id) =>
        set((state) => ({ notes: state.notes.filter((n) => n.id !== id) })),
      emptyTrash: () =>
        set((state) => ({ 
          notes: state.notes.filter((n) => !n.deletedAt),
          tasks: state.tasks.filter((t) => !t.deletedAt),
          goals: state.goals.filter((g) => !g.deletedAt),
          habits: state.habits.filter((h) => !h.deletedAt),
        })),
      emptyNotesTrash: () =>
        set((state) => ({ notes: state.notes.filter((n) => !n.deletedAt) })),
      toggleNotePin: (id) =>
        set((state) => ({
          notes: state.notes.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned, updatedAt: new Date().toISOString() } : n)),
        })),
      toggleNoteFavorite: (id) =>
        set((state) => ({
          notes: state.notes.map((n) => (n.id === id ? { ...n, isFavorite: !n.isFavorite, updatedAt: new Date().toISOString() } : n)),
        })),
      archiveNote: (id) =>
        set((state) => ({
          notes: state.notes.map((n) => (n.id === id ? { ...n, archivedAt: new Date().toISOString() } : n)),
        })),
      unarchiveNote: (id) =>
        set((state) => ({
          notes: state.notes.map((n) => (n.id === id ? { ...n, archivedAt: undefined, updatedAt: new Date().toISOString() } : n)),
        })),
      
      // Trash Settings
      trashSettings: { autoCleanupDays: 30, enabled: true },
      setTrashSettings: (settings) =>
        set((state) => ({ trashSettings: { ...state.trashSettings, ...settings } })),
      noteTags: [
        { id: 'ntag-idea', name: 'Ý tưởng', color: '45 95% 55%' },
        { id: 'ntag-work', name: 'Công việc', color: '217 91% 60%' },
        { id: 'ntag-personal', name: 'Cá nhân', color: '142 71% 45%' },
        { id: 'ntag-important', name: 'Quan trọng', color: '0 84% 60%' },
      ],
      addNoteTag: (name, color) => {
        const id = crypto.randomUUID();
        set((state) => ({ noteTags: [...state.noteTags, { id, name, color }] }));
        return id;
      },
      updateNoteTag: (id, updates) =>
        set((state) => ({ noteTags: state.noteTags.map((t) => (t.id === id ? { ...t, ...updates } : t)) })),
      deleteNoteTag: (id) =>
        set((state) => ({
        noteTags: state.noteTags.filter((t) => t.id !== id),
          notes: state.notes.map((n) => ({ ...n, tags: (n.tags || []).filter((tagId) => tagId !== id) })),
        })),

      // Daily Intentions
      dailyIntentions: [],
      addDailyIntention: (intention) => {
        const today = new Date().toISOString().split('T')[0];
        set((state) => ({
          dailyIntentions: [
            ...state.dailyIntentions.filter((i) => i.date !== today),
            {
              id: crypto.randomUUID(),
              date: today,
              intention,
              completed: false,
              createdAt: new Date().toISOString(),
            },
          ],
        }));
      },
      updateDailyIntention: (id, updates) =>
        set((state) => ({
          dailyIntentions: state.dailyIntentions.map((i) =>
            i.id === id ? { ...i, ...updates } : i
          ),
        })),
      completeDailyIntention: (id) =>
        set((state) => ({
          dailyIntentions: state.dailyIntentions.map((i) =>
            i.id === id ? { ...i, completed: true } : i
          ),
        })),
      getTodayIntention: () => {
        const today = new Date().toISOString().split('T')[0];
        return get().dailyIntentions.find((i) => i.date === today);
      },

      // App Settings
      notificationSoundEnabled: true,
      setNotificationSoundEnabled: (enabled) => set({ notificationSoundEnabled: enabled }),
      pushNotificationsEnabled: false,
      setPushNotificationsEnabled: (enabled) => set({ pushNotificationsEnabled: enabled }),
      goalSidebarTabOrder: ['stats', 'streak', 'notify'],
      setGoalSidebarTabOrder: (order) => set({ goalSidebarTabOrder: order }),
      mainSidebarMenuOrder: ['/', '/dashboard', '/habits', '/tasks', '/goals', '/journal', '/notes', '/life-wheel', '/weekly-review', '/ai-chat'],
      setMainSidebarMenuOrder: (order) => set({ mainSidebarMenuOrder: order }),
      mobileMenuOrder: ['/dashboard', '/goals', '/notes', '/health', '/finance', '/learning', '/relationships', '/life-wheel', '/weekly-review', '/ai-chat', '/me', '/trash'],
      setMobileMenuOrder: (order) => set({ mobileMenuOrder: order }),

      // Pomodoro
      pomodoroSettings: { workDuration: 25, breakDuration: 5, longBreakDuration: 15, sessionsBeforeLongBreak: 4 },
      setPomodoroSettings: (settings) => set((state) => ({ pomodoroSettings: { ...state.pomodoroSettings, ...settings } })),
      pomodoroSessions: [], // Khởi tạo với empty array, không dùng sample data
      addPomodoroSession: (session) =>
        set((state) => ({ pomodoroSessions: [...state.pomodoroSessions, { ...session, id: crypto.randomUUID(), completedAt: new Date().toISOString() }] })),

      // Health Module
      healthLogs: [],
      addHealthLog: (log) => set((state) => ({ healthLogs: [...state.healthLogs, log] })),
      updateHealthLog: (id, updates) =>
        set((state) => ({ healthLogs: state.healthLogs.map((l) => (l.id === id ? { ...l, ...updates } : l)) })),
      deleteHealthLog: (id) => set((state) => ({ healthLogs: state.healthLogs.filter((l) => l.id !== id) })),

      // Finance Module
      financeTransactions: [],
      addFinanceTransaction: (transaction) => set((state) => ({ financeTransactions: [...state.financeTransactions, transaction] })),
      updateFinanceTransaction: (id, updates) =>
        set((state) => ({ financeTransactions: state.financeTransactions.map((t) => (t.id === id ? { ...t, ...updates } : t)) })),
      deleteFinanceTransaction: (id) => set((state) => ({ financeTransactions: state.financeTransactions.filter((t) => t.id !== id) })),

      // Learning Module
      learningCourses: [],
      learningBooks: [],
      addLearningCourse: (course) => set((state) => ({ learningCourses: [...state.learningCourses, course] })),
      updateLearningCourse: (id, updates) =>
        set((state) => ({ learningCourses: state.learningCourses.map((c) => (c.id === id ? { ...c, ...updates } : c)) })),
      deleteLearningCourse: (id) => set((state) => ({ learningCourses: state.learningCourses.filter((c) => c.id !== id) })),
      addLearningBook: (book) => set((state) => ({ learningBooks: [...state.learningBooks, book] })),
      updateLearningBook: (id, updates) =>
        set((state) => ({ learningBooks: state.learningBooks.map((b) => (b.id === id ? { ...b, ...updates } : b)) })),
      deleteLearningBook: (id) => set((state) => ({ learningBooks: state.learningBooks.filter((b) => b.id !== id) })),

      // Relationships Module
      relationshipsContacts: [],
      relationshipsInteractions: [],
      addRelationshipContact: (contact) => set((state) => ({ relationshipsContacts: [...state.relationshipsContacts, contact] })),
      updateRelationshipContact: (id, updates) =>
        set((state) => ({ relationshipsContacts: state.relationshipsContacts.map((c) => (c.id === id ? { ...c, ...updates } : c)) })),
      deleteRelationshipContact: (id) => set((state) => ({ relationshipsContacts: state.relationshipsContacts.filter((c) => c.id !== id) })),
      addRelationshipInteraction: (interaction) => set((state) => ({ relationshipsInteractions: [...state.relationshipsInteractions, interaction] })),
      updateRelationshipInteraction: (id, updates) =>
        set((state) => ({ relationshipsInteractions: state.relationshipsInteractions.map((i) => (i.id === id ? { ...i, ...updates } : i)) })),
      deleteRelationshipInteraction: (id) => set((state) => ({ relationshipsInteractions: state.relationshipsInteractions.filter((i) => i.id !== id) })),

      // User Preferences
      userPreferences: {
        aiTone: 'gentle',
        planningStyle: 'checklist',
        archetype: 'beginner',
        lifeAreaPriorities: ['health', 'career', 'finance', 'learning', 'relationships'],
        morningCheckinEnabled: true,
        morningCheckinTime: '07:00',
        eveningReviewEnabled: true,
        eveningReviewTime: '21:00',
        showTodayFocus: true,
        showAISuggestions: true,
        showStreaks: true,
        onboardingCompleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      setUserPreferences: (prefs) => set((state) => ({
        userPreferences: { ...state.userPreferences, ...prefs, updatedAt: new Date().toISOString() },
      })),

      // Morning Checkins
      morningCheckins: [],
      addMorningCheckin: (entry) =>
        set((state) => ({
          morningCheckins: [...state.morningCheckins, { ...entry, id: crypto.randomUUID(), createdAt: new Date().toISOString() }],
        })),
      updateMorningCheckin: (id, updates) =>
        set((state) => ({
          morningCheckins: state.morningCheckins.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        })),

      // Evening Reviews
      eveningReviews: [],
      addEveningReview: (entry) =>
        set((state) => ({
          eveningReviews: [...state.eveningReviews, { ...entry, id: crypto.randomUUID(), createdAt: new Date().toISOString() }],
        })),
      updateEveningReview: (id, updates) =>
        set((state) => ({
          eveningReviews: state.eveningReviews.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        })),

      // AI Memory
      aiMemories: [],
      addAIMemory: (memory) =>
        set((state) => ({
          aiMemories: [...state.aiMemories, { ...memory, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
        })),
      updateAIMemory: (id, updates) =>
        set((state) => ({
          aiMemories: state.aiMemories.map((m) => (m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m)),
        })),
      deleteAIMemory: (id) =>
        set((state) => ({
          aiMemories: state.aiMemories.filter((m) => m.id !== id),
        })),

      // Decision Logs
      decisionLogs: [],
      addDecisionLog: (log) =>
        set((state) => ({
          decisionLogs: [...state.decisionLogs, { ...log, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
        })),
      updateDecisionLog: (id, updates) =>
        set((state) => ({
          decisionLogs: state.decisionLogs.map((l) => (l.id === id ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l)),
        })),
      deleteDecisionLog: (id) =>
        set((state) => ({
          decisionLogs: state.decisionLogs.map((l) => (l.id === id ? { ...l, deletedAt: new Date().toISOString() } : l)),
        })),

      // Data management
      loadSampleData: () =>
        set({
          user: sampleUser,
          habits: sampleHabits,
          tasks: sampleTasks,
          goals: sampleGoals,
          journalEntries: sampleJournalEntries,
          lifeWheelScores: sampleLifeWheelScores,
          weeklyReviews: sampleWeeklyReviews,
          chatMessages: sampleChatMessages,
          pomodoroSessions: samplePomodoroSessions,
          notes: sampleNotes,
          dailyIntentions: sampleDailyIntentions,
        }),
      clearAllData: () =>
        set({
          user: { 
            name: 'User',
            personalValues: undefined,
            lifeRoles: undefined,
            visions: undefined,
            traits: undefined,
            milestones: undefined,
          },
          habits: [],
          tasks: [],
          goals: [],
          journalEntries: [],
          notes: [],
          lifeWheelScores: [],
          weeklyReviews: [],
          dailyIntentions: [],
          chatMessages: [],
          pomodoroSessions: [],
          taskTags: [],
          journalTags: [],
          noteTags: [],
        }),
    }),
    { name: 'lifeos-storage' }
  )
);
