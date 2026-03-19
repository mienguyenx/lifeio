// Life Areas
export type LifeArea =
  | 'health'
  | 'relationships'
  | 'career'
  | 'finance'
  | 'personal'
  | 'fun'
  | 'environment'
  | 'spirituality'
  | 'learning'
  | 'contribution';

export const LIFE_AREAS: { id: LifeArea; name: string; icon: string; color: string }[] = [
  { id: 'health', name: 'Sức khỏe', icon: '💪', color: 'area-health' },
  { id: 'relationships', name: 'Quan hệ', icon: '❤️', color: 'area-relationships' },
  { id: 'career', name: 'Sự nghiệp', icon: '💼', color: 'area-career' },
  { id: 'finance', name: 'Tài chính', icon: '💰', color: 'area-finance' },
  { id: 'personal', name: 'Cá nhân', icon: '🧘', color: 'area-personal' },
  { id: 'fun', name: 'Giải trí', icon: '🎉', color: 'area-fun' },
  { id: 'environment', name: 'Môi trường', icon: '🏠', color: 'area-environment' },
  { id: 'spirituality', name: 'Tâm linh', icon: '✨', color: 'area-spirituality' },
  { id: 'learning', name: 'Học tập', icon: '📚', color: 'area-learning' },
  { id: 'contribution', name: 'Đóng góp', icon: '🤝', color: 'area-contribution' },
];

// Habit Completion Record (for target tracking)
export interface HabitCompletion {
  date: string;
  count: number; // How many times completed on this date
  notes?: string;
  time?: string; // Time of completion
}

// Habit Challenge
export interface HabitChallenge {
  id: string;
  habitId: string;
  type: '21-day' | '30-day' | '66-day';
  startDate: string;
  completedDays: number;
  status: 'active' | 'completed' | 'failed';
  completedAt?: string;
}

// Habit Competition - Race between habits to reach a target
export interface HabitCompetition {
  id: string;
  name: string;
  habitIds: string[]; // Habits competing
  targetRate: number; // Target completion rate (e.g., 90 for 90%)
  durationDays: number; // Competition duration
  startDate: string;
  status: 'active' | 'completed';
  winnerId?: string; // Habit that won
  completedAt?: string;
  createdAt: string;
}

// Habit
export interface Habit {
  id: string;
  name: string;
  description?: string;
  area: LifeArea;
  frequency: 'daily' | 'weekly' | 'custom';
  customDays?: number[]; // 0-6 for weekly (0 = Sunday)
  targetPerDay?: number; // Target count per day (e.g., 8 glasses of water)
  targetUnit?: string; // Unit label (e.g., "glasses", "minutes", "pages")
  streak: number;
  bestStreak?: number;
  completedDates: string[]; // Legacy: simple date strings
  completions?: HabitCompletion[]; // New: detailed completion records
  reminderTime?: string; // HH:mm format
  reminderEnabled?: boolean;
  color?: string; // Custom color override
  icon?: string; // Custom emoji icon
  challenge?: HabitChallenge; // Active challenge
  goalId?: string; // Link to parent goal
  targetDays?: number; // Target days to complete for goal progress (e.g., 30 days)
  createdAt: string;
  archivedAt?: string;
  deletedAt?: string; // Soft delete - move to trash
}

// Subtask
export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
}

// Task Tag
export interface TaskTag {
  id: string;
  name: string;
  color: string; // HSL color value
}

// Recurring Settings
export interface RecurringSettings {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number; // every X days/weeks/months
  weekDays?: number[]; // 0-6 for weekly (0 = Sunday)
  endDate?: string;
}

