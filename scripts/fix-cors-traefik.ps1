# Script để thêm Traefik labels và CORS middleware cho Supabase
Write-Host "=== Adding Traefik Labels and CORS Middleware to Supabase ===" -ForegroundColor Cyan

$containerName = "supabase_kong_Supabase"

# Kiểm tra container có tồn tại không
$containerExists = docker ps -a --filter "name=$containerName" --format "{{.Names}}"
if (-not $containerExists) {
    Write-Host "❌ Container $containerName not found!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found container: $containerName" -ForegroundColor Green

# Thêm Traefik labels cơ bản
Write-Host "`nAdding Traefik labels..." -ForegroundColor Yellow

docker update --label-add "traefik.enable=true" $containerName
docker update --label-add "traefik.docker.network=affine_traefik-network" $containerName
docker update --label-add "traefik.http.routers.supabase.rule=Host(\`supabase.hoanong.com\`)" $containerName
docker update --label-add "traefik.http.routers.supabase.entrypoints=web" $containerName
docker update --label-add "traefik.http.routers.supabase.service=supabase" $containerName
docker update --label-add "traefik.http.services.supabase.loadbalancer.server.port=8000" $containerName

# Thêm CORS middleware
Write-Host "`nAdding CORS middleware..." -ForegroundColor Yellow

docker update --label-add "traefik.http.routers.supabase.middlewares=supabase-cors" $containerName
docker update --label-add "traefik.http.middlewares.supabase-cors.headers.accesscontrolallowmethods=GET,POST,PUT,DELETE,PATCH,OPTIONS" $containerName
docker update --label-add "traefik.http.middlewares.supabase-cors.headers.accesscontrolalloworiginlist=https://life.hoanong.com" $containerName
docker update --label-add "traefik.http.middlewares.supabase-cors.headers.accesscontrolallowheaders=Content-Type,Authorization,apikey,x-client-info" $containerName
docker update --label-add "traefik.http.middlewares.supabase-cors.headers.accesscontrolallowcredentials=true" $containerName
docker update --label-add "traefik.http.middlewares.supabase-cors.headers.accesscontrolmaxage=86400" $containerName

Write-Host "✅ Traefik labels and CORS middleware added successfully!" -ForegroundColor Green

# Kiểm tra labels đã được thêm
Write-Host "`nVerifying labels..." -ForegroundColor Yellow
docker inspect $containerName --format '{{range $key, $value := .Config.Labels}}{{if contains $key "traefik"}}{{$key}}={{$value}}{{println}}{{end}}{{end}}'

Write-Host "`n=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Restart Traefik:" -ForegroundColor White
Write-Host "   docker restart traefik" -ForegroundColor Gray
Write-Host "2. Restart Supabase Kong:" -ForegroundColor White
Write-Host "   docker restart supabase_kong_Supabase" -ForegroundColor Gray
Write-Host "3. Update Cloudflare Tunnel config (if needed):" -ForegroundColor White
Write-Host "   - Service: http://traefik:80" -ForegroundColor Gray
Write-Host "   - Hostname: supabase.hoanong.com" -ForegroundColor Gray
Write-Host "4. Wait 30-60 seconds and test" -ForegroundColor White

