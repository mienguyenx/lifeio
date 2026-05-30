# Script deploy AI Coach Edge Function lên Supabase Local
# Yêu cầu: Supabase Local đang chạy

Write-Host "🚀 Deploy AI Coach Edge Function lên Supabase Local" -ForegroundColor Cyan
Write-Host ""

# Kiểm tra Supabase CLI
$supabaseCmd = Get-Command supabase -ErrorAction SilentlyContinue
if (-not $supabaseCmd) {
    Write-Host "❌ Supabase CLI chưa được cài đặt!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Cài đặt Supabase CLI:" -ForegroundColor Yellow
    Write-Host "  npm install -g supabase" -ForegroundColor White
    Write-Host "  hoặc" -ForegroundColor White
    Write-Host "  scoop install supabase" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Chuyển đến thư mục project
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectPath = Join-Path $scriptPath ".."
Set-Location $projectPath

Write-Host "📁 Thư mục project: $projectPath" -ForegroundColor Yellow
Write-Host ""

# Kiểm tra Supabase Local đang chạy
Write-Host "🔍 Kiểm tra Supabase Local..." -ForegroundColor Cyan
$supabaseRunning = docker ps --filter "name=supabase_kong" --format "{{.Names}}" | Select-String "supabase_kong"
if (-not $supabaseRunning) {
    Write-Host "❌ Supabase Local chưa chạy!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Khởi động Supabase Local:" -ForegroundColor Yellow
    Write-Host "  supabase start" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "✅ Supabase Local đang chạy" -ForegroundColor Green
Write-Host ""

# Kiểm tra file Edge Function
$functionPath = Join-Path $projectPath "supabase\functions\ai-coach\index.ts"
if (-not (Test-Path $functionPath)) {
    Write-Host "❌ Không tìm thấy Edge Function tại: $functionPath" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Tìm thấy Edge Function" -ForegroundColor Green
Write-Host ""

# Kiểm tra link với local project
Write-Host "🔗 Kiểm tra link với Supabase Local..." -ForegroundColor Cyan
try {
    $linkStatus = supabase status 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Chưa link với Supabase Local. Đang link..." -ForegroundColor Yellow
        Write-Host "   (Nếu có lỗi, chạy: supabase link --project-ref local)" -ForegroundColor Gray
    } else {
        Write-Host "✅ Đã link với Supabase Local" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Không thể kiểm tra link status" -ForegroundColor Yellow
}

Write-Host ""

# Deploy Edge Function
Write-Host "🚀 Đang deploy AI Coach Edge Function..." -ForegroundColor Cyan
Write-Host ""

try {
    # Deploy với --no-verify-jwt để tránh lỗi JWT verification trong local
    supabase functions deploy ai-coach --no-verify-jwt --project-ref local
    
    Write-Host ""
    Write-Host "✅ Deploy thành công!" -ForegroundColor Green
    Write-Host ""
    
    # Hiển thị thông tin truy cập
    Write-Host "📝 Thông tin truy cập Edge Function:" -ForegroundColor Cyan
    Write-Host ""
    
    # Lấy Supabase URL từ environment
    $supabaseUrl = "https://life.hoanong.com/supabase"
    if ($env:VITE_SUPABASE_URL) {
        $supabaseUrl = $env:VITE_SUPABASE_URL
    }
    
    Write-Host "   Local URL: http://localhost:54321/functions/v1/ai-coach" -ForegroundColor White
    Write-Host "   Public URL: $supabaseUrl/functions/v1/ai-coach" -ForegroundColor White
    Write-Host "   Studio URL: https://supabase.hoanong.com/functions/v1/ai-coach" -ForegroundColor White
    Write-Host ""
    
    Write-Host "📝 Kiểm tra:" -ForegroundColor Cyan
    Write-Host "1. Mở ứng dụng tại https://life.hoanong.com" -ForegroundColor White
    Write-Host "2. Mở AI Coach và thử gửi tin nhắn" -ForegroundColor White
    Write-Host "3. Kiểm tra logs: supabase functions logs ai-coach" -ForegroundColor White
    Write-Host ""
    
    # Test Edge Function
    Write-Host "🧪 Test Edge Function..." -ForegroundColor Cyan
    try {
        $testUrl = "http://localhost:54321/functions/v1/ai-coach"
        $testResponse = Invoke-WebRequest -Uri $testUrl -Method OPTIONS -ErrorAction SilentlyContinue
        if ($testResponse) {
            Write-Host "✅ Edge Function có thể truy cập tại localhost" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️  Không thể test Edge Function (có thể cần đợi vài giây để khởi động)" -ForegroundColor Yellow
    }
    
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "❌ Deploy thất bại!" -ForegroundColor Red
    Write-Host "Lỗi: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Gợi ý:" -ForegroundColor Yellow
    Write-Host "1. Đảm bảo Supabase Local đang chạy: supabase start" -ForegroundColor White
    Write-Host "2. Kiểm tra link: supabase link --project-ref local" -ForegroundColor White
    Write-Host "3. Kiểm tra API keys đã được cấu hình trong Admin Panel" -ForegroundColor White
    Write-Host "4. Xem logs: supabase functions logs ai-coach" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "✨ Hoàn tất!" -ForegroundColor Green

