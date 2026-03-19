# Script kiem tra tien do trien khai AI Coach
# Kiem tra tat ca cac thanh phan can thiet

Write-Host "Kiem Tra Tien Do Trien Khai AI Coach" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$projectPath = "D:\LifeOSS\remix-of-remix-of-lifeos-mobile-v3.copy"
$checks = @{
    "Edge Function Code" = $false
    "Database Migration" = $false
    "Supabase CLI" = $false
    "Supabase Login" = $false
    "Edge Function Deployed" = $false
    "API Keys Configured" = $false
}

# 1. Kiem tra Edge Function code
Write-Host "1. Kiem tra Edge Function code..." -ForegroundColor Yellow
$edgeFunctionPath = Join-Path $projectPath "supabase\functions\ai-coach\index.ts"
if (Test-Path $edgeFunctionPath) {
    $content = Get-Content $edgeFunctionPath -Raw
    if ($content -match "get_api_key_for_provider" -and $content -match "increment_api_key_usage") {
        Write-Host "   [OK] Edge Function code co ho tro API key rotation" -ForegroundColor Green
        $checks["Edge Function Code"] = $true
    } else {
        Write-Host "   [WARN] Edge Function code thieu tinh nang API key rotation" -ForegroundColor Yellow
    }
} else {
    Write-Host "   [ERROR] Khong tim thay Edge Function code" -ForegroundColor Red
}

# 2. Kiem tra Database Migration
Write-Host ""
Write-Host "2. Kiem tra Database Migration..." -ForegroundColor Yellow
$migrationPath = Join-Path $projectPath "supabase\migrations\20251229000001_add_api_key_rotation_rpc.sql"
if (Test-Path $migrationPath) {
    Write-Host "   [OK] Migration file ton tai" -ForegroundColor Green
    $checks["Database Migration"] = $true
} else {
    Write-Host "   [WARN] Migration file khong ton tai" -ForegroundColor Yellow
}

# 3. Kiem tra Supabase CLI
Write-Host ""
Write-Host "3. Kiem tra Supabase CLI..." -ForegroundColor Yellow
try {
    $supabaseVersion = supabase --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [OK] Supabase CLI da duoc cai dat: $supabaseVersion" -ForegroundColor Green
        $checks["Supabase CLI"] = $true
        
        # 4. Kiem tra dang nhap Supabase
        Write-Host ""
        Write-Host "4. Kiem tra dang nhap Supabase..." -ForegroundColor Yellow
        try {
            supabase projects list 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   [OK] Da dang nhap Supabase" -ForegroundColor Green
                $checks["Supabase Login"] = $true
                
                # 5. Kiem tra Edge Function da deploy chua
                Write-Host ""
                Write-Host "5. Kiem tra Edge Function da deploy..." -ForegroundColor Yellow
                $functions = supabase functions list 2>&1
                if ($functions -match "ai-coach") {
                    Write-Host "   [OK] Edge Function 'ai-coach' da duoc deploy" -ForegroundColor Green
                    $checks["Edge Function Deployed"] = $true
                } else {
                    Write-Host "   [WARN] Edge Function 'ai-coach' chua duoc deploy" -ForegroundColor Yellow
                    Write-Host "      Chay: supabase functions deploy ai-coach" -ForegroundColor White
                }
            } else {
                Write-Host "   [WARN] Chua dang nhap Supabase" -ForegroundColor Yellow
                Write-Host "      Chay: supabase login" -ForegroundColor White
            }
        } catch {
            Write-Host "   [WARN] Khong the kiem tra dang nhap" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "   [ERROR] Supabase CLI chua duoc cai dat" -ForegroundColor Red
    Write-Host "      Cai dat:" -ForegroundColor White
    Write-Host "      - WinGet: winget install Supabase.CLI" -ForegroundColor White
    Write-Host "      - Hoac tai tu: https://github.com/supabase/cli/releases" -ForegroundColor White
}

# 6. Kiem tra API Keys
Write-Host ""
Write-Host "6. Kiem tra API Keys..." -ForegroundColor Yellow
Write-Host "   [INFO] Can kiem tra trong Admin Panel > API Keys" -ForegroundColor White
Write-Host "   Hoac kiem tra trong database table 'api_keys'" -ForegroundColor White

# Kiem tra file SQL setup
$apiKeysSetupPath = Join-Path $projectPath "database-api-keys.sql"
if (Test-Path $apiKeysSetupPath) {
    Write-Host "   [OK] File setup API keys ton tai" -ForegroundColor Green
} else {
    Write-Host "   [WARN] File setup API keys khong ton tai" -ForegroundColor Yellow
}

# Tong ket
Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "TONG KET" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$completed = ($checks.Values | Where-Object { $_ -eq $true }).Count
$total = $checks.Count

foreach ($check in $checks.GetEnumerator()) {
    $status = if ($check.Value) { "[OK]" } else { "[X]" }
    Write-Host "   $status $($check.Key)" -ForegroundColor $(if ($check.Value) { "Green" } else { "Red" })
}

Write-Host ""
$percent = [math]::Round($completed/$total*100)
Write-Host "Tien do: $completed/$total ($percent%)" -ForegroundColor $(if ($completed -eq $total) { "Green" } else { "Yellow" })

Write-Host ""
Write-Host "CAC BUOC TIEP THEO:" -ForegroundColor Cyan

if (-not $checks["Supabase CLI"]) {
    Write-Host "   1. Cai dat Supabase CLI:" -ForegroundColor Yellow
    Write-Host "      winget install Supabase.CLI" -ForegroundColor White
}

if (-not $checks["Supabase Login"]) {
    Write-Host "   2. Dang nhap Supabase:" -ForegroundColor Yellow
    Write-Host "      supabase login" -ForegroundColor White
}

if ($checks["Supabase CLI"] -and $checks["Supabase Login"] -and -not $checks["Edge Function Deployed"]) {
    Write-Host "   3. Deploy Edge Function:" -ForegroundColor Yellow
    Write-Host "      cd `"$projectPath`"" -ForegroundColor White
    Write-Host "      supabase functions deploy ai-coach" -ForegroundColor White
}

if (-not $checks["Database Migration"]) {
    Write-Host "   4. Chay Database Migration:" -ForegroundColor Yellow
    Write-Host "      supabase db push" -ForegroundColor White
    Write-Host "      Hoac chay file: supabase\migrations\20251229000001_add_api_key_rotation_rpc.sql" -ForegroundColor White
}

Write-Host "   5. Cau hinh API Keys trong Admin Panel:" -ForegroundColor Yellow
Write-Host "      - Vao Admin Panel > API Keys" -ForegroundColor White
Write-Host "      - Them API keys cho Gemini va/hoac Perplexity" -ForegroundColor White
Write-Host "      - Dat mot key lam Primary" -ForegroundColor White

Write-Host ""
Write-Host "Hoan tat kiem tra!" -ForegroundColor Green
