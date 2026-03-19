/**
 * Backup Data Collector
 * Collects all data from Supabase database for backup
 */

import { activeSupabase as supabase, ensureValidSession } from '@/integrations/supabase/externalClient';

export interface BackupData {
  version: string;
  exportedAt: string;
  exportedBy: string;
  scope: 'user' | 'all_users' | 'full_database';
  targetUserId?: string;
  database: {
    // Core User Data
    profiles: any[];
    user_roles: any[];
    user_settings: any[];
    
    // Goals Module
    goals: any[];
    goal_milestones: any[];
    goal_activities: any[];
    goal_collaborators: any[];
    goal_vision_items: any[];
    goal_progress_history: any[];
    
    // Tasks Module
    tasks: any[];
    subtasks: any[];
    task_tags: any[];
    
    // Habits Module
    habits: any[];
    habit_completions: any[];
    habit_challenges: any[];
    habit_competitions: any[];
    
    // Journal & Notes
    journal_entries: any[];
    journal_tags: any[];
    notes: any[];
    note_tags: any[];
    
    // Life Management
    daily_intentions: any[];
    life_wheel_scores: any[];
    weekly_reviews: any[];
    personal_values: any[];
    personal_traits: any[];
    life_visions: any[];
    life_roles: any[];
    life_role_goals: any[];
    life_milestones: any[];
    
    // Pomodoro & Chat
    pomodoro_sessions: any[];
    saved_conversations: any[];
    chat_messages: any[];
    
    // Finance Module
    finance_transactions: any[];
    
    // Health Module
    health_logs: any[];
    
    // Learning Module
    learning_courses: any[];
    learning_books: any[];
    
    // Relationships Module
    relationships_contacts: any[];
    relationships_interactions: any[];
    
    // Google Drive Tokens
    google_drive_tokens: any[];
    
    // Admin & System (only for full database backup)
    subscription_plans?: any[];
    user_subscriptions?: any[];
    workspaces?: any[];
    workspace_members?: any[];
    workspace_invitations?: any[];
    admin_settings?: any[];
    system_logs?: any[];
    email_logs?: any[];
    feature_flags?: any[];
    admin_ai_models?: any[];
    admin_ai_prompts?: any[];
    admin_templates?: any[];
    admin_themes?: any[];
    admin_languages?: any[];
    admin_translations?: any[];
    admin_plugins?: any[];
    plugin_hooks?: any[];
    user_plugin_settings?: any[];
    backup_history?: any[];
    backup_progress?: any[];
    backup_settings?: any[];
  };
  metadata: {
    totalUsers?: number;
    totalRecords: number;
    tableCounts: Record<string, number>;
  };
}

/**
 * Fetch all data for a specific user
 */
