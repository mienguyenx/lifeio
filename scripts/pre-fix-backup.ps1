# Pre-Fix Backup Script - Backup toàn bộ trước khi fix sync issues
# Tạo backup: Database + Code + Config

param(
    [string]$BackupDir = "./backups/pre-fix-backup-$(Get-Date -Format 'yyyyMMdd_HHmmss')"
)

$ErrorActionPreference = "Stop"

Write-Host "=========================================="
Write-Host "🔒 Pre-Fix Backup - LifeOS Application"
Write-Host "=========================================="
Write-Host "Backup Directory: $BackupDir"
Write-Host "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "=========================================="
Write-Host ""

# Tạo thư mục backup
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    Write-Host "✅ Created backup directory: $BackupDir"
}

$ManifestFile = Join-Path $BackupDir "backup-manifest.json"
$Manifest = @{
    timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
    backupType = "pre-fix-backup"
    description = "Backup trước khi fix sync issues trên PWA mobile"
    items = @()
}

# ==========================================
# 1. DATABASE BACKUP
# ==========================================
Write-Host ""
Write-Host "📦 Step 1: Database Backup..."
Write-Host "----------------------------------------"

$DbBackupDir = Join-Path $BackupDir "database"
if (-not (Test-Path $DbBackupDir)) {
    New-Item -ItemType Directory -Path $DbBackupDir -Force | Out-Null
}

# Kiểm tra container Supabase
$containerName = "supabase_db_Supabase"
$containerExists = docker ps -a --filter "name=$containerName" --format "{{.Names}}" | Select-String $containerName

if ($containerExists) {
    Write-Host "✅ Found Supabase container: $containerName"
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $dbBackupFile = Join-Path $DbBackupDir "lifeos_db_backup_$timestamp.sql"
    
    Write-Host "Creating database backup..."
    
    # Backup qua Docker exec
    docker exec $containerName pg_dump -U postgres postgres --clean --if-exists --no-owner --no-acl > $dbBackupFile
    
    if ($LASTEXITCODE -eq 0 -and (Test-Path $dbBackupFile)) {
        $dbSize = (Get-Item $dbBackupFile).Length / 1MB
        Write-Host "✅ Database backup completed: $dbBackupFile ($([math]::Round($dbSize, 2)) MB)"
        
        # Compress
        Write-Host "Compressing database backup..."
        Compress-Archive -Path $dbBackupFile -DestinationPath "$dbBackupFile.zip" -Force
        Remove-Item $dbBackupFile -Force
        $compressedSize = (Get-Item "$dbBackupFile.zip").Length / 1MB
        Write-Host "✅ Compressed: $dbBackupFile.zip ($([math]::Round($compressedSize, 2)) MB)"
        
        $Manifest.items += @{
            type = "database"
            file = "$dbBackupFile.zip"
            size = [math]::Round($compressedSize, 2)
            method = "docker_exec_pg_dump"
        }
    } else {
        Write-Host "⚠️  Database backup failed, trying alternative method..."
        
        # Alternative: Dùng script backup có sẵn
        $env:DB_HOST = "localhost"
        $env:DB_PORT = "54322"
        $env:DB_NAME = "postgres"
        $env:DB_USER = "postgres"
        $env:DB_PASSWORD = "postgres"
        $env:BACKUP_DIR = $DbBackupDir
        
        Push-Location $PSScriptRoot
        & ".\backup-postgresql-database.ps1"
        Pop-Location
        
        if ($LASTEXITCODE -eq 0) {
            $latestBackup = Get-ChildItem -Path $DbBackupDir -Filter "lifeos_backup_*.sql.zip" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
            if ($latestBackup) {
                Write-Host "✅ Database backup completed: $($latestBackup.FullName)"
                $Manifest.items += @{
                    type = "database"
                    file = $latestBackup.Name
                    size = [math]::Round($latestBackup.Length / 1MB, 2)
                    method = "backup_script"
                }
            }
        }
    }
} else {
    Write-Host "⚠️  Supabase container not found. Skipping database backup."
    Write-Host "   Container name expected: $containerName"
    Write-Host "   Run 'docker ps -a' to check available containers"
}

# ==========================================
# 2. CODE BACKUP (Git Commit)
# ==========================================
Write-Host ""
Write-Host "📝 Step 2: Code Backup (Git)..."
Write-Host "----------------------------------------"

$CodeBackupDir = Join-Path $BackupDir "code"
if (-not (Test-Path $CodeBackupDir)) {
    New-Item -ItemType Directory -Path $CodeBackupDir -Force | Out-Null
}

