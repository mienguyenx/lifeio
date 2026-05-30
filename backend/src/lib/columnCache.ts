import { pool } from '../db';
import { SUPPORTED_TABLES } from './dbRegistry';

// Cache of valid column names per table, populated once from information_schema.
// Used to validate any client-supplied identifier (filter columns, select columns,
// insert/update keys) so the generic gateway can never reference arbitrary SQL.
const columnCache = new Map<string, Set<string>>();

export async function loadColumnCache(): Promise<void> {
  const { rows } = await pool.query<{ table_name: string; column_name: string }>(
    `SELECT table_name, column_name
       FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ANY($1)`,
    [SUPPORTED_TABLES],
  );
  columnCache.clear();
  for (const row of rows) {
    if (!columnCache.has(row.table_name)) columnCache.set(row.table_name, new Set());
    columnCache.get(row.table_name)!.add(row.column_name);
  }
}

export function getColumns(table: string): Set<string> | undefined {
  return columnCache.get(table);
}

export function isValidColumn(table: string, column: string): boolean {
  return columnCache.get(table)?.has(column) ?? false;
}
