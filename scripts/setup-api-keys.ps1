# Script to setup API Keys table in Supabase
# Chạy script này để tạo table api_keys trong database

Write-Host "`n=== SETUP API KEYS TABLE ===" -ForegroundColor Green

# Check if Supabase is running
$supabaseRunning = docker ps --filter "name=supabase" --format "{{.Names}}" | Select-String "supabase"

if (-not $supabaseRunning) {
    Write-Host "`n❌ Supabase không đang chạy!" -ForegroundColor Red
    Write-Host "Vui lòng chạy: supabase start" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n📝 Đang tạo table api_keys..." -ForegroundColor Cyan

# Read SQL file
$sqlFile = Join-Path $PSScriptRoot "..\database-api-keys.sql"
if (-not (Test-Path $sqlFile)) {
    Write-Host "❌ Không tìm thấy file: $sqlFile" -ForegroundColor Red
    exit 1
}

$sqlContent = Get-Content $sqlFile -Raw -Encoding UTF8

# Execute SQL
try {
    docker exec -i supabase_db_Supabase psql -U postgres -d postgres -c $sqlContent
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Đã tạo table api_keys thành công!" -ForegroundColor Green
        Write-Host "`n📝 Bạn có thể:" -ForegroundColor Cyan
        Write-Host "   1. Mở Admin Panel -> API Keys để quản lý" -ForegroundColor White
        Write-Host "   2. Thêm API keys cho Gemini và Perplexity" -ForegroundColor White
    } else {
        Write-Host "`n❌ Có lỗi khi chạy SQL script" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "`n❌ Lỗi: $_" -ForegroundColor Red
    Write-Host "`n💡 Thử chạy thủ công:" -ForegroundColor Yellow
    Write-Host "   1. Mở Supabase Studio: http://localhost:54323" -ForegroundColor White
    Write-Host "   2. Vào SQL Editor" -ForegroundColor White
    Write-Host "   3. Copy nội dung file database-api-keys.sql và chạy" -ForegroundColor White
    exit 1
}

