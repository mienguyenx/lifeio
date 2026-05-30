# Script test AI Coach Edge Function endpoint

Write-Host "🧪 Test AI Coach Edge Function Endpoint" -ForegroundColor Cyan
Write-Host ""

# Test URLs
$testUrls = @(
    @{
        Name = "Local (localhost:54321)";
        Url = "http://localhost:54321/functions/v1/ai-coach";
        Description = "Direct access to Supabase Local"
    },
    @{
        Name = "Same-Origin Proxy (life.hoanong.com/supabase)";
        Url = "https://life.hoanong.com/supabase/functions/v1/ai-coach";
        Description = "Via same-origin proxy (used by app)"
    },
    @{
        Name = "Public Subdomain (supabase.hoanong.com)";
        Url = "https://supabase.hoanong.com/functions/v1/ai-coach";
        Description = "Via public subdomain"
    }
)

foreach ($test in $testUrls) {
    Write-Host "📍 Testing: $($test.Name)" -ForegroundColor Yellow
    Write-Host "   URL: $($test.Url)" -ForegroundColor Gray
    Write-Host "   Description: $($test.Description)" -ForegroundColor Gray
    
    try {
        # Test OPTIONS request (CORS preflight)
        $response = Invoke-WebRequest -Uri $test.Url -Method OPTIONS -TimeoutSec 10 -ErrorAction Stop
        
        Write-Host "   ✅ OPTIONS: Status $($response.StatusCode)" -ForegroundColor Green
        
        # Check CORS headers
        if ($response.Headers['Access-Control-Allow-Origin']) {
            Write-Host "   ✅ CORS: $($response.Headers['Access-Control-Allow-Origin'])" -ForegroundColor Green
        }
        
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode) {
            if ($statusCode -eq 404) {
                Write-Host "   ❌ Status 404: Function not found" -ForegroundColor Red
                Write-Host "      → Cần deploy Edge Function" -ForegroundColor Yellow
            } elseif ($statusCode -eq 401 -or $statusCode -eq 403) {
                Write-Host "   ⚠️  Status $statusCode: Auth required (OK for OPTIONS)" -ForegroundColor Yellow
            } else {
                Write-Host "   ⚠️  Status $statusCode" -ForegroundColor Yellow
            }
        } else {
            Write-Host "   ❌ Không thể kết nối: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    Write-Host ""
}

Write-Host "📝 Kết luận:" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Nếu tất cả endpoints trả về 200/204: Edge Function đã deploy và hoạt động" -ForegroundColor Green
Write-Host "❌ Nếu có 404: Cần deploy Edge Function" -ForegroundColor Red
Write-Host "⚠️  Nếu có lỗi kết nối: Kiểm tra network/proxy" -ForegroundColor Yellow
Write-Host ""

