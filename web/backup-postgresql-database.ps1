# Backup PostgreSQL Database Script (PowerShell)
# This script creates a full PostgreSQL database backup

# Configuration
$DB_HOST = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
$DB_PORT = if ($env:DB_PORT) { $env:DB_PORT } else { "54322" }
$DB_NAME = if ($env:DB_NAME) { $env:DB_NAME } else { "postgres" }
$DB_USER = if ($env:DB_USER) { $env:DB_USER } else { "postgres" }
$DB_PASSWORD = if ($env:DB_PASSWORD) { $env:DB_PASSWORD } else { "postgres" }
$BACKUP_DIR = if ($env:BACKUP_DIR) { $env:BACKUP_DIR } else { "./backups" }
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_FILE = Join-Path $BACKUP_DIR "lifeos_backup_$TIMESTAMP.sql"

# Create backup directory if it doesn't exist
if (-not (Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
}

Write-Host "=========================================="
Write-Host "LifeOS Database Backup"
Write-Host "=========================================="
Write-Host "Database: $DB_NAME"
Write-Host "Host: ${DB_HOST}:${DB_PORT}"
Write-Host "Backup file: $BACKUP_FILE"
Write-Host "=========================================="

# Set PGPASSWORD environment variable
$env:PGPASSWORD = $DB_PASSWORD

# Check if pg_dump is available
$pgDumpPath = Get-Command pg_dump -ErrorAction SilentlyContinue
if (-not $pgDumpPath) {
    Write-Host "❌ pg_dump not found. Please install PostgreSQL client tools."
    Write-Host "Download from: https://www.postgresql.org/download/"
    exit 1
}

# Create full database backup
Write-Host "Creating backup..."
$backupProcess = Start-Process -FilePath "pg_dump" `
    -ArgumentList @(
        "-h", $DB_HOST,
        "-p", $DB_PORT,
        "-U", $DB_USER,
        "-d", $DB_NAME,
        "--clean",
        "--if-exists",
        "--create",
        "--format=plain",
        "--no-owner",
        "--no-acl",
        "--verbose"
    ) `
    -RedirectStandardOutput $BACKUP_FILE `
    -RedirectStandardError "$BACKUP_FILE.error" `
    -NoNewWindow `
    -Wait `
    -PassThru

# Check if backup was successful
if ($backupProcess.ExitCode -eq 0) {
    $backupSize = (Get-Item $BACKUP_FILE).Length / 1MB
    Write-Host "=========================================="
    Write-Host "✅ Backup completed successfully!"
    Write-Host "File: $BACKUP_FILE"
    Write-Host "Size: $([math]::Round($backupSize, 2)) MB"
    Write-Host "=========================================="
    
    # Compress backup (optional - requires 7-Zip or similar)
    Write-Host "Compressing backup..."
    try {
        Compress-Archive -Path $BACKUP_FILE -DestinationPath "$BACKUP_FILE.zip" -Force
        $compressedSize = (Get-Item "$BACKUP_FILE.zip").Length / 1MB
        Write-Host "Compressed file: $BACKUP_FILE.zip"
        Write-Host "Compressed size: $([math]::Round($compressedSize, 2)) MB"
        Remove-Item $BACKUP_FILE -Force
    } catch {
        Write-Host "⚠️  Compression failed. Backup file saved without compression."
    }
} else {
    Write-Host "=========================================="
    Write-Host "❌ Backup failed!"
    Write-Host "Error output:"
    Get-Content "$BACKUP_FILE.error"
    Write-Host "=========================================="
    Remove-Item "$BACKUP_FILE.error" -ErrorAction SilentlyContinue
    exit 1
}

# Clean up old backups (keep last 7 days)
Write-Host "Cleaning up old backups (keeping last 7 days)..."
Get-ChildItem -Path $BACKUP_DIR -Filter "lifeos_backup_*.sql.zip" | 
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } | 
    Remove-Item -Force
Write-Host "Done!"

