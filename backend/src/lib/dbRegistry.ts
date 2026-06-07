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
}

export const TABLE_REGISTRY: Record<string, TablePolicy> = {
  profiles: { ownerColumn: 'id' },
  user_roles: { ownerColumn: 'user_id' },
  user_settings: { ownerColumn: 'user_id' },
  tasks: { ownerColumn: 'user_id' },
  task_tags: { ownerColumn: 'user_id' },
  subtasks: { parent: { table: 'tasks', fk: 'task_id', parentKey: 'id', parentOwnerColumn: 'user_id' } },
  habits: { ownerColumn: 'user_id' },
  habit_completions: {
    parent: { table: 'habits', fk: 'habit_id', parentKey: 'id', parentOwnerColumn: 'user_id' },
  },
  goals: { ownerColumn: 'user_id' },
  goal_milestones: {
    parent: { table: 'goals', fk: 'goal_id', parentKey: 'id', parentOwnerColumn: 'user_id' },
  },
  journal_entries: { ownerColumn: 'user_id' },
  journal_tags: { ownerColumn: 'user_id' },
  notes: { ownerColumn: 'user_id' },
  note_tags: { ownerColumn: 'user_id' },
};

export function getPolicy(table: string): TablePolicy | undefined {
  return Object.prototype.hasOwnProperty.call(TABLE_REGISTRY, table) ? TABLE_REGISTRY[table] : undefined;
}

export const SUPPORTED_TABLES = Object.keys(TABLE_REGISTRY);

// Tables the frontend still queries but that have not been ported to the new
// backend yet (admin, workspaces, area modules, reviews, health/finance/learning/
// relationships, history/audit tables, ...). Until each is ported into
// TABLE_REGISTRY, the gateway treats reads as empty result sets and writes as
// no-ops so the local-first frontend degrades gracefully instead of erroring on
// every background sync. Move a table out of this set and into TABLE_REGISTRY
// when its schema + scoping are implemented.
export const DEFERRED_TABLES: ReadonlySet<string> = new Set([
  'admin_ai_models',
  'admin_ai_prompts',
  'admin_ai_providers',
  'admin_languages',
  'admin_plugins',
  'admin_settings',
  'admin_templates',
  'admin_themes',
  'ai_memories',
  'api_keys',
  'backup_history',
  'backup_progress',
  'backup_settings',
  'chat_messages',
  'daily_intentions',
  'feature_flags',
  'finance_transactions',
  'google_drive_tokens',
  'health_logs',
  'learning_books',
  'learning_courses',
  'life_milestones',
  'life_milestones_history',
  'life_role_goals',
  'life_roles',
  'life_roles_history',
  'life_visions',
  'life_visions_history',
  'life_wheel_scores',
  'monthly_reviews',
  'personal_traits',
  'personal_traits_history',
  'personal_values',
  'personal_values_history',
  'pomodoro_sessions',
  'relationships_contacts',
  'relationships_interactions',
  'subscription_plans',
  'system_logs',
  'user_subscriptions',
  'weekly_reviews',
  'workspace_invitations',
  'workspace_members',
  'workspaces',
  'yearly_plannings',
  'yearly_reviews',
]);

export function isDeferredTable(table: string): boolean {
  return DEFERRED_TABLES.has(table);
}
