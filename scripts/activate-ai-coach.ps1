# Script tự động kích hoạt AI Coach
# Hỗ trợ cả local Supabase và Supabase Cloud

Write-Host "🚀 Kích Hoạt AI Coach" -ForegroundColor Cyan
Write-Host ""

# Kiểm tra Supabase CLI
Write-Host "📋 Bước 1: Kiểm tra Supabase CLI..." -ForegroundColor Yellow
$supabaseInstalled = $false
try {
    $version = supabase --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Supabase CLI đã được cài đặt: $version" -ForegroundColor Green
        $supabaseInstalled = $true
    }
} catch {
    Write-Host "❌ Supabase CLI chưa được cài đặt" -ForegroundColor Red
}

if (-not $supabaseInstalled) {
    Write-Host ""
    Write-Host "Cài đặt Supabase CLI:" -ForegroundColor Yellow
    Write-Host "  npm install -g supabase" -ForegroundColor White
    Write-Host ""
    $install = Read-Host "Bạn có muốn cài đặt ngay bây giờ? (y/n)"
    if ($install -eq "y" -or $install -eq "Y") {
        Write-Host "Đang cài đặt..." -ForegroundColor Yellow
        npm install -g supabase
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Đã cài đặt Supabase CLI" -ForegroundColor Green
            $supabaseInstalled = $true
        } else {
            Write-Host "❌ Cài đặt thất bại. Vui lòng cài đặt thủ công: npm install -g supabase" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "⚠️  Bạn cần cài đặt Supabase CLI để deploy Edge Function" -ForegroundColor Yellow
        Write-Host "   Hoặc sử dụng Fallback Response (đã có sẵn)" -ForegroundColor Yellow
        exit 0
    }
}

Write-Host ""
Write-Host "📝 Các bước kích hoạt AI Coach:" -ForegroundColor Cyan
Write-Host "1. Đăng nhập Supabase (nếu chưa)" -ForegroundColor White
Write-Host "2. Link project với Supabase Cloud" -ForegroundColor White
Write-Host "3. Set API key (GEMINI_API_KEY, PERPLEXITY_API_KEY, hoặc LOVABLE_API_KEY)" -ForegroundColor White
Write-Host "4. Deploy Edge Function ai-coach" -ForegroundColor White
Write-Host ""

$continue = Read-Host "Bạn có muốn tiếp tục? (y/n)"
if ($continue -ne "y" -and $continue -ne "Y") {
    Write-Host ""
    Write-Host "ℹ️  Bạn có thể sử dụng Fallback Response (đã có sẵn)" -ForegroundColor Yellow
    Write-Host "   AI Coach vẫn hoạt động với các tính năng cơ bản" -ForegroundColor Yellow
    exit 0
}

# Bước 1: Kiểm tra đăng nhập
Write-Host ""
Write-Host "🔐 Bước 1: Kiểm tra đăng nhập Supabase..." -ForegroundColor Cyan
try {
    supabase projects list 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Đã đăng nhập" -ForegroundColor Green
    } else {
        throw "Not logged in"
    }
} catch {
    Write-Host "⚠️  Chưa đăng nhập. Đang mở trình duyệt..." -ForegroundColor Yellow
    supabase login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Đăng nhập thất bại" -ForegroundColor Red
        exit 1
    }
}

# Bước 2: Link project
Write-Host ""
Write-Host "🔗 Bước 2: Link project với Supabase..." -ForegroundColor Cyan
Write-Host "Project ref: pxgdmyszzwamwygvifvj" -ForegroundColor White
Write-Host ""
Write-Host "Lưu ý: Nếu bạn chưa có project, tạo mới tại: https://supabase.com/dashboard" -ForegroundColor Yellow
$link = Read-Host "Bạn có muốn link project này? (y/n)"
if ($link -eq "y" -or $link -eq "Y") {
    supabase link --project-ref pxgdmyszzwamwygvifvj
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Link project thất bại. Bạn có thể thử lại sau." -ForegroundColor Yellow
    } else {
        Write-Host "✅ Đã link project" -ForegroundColor Green
    }
}

