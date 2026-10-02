import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, types } from 'pg';
import { env } from '../env';
import * as schema from './schema';

// Return SQL DATE columns as plain 'YYYY-MM-DD' strings (like PostgREST/Supabase did)
// instead of JS Dates serialised as UTC timestamps; the frontend compares them as strings.
types.setTypeParser(1082, (value: string) => value);

export const pool = new Pool({ connectionString: env.DATABASE_URL, ...(process.env.PG_POOL_MAX ? { max: Number(process.env.PG_POOL_MAX) } : {}) });

export const db = drizzle(pool, { schema });

export type Database = typeof db;
export { schema };
