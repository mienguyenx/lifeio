# Script kiểm tra deployment AI Coach Edge Function trên Supabase Local

Write-Host "🔍 Kiểm Tra Deployment AI Coach Edge Function" -ForegroundColor Cyan
Write-Host ""

# Chuyển đến thư mục project
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectPath = Join-Path $scriptPath ".."
Set-Location $projectPath

# 1. Kiểm tra Supabase Local đang chạy
Write-Host "1️⃣  Kiểm tra Supabase Local..." -ForegroundColor Yellow
$supabaseKong = docker ps --filter "name=supabase_kong" --format "{{.Names}}" | Select-String "supabase_kong"
$supabaseEdge = docker ps --filter "name=supabase_edge" --format "{{.Names}}" | Select-String "supabase_edge"

if ($supabaseKong -and $supabaseEdge) {
    Write-Host "   ✅ Supabase Local đang chạy" -ForegroundColor Green
    Write-Host "      - Kong Gateway: $supabaseKong" -ForegroundColor Gray
    Write-Host "      - Edge Runtime: $supabaseEdge" -ForegroundColor Gray
} else {
    Write-Host "   ❌ Supabase Local chưa chạy!" -ForegroundColor Red
    Write-Host "      Chạy: supabase start" -ForegroundColor White
    exit 1
}

Write-Host ""

# 2. Kiểm tra Edge Function file
Write-Host "2️⃣  Kiểm tra Edge Function file..." -ForegroundColor Yellow
$functionPath = Join-Path $projectPath "supabase\functions\ai-coach\index.ts"
if (Test-Path $functionPath) {
    Write-Host "   ✅ Tìm thấy: $functionPath" -ForegroundColor Green
    $fileSize = (Get-Item $functionPath).Length
    Write-Host "      Size: $fileSize bytes" -ForegroundColor Gray
} else {
    Write-Host "   ❌ Không tìm thấy Edge Function!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 3. Kiểm tra Supabase CLI
Write-Host "3️⃣  Kiểm tra Supabase CLI..." -ForegroundColor Yellow
$supabaseCmd = Get-Command supabase -ErrorAction SilentlyContinue
if ($supabaseCmd) {
    $version = supabase --version 2>&1
    Write-Host "   ✅ Supabase CLI: $version" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Supabase CLI chưa được cài đặt" -ForegroundColor Yellow
    Write-Host "      Cài đặt: npm install -g supabase" -ForegroundColor White
}

Write-Host ""

# 4. Kiểm tra link với local project
Write-Host "4️⃣  Kiểm tra link với Supabase Local..." -ForegroundColor Yellow
try {
    $status = supabase status 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Đã link với Supabase Local" -ForegroundColor Green
        # Parse status để lấy thông tin
        $statusLines = $status -split "`n"
        foreach ($line in $statusLines) {
            if ($line -match "API URL|Studio URL|Edge Functions URL") {
                Write-Host "      $line" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host "   ⚠️  Chưa link với Supabase Local" -ForegroundColor Yellow
        Write-Host "      Chạy: supabase link --project-ref local" -ForegroundColor White
    }
} catch {
    Write-Host "   ⚠️  Không thể kiểm tra link status" -ForegroundColor Yellow
}

Write-Host ""

# 5. Test Edge Function endpoint
Write-Host "5️⃣  Test Edge Function endpoint..." -ForegroundColor Yellow

$testUrls = @(
    @{ Name = "Local (localhost)"; Url = "http://localhost:54321/functions/v1/ai-coach" },
    @{ Name = "Local (127.0.0.1)"; Url = "http://127.0.0.1:54321/functions/v1/ai-coach" }
)

foreach ($test in $testUrls) {
    try {
        $response = Invoke-WebRequest -Uri $test.Url -Method OPTIONS -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 204) {
            Write-Host "   ✅ $($test.Name): OK" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  $($test.Name): Status $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   ❌ $($test.Name): Không thể kết nối" -ForegroundColor Red
        Write-Host "      Lỗi: $($_.Exception.Message)" -ForegroundColor Gray
    }
}

Write-Host ""

# 6. Kiểm tra environment variables
Write-Host "6️⃣  Kiểm tra Environment Variables..." -ForegroundColor Yellow
$supabaseUrl = $env:VITE_SUPABASE_URL
if ($supabaseUrl) {
    Write-Host "   ✅ VITE_SUPABASE_URL: $supabaseUrl" -ForegroundColor Green
    $edgeFunctionUrl = "$supabaseUrl/functions/v1/ai-coach"
    Write-Host "      Edge Function URL: $edgeFunctionUrl" -ForegroundColor Gray
} else {
    Write-Host "   ⚠️  VITE_SUPABASE_URL chưa được set" -ForegroundColor Yellow
}

Write-Host ""

# 7. Tóm tắt
Write-Host "📊 Tóm tắt:" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Để deploy Edge Function:" -ForegroundColor Green
Write-Host "   .\scripts\deploy-ai-coach-local.ps1" -ForegroundColor White
Write-Host ""
Write-Host "✅ Để test Edge Function:" -ForegroundColor Green
Write-Host "   curl -X OPTIONS http://localhost:54321/functions/v1/ai-coach" -ForegroundColor White
Write-Host ""
Write-Host "✅ Để xem logs:" -ForegroundColor Green
Write-Host "   supabase functions logs ai-coach" -ForegroundColor White
Write-Host ""

