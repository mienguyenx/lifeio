# Script để fix login issue
Write-Host "=== Fix Login Issue ===" -ForegroundColor Cyan

# Option 1: Revert về Lovable Cloud Supabase (Đơn giản nhất)
Write-Host "`nOption 1: Revert về Lovable Cloud Supabase" -ForegroundColor Yellow
Write-Host "   Ưu điểm: Không cần network config, hoạt động ngay" -ForegroundColor Green
Write-Host "   Nhược điểm: Cần migrate data nếu có" -ForegroundColor Yellow

# Option 2: Fix network với IP address
Write-Host "`nOption 2: Fix network với IP address" -ForegroundColor Yellow
Write-Host "   Ưu điểm: Giữ data local" -ForegroundColor Green
Write-Host "   Nhược điểm: Cần update Cloudflare Tunnel config" -ForegroundColor Yellow

Write-Host "`nChọn option:" -ForegroundColor Cyan
Write-Host "1. Revert về Lovable Cloud (khuyến nghị)" -ForegroundColor White
Write-Host "2. Fix network với IP address" -ForegroundColor White
$choice = Read-Host "Nhập lựa chọn (1 hoặc 2)"

if ($choice -eq "1") {
    Write-Host "`n=== Reverting về Lovable Cloud ===" -ForegroundColor Cyan
    
    # Backup docker-compose.yml
    Copy-Item "docker-compose.yml" "docker-compose.yml.backup" -Force
    Write-Host "✅ Đã backup docker-compose.yml" -ForegroundColor Green
    
    # Comment out VITE_SUPABASE_URL và VITE_SUPABASE_PUBLISHABLE_KEY
    $content = Get-Content "docker-compose.yml" -Raw
    $content = $content -replace "VITE_SUPABASE_URL:", "# VITE_SUPABASE_URL:"
    $content = $content -replace "VITE_SUPABASE_PUBLISHABLE_KEY:", "# VITE_SUPABASE_PUBLISHABLE_KEY:"
    Set-Content "docker-compose.yml" -Value $content -NoNewline
    
    Write-Host "✅ Đã comment out Supabase env vars" -ForegroundColor Green
    Write-Host "`nTiếp theo:" -ForegroundColor Yellow
    Write-Host "1. Rebuild container: docker-compose build --no-cache lifeos-app" -ForegroundColor White
    Write-Host "2. Restart: docker-compose up -d --force-recreate lifeos-app" -ForegroundColor White
    Write-Host "3. Test login tại https://life.hoanong.com" -ForegroundColor White
    
} elseif ($choice -eq "2") {
    Write-Host "`n=== Fix Network với IP Address ===" -ForegroundColor Cyan
    
    # Lấy IP của Supabase Kong
    Write-Host "`nĐang lấy IP của Supabase Kong..." -ForegroundColor Yellow
    $ipOutput = docker inspect supabase_kong_Supabase 2>&1 | Select-String -Pattern '"IPAddress": "172' -Context 0
    if ($ipOutput) {
        $ip = ($ipOutput -split '"')[3]
        Write-Host "✅ IP Address: $ip" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Không tìm thấy IP, sử dụng IP mặc định: 172.23.0.5" -ForegroundColor Yellow
        $ip = "172.23.0.5"
    }
    
    Write-Host "`n📋 Hướng dẫn update Cloudflare Tunnel:" -ForegroundColor Yellow
    Write-Host "1. Vào: https://dash.cloudflare.com" -ForegroundColor White
    Write-Host "2. Zero Trust > Networks > Tunnels" -ForegroundColor White
    Write-Host "3. Chọn tunnel của bạn" -ForegroundColor White
    Write-Host "4. Configure > Public Hostname > supabase.hoanong.com" -ForegroundColor White
    Write-Host "5. Thay đổi Service:" -ForegroundColor White
    Write-Host "   Từ: http://supabase_kong_Supabase:8000" -ForegroundColor Gray
    Write-Host "   Thành: http://$ip`:8000" -ForegroundColor Green
    Write-Host "6. Thêm HTTP Headers:" -ForegroundColor White
    Write-Host "   Access-Control-Allow-Origin: https://life.hoanong.com" -ForegroundColor Gray
    Write-Host "   Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE, PATCH" -ForegroundColor Gray
    Write-Host "   Access-Control-Allow-Headers: Content-Type, Authorization, apikey, x-client-info" -ForegroundColor Gray
    Write-Host "   Access-Control-Allow-Credentials: true" -ForegroundColor Gray
    Write-Host "7. Save và đợi 30-60 giây" -ForegroundColor White
    Write-Host "8. Test login tại https://life.hoanong.com" -ForegroundColor White
    
} else {
    Write-Host "❌ Lựa chọn không hợp lệ" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Complete ===" -ForegroundColor Cyan