# Kiểm tra git
$gitExists = Get-Command git -ErrorAction SilentlyContinue
if ($gitExists) {
    Push-Location $PSScriptRoot
    
    # Kiểm tra có thay đổi chưa commit
    $gitStatus = git status --porcelain
    if ($gitStatus) {
        Write-Host "⚠️  Có thay đổi chưa commit. Tạo commit backup..."
        
        $commitMessage = "Backup: Pre-fix sync issues - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        git add .
        git commit -m $commitMessage
        
        if ($LASTEXITCODE -eq 0) {
            $commitHash = git rev-parse HEAD
            Write-Host "✅ Git commit created: $commitHash"
            $Manifest.items += @{
                type = "code"
                method = "git_commit"
                commitHash = $commitHash
                message = $commitMessage
            }
        }
    } else {
        $commitHash = git rev-parse HEAD
        Write-Host "✅ Current commit: $commitHash"
        $Manifest.items += @{
            type = "code"
            method = "git_commit"
            commitHash = $commitHash
            message = "No changes, using current commit"
        }
    }
    
    # Copy source code (trừ node_modules, dist, etc.)
    Write-Host "Copying source code..."
    $excludeDirs = @("node_modules", "dist", ".git", "backups", ".next", "build")
    
    # Copy các thư mục quan trọng
    $importantDirs = @("src", "public", "supabase")
    foreach ($dir in $importantDirs) {
        $srcPath = Join-Path $PSScriptRoot $dir
        if (Test-Path $srcPath) {
            $destPath = Join-Path $CodeBackupDir $dir
            Copy-Item -Path $srcPath -Destination $destPath -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
    
    # Copy các file config quan trọng
    $importantFiles = @("package.json", "vite.config.ts", "tsconfig.json", "docker-compose.yml", "Dockerfile")
    foreach ($file in $importantFiles) {
        $srcPath = Join-Path $PSScriptRoot $file
        if (Test-Path $srcPath) {
            Copy-Item -Path $srcPath -Destination $CodeBackupDir -Force -ErrorAction SilentlyContinue
        }
    }
    
    $codeSize = (Get-ChildItem -Path $CodeBackupDir -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "✅ Code backup completed: $CodeBackupDir ($([math]::Round($codeSize, 2)) MB)"
    
    Pop-Location
} else {
    Write-Host "⚠️  Git not found. Copying source files directly..."
    
    # Copy trực tiếp không dùng git
    $srcFiles = @("src", "public", "supabase", "*.json", "*.ts", "*.tsx", "*.md", "docker-compose.yml", "Dockerfile")
    foreach ($item in $srcFiles) {
        $srcPath = Join-Path $PSScriptRoot $item
        if (Test-Path $srcPath) {
            Copy-Item -Path $srcPath -Destination $CodeBackupDir -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
    
    $codeSize = (Get-ChildItem -Path $CodeBackupDir -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "✅ Code backup completed: $CodeBackupDir ($([math]::Round($codeSize, 2)) MB)"
    
    $Manifest.items += @{
        type = "code"
        method = "direct_copy"
        size = [math]::Round($codeSize, 2)
    }
}

# ==========================================
# 3. CONFIG BACKUP
# ==========================================
Write-Host ""
Write-Host "⚙️  Step 3: Config Backup..."
Write-Host "----------------------------------------"

$ConfigBackupDir = Join-Path $BackupDir "config"
if (-not (Test-Path $ConfigBackupDir)) {
    New-Item -ItemType Directory -Path $ConfigBackupDir -Force | Out-Null
}

$configFiles = @(
    "docker-compose.yml",
    "Dockerfile",
    "package.json",
    "vite.config.ts",
    "tsconfig.json",
    ".env.example",
    "env.example",
    "env.template"
)

foreach ($file in $configFiles) {
    $srcPath = Join-Path $PSScriptRoot $file
    if (Test-Path $srcPath) {
        Copy-Item -Path $srcPath -Destination $ConfigBackupDir -Force
        Write-Host "✅ Copied: $file"
        $Manifest.items += @{
            type = "config"
            file = $file
        }
    }
}

# Backup env files nếu có (không copy giá trị sensitive)
if (Test-Path ".env") {
    Write-Host "⚠️  .env file exists but not copied (contains sensitive data)"
    Write-Host "   Please backup manually if needed"
}

# ==========================================
# 4. CREATE MANIFEST
# ==========================================
Write-Host ""
Write-Host "📋 Step 4: Creating manifest..."
Write-Host "----------------------------------------"

$Manifest | ConvertTo-Json -Depth 10 | Out-File -FilePath $ManifestFile -Encoding UTF8
Write-Host "✅ Manifest created: $ManifestFile"

# ==========================================
# SUMMARY
# ==========================================
Write-Host ""
Write-Host "=========================================="
Write-Host "✅ Backup Completed Successfully!"
Write-Host "=========================================="
Write-Host "Backup Location: $BackupDir"
Write-Host "Manifest: $ManifestFile"
Write-Host ""
Write-Host "Backup Summary:"
$Manifest.items | Group-Object type | ForEach-Object {
    Write-Host "  - $($_.Name): $($_.Count) item(s)"
}
Write-Host ""
Write-Host "Next Steps:"
Write-Host "  1. Verify backup files"
Write-Host "  2. Proceed with sync fixes"
Write-Host "  3. Test on PWA mobile"
Write-Host "=========================================="

