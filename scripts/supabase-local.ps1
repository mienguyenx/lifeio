# Script để quản lý Supabase Local
# Sử dụng: .\scripts\supabase-local.ps1 <command>
# Commands: start, stop, status, reset, logs

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("start", "stop", "status", "reset", "logs", "studio")]
    [string]$Command
)

$ErrorActionPreference = "Stop"

function CheckSupabaseCLI {
    if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
        Write-Host "❌ Supabase CLI chưa được cài đặt!" -ForegroundColor Red
        Write-Host "📦 Cài đặt qua npm: npm install -g supabase" -ForegroundColor Yellow
        Write-Host "   Hoặc qua Scoop: scoop install supabase" -ForegroundColor Yellow
        exit 1
    }
}

function CheckDocker {
    try {
        docker ps | Out-Null
    } catch {
        Write-Host "❌ Docker chưa chạy hoặc chưa được cài đặt!" -ForegroundColor Red
        Write-Host "📦 Cài đặt Docker Desktop: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
        exit 1
    }
}

CheckSupabaseCLI
CheckDocker

switch ($Command) {
    "start" {
        Write-Host "🚀 Đang khởi động Supabase Local..." -ForegroundColor Green
        supabase start
        Write-Host "`n✅ Supabase đã khởi động!" -ForegroundColor Green
        Write-Host "📝 Lấy thông tin kết nối:" -ForegroundColor Yellow
        supabase status
        Write-Host "`n💡 Truy cập Studio: http://localhost:54323" -ForegroundColor Cyan
    }
    "stop" {
        Write-Host "🛑 Đang dừng Supabase Local..." -ForegroundColor Yellow
        supabase stop
        Write-Host "✅ Đã dừng Supabase" -ForegroundColor Green
    }
    "status" {
        Write-Host "📊 Trạng thái Supabase:" -ForegroundColor Cyan
        supabase status
    }
    "reset" {
        Write-Host "🔄 Đang reset database..." -ForegroundColor Yellow
        Write-Host "⚠️  Cảnh báo: Tất cả data sẽ bị xóa!" -ForegroundColor Red
        $confirm = Read-Host "Bạn có chắc chắn? (yes/no)"
        if ($confirm -eq "yes") {
            supabase db reset
            Write-Host "✅ Database đã được reset" -ForegroundColor Green
        } else {
            Write-Host "❌ Đã hủy" -ForegroundColor Yellow
        }
    }
    "logs" {
        Write-Host "📋 Logs Supabase:" -ForegroundColor Cyan
        supabase logs
    }
    "studio" {
        Write-Host "🎨 Đang mở Supabase Studio..." -ForegroundColor Green
        $status = supabase status --output json 2>$null
        if ($status) {
            Start-Process "http://localhost:54323"
        } else {
            Write-Host "❌ Supabase chưa được khởi động. Chạy: .\scripts\supabase-local.ps1 start" -ForegroundColor Red
        }
    }
}

