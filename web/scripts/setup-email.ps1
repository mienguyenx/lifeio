# Setup Email Configuration cho LifeOS
# Usage: .\setup-email.ps1 -Provider "resend" -ResendApiKey "re_xxxxx"

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("resend", "gmail", "smtp")]
    [string]$Provider,
    
    [Parameter(Mandatory=$false)]
    [string]$ResendApiKey,
    
    [Parameter(Mandatory=$false)]
    [string]$SmtpHost,
    
    [Parameter(Mandatory=$false)]
    [string]$SmtpPort = "587",
    
    [Parameter(Mandatory=$false)]
    [string]$SmtpUsername,
    
    [Parameter(Mandatory=$false)]
    [string]$SmtpPassword,
    
    [Parameter(Mandatory=$false)]
    [string]$FromEmail = "noreply@hoanong.com",
    
    [Parameter(Mandatory=$false)]
    [string]$FromName = "LifeOS"
)

Write-Host "`n=== CAU HINH EMAIL ===" -ForegroundColor Cyan
Write-Host "Provider: $Provider" -ForegroundColor Yellow

# Build SQL
$sql = @"
-- Email Provider
INSERT INTO public.admin_settings (key, value, description)
VALUES ('email_provider', '$Provider', 'Email provider')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- From Email
INSERT INTO public.admin_settings (key, value, description)
VALUES ('smtp_from_email', '$FromEmail', 'Email gui di')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- From Name
INSERT INTO public.admin_settings (key, value, description)
VALUES ('smtp_from_name', '$FromName', 'Ten hien thi')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
"@

if ($Provider -eq "resend") {
    if (-not $ResendApiKey) {
        Write-Host "`n❌ Resend API Key is required!" -ForegroundColor Red
        Write-Host "Usage: .\setup-email.ps1 -Provider resend -ResendApiKey 're_xxxxx'" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "`nSetting up Resend..." -ForegroundColor Cyan
    Write-Host "API Key: $($ResendApiKey.Substring(0, 10))..." -ForegroundColor Gray
    
    # Thêm RESEND_API_KEY vào Supabase Functions environment
    # Note: Cần restart Supabase Functions để áp dụng
    Write-Host "⚠️  Cần thêm RESEND_API_KEY vào Supabase Functions environment" -ForegroundColor Yellow
    Write-Host "   Cách 1: Thêm vào .env file của Supabase" -ForegroundColor Gray
    Write-Host "   Cách 2: Export trong shell trước khi chạy Supabase" -ForegroundColor Gray
    Write-Host "   Cách 3: Thêm vào docker-compose.yml của Supabase" -ForegroundColor Gray
}

if ($Provider -eq "gmail" -or $Provider -eq "smtp") {
    if (-not $SmtpHost -or -not $SmtpUsername -or -not $SmtpPassword) {
        Write-Host "`n❌ SMTP configuration is incomplete!" -ForegroundColor Red
        Write-Host "Required: -SmtpHost, -SmtpUsername, -SmtpPassword" -ForegroundColor Yellow
        exit 1
    }
    
    if ($Provider -eq "gmail") {
        $SmtpHost = "smtp.gmail.com"
        $SmtpPort = "465"
    }
    
    $sql += @"

-- SMTP Host
INSERT INTO public.admin_settings (key, value, description)
VALUES ('smtp_host', '$SmtpHost', 'SMTP host')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- SMTP Port
INSERT INTO public.admin_settings (key, value, description)
VALUES ('smtp_port', '$SmtpPort', 'SMTP port')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- SMTP Username
INSERT INTO public.admin_settings (key, value, description)
VALUES ('smtp_username', '$SmtpUsername', 'SMTP username')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- SMTP Password
INSERT INTO public.admin_settings (key, value, description)
VALUES ('smtp_password', '$SmtpPassword', 'SMTP password')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- SMTP Secure
INSERT INTO public.admin_settings (key, value, description)
VALUES ('smtp_secure', 'true', 'Dung SSL/TLS')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
"@
}

Write-Host "`nDang cau hinh email trong database..." -ForegroundColor Cyan
$result = docker exec -i supabase_db_Supabase psql -U postgres -d postgres 2>&1 <<< $sql

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Cau hinh email hoan tat!" -ForegroundColor Green
    
    Write-Host "`nKiem tra cau hinh:" -ForegroundColor Yellow
    docker exec supabase_db_Supabase psql -U postgres -d postgres -c "SELECT key, value FROM public.admin_settings WHERE key LIKE '%email%' OR key LIKE '%smtp%' ORDER BY key;" 2>&1 | Select-String -Pattern "key|email|smtp|resend" | Select-Object -First 10
    
    Write-Host "`n📝 Buoc tiep theo:" -ForegroundColor Cyan
    if ($Provider -eq "resend") {
        Write-Host "  1. Them RESEND_API_KEY vao Supabase Functions environment" -ForegroundColor White
        Write-Host "  2. Restart Supabase Functions (neu can)" -ForegroundColor White
        Write-Host "  3. Test gui email qua Admin Panel" -ForegroundColor White
    } else {
        Write-Host "  1. Test SMTP configuration qua Admin Panel" -ForegroundColor White
        Write-Host "  2. Test gui email reset password" -ForegroundColor White
    }
} else {
    Write-Host "`n❌ Co loi khi cau hinh!" -ForegroundColor Red
    Write-Host $result -ForegroundColor Red
    exit 1
}

