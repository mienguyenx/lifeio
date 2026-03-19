# Script tạo icons cho extension từ favicon.svg
# Yêu cầu: Cần cài ImageMagick hoặc dùng online converter

Write-Host "`n=== TAO ICONS CHO EXTENSION ===" -ForegroundColor Cyan
Write-Host ""

$faviconPath = "..\public\favicon.svg"
$iconsDir = "icons"

# Kiểm tra favicon.svg có tồn tại không
if (-not (Test-Path $faviconPath)) {
    Write-Host "❌ Khong tim thay file: $faviconPath" -ForegroundColor Red
    Write-Host "`nVui long chay script tu thu muc extension/" -ForegroundColor Yellow
    exit 1
}

# Kiểm tra thư mục icons
if (-not (Test-Path $iconsDir)) {
    New-Item -ItemType Directory -Path $iconsDir | Out-Null
    Write-Host "✅ Da tao thu muc: $iconsDir" -ForegroundColor Green
}

# Kiểm tra ImageMagick
$magickPath = Get-Command magick -ErrorAction SilentlyContinue
$convertPath = Get-Command convert -ErrorAction SilentlyContinue

if ($magickPath -or $convertPath) {
    Write-Host "✅ Tim thay ImageMagick" -ForegroundColor Green
    Write-Host "`nDang tao icons..." -ForegroundColor Yellow
    
    $command = if ($magickPath) { "magick" } else { "convert" }
    
    # Tạo icon-16.png
    & $command $faviconPath -resize 16x16 "$iconsDir\icon-16.png"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ icon-16.png" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Loi khi tao icon-16.png" -ForegroundColor Red
    }
    
    # Tạo icon-48.png
    & $command $faviconPath -resize 48x48 "$iconsDir\icon-48.png"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ icon-48.png" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Loi khi tao icon-48.png" -ForegroundColor Red
    }
    
    # Tạo icon-128.png
    & $command $faviconPath -resize 128x128 "$iconsDir\icon-128.png"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ icon-128.png" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Loi khi tao icon-128.png" -ForegroundColor Red
    }
    
    Write-Host "`n✅ Hoan thanh! Icons da duoc tao trong thu muc $iconsDir" -ForegroundColor Green
} else {
    Write-Host "⚠️  Khong tim thay ImageMagick" -ForegroundColor Yellow
    Write-Host "`n=== HUONG DAN TAO ICONS BANG CACH KHAC ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Cach 1: Dung online converter (KHUYEN NGHI)" -ForegroundColor Green
    Write-Host "  1. Vao: https://convertio.co/svg-png/" -ForegroundColor White
    Write-Host "  2. Upload file: $faviconPath" -ForegroundColor White
    Write-Host "  3. Convert thanh PNG" -ForegroundColor White
    Write-Host "  4. Download va resize thanh cac kich thuoc:" -ForegroundColor White
    Write-Host "     - 16x16 → Luu vao: $iconsDir\icon-16.png" -ForegroundColor Gray
    Write-Host "     - 48x48 → Luu vao: $iconsDir\icon-48.png" -ForegroundColor Gray
    Write-Host "     - 128x128 → Luu vao: $iconsDir\icon-128.png" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Cach 2: Cai ImageMagick" -ForegroundColor Green
    Write-Host "  - Download: https://imagemagick.org/script/download.php" -ForegroundColor White
    Write-Host "  - Hoac dung Chocolatey: choco install imagemagick" -ForegroundColor White
    Write-Host "  - Sau do chay lai script nay" -ForegroundColor White
    Write-Host ""
    Write-Host "Cach 3: Dung Photoshop/GIMP" -ForegroundColor Green
    Write-Host "  - Mo favicon.svg" -ForegroundColor White
    Write-Host "  - Export thanh PNG voi cac kich thuoc tren" -ForegroundColor White
    Write-Host "  - Luu vao thu muc $iconsDir" -ForegroundColor White
    Write-Host ""
    Write-Host "File favicon.svg: $((Resolve-Path $faviconPath).Path)" -ForegroundColor Cyan
}

