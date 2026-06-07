#!/usr/bin/env bash
#
# Migrate data from an old Supabase pg_dump into the new LifeOS Postgres schema.
#
# The old dump is a full Supabase dump (auth/storage/_realtime schemas, RLS
# policies, supabase roles, etc). The new backend uses a plain Postgres schema
# created by its own Drizzle migrations. This script:
#
#   1. Loads the dump into a throwaway STAGING database (errors for
#      supabase-only roles/extensions are expected and ignored).
#   2. Migrates auth.users -> public.users (id, email, password hash, verified).
#   3. Copies every business table that exists in BOTH the dump's public schema
#      and the new schema, intersecting on common column names, into TARGET.
#
# Copies are idempotent (ON CONFLICT DO NOTHING) and FK checks are disabled
# during load (session_replication_role=replica) so table order doesn't matter.
#
# Requirements: psql (client) reachable to both databases. The TARGET database
# must already have the new schema (start the backend once, or run
# `npm run migrate:prod`, before running this).
#
# Usage:
#   TARGET_DATABASE_URL=postgres://user:pass@host:5432/lifeos \
#   DUMP_FILE=db/backups/db_backup_YYYYMMDD_HHMMSS.sql \
#   [STAGING_DATABASE_URL=postgres://user:pass@host:5432/lifeos_staging] \
#   scripts/migrate-supabase-dump.sh
#
# If STAGING_DATABASE_URL is omitted, a database named
# `<target>_migration_staging` is created on the same server as TARGET and
# dropped at the end (set KEEP_STAGING=1 to keep it for inspection).

set -euo pipefail

DUMP_FILE="${DUMP_FILE:-}"
TARGET_DATABASE_URL="${TARGET_DATABASE_URL:-}"
STAGING_DATABASE_URL="${STAGING_DATABASE_URL:-}"
KEEP_STAGING="${KEEP_STAGING:-0}"

if [[ -z "$DUMP_FILE" || -z "$TARGET_DATABASE_URL" ]]; then
  echo "ERROR: DUMP_FILE and TARGET_DATABASE_URL are required." >&2
  echo "See the header of this script for usage." >&2
  exit 1
fi
if [[ ! -f "$DUMP_FILE" ]]; then
  echo "ERROR: dump file not found: $DUMP_FILE" >&2
  exit 1
fi
if ! command -v psql >/dev/null 2>&1; then
  echo "ERROR: psql not found on PATH." >&2
  exit 1
fi

# Tables created/managed by the backend that must NOT be auto-copied from the
# dump's public schema (handled specially or have no source data).
SKIP_TABLES=" users refresh_tokens password_reset_tokens agent_tokens "

WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT

# --- Set up staging database -------------------------------------------------
base="${TARGET_DATABASE_URL%/*}"
staging_db=""
CREATED_STAGING=0
if [[ -z "$STAGING_DATABASE_URL" ]]; then
  dbname="${TARGET_DATABASE_URL##*/}"; dbname="${dbname%%\?*}"
  staging_db="${dbname}_migration_staging"
  STAGING_DATABASE_URL="${base}/${staging_db}"
  echo ">> Creating staging database: ${staging_db}"
  psql "${base}/postgres" -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS ${staging_db};" >/dev/null
  psql "${base}/postgres" -v ON_ERROR_STOP=1 -c "CREATE DATABASE ${staging_db};" >/dev/null
  CREATED_STAGING=1
fi

drop_staging() {
  if [[ "$CREATED_STAGING" == "1" && "$KEEP_STAGING" != "1" ]]; then
    echo ">> Dropping staging database"
    psql "${base}/postgres" -c "DROP DATABASE IF EXISTS ${staging_db};" >/dev/null 2>&1 || true
  fi
}
trap 'drop_staging; rm -rf "$WORKDIR"' EXIT

echo ">> Loading dump into staging (supabase-only role/extension errors are expected)"
psql "$STAGING_DATABASE_URL" -v ON_ERROR_STOP=0 -q -f "$DUMP_FILE" \
  >/dev/null 2>"$WORKDIR/dump_load.log" || true
echo "   load warnings: $(wc -l < "$WORKDIR/dump_load.log") lines (saved to $WORKDIR/dump_load.log)"

# Helper: list "column_name|udt_name" of a table, one per line sorted. Including
# the underlying type (udt_name) lets us copy only columns whose name AND type
# match between the old and new schema (e.g. skip tasks.tags which changed from
# text[] to uuid[]).
cols_of() {  # $1=db_url  $2=schema  $3=table
  psql "$1" -At -c \
    "SELECT column_name || '|' || udt_name FROM information_schema.columns \
     WHERE table_schema='$2' AND table_name='$3' ORDER BY column_name;"
}

