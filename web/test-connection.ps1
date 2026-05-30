# Script test ket noi LifeOS
Write-Host "Kiem tra ket noi LifeOS..." -ForegroundColor Cyan

# 1. Kiem tra containers
Write-Host "`n1. Kiem tra containers:" -ForegroundColor Yellow
docker ps --filter "name=lifeos" --format "table {{.Names}}`t{{.Status}}"

# 2. Kiem tra network
Write-Host "`n2. Kiem tra network:" -ForegroundColor Yellow
docker network inspect affine_traefik-network --format '{{range .Containers}}{{.Name}} - {{.IPv4Address}}{{"\n"}}{{end}}' | Select-String "lifeos"

# 3. Kiem tra lifeos-app response
Write-Host "`n3. Test response tu lifeos-app:" -ForegroundColor Yellow
$response = docker exec lifeos-app curl -s -o /dev/null -w "%{http_code}" http://localhost:80
if ($response -eq "200") {
    Write-Host "   OK lifeos-app dang phan hoi (HTTP $response)" -ForegroundColor Green
} else {
    Write-Host "   ERROR lifeos-app khong phan hoi dung (HTTP $response)" -ForegroundColor Red
}

# 4. Kiem tra Cloudflare Tunnel config
Write-Host "`n4. Kiem tra Cloudflare Tunnel config:" -ForegroundColor Yellow
$tunnelConfig = docker-compose logs --tail=200 cloudflared | Select-String -Pattern "life.hoanong.com.*http://lifeos-app" | Select-Object -Last 1
if ($tunnelConfig) {
    Write-Host "   OK Cloudflare Tunnel da cau hinh life.hoanong.com -> http://lifeos-app:80" -ForegroundColor Green
} else {
    Write-Host "   WARNING Khong tim thay config trong logs" -ForegroundColor Yellow
}

# 5. Kiem tra DNS
Write-Host "`n5. Kiem tra DNS:" -ForegroundColor Yellow
$dns = Resolve-DnsName -Name "life.hoanong.com" -ErrorAction SilentlyContinue
if ($dns) {
    Write-Host "   OK DNS resolve duoc: $($dns.IPAddress -join ', ')" -ForegroundColor Green
} else {
    Write-Host "   WARNING DNS chua resolve duoc (co the can doi vai phut)" -ForegroundColor Yellow
}

# 6. Test HTTP request
Write-Host "`n6. Test HTTP request:" -ForegroundColor Yellow
try {
    $webRequest = Invoke-WebRequest -Uri "https://life.hoanong.com" -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
    Write-Host "   OK Truy cap thanh cong! Status: $($webRequest.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "   ERROR Khong the truy cap: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Kiem tra:" -ForegroundColor Yellow
    Write-Host "      - Cloudflare Tunnel dang chay" -ForegroundColor Gray
    Write-Host "      - Public Hostname da duoc cau hinh trong Cloudflare Dashboard" -ForegroundColor Gray
    Write-Host "      - DNS da propagate (doi vai phut)" -ForegroundColor Gray
}

Write-Host "`nKiem tra hoan tat!" -ForegroundColor Green
