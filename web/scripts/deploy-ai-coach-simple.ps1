# Script đơn giản để deploy AI Coach Edge Function
# Yêu cầu: Supabase CLI đã được cài đặt và đăng nhập

Write-Host "🚀 Deploy AI Coach Edge Function" -ForegroundColor Cyan
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

# Kiểm tra file Edge Function
$functionPath = Join-Path $projectPath "supabase\functions\ai-coach\index.ts"
if (-not (Test-Path $functionPath)) {
    Write-Host "❌ Không tìm thấy Edge Function tại: $functionPath" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Tìm thấy Edge Function" -ForegroundColor Green
Write-Host ""

# Deploy
Write-Host "🚀 Đang deploy AI Coach Edge Function..." -ForegroundColor Cyan
Write-Host ""

try {
    supabase functions deploy ai-coach --no-verify-jwt
    
    Write-Host ""
    Write-Host "✅ Deploy thành công!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Kiểm tra:" -ForegroundColor Cyan
    Write-Host "1. Mở ứng dụng và thử sử dụng AI Coach" -ForegroundColor White
    Write-Host "2. Kiểm tra logs: supabase functions logs ai-coach" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host ""
    Write-Host "❌ Deploy thất bại!" -ForegroundColor Red
    Write-Host "Lỗi: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Gợi ý:" -ForegroundColor Yellow
    Write-Host "1. Đảm bảo đã đăng nhập: supabase login" -ForegroundColor White
    Write-Host "2. Đảm bảo đã link project: supabase link --project-ref <your-project-ref>" -ForegroundColor White
    Write-Host "3. Kiểm tra API keys đã được cấu hình trong Admin Panel" -ForegroundColor White
    Write-Host ""
    exit 1
}

