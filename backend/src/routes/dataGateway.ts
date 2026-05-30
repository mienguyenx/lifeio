import type { FastifyPluginAsync } from 'fastify';
import { pool } from '../db';
import { getColumns, isValidColumn } from '../lib/columnCache';
import { getPolicy, type TablePolicy } from '../lib/dbRegistry';
import { getUserId } from '../lib/context';
import { badRequest, forbidden, notFound } from '../lib/errors';

type Op = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'is' | 'like' | 'ilike' | 'contains';

interface Filter {
  column: string;
  op: Op;
  value: unknown;
  negate?: boolean;
}

interface OrderBy {
  column: string;
  ascending?: boolean;
}

const OP_SQL: Record<Exclude<Op, 'in' | 'is' | 'contains'>, string> = {
  eq: '=',
  neq: '<>',
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
  like: 'LIKE',
  ilike: 'ILIKE',
};

function qi(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}

class ParamList {
  private values: unknown[] = [];
  add(value: unknown): string {
    this.values.push(value);
    return `$${this.values.length}`;
  }
  all(): unknown[] {
    return this.values;
  }
}

function requirePolicy(table: string): TablePolicy {
  const policy = getPolicy(table);
  if (!policy) throw notFound(`Table '${table}' is not available`);
  if (!getColumns(table)) throw notFound(`Table '${table}' is not available`);
  return policy;
}

function scopeClause(table: string, policy: TablePolicy, userId: string, params: ParamList): string {
  if (policy.ownerColumn) {
    return `${qi(table)}.${qi(policy.ownerColumn)} = ${params.add(userId)}`;
  }
  const p = policy.parent!;
  return `${qi(table)}.${qi(p.fk)} IN (SELECT ${qi(p.parentKey)} FROM ${qi(p.table)} WHERE ${qi(
    p.parentOwnerColumn,
  )} = ${params.add(userId)})`;
}

function buildFilter(table: string, f: Filter, params: ParamList): string {
  if (!isValidColumn(table, f.column)) throw badRequest(`Unknown column '${f.column}' on '${table}'`);
  const col = `${qi(table)}.${qi(f.column)}`;
  if (f.op === 'is') {
    const neg = f.negate ? 'IS NOT' : 'IS';
    if (f.value === null) return `${col} ${neg} NULL`;
    if (typeof f.value === 'boolean') return `${col} ${neg} ${f.value ? 'TRUE' : 'FALSE'}`;
    throw badRequest(`Unsupported 'is' value`);
  }
  if (f.op === 'in') {
    if (!Array.isArray(f.value)) throw badRequest(`'in' requires an array`);
    const clause = `${col} = ANY(${params.add(f.value)})`;
    return f.negate ? `NOT (${clause})` : clause;
  }
  if (f.op === 'contains') {
    const clause = `${col} @> ${params.add(f.value)}`;
    return f.negate ? `NOT (${clause})` : clause;
  }
  const clause = `${col} ${OP_SQL[f.op]} ${params.add(f.value)}`;
  return f.negate ? `NOT (${clause})` : clause;
}

function buildWhere(
  table: string,
  policy: TablePolicy,
  userId: string,
  filters: Filter[],
  params: ParamList,
): string {
  const clauses = [scopeClause(table, policy, userId, params)];
  for (const f of filters) clauses.push(buildFilter(table, f, params));
  return clauses.join(' AND ');
}

function validateSelect(table: string, select?: string[]): string {
  if (!select || select.length === 0 || select.includes('*')) return '*';
  for (const c of select) {
    if (!isValidColumn(table, c)) throw badRequest(`Unknown column '${c}' on '${table}'`);
  }
  return select.map((c) => `${qi(table)}.${qi(c)}`).join(', ');
}

function sanitizeRow(table: string, policy: TablePolicy, row: Record<string, unknown>, userId: string) {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (!isValidColumn(table, key)) throw badRequest(`Unknown column '${key}' on '${table}'`);
    cleaned[key] = value;
  }
  // Force ownership; never trust a client-supplied owner id.
  if (policy.ownerColumn) cleaned[policy.ownerColumn] = userId;
  return cleaned;
}

async function assertParentOwned(policy: TablePolicy, row: Record<string, unknown>, userId: string) {
  if (!policy.parent) return;
  const p = policy.parent;
  const fkValue = row[p.fk];
  if (fkValue === undefined || fkValue === null) throw badRequest(`Missing '${p.fk}'`);
  const { rowCount } = await pool.query(
    `SELECT 1 FROM ${qi(p.table)} WHERE ${qi(p.parentKey)} = $1 AND ${qi(p.parentOwnerColumn)} = $2`,
    [fkValue, userId],
  );
  if (!rowCount) throw forbidden(`Parent row not owned by user`);
}

const dataGatewayRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.authenticate);

  // SELECT
  fastify.post<{
    Body: {
      table: string;
      select?: string[];
      filters?: Filter[];
      order?: OrderBy[];
      limit?: number;
      offset?: number;
      single?: boolean;
      count?: boolean;
      head?: boolean;
    };
  }>(
    '/db/query',
    { schema: { tags: ['data-gateway'], summary: 'Generic scoped SELECT', security: [{ bearerAuth: [] }] } },
    async (request, reply) => {
      const userId = getUserId(request);
      const { table, filters = [], order = [], limit, offset, single, count, head } = request.body;
      const policy = requirePolicy(table);
      const params = new ParamList();
      const where = buildWhere(table, policy, userId, filters, params);

      if (count || head) {
        const countSql = `SELECT count(*)::int AS count FROM ${qi(table)} WHERE ${where}`;
        const res = await pool.query<{ count: number }>(countSql, params.all());
        const total = res.rows[0]?.count ?? 0;
        return reply.send({ data: head ? [] : undefined, count: total, error: null });
      }

      const cols = validateSelect(table, request.body.select);
      let sql = `SELECT ${cols} FROM ${qi(table)} WHERE ${where}`;
      for (const o of order) {
        if (!isValidColumn(table, o.column)) throw badRequest(`Unknown order column '${o.column}'`);
      }
      if (order.length > 0) {
        sql += ' ORDER BY ' + order.map((o) => `${qi(table)}.${qi(o.column)} ${o.ascending ? 'ASC' : 'DESC'}`).join(', ');
      }
      if (typeof limit === 'number') sql += ` LIMIT ${params.add(limit)}`;
      if (typeof offset === 'number') sql += ` OFFSET ${params.add(offset)}`;

      const res = await pool.query(sql, params.all());
      if (single) {
        if (res.rows.length !== 1) {
          return reply.send({ data: null, error: { message: 'Expected a single row', code: 'PGRST116' } });
        }
        return reply.send({ data: res.rows[0], error: null });
      }
      return reply.send({ data: res.rows, error: null });
    },
  );

  // INSERT / UPSERT
  fastify.post<{
    Body: {
      table: string;
      rows: Record<string, unknown>[];
      onConflict?: string[];
      returning?: boolean;
    };
  }>(
    '/db/insert',
    { schema: { tags: ['data-gateway'], summary: 'Generic scoped INSERT/UPSERT', security: [{ bearerAuth: [] }] } },
    async (request, reply) => {
      const userId = getUserId(request);
      const { table, onConflict, returning = true } = request.body;
      const rows = request.body.rows ?? [];
      const policy = requirePolicy(table);
      if (rows.length === 0) throw badRequest('No rows to insert');

      const cleaned = rows.map((r) => sanitizeRow(table, policy, r, userId));
      for (const r of cleaned) await assertParentOwned(policy, r, userId);

      const columns = Array.from(new Set(cleaned.flatMap((r) => Object.keys(r))));
      if (columns.length === 0) throw badRequest('No valid columns to insert');
      const params = new ParamList();
      const valuesSql = cleaned
        .map((r) => `(${columns.map((c) => (c in r ? params.add(r[c]) : 'DEFAULT')).join(', ')})`)
        .join(', ');

      let sql = `INSERT INTO ${qi(table)} (${columns.map(qi).join(', ')}) VALUES ${valuesSql}`;
      if (onConflict && onConflict.length > 0) {
        for (const c of onConflict) if (!isValidColumn(table, c)) throw badRequest(`Unknown conflict column '${c}'`);
        const updateCols = columns.filter((c) => !onConflict.includes(c));
        sql +=
          ` ON CONFLICT (${onConflict.map(qi).join(', ')}) DO ` +
          (updateCols.length > 0
            ? `UPDATE SET ${updateCols.map((c) => `${qi(c)} = EXCLUDED.${qi(c)}`).join(', ')}`
            : 'NOTHING');
      }
      if (returning) sql += ' RETURNING *';
      const res = await pool.query(sql, params.all());
      return reply.send({ data: returning ? res.rows : null, error: null });
    },
  );

  // UPDATE
  fastify.post<{
    Body: { table: string; set: Record<string, unknown>; filters?: Filter[]; returning?: boolean };
  }>(
    '/db/update',
    { schema: { tags: ['data-gateway'], summary: 'Generic scoped UPDATE', security: [{ bearerAuth: [] }] } },
    async (request, reply) => {
      const userId = getUserId(request);
      const { table, set, filters = [], returning = true } = request.body;
      const policy = requirePolicy(table);
      const entries = Object.entries(set ?? {});
      if (entries.length === 0) throw badRequest('No fields to update');
      for (const [k] of entries) {
        if (!isValidColumn(table, k)) throw badRequest(`Unknown column '${k}' on '${table}'`);
        if (policy.ownerColumn && k === policy.ownerColumn) throw badRequest('Cannot modify ownership column');
      }
      const params = new ParamList();
      const setSql = entries.map(([k, v]) => `${qi(k)} = ${params.add(v)}`).join(', ');
      const where = buildWhere(table, policy, userId, filters, params);
      let sql = `UPDATE ${qi(table)} SET ${setSql} WHERE ${where}`;
      if (returning) sql += ' RETURNING *';
      const res = await pool.query(sql, params.all());
      return reply.send({ data: returning ? res.rows : null, error: null });
    },
  );

  // DELETE
  fastify.post<{ Body: { table: string; filters?: Filter[]; returning?: boolean } }>(
    '/db/delete',
    { schema: { tags: ['data-gateway'], summary: 'Generic scoped DELETE', security: [{ bearerAuth: [] }] } },
    async (request, reply) => {
      const userId = getUserId(request);
      const { table, filters = [], returning = false } = request.body;
      const policy = requirePolicy(table);
      const params = new ParamList();
      const where = buildWhere(table, policy, userId, filters, params);
      let sql = `DELETE FROM ${qi(table)} WHERE ${where}`;
      if (returning) sql += ' RETURNING *';
      const res = await pool.query(sql, params.all());
      return reply.send({ data: returning ? res.rows : null, error: null });
    },
  );
};

export default dataGatewayRoutes;
