# Script rebuild Docker container cho LifeOS (PowerShell)

Write-Host "🔄 Đang rebuild Docker image..." -ForegroundColor Yellow
docker-compose build --no-cache lifeos-app

if ($LASTEXITCODE -eq 0) {
    Write-Host "🛑 Đang dừng container cũ..." -ForegroundColor Yellow
    docker-compose stop lifeos-app
    
    Write-Host "🚀 Đang khởi động container mới..." -ForegroundColor Yellow
    docker-compose up -d lifeos-app
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Hoàn thành! Container đã được rebuild và restart." -ForegroundColor Green
        Write-Host "📝 Kiểm tra logs: docker-compose logs -f lifeos-app" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Lỗi khi khởi động container!" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Lỗi khi build image!" -ForegroundColor Red
}