async function fetchUserData(userId: string): Promise<Partial<BackupData['database']>> {
  await ensureValidSession();
  
  const userData: Partial<BackupData['database']> = {};
  
  // Helper function to fetch data with error handling
  const fetchTable = async (tableName: string, filter?: { column: string; value: any }) => {
    try {
      let query = supabase.from(tableName).select('*');
      if (filter) {
        if (Array.isArray(filter.value) && filter.value.length > 0) {
          // Use .in() for array values
          query = query.in(filter.column, filter.value);
        } else if (!Array.isArray(filter.value)) {
          // Use .eq() for single values
          query = query.eq(filter.column, filter.value);
        } else {
          // Empty array, return empty
          return [];
        }
      }
      const { data, error } = await query;
      if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
        console.warn(`Error fetching ${tableName}:`, error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.warn(`Error fetching ${tableName}:`, error);
      return [];
    }
  };
  
  // Core User Data
  userData.profiles = await fetchTable('profiles', { column: 'id', value: userId });
  userData.user_roles = await fetchTable('user_roles', { column: 'user_id', value: userId });
  userData.user_settings = await fetchTable('user_settings', { column: 'user_id', value: userId });
  
  // Goals Module
  userData.goals = await fetchTable('goals', { column: 'user_id', value: userId });
  const goalIds = userData.goals?.map(g => g.id) || [];
  if (goalIds.length > 0) {
    userData.goal_milestones = await fetchTable('goal_milestones', { column: 'goal_id', value: goalIds });
    userData.goal_activities = await fetchTable('goal_activities', { column: 'goal_id', value: goalIds });
    userData.goal_collaborators = await fetchTable('goal_collaborators', { column: 'goal_id', value: goalIds });
    userData.goal_vision_items = await fetchTable('goal_vision_items', { column: 'goal_id', value: goalIds });
    userData.goal_progress_history = await fetchTable('goal_progress_history', { column: 'goal_id', value: goalIds });
  } else {
    userData.goal_milestones = [];
    userData.goal_activities = [];
    userData.goal_collaborators = [];
    userData.goal_vision_items = [];
    userData.goal_progress_history = [];
  }
  
  // Tasks Module
  userData.tasks = await fetchTable('tasks', { column: 'user_id', value: userId });
  const taskIds = userData.tasks?.map(t => t.id) || [];
  if (taskIds.length > 0) {
    userData.subtasks = await fetchTable('subtasks', { column: 'task_id', value: taskIds });
    userData.task_tags = await fetchTable('task_tags', { column: 'task_id', value: taskIds });
  } else {
    userData.subtasks = [];
    userData.task_tags = [];
  }
  
  // Habits Module
  userData.habits = await fetchTable('habits', { column: 'user_id', value: userId });
  const habitIds = userData.habits?.map(h => h.id) || [];
  if (habitIds.length > 0) {
    userData.habit_completions = await fetchTable('habit_completions', { column: 'habit_id', value: habitIds });
    userData.habit_challenges = await fetchTable('habit_challenges', { column: 'habit_id', value: habitIds });
    userData.habit_competitions = await fetchTable('habit_competitions', { column: 'habit_id', value: habitIds });
  } else {
    userData.habit_completions = [];
    userData.habit_challenges = [];
    userData.habit_competitions = [];
  }
  
  // Journal & Notes
  userData.journal_entries = await fetchTable('journal_entries', { column: 'user_id', value: userId });
  userData.journal_tags = await fetchTable('journal_tags', { column: 'user_id', value: userId });
  userData.notes = await fetchTable('notes', { column: 'user_id', value: userId });
  userData.note_tags = await fetchTable('note_tags', { column: 'user_id', value: userId });
  
  // Life Management
  userData.daily_intentions = await fetchTable('daily_intentions', { column: 'user_id', value: userId });
  userData.life_wheel_scores = await fetchTable('life_wheel_scores', { column: 'user_id', value: userId });
  userData.weekly_reviews = await fetchTable('weekly_reviews', { column: 'user_id', value: userId });
  userData.personal_values = await fetchTable('personal_values', { column: 'user_id', value: userId });
  userData.personal_traits = await fetchTable('personal_traits', { column: 'user_id', value: userId });
  userData.life_visions = await fetchTable('life_visions', { column: 'user_id', value: userId });
  userData.life_roles = await fetchTable('life_roles', { column: 'user_id', value: userId });
  userData.life_role_goals = await fetchTable('life_role_goals', { column: 'user_id', value: userId });
  userData.life_milestones = await fetchTable('life_milestones', { column: 'user_id', value: userId });
  
  // Pomodoro & Chat
  userData.pomodoro_sessions = await fetchTable('pomodoro_sessions', { column: 'user_id', value: userId });
  userData.saved_conversations = await fetchTable('saved_conversations', { column: 'user_id', value: userId });
  userData.chat_messages = await fetchTable('chat_messages', { column: 'user_id', value: userId });
  
  // Finance Module
  userData.finance_transactions = await fetchTable('finance_transactions', { column: 'user_id', value: userId });
  
  // Health Module
  userData.health_logs = await fetchTable('health_logs', { column: 'user_id', value: userId });
  
  // Learning Module
  userData.learning_courses = await fetchTable('learning_courses', { column: 'user_id', value: userId });
  userData.learning_books = await fetchTable('learning_books', { column: 'user_id', value: userId });
  
  // Relationships Module
  userData.relationships_contacts = await fetchTable('relationships_contacts', { column: 'user_id', value: userId });
  userData.relationships_interactions = await fetchTable('relationships_interactions', { column: 'user_id', value: userId });
  
  // Google Drive Tokens
  userData.google_drive_tokens = await fetchTable('google_drive_tokens', { column: 'user_id', value: userId });
  
  return userData;
}

/**
 * Fetch all data for all users (admin only)
 */
async function fetchAllUsersData(): Promise<Partial<BackupData['database']>> {
  await ensureValidSession();
  
  // Fetch all users
  const { data: profiles } = await supabase.from('profiles').select('id');
  if (!profiles || profiles.length === 0) {
    return {};
  }
  
  const userIds = profiles.map(p => p.id);
  const allData: Partial<BackupData['database']> = {};
  
  // Fetch data for all users
  for (const userId of userIds) {
    const userData = await fetchUserData(userId);
    
    // Merge data
    for (const [key, value] of Object.entries(userData)) {
      if (!allData[key as keyof typeof allData]) {
        allData[key as keyof typeof allData] = [];
      }
      if (Array.isArray(value) && Array.isArray(allData[key as keyof typeof allData])) {
        (allData[key as keyof typeof allData] as any[]).push(...value);
      }
    }
  }
  
  return allData;
}

/**
 * Fetch full database backup (admin only, includes system tables)
 */
async function fetchFullDatabaseBackup(): Promise<Partial<BackupData['database']>> {
  await ensureValidSession();
  
  const fullData = await fetchAllUsersData();
  
  // Helper function to fetch system tables
  const fetchSystemTable = async (tableName: string) => {
    try {
      const { data, error } = await supabase.from(tableName).select('*');
      if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
        console.warn(`Error fetching ${tableName}:`, error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.warn(`Error fetching ${tableName}:`, error);
      return [];
    }
  };
  
  // System & Admin Tables
  fullData.subscription_plans = await fetchSystemTable('subscription_plans');
  fullData.user_subscriptions = await fetchSystemTable('user_subscriptions');
  fullData.workspaces = await fetchSystemTable('workspaces');
  fullData.workspace_members = await fetchSystemTable('workspace_members');
  fullData.workspace_invitations = await fetchSystemTable('workspace_invitations');
  fullData.admin_settings = await fetchSystemTable('admin_settings');
  fullData.system_logs = await fetchSystemTable('system_logs');
  fullData.email_logs = await fetchSystemTable('email_logs');
  fullData.feature_flags = await fetchSystemTable('feature_flags');
  fullData.admin_ai_models = await fetchSystemTable('admin_ai_models');
  fullData.admin_ai_prompts = await fetchSystemTable('admin_ai_prompts');
  fullData.admin_templates = await fetchSystemTable('admin_templates');
  fullData.admin_themes = await fetchSystemTable('admin_themes');
  fullData.admin_languages = await fetchSystemTable('admin_languages');
  fullData.admin_translations = await fetchSystemTable('admin_translations');
  fullData.admin_plugins = await fetchSystemTable('admin_plugins');
  fullData.plugin_hooks = await fetchSystemTable('plugin_hooks');
  fullData.user_plugin_settings = await fetchSystemTable('user_plugin_settings');
  fullData.backup_history = await fetchSystemTable('backup_history');
  fullData.backup_progress = await fetchSystemTable('backup_progress');
  fullData.backup_settings = await fetchSystemTable('backup_settings');
  
  return fullData;
}

/**
 * Collect backup data based on scope
 */
export async function collectBackupData(
  scope: 'user' | 'all_users' | 'full_database',
  userId?: string,
  exportedBy: string = 'system'
): Promise<BackupData> {
  await ensureValidSession();
  
  let databaseData: Partial<BackupData['database']>;
  let totalUsers = 0;
  
  if (scope === 'user' && userId) {
    databaseData = await fetchUserData(userId);
    totalUsers = 1;
  } else if (scope === 'all_users') {
    databaseData = await fetchAllUsersData();
    const { data: profiles } = await supabase.from('profiles').select('id');
    totalUsers = profiles?.length || 0;
  } else {
    // full_database
    databaseData = await fetchFullDatabaseBackup();
    const { data: profiles } = await supabase.from('profiles').select('id');
    totalUsers = profiles?.length || 0;
  }
  
  // Calculate metadata
  const tableCounts: Record<string, number> = {};
  let totalRecords = 0;
  
  for (const [key, value] of Object.entries(databaseData)) {
    if (Array.isArray(value)) {
      const count = value.length;
      tableCounts[key] = count;
      totalRecords += count;
    }
  }
  
  const backupData: BackupData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    exportedBy,
    scope,
    targetUserId: userId,
    database: databaseData as BackupData['database'],
    metadata: {
      totalUsers,
      totalRecords,
      tableCounts,
    },
  };
  
  return backupData;
}

