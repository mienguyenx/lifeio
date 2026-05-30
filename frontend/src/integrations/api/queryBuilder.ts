// Minimal PostgREST-compatible query builder that maps the subset of the Supabase
// JS client used by this app onto the LifeOS data gateway (`/db/*`). It is a
// thenable: awaiting it (or calling .then) executes the accumulated query.

import { apiFetch, HttpError, type ApiError } from './httpClient';

type Op = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'is' | 'like' | 'ilike' | 'contains';

interface Filter {
  column: string;
  op: Op;
  value: unknown;
  negate?: boolean;
}

interface OrderBy {
  column: string;
  ascending: boolean;
}

export interface PostgrestResult<T> {
  data: T | null;
  error: ApiError | null;
  count?: number | null;
  status?: number;
}

type Method = 'select' | 'insert' | 'update' | 'delete';

function splitList(value?: string): string[] | undefined {
  if (!value) return undefined;
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export class QueryBuilder<T = unknown> implements PromiseLike<PostgrestResult<T>> {
  private method: Method = 'select';
  private selectColumns?: string[];
  private returningEnabled = false;
  private filters: Filter[] = [];
  private orders: OrderBy[] = [];
  private limitValue?: number;
  private offsetValue?: number;
  private rowMode: 'many' | 'single' | 'maybe' = 'many';
  private countMode = false;
  private headMode = false;
  private rows?: Record<string, unknown>[];
  private setValues?: Record<string, unknown>;
  private onConflict?: string[];

  constructor(private readonly table: string) {}

  select(columns?: string, opts?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }): this {
    if (this.method === 'select') {
      this.selectColumns = splitList(columns);
    } else {
      this.returningEnabled = true;
    }
    if (opts?.count) this.countMode = true;
    if (opts?.head) this.headMode = true;
    return this;
  }

  insert(rows: Record<string, unknown> | Record<string, unknown>[]): this {
    this.method = 'insert';
    this.rows = Array.isArray(rows) ? rows : [rows];
    return this;
  }

  upsert(
    rows: Record<string, unknown> | Record<string, unknown>[],
    opts?: { onConflict?: string },
  ): this {
    this.method = 'insert';
    this.rows = Array.isArray(rows) ? rows : [rows];
    this.onConflict = splitList(opts?.onConflict) ?? ['id'];
    return this;
  }

  update(values: Record<string, unknown>): this {
    this.method = 'update';
    this.setValues = values;
    return this;
  }

  delete(): this {
    this.method = 'delete';
    return this;
  }

  private addFilter(column: string, op: Op, value: unknown, negate = false): this {
    this.filters.push({ column, op, value, negate });
    return this;
  }

  eq(column: string, value: unknown): this {
    return this.addFilter(column, 'eq', value);
  }
  neq(column: string, value: unknown): this {
    return this.addFilter(column, 'neq', value);
  }
  gt(column: string, value: unknown): this {
    return this.addFilter(column, 'gt', value);
  }
  gte(column: string, value: unknown): this {
    return this.addFilter(column, 'gte', value);
  }
  lt(column: string, value: unknown): this {
    return this.addFilter(column, 'lt', value);
  }
  lte(column: string, value: unknown): this {
    return this.addFilter(column, 'lte', value);
  }
  like(column: string, value: unknown): this {
    return this.addFilter(column, 'like', value);
  }
  ilike(column: string, value: unknown): this {
    return this.addFilter(column, 'ilike', value);
  }
  in(column: string, value: unknown[]): this {
    return this.addFilter(column, 'in', value);
  }
  is(column: string, value: unknown): this {
    return this.addFilter(column, 'is', value);
  }
  contains(column: string, value: unknown): this {
    return this.addFilter(column, 'contains', value);
  }
  not(column: string, op: Op, value: unknown): this {
    return this.addFilter(column, op, value, true);
  }
  match(query: Record<string, unknown>): this {
    for (const [column, value] of Object.entries(query)) this.addFilter(column, 'eq', value);
    return this;
  }

  order(column: string, opts?: { ascending?: boolean }): this {
    this.orders.push({ column, ascending: opts?.ascending ?? true });
    return this;
  }
  limit(n: number): this {
    this.limitValue = n;
    return this;
  }
  range(from: number, to: number): this {
    this.offsetValue = from;
    this.limitValue = to - from + 1;
    return this;
  }

  single(): this {
    this.rowMode = 'single';
    return this;
  }
  maybeSingle(): this {
    this.rowMode = 'maybe';
    return this;
  }

  private async run(): Promise<PostgrestResult<T>> {
    try {
      if (this.method === 'select') {
        const res = await apiFetch<{ data: Record<string, unknown>[] | null; count?: number }>('/db/query', {
          method: 'POST',
          body: {
            table: this.table,
            select: this.selectColumns,
            filters: this.filters,
            order: this.orders,
            limit: this.limitValue,
            offset: this.offsetValue,
            count: this.countMode,
            head: this.headMode,
          },
        });
        if (this.headMode) {
          return { data: null, error: null, count: res.count ?? 0, status: 200 };
        }
        return this.shape(res.data ?? [], res.count);
      }

      if (this.method === 'insert') {
        const res = await apiFetch<{ data: Record<string, unknown>[] | null }>('/db/insert', {
          method: 'POST',
          body: { table: this.table, rows: this.rows, onConflict: this.onConflict, returning: this.returningEnabled },
        });
        return this.shape(res.data ?? [], null);
      }

      if (this.method === 'update') {
        const res = await apiFetch<{ data: Record<string, unknown>[] | null }>('/db/update', {
          method: 'POST',
          body: {
            table: this.table,
            set: this.setValues,
            filters: this.filters,
            returning: this.returningEnabled,
          },
        });
        return this.shape(res.data ?? [], null);
      }

      // delete
      const res = await apiFetch<{ data: Record<string, unknown>[] | null }>('/db/delete', {
        method: 'POST',
        body: { table: this.table, filters: this.filters, returning: this.returningEnabled },
      });
      return this.shape(res.data ?? [], null);
    } catch (err) {
      const error: ApiError =
        err instanceof HttpError
          ? { message: err.message, code: err.code, status: err.status, details: err.details }
          : { message: err instanceof Error ? err.message : 'Unknown error' };
      return { data: null, error, count: null, status: error.status };
    }
  }

  private shape(rows: Record<string, unknown>[], count?: number | null): PostgrestResult<T> {
    if (this.rowMode === 'single') {
      if (rows.length !== 1) {
        return {
          data: null,
          error: { message: 'JSON object requested, multiple (or no) rows returned', code: 'PGRST116' },
          count: count ?? null,
        };
      }
      return { data: rows[0] as T, error: null, count: count ?? null, status: 200 };
    }
    if (this.rowMode === 'maybe') {
      return { data: (rows[0] ?? null) as T, error: null, count: count ?? null, status: 200 };
    }
    return { data: rows as unknown as T, error: null, count: count ?? null, status: 200 };
  }

  then<TResult1 = PostgrestResult<T>, TResult2 = never>(
    onfulfilled?: ((value: PostgrestResult<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.run().then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null,
  ): Promise<PostgrestResult<T> | TResult> {
    return this.run().catch(onrejected);
  }

  finally(onfinally?: (() => void) | null): Promise<PostgrestResult<T>> {
    return this.run().finally(onfinally);
  }
}
