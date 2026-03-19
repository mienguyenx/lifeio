# Script kiểm tra trạng thái AI Coach
# Kiểm tra cấu hình, Edge Function, và API keys

Write-Host "🔍 Kiểm Tra Trạng Thái AI Coach" -ForegroundColor Cyan
Write-Host ""

# Bước 1: Kiểm tra biến môi trường
Write-Host "📋 Bước 1: Kiểm tra biến môi trường..." -ForegroundColor Yellow
$envFile = "docker-compose.yml"
if (Test-Path $envFile) {
    $content = Get-Content $envFile -Raw
    if ($content -match "VITE_SUPABASE_URL:\s*(.+)") {
        $supabaseUrl = $matches[1].Trim()
        Write-Host "✅ VITE_SUPABASE_URL: $supabaseUrl" -ForegroundColor Green
    } else {
        Write-Host "❌ Không tìm thấy VITE_SUPABASE_URL trong docker-compose.yml" -ForegroundColor Red
    }
    
    if ($content -match "VITE_SUPABASE_PUBLISHABLE_KEY:\s*(.+)") {
        $key = $matches[1].Trim()
        $keyPreview = $key.Substring(0, [Math]::Min(30, $key.Length)) + "..."
        Write-Host "✅ VITE_SUPABASE_PUBLISHABLE_KEY: $keyPreview" -ForegroundColor Green
    } else {
        Write-Host "❌ Không tìm thấy VITE_SUPABASE_PUBLISHABLE_KEY trong docker-compose.yml" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Không tìm thấy file docker-compose.yml" -ForegroundColor Red
}

Write-Host ""

# Bước 2: Kiểm tra Supabase CLI
Write-Host "📋 Bước 2: Kiểm tra Supabase CLI..." -ForegroundColor Yellow
$supabaseInstalled = $false
try {
    $version = supabase --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Supabase CLI đã được cài đặt: $version" -ForegroundColor Green
        $supabaseInstalled = $true
    }
} catch {
    Write-Host "❌ Supabase CLI chưa được cài đặt" -ForegroundColor Red
    Write-Host "   Cài đặt: npm install -g supabase" -ForegroundColor Yellow
}

Write-Host ""

# Bước 3: Kiểm tra Edge Function
Write-Host "📋 Bước 3: Kiểm tra Edge Function..." -ForegroundColor Yellow
$edgeFunctionPath = "supabase\functions\ai-coach\index.ts"
if (Test-Path $edgeFunctionPath) {
    Write-Host "✅ Edge Function file tồn tại: $edgeFunctionPath" -ForegroundColor Green
} else {
    Write-Host "❌ Không tìm thấy Edge Function: $edgeFunctionPath" -ForegroundColor Red
}

Write-Host ""

# Bước 4: Kiểm tra đăng nhập Supabase (nếu có CLI)
if ($supabaseInstalled) {
    Write-Host "📋 Bước 4: Kiểm tra đăng nhập Supabase..." -ForegroundColor Yellow
    try {
        supabase projects list 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Đã đăng nhập Supabase" -ForegroundColor Green
            
            # Kiểm tra functions đã deploy
            Write-Host ""
            Write-Host "📋 Bước 5: Kiểm tra functions đã deploy..." -ForegroundColor Yellow
            $functions = supabase functions list 2>&1
            if ($functions -match "ai-coach") {
                Write-Host "✅ Edge Function 'ai-coach' đã được deploy" -ForegroundColor Green
            } else {
                Write-Host "⚠️  Edge Function 'ai-coach' chưa được deploy" -ForegroundColor Yellow
                Write-Host "   Deploy: supabase functions deploy ai-coach" -ForegroundColor White
            }
        } else {
            Write-Host "⚠️  Chưa đăng nhập Supabase" -ForegroundColor Yellow
            Write-Host "   Đăng nhập: supabase login" -ForegroundColor White
        }
    } catch {
        Write-Host "⚠️  Không thể kiểm tra đăng nhập" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Bỏ qua kiểm tra deploy (cần Supabase CLI)" -ForegroundColor Yellow
}

Write-Host ""

# Bước 5: Kiểm tra API Keys (nếu có CLI và đã đăng nhập)
if ($supabaseInstalled) {
    Write-Host "📋 Bước 6: Kiểm tra API Keys..." -ForegroundColor Yellow
    Write-Host "   (Cần kiểm tra trong Supabase Dashboard > Settings > Edge Functions > Secrets)" -ForegroundColor White
    Write-Host "   Các keys cần có:" -ForegroundColor White
    Write-Host "   - GEMINI_API_KEY (khuyến nghị)" -ForegroundColor White
    Write-Host "   - PERPLEXITY_API_KEY" -ForegroundColor White
    Write-Host "   - LOVABLE_API_KEY" -ForegroundColor White
    Write-Host ""
    Write-Host "   Lưu ý: Chỉ cần một trong ba keys trên" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📝 Tổng Kết:" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ AI Coach có Fallback Response (hoạt động ngay không cần deploy)" -ForegroundColor Green
Write-Host "   - Trả lời các câu hỏi về hướng dẫn" -ForegroundColor White
Write-Host "   - Phân tích dữ liệu cơ bản" -ForegroundColor White
Write-Host "   - Đưa ra gợi ý dựa trên module" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Để sử dụng Full AI Features:" -ForegroundColor Cyan
Write-Host "   1. Deploy Edge Function: supabase functions deploy ai-coach" -ForegroundColor White
Write-Host "   2. Set API key: supabase secrets set GEMINI_API_KEY=your-key" -ForegroundColor White
Write-Host "   3. Xem hướng dẫn: ACTIVATE_AI_COACH.md" -ForegroundColor White
Write-Host ""
Write-Host "💡 Chạy script kích hoạt: .\scripts\activate-ai-coach.ps1" -ForegroundColor Yellow