// Task
export interface Task {
  id: string;
  title: string;
  description?: string;
  area?: LifeArea;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'deferred' | 'done';
  dueDate?: string;
  estimatedPomodoros?: number;
  completedPomodoros: number;
  subtasks?: Subtask[];
  tags?: string[]; // Array of tag IDs
  recurring?: RecurringSettings;
  reminderMinutes?: number; // Minutes before deadline to remind
  reminderTime?: string; // Specific time for reminder (HH:mm format)
  lastReminded?: string; // ISO date of last reminder
  archived?: boolean; // Auto-archived after 30 days of completion
  archivedAt?: string; // ISO date when archived
  createdAt: string;
  completedAt?: string;
  goalId?: string; // Link to parent goal
  milestoneId?: string; // Link to specific milestone
  deletedAt?: string; // Soft delete - move to trash
  position?: number; // Custom sort order within column
}

// Goal Progress History Entry
export interface GoalProgressEntry {
  date: string;
  progress: number;
  note?: string;
}

// Vision Board Item
export interface VisionItem {
  id: string;
  type: 'image' | 'quote';
  content: string; // URL for image, text for quote
  author?: string; // For quotes
  createdAt: string;
}

// Goal Activity for streak tracking
export interface GoalActivity {
  date: string;
  type: 'progress' | 'milestone' | 'note' | 'task';
  description?: string;
}

// Goal Collaborator
export interface GoalCollaborator {
  id: string;
  email: string;
  name?: string;
  role: 'viewer' | 'editor';
  invitedAt: string;
  acceptedAt?: string;
}

// Goal
export interface Goal {
  id: string;
  title: string;
  description?: string;
  area: LifeArea;
  targetDate?: string;
  progress: number; // 0-100
  milestones: Milestone[];
  progressHistory?: GoalProgressEntry[]; // Track progress over time
  visionBoard?: VisionItem[]; // Inspirational images/quotes
  dependencies?: string[]; // IDs of goals that must be completed first (prerequisites)
  dependents?: string[]; // IDs of goals that depend on this goal
  priority?: 'low' | 'medium' | 'high';
  status?: 'active' | 'paused' | 'archived';
  isFocused?: boolean; // Focus mode - highlight this goal
  focusedAt?: string; // When focus mode was enabled
  archivedAt?: string;
  createdAt: string;
  completedAt?: string;
  reminderDays?: number; // Days before deadline to remind (default 7)
  reminderEnabled?: boolean;
  lastReminded?: string;
  // Streak tracking
  activities?: GoalActivity[]; // Daily activities on this goal
  currentStreak?: number;
  bestStreak?: number;
  lastActivityDate?: string;
  // Collaboration
  collaborators?: GoalCollaborator[];
  isPublic?: boolean; // Public sharing link
  shareCode?: string; // Unique share code
  // Push notifications
  pushEnabled?: boolean;
  pushDeadline?: boolean; // Notify on deadline day
  pushWeekly?: boolean; // Weekly progress reminder
  deletedAt?: string; // Soft delete - move to trash
}

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
  taskId?: string; // Link to created task
}

// Journal Entry
export interface JournalTag {
  id: string;
  name: string;
  color: string; // HSL values like '0 84% 60%'
}

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  mood: 1 | 2 | 3 | 4 | 5;
  energy: 1 | 2 | 3 | 4 | 5;
  areas?: LifeArea[];
  gratitude?: string[];
  tags?: string[]; // Array of JournalTag ids
  images?: string[]; // Array of image URLs
  createdAt: string;
}

// Life Wheel Score
export interface LifeWheelScore {
  id: string;
  date: string;
  scores: Record<LifeArea, number>; // 1-10 for each area
  createdAt: string;
}

// Weekly Review
export interface WeeklyReview {
  id: string;
  weekStart: string; // ISO date of Monday
  wins: string[];
  challenges: string[];
  lessonsLearned: string[];
  nextWeekFocus: string[];
  overallRating: 1 | 2 | 3 | 4 | 5;
  areaRatings?: Record<LifeArea, number>; // 1-10 rating for each life area
  gratitude?: string[]; // Things to be grateful for
  highlight?: string; // Highlight of the week
  lowlight?: string; // Lowlight of the week
  createdAt: string;
}

