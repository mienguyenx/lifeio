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
