# Script to check Supabase connection and rebuild container
Write-Host "=== Checking Supabase Connection and Rebuilding ===" -ForegroundColor Cyan

# Step 1: Check Supabase containers
Write-Host "`n1. Checking Supabase containers..." -ForegroundColor Yellow
$supabaseContainers = docker ps --filter "name=supabase" --format "{{.Names}}"
if ($supabaseContainers) {
    Write-Host "   Found Supabase containers:" -ForegroundColor Green
    $supabaseContainers | ForEach-Object { Write-Host "   - $_" -ForegroundColor Green }
} else {
    Write-Host "   ⚠️  No Supabase containers found. Make sure Supabase is running." -ForegroundColor Yellow
}

# Step 2: Test Supabase URL
Write-Host "`n2. Testing Supabase URL..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://supabase.hoanong.com/rest/v1/" -Method Head -UseBasicParsing -TimeoutSec 5
    Write-Host "   ✅ Supabase URL accessible (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Cannot access Supabase URL: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   💡 Check Cloudflare Tunnel configuration" -ForegroundColor Yellow
}

# Step 3: Check docker-compose configuration
Write-Host "`n3. Checking docker-compose configuration..." -ForegroundColor Yellow
$composeFile = "docker-compose.yml"
if (Test-Path $composeFile) {
    $supabaseUrl = Select-String -Path $composeFile -Pattern "VITE_SUPABASE_URL" | Select-Object -First 1
    if ($supabaseUrl) {
        Write-Host "   Found Supabase URL config:" -ForegroundColor Green
        Write-Host "   $($supabaseUrl.Line.Trim())" -ForegroundColor Gray
    }
} else {
    Write-Host "   ❌ docker-compose.yml not found!" -ForegroundColor Red
    exit 1
}

# Step 4: Rebuild container
Write-Host "`n4. Rebuilding container..." -ForegroundColor Yellow
Write-Host "   This may take a few minutes..." -ForegroundColor Gray

try {
    docker-compose build --no-cache lifeos-app
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Build successful!" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Build failed!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ❌ Build error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 5: Restart container
Write-Host "`n5. Restarting container..." -ForegroundColor Yellow
try {
    docker-compose up -d --force-recreate lifeos-app
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Container restarted!" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Restart failed!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ❌ Restart error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 6: Check container logs
Write-Host "`n6. Checking container logs (last 20 lines)..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
docker-compose logs --tail=20 lifeos-app

Write-Host "`n=== Complete ===" -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Open https://life.hoanong.com in browser" -ForegroundColor White
Write-Host "2. Open Developer Tools (F12) > Console" -ForegroundColor White
Write-Host "3. Run: await __LIFEOS_DEBUG__.checkConnection()" -ForegroundColor White
Write-Host "4. Check for any errors in console" -ForegroundColor White