// AI Chat
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  isFavorite?: boolean;
}

export interface SavedConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
}

export interface AISettings {
  geminiApiKey?: string;
  perplexityApiKey?: string;
}

// Pomodoro
export type PomodoroPhase = 'work' | 'break' | 'long_break';

export interface PomodoroSettings {
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
}

export interface PomodoroSession {
  id: string;
  taskId?: string;
  phase: PomodoroPhase;
  duration: number;
  completedAt: string;
}

export interface PomodoroState {
  isRunning: boolean;
  phase: PomodoroPhase;
  timeRemaining: number;
  sessionsCompleted: number;
  currentTaskId?: string;
}

// Personal Value with priority and description
export interface PersonalValue {
  id: string;
  name: string;
  description?: string;
  priority: 1 | 2 | 3 | 4 | 5; // 1 = highest priority
  icon?: string; // emoji
  createdAt: string;
}

// Life Role with description and linked goals
export interface LifeRole {
  id: string;
  name: string;
  description?: string;
  linkedGoalIds?: string[]; // Goals associated with this role
  icon?: string; // emoji
  isActive: boolean;
  createdAt: string;
}

// Life Vision with history tracking
export interface LifeVision {
  id: string;
  statement: string;
  timeframe?: '1-year' | '5-year' | '10-year' | 'lifetime';
  createdAt: string;
  updatedAt: string;
}

// Personal Strength/Weakness
export interface PersonalTrait {
  id: string;
  name: string;
  type: 'strength' | 'weakness';
  description?: string;
  createdAt: string;
}

// Life Milestone Achievement
export interface LifeMilestone {
  id: string;
  title: string;
  description?: string;
  date: string;
  area?: LifeArea;
  createdAt: string;
}

// History tracking for Area Modules
export type HistoryAction = 'created' | 'updated' | 'deleted' | 'restored' | 'activated' | 'deactivated' | 'completed';

export interface AreaModuleHistory {
  id: string;
  entityId: string; // ID của entity (value_id, role_id, etc.)
  userId: string;
  action: HistoryAction;
  oldData?: any; // Dữ liệu cũ (trước khi thay đổi)
  newData?: any; // Dữ liệu mới (sau khi thay đổi)
  changedFields?: string[]; // Danh sách các field đã thay đổi
  createdAt: string;
}

export interface PersonalValueHistory extends AreaModuleHistory {
  valueId: string;
}

export interface LifeRoleHistory extends AreaModuleHistory {
  roleId: string;
}

export interface LifeVisionHistory extends AreaModuleHistory {
  visionId: string;
}

export interface PersonalTraitHistory extends AreaModuleHistory {
  traitId: string;
}

export interface LifeMilestoneHistory extends AreaModuleHistory {
  milestoneId: string;
}

// User Profile
export interface UserProfile {
  name: string;
  avatar?: string;
  email?: string;
  phone?: string;
  birthday?: string;
  timezone?: string;
  bio?: string;
  // Legacy fields (for backward compatibility)
  vision?: string;
  values?: string[];
  roles?: string[];
  // Enhanced fields
  lifePurpose?: string; // Life motto/purpose statement
  visions?: LifeVision[];
  personalValues?: PersonalValue[];
  lifeRoles?: LifeRole[];
  traits?: PersonalTrait[];
  milestones?: LifeMilestone[];
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
}

// Daily Intention
export interface DailyIntention {
  id: string;
  date: string;
  intention: string;
  reflection?: string;
  completed: boolean;
  createdAt: string;
}

// Note
export interface NoteTag {
  id: string;
  name: string;
  color: string; // HSL values
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags?: string[]; // Array of NoteTag ids
  area?: LifeArea;
  isPinned?: boolean;
  isFavorite?: boolean;
  color?: string; // Background color
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  deletedAt?: string; // Soft delete - move to trash
}

export interface TrashSettings {
  autoCleanupDays: number; // 0 = never auto cleanup
  enabled: boolean;
}
