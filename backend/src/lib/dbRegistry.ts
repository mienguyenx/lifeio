// Registry describing which tables the generic data gateway may serve and how each
// is scoped to the authenticated user. This replaces Supabase Row-Level Security.
//
// - ownerColumn: the column that holds the owning user's id (rows are filtered by it
//   and it is force-set on insert).
// - parent: for child tables that have no direct user column, ownership is derived by
//   joining to a parent table through `fk` -> parent.`parentKey`, where the parent is
//   itself owned via `parentOwnerColumn`.

export interface ParentScope {
  table: string;
  fk: string; // column on the child table
  parentKey: string; // referenced column on the parent table (usually "id")
  parentOwnerColumn: string;
}

export interface TablePolicy {
  ownerColumn?: string;
  parent?: ParentScope;
  /**
   * Global (not per-user) table, e.g. admin configuration. `read` decides who may
   * SELECT; writes are always admin-only.
   */
  global?: { read: 'authenticated' | 'admin' };
  /** Admins bypass owner/parent scoping (read + write any row), like the old "Admins can manage" RLS. */
  adminAll?: boolean;
  /** Non-admins may only read their own rows; all writes require admin (e.g. roles, subscriptions). */
  writeAdminOnly?: boolean;
}

const own = (extra: Partial<TablePolicy> = {}): TablePolicy => ({ ownerColumn: 'user_id', ...extra });
const childOf = (table: string, fk: string, extra: Partial<TablePolicy> = {}, parentOwnerColumn = 'user_id'): TablePolicy => ({
  parent: { table, fk, parentKey: 'id', parentOwnerColumn },
  ...extra,
});
const globalRead: TablePolicy = { global: { read: 'authenticated' } };
const adminOnly: TablePolicy = { global: { read: 'admin' } };

export const TABLE_REGISTRY: Record<string, TablePolicy> = {
  // Core
  profiles: { ownerColumn: 'id', adminAll: true },
  user_roles: own({ adminAll: true, writeAdminOnly: true }),
  user_settings: own({ adminAll: true }),
  user_notifications: own(),
  tasks: own(),
  task_tags: own(),
  subtasks: childOf('tasks', 'task_id'),
  habits: own(),
  habit_completions: childOf('habits', 'habit_id'),
  goals: own(),
  goal_milestones: childOf('goals', 'goal_id'),
  journal_entries: own(),
  journal_tags: own(),
  notes: own(),
  note_tags: own(),

  // Personal modules
  chat_messages: own(),
  daily_intentions: own(),
  daily_checkins: own(),
  pomodoro_sessions: own(),
  weekly_reviews: own(),
  monthly_reviews: own(),
  yearly_reviews: own(),
  yearly_plannings: own(),
  life_wheel_scores: own(),
  life_visions: own(),
  activity_log: own({ writeAdminOnly: true }),
  life_visions_history: own(),
  life_milestones: own(),
  life_milestones_history: own(),
  life_roles: own(),
  life_roles_history: own(),
  life_role_goals: childOf('life_roles', 'role_id'),
  personal_values: own(),
  personal_values_history: own(),
  personal_traits: own(),
  personal_traits_history: own(),
  finance_transactions: own(),
  health_logs: own(),
  learning_books: own(),
  learning_courses: own(),
  relationships_contacts: own(),
  relationships_interactions: own(),
  google_drive_tokens: own(),
  ai_memories: own({ adminAll: true }),

  // Backups
  backup_history: own({ adminAll: true }),
  backup_progress: childOf('backup_history', 'backup_history_id', { adminAll: true }),
  backup_settings: globalRead,

  // Subscriptions & workspaces
  subscription_plans: globalRead,
  user_subscriptions: own({ adminAll: true, writeAdminOnly: true }),
  workspaces: { ownerColumn: 'owner_id', adminAll: true },
  workspace_members: childOf('workspaces', 'workspace_id', { adminAll: true }, 'owner_id'),
  workspace_invitations: childOf('workspaces', 'workspace_id', { adminAll: true }, 'owner_id'),

  // Admin configuration (readable by every signed-in user, writable by admins)
  admin_ai_models: globalRead,
  admin_ai_prompts: globalRead,
  admin_ai_providers: globalRead,
  admin_languages: globalRead,
  admin_plugins: globalRead,
  admin_templates: globalRead,
  admin_themes: globalRead,
  admin_translations: globalRead,
  feature_flags: globalRead,

  // Admin-only (may contain secrets / other users' data)
  admin_settings: adminOnly,
  api_keys: adminOnly,
  system_logs: adminOnly,
  email_logs: adminOnly,
};

export function getPolicy(table: string): TablePolicy | undefined {
  return Object.prototype.hasOwnProperty.call(TABLE_REGISTRY, table) ? TABLE_REGISTRY[table] : undefined;
}

export const SUPPORTED_TABLES = Object.keys(TABLE_REGISTRY);

// Tables the frontend may still query but that are intentionally not served
// (legacy fallbacks). Reads return empty result sets and writes are no-ops so the
// local-first frontend degrades gracefully instead of erroring.
export const DEFERRED_TABLES: ReadonlySet<string> = new Set<string>([
  // Old Supabase-only table name; the app falls back to it only if admin_translations is missing.
  'translations',
]);

export function isDeferredTable(table: string): boolean {
  return DEFERRED_TABLES.has(table);
}
