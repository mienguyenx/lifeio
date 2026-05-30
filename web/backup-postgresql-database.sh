#!/bin/bash
# Backup PostgreSQL Database Script
# This script creates a full PostgreSQL database backup

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-54322}"
DB_NAME="${DB_NAME:-postgres}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/lifeos_backup_${TIMESTAMP}.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "=========================================="
echo "LifeOS Database Backup"
echo "=========================================="
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "Backup file: $BACKUP_FILE"
echo "=========================================="

# Set PGPASSWORD environment variable
export PGPASSWORD="$DB_PASSWORD"

# Create full database backup
echo "Creating backup..."
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  --clean \
  --if-exists \
  --create \
  --format=plain \
  --no-owner \
  --no-acl \
  --verbose \
  > "$BACKUP_FILE" 2>&1

# Check if backup was successful
if [ $? -eq 0 ]; then
  BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "=========================================="
  echo "✅ Backup completed successfully!"
  echo "File: $BACKUP_FILE"
  echo "Size: $BACKUP_SIZE"
  echo "=========================================="
  
  # Compress backup (optional)
  echo "Compressing backup..."
  gzip "$BACKUP_FILE"
  COMPRESSED_FILE="${BACKUP_FILE}.gz"
  COMPRESSED_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
  echo "Compressed file: $COMPRESSED_FILE"
  echo "Compressed size: $COMPRESSED_SIZE"
else
  echo "=========================================="
  echo "❌ Backup failed!"
  echo "Check the error messages above."
  echo "=========================================="
  exit 1
fi

# Clean up old backups (keep last 7 days)
echo "Cleaning up old backups (keeping last 7 days)..."
find "$BACKUP_DIR" -name "lifeos_backup_*.sql.gz" -mtime +7 -delete
echo "Done!"

