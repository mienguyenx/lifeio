# Script để deploy AI Coach Edge Function lên Supabase
# Yêu cầu: Supabase CLI đã được cài đặt

Write-Host "🚀 Deploy AI Coach Edge Function lên Supabase" -ForegroundColor Cyan
Write-Host ""

# Kiểm tra Supabase CLI
Write-Host "📋 Kiểm tra Supabase CLI..." -ForegroundColor Yellow
try {
    $version = supabase --version 2>&1
    Write-Host "✅ Supabase CLI đã được cài đặt: $version" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI chưa được cài đặt!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Cài đặt Supabase CLI:" -ForegroundColor Yellow
    Write-Host "  npm install -g supabase" -ForegroundColor White
    Write-Host ""
    Write-Host "Hoặc xem hướng dẫn trong DEPLOY_AI_COACH_EDGE_FUNCTION.md" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📝 Các bước deploy:" -ForegroundColor Cyan
Write-Host "1. Đăng nhập vào Supabase (nếu chưa)" -ForegroundColor White
Write-Host "2. Link project với Supabase" -ForegroundColor White
Write-Host "3. Set API keys (GEMINI_API_KEY, PERPLEXITY_API_KEY, hoặc LOVABLE_API_KEY)" -ForegroundColor White
Write-Host "4. Deploy Edge Function" -ForegroundColor White
Write-Host ""

$continue = Read-Host "Bạn có muốn tiếp tục? (y/n)"
if ($continue -ne "y" -and $continue -ne "Y") {
    Write-Host "Đã hủy." -ForegroundColor Yellow
    exit 0
}

# Bước 1: Kiểm tra đăng nhập
Write-Host ""
Write-Host "🔐 Bước 1: Kiểm tra đăng nhập Supabase..." -ForegroundColor Cyan
try {
    supabase projects list 2>&1 | Out-Null
    Write-Host "✅ Đã đăng nhập" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Chưa đăng nhập. Đang mở trình duyệt để đăng nhập..." -ForegroundColor Yellow
    supabase login
}

# Bước 2: Link project
Write-Host ""
Write-Host "🔗 Bước 2: Link project với Supabase..." -ForegroundColor Cyan
Write-Host "Project ref: pxgdmyszzwamwygvifvj" -ForegroundColor White
$link = Read-Host "Bạn có muốn link project này? (y/n)"
if ($link -eq "y" -or $link -eq "Y") {
    supabase link --project-ref pxgdmyszzwamwygvifvj
}

# Bước 3: Set secrets
Write-Host ""
Write-Host "🔑 Bước 3: Cấu hình API Keys..." -ForegroundColor Cyan
Write-Host "Bạn cần ít nhất một trong các API keys sau:" -ForegroundColor Yellow
Write-Host "  - GEMINI_API_KEY (từ Google AI Studio)" -ForegroundColor White
Write-Host "  - PERPLEXITY_API_KEY (từ Perplexity)" -ForegroundColor White
Write-Host "  - LOVABLE_API_KEY (từ Lovable AI)" -ForegroundColor White
Write-Host ""

$setGemini = Read-Host "Bạn có muốn set GEMINI_API_KEY? (y/n)"
if ($setGemini -eq "y" -or $setGemini -eq "Y") {
    $geminiKey = Read-Host "Nhập GEMINI_API_KEY" -AsSecureString
    $geminiKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($geminiKey))
    supabase secrets set GEMINI_API_KEY=$geminiKeyPlain
    Write-Host "✅ Đã set GEMINI_API_KEY" -ForegroundColor Green
}

$setPerplexity = Read-Host "Bạn có muốn set PERPLEXITY_API_KEY? (y/n)"
if ($setPerplexity -eq "y" -or $setPerplexity -eq "Y") {
    $perplexityKey = Read-Host "Nhập PERPLEXITY_API_KEY" -AsSecureString
    $perplexityKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($perplexityKey))
    supabase secrets set PERPLEXITY_API_KEY=$perplexityKeyPlain
    Write-Host "✅ Đã set PERPLEXITY_API_KEY" -ForegroundColor Green
}

$setLovable = Read-Host "Bạn có muốn set LOVABLE_API_KEY? (y/n)"
if ($setLovable -eq "y" -or $setLovable -eq "Y") {
    $lovableKey = Read-Host "Nhập LOVABLE_API_KEY" -AsSecureString
    $lovableKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($lovableKey))
    supabase secrets set LOVABLE_API_KEY=$lovableKeyPlain
    Write-Host "✅ Đã set LOVABLE_API_KEY" -ForegroundColor Green
}

# Bước 4: Deploy
Write-Host ""
Write-Host "🚀 Bước 4: Deploy Edge Function ai-coach..." -ForegroundColor Cyan
$deploy = Read-Host "Bạn có muốn deploy ngay bây giờ? (y/n)"
if ($deploy -eq "y" -or $deploy -eq "Y") {
    Write-Host "Đang deploy..." -ForegroundColor Yellow
    supabase functions deploy ai-coach
    Write-Host ""
    Write-Host "✅ Deploy hoàn tất!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Kiểm tra:" -ForegroundColor Cyan
    Write-Host "1. Mở ứng dụng tại https://life.hoanong.com" -ForegroundColor White
    Write-Host "2. Mở AI Coach và thử gửi tin nhắn" -ForegroundColor White
    Write-Host "3. Nếu vẫn lỗi, kiểm tra logs: supabase functions logs ai-coach" -ForegroundColor White
} else {
    Write-Host "Bạn có thể deploy sau bằng lệnh:" -ForegroundColor Yellow
    Write-Host "  supabase functions deploy ai-coach" -ForegroundColor White
}

Write-Host ""
Write-Host "✨ Hoàn tất!" -ForegroundColor Green

