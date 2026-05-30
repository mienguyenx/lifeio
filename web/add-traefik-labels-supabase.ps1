# Script để thêm Traefik labels cho Supabase container
Write-Host "=== Adding Traefik Labels to Supabase ===" -ForegroundColor Cyan

$containerName = "supabase_kong_Supabase"

# Kiểm tra container có tồn tại không
$containerExists = docker ps -a --filter "name=$containerName" --format "{{.Names}}"
if (-not $containerExists) {
    Write-Host "❌ Container $containerName not found!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found container: $containerName" -ForegroundColor Green

# Thêm Traefik labels
Write-Host "`nAdding Traefik labels..." -ForegroundColor Yellow

docker update --label-add "traefik.enable=true" $containerName
docker update --label-add "traefik.docker.network=affine_traefik-network" $containerName
docker update --label-add "traefik.http.routers.supabase.rule=Host(\`supabase.hoanong.com\`)" $containerName
docker update --label-add "traefik.http.routers.supabase.entrypoints=web" $containerName
docker update --label-add "traefik.http.routers.supabase.service=supabase" $containerName
docker update --label-add "traefik.http.services.supabase.loadbalancer.server.port=8000" $containerName

Write-Host "✅ Traefik labels added successfully!" -ForegroundColor Green

# Kiểm tra labels đã được thêm
Write-Host "`nVerifying labels..." -ForegroundColor Yellow
docker inspect $containerName --format '{{range $key, $value := .Config.Labels}}{{if contains $key "traefik"}}{{$key}}={{$value}}{{println}}{{end}}{{end}}'

Write-Host "`n=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Update Cloudflare Tunnel config:" -ForegroundColor White
Write-Host "   - Service: http://traefik:80" -ForegroundColor Gray
Write-Host "   - Hostname: supabase.hoanong.com" -ForegroundColor Gray
Write-Host "2. Wait 30-60 seconds for Cloudflare to update" -ForegroundColor White
Write-Host "3. Test: https://supabase.hoanong.com/rest/v1/" -ForegroundColor White

