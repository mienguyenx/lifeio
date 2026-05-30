# Script để lấy Supabase Local anon key
Write-Host "Đang lấy Supabase Local anon key..." -ForegroundColor Cyan

# Thử lấy từ API với key mặc định
$defaultKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

try {
    $response = Invoke-WebRequest -Uri "http://localhost:54321/rest/v1/" -Headers @{"apikey"=$defaultKey} -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ Key mặc định hoạt động: $defaultKey" -ForegroundColor Green
    $defaultKey
} catch {
    Write-Host "⚠️ Key mặc định không hoạt động, đang thử cách khác..." -ForegroundColor Yellow
    
    # Thử lấy từ config
    if (Test-Path "supabase\.env") {
        $envContent = Get-Content "supabase\.env"
        $anonKey = $envContent | Select-String "ANON_KEY" | ForEach-Object { $_.Line -replace '.*ANON_KEY=(.+)', '$1' }
        if ($anonKey) {
            Write-Host "✅ Tìm thấy key trong supabase/.env" -ForegroundColor Green
            $anonKey
        }
    }
    
    Write-Host "💡 Chạy: supabase status để xem anon key" -ForegroundColor Yellow
}