# --- 1) Migrate auth.users -> public.users ----------------------------------
echo ">> Migrating auth.users -> public.users"
psql "$STAGING_DATABASE_URL" -v ON_ERROR_STOP=1 -c "\copy (\
  SELECT id, email, COALESCE(encrypted_password, 'migrated-no-password') AS password_hash, \
         (email_confirmed_at IS NOT NULL) AS email_verified, \
         COALESCE(created_at, now()) AS created_at, COALESCE(updated_at, now()) AS updated_at \
  FROM auth.users WHERE deleted_at IS NULL AND email IS NOT NULL) \
  TO '$WORKDIR/users.csv' WITH (FORMAT csv)"

psql "$TARGET_DATABASE_URL" -v ON_ERROR_STOP=1 <<SQL
SET session_replication_role = replica;
CREATE TEMP TABLE _stg_users (
  id uuid, email text, password_hash text, email_verified boolean,
  created_at timestamptz, updated_at timestamptz
);
\copy _stg_users FROM '$WORKDIR/users.csv' WITH (FORMAT csv)
INSERT INTO public.users (id, email, password_hash, email_verified, created_at, updated_at)
SELECT id, email, password_hash, email_verified, created_at, updated_at FROM _stg_users
ON CONFLICT (id) DO NOTHING;
SQL
users_n=$(psql "$TARGET_DATABASE_URL" -At -c "SELECT count(*) FROM public.users;")
echo "   public.users now has ${users_n} rows"

# --- 2) Copy business tables present in both public schemas ------------------
echo ">> Copying business tables (intersecting columns)"
mapfile -t TABLES < <(psql "$STAGING_DATABASE_URL" -At -c \
  "SELECT t.table_name FROM information_schema.tables t \
   WHERE t.table_schema='public' AND t.table_type='BASE TABLE' \
   AND EXISTS (SELECT 1 FROM information_schema.tables x \
               WHERE x.table_schema='public' AND x.table_name=t.table_name) \
   ORDER BY t.table_name;")

for tbl in "${TABLES[@]}"; do
  [[ " $SKIP_TABLES " == *" $tbl "* ]] && continue
  # Skip tables that don't exist in the target schema.
  exists_target=$(psql "$TARGET_DATABASE_URL" -At -c \
    "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='$tbl' LIMIT 1;")
  [[ "$exists_target" != "1" ]] && { echo "   - skip $tbl (not in new schema)"; continue; }

  # Intersect on column name AND type, then keep just the names.
  cols_of "$STAGING_DATABASE_URL" public "$tbl" > "$WORKDIR/src_cols.txt"
  cols_of "$TARGET_DATABASE_URL" public "$tbl" > "$WORKDIR/dst_cols.txt"
  common=$(comm -12 "$WORKDIR/src_cols.txt" "$WORKDIR/dst_cols.txt" | cut -d'|' -f1 | paste -sd, -)
  [[ -z "$common" ]] && { echo "   - skip $tbl (no common columns)"; continue; }

  psql "$STAGING_DATABASE_URL" -v ON_ERROR_STOP=1 -c \
    "\copy (SELECT $common FROM public.\"$tbl\") TO '$WORKDIR/$tbl.csv' WITH (FORMAT csv)"

  psql "$TARGET_DATABASE_URL" -v ON_ERROR_STOP=1 <<SQL >/dev/null
SET session_replication_role = replica;
CREATE TEMP TABLE _stg AS SELECT $common FROM public."$tbl" WITH NO DATA;
\copy _stg ($common) FROM '$WORKDIR/$tbl.csv' WITH (FORMAT csv)
INSERT INTO public."$tbl" ($common) SELECT $common FROM _stg ON CONFLICT DO NOTHING;
DROP TABLE _stg;
SQL
  n=$(psql "$TARGET_DATABASE_URL" -At -c "SELECT count(*) FROM public.\"$tbl\";")
  echo "   - $tbl: copied ($common) -> ${n} rows total"
done

echo ""
echo ">> Migration complete."
echo "   NOTE: Supabase stored bcrypt password hashes; the new backend verifies"
echo "   argon2. Migrated hashes are preserved in users.password_hash but logins"
echo "   will fail until each user resets their password (or the backend is"
echo "   extended to verify bcrypt hashes). Trigger password resets accordingly."