# Bước 3: Set API key
Write-Host ""
Write-Host "🔑 Bước 3: Cấu hình API Key..." -ForegroundColor Cyan
Write-Host "Bạn cần ít nhất một trong các API keys sau:" -ForegroundColor Yellow
Write-Host "  - GEMINI_API_KEY (từ Google AI Studio: https://makersuite.google.com/app/apikey)" -ForegroundColor White
Write-Host "  - PERPLEXITY_API_KEY (từ Perplexity: https://www.perplexity.ai/settings/api)" -ForegroundColor White
Write-Host "  - LOVABLE_API_KEY (từ Lovable AI: https://lovable.dev)" -ForegroundColor White
Write-Host ""

$setGemini = Read-Host "Bạn có muốn set GEMINI_API_KEY? (y/n)"
if ($setGemini -eq "y" -or $setGemini -eq "Y") {
    $geminiKey = Read-Host "Nhập GEMINI_API_KEY" -AsSecureString
    $geminiKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($geminiKey))
    supabase secrets set GEMINI_API_KEY=$geminiKeyPlain
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Đã set GEMINI_API_KEY" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Set GEMINI_API_KEY thất bại" -ForegroundColor Yellow
    }
}

$setPerplexity = Read-Host "Bạn có muốn set PERPLEXITY_API_KEY? (y/n)"
if ($setPerplexity -eq "y" -or $setPerplexity -eq "Y") {
    $perplexityKey = Read-Host "Nhập PERPLEXITY_API_KEY" -AsSecureString
    $perplexityKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($perplexityKey))
    supabase secrets set PERPLEXITY_API_KEY=$perplexityKeyPlain
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Đã set PERPLEXITY_API_KEY" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Set PERPLEXITY_API_KEY thất bại" -ForegroundColor Yellow
    }
}

$setLovable = Read-Host "Bạn có muốn set LOVABLE_API_KEY? (y/n)"
if ($setLovable -eq "y" -or $setLovable -eq "Y") {
    $lovableKey = Read-Host "Nhập LOVABLE_API_KEY" -AsSecureString
    $lovableKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($lovableKey))
    supabase secrets set LOVABLE_API_KEY=$lovableKeyPlain
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Đã set LOVABLE_API_KEY" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Set LOVABLE_API_KEY thất bại" -ForegroundColor Yellow
    }
}

# Bước 4: Deploy
Write-Host ""
Write-Host "🚀 Bước 4: Deploy Edge Function ai-coach..." -ForegroundColor Cyan
$deploy = Read-Host "Bạn có muốn deploy ngay bây giờ? (y/n)"
if ($deploy -eq "y" -or $deploy -eq "Y") {
    Write-Host "Đang deploy..." -ForegroundColor Yellow
    supabase functions deploy ai-coach
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Deploy hoàn tất!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📝 Kiểm tra:" -ForegroundColor Cyan
        Write-Host "1. Mở ứng dụng tại https://life.hoanong.com" -ForegroundColor White
        Write-Host "2. Mở AI Coach và thử gửi tin nhắn" -ForegroundColor White
        Write-Host "3. Nếu vẫn lỗi, kiểm tra logs: supabase functions logs ai-coach" -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "❌ Deploy thất bại. Kiểm tra:" -ForegroundColor Red
        Write-Host "  - Đã link project chưa?" -ForegroundColor Yellow
        Write-Host "  - Đã set API key chưa?" -ForegroundColor Yellow
        Write-Host "  - Xem logs: supabase functions logs ai-coach" -ForegroundColor Yellow
    }
} else {
    Write-Host "Bạn có thể deploy sau bằng lệnh:" -ForegroundColor Yellow
    Write-Host "  supabase functions deploy ai-coach" -ForegroundColor White
}

Write-Host ""
Write-Host "✨ Hoàn tất!" -ForegroundColor Green
Write-Host ""
Write-Host "ℹ️  Lưu ý: Nếu chưa deploy Edge Function, AI Coach vẫn hoạt động với Fallback Response" -ForegroundColor Yellow
















