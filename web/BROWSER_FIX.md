# Khắc phục vấn đề Browser - life.hoanong.com

## ✅ Website đã hoạt động!

Test cho thấy website đã hoạt động bình thường:
- ✅ HTTP Status: 200
- ✅ DNS resolve được
- ✅ Cloudflare Tunnel kết nối thành công
- ✅ Container đang chạy

## Nếu browser vẫn không truy cập được:

### 1. Clear Browser Cache

**Chrome/Edge:**
- Nhấn `Ctrl + Shift + Delete`
- Chọn "Cached images and files"
- Chọn "All time"
- Click "Clear data"

**Hoặc Hard Refresh:**
- Nhấn `Ctrl + F5` hoặc `Ctrl + Shift + R`

### 2. Kiểm tra Browser Console

1. Mở Developer Tools: `F12`
2. Vào tab **Console**
3. Xem có lỗi gì không (màu đỏ)
4. Vào tab **Network**
5. Reload trang (`F5`)
6. Xem request đến `life.hoanong.com` có status gì

### 3. Thử Browser khác hoặc Incognito Mode

- Mở Incognito/Private window: `Ctrl + Shift + N`
- Truy cập: https://life.hoanong.com

### 4. Kiểm tra DNS Cache

**Windows:**
```powershell
ipconfig /flushdns
```

**Sau đó thử lại:**
```powershell
nslookup life.hoanong.com
```

### 5. Kiểm tra Firewall/Antivirus

- Tạm thời tắt firewall/antivirus
- Hoặc thêm exception cho `life.hoanong.com`

### 6. Kiểm tra Cloudflare Status

- Vào: https://www.cloudflarestatus.com/
- Kiểm tra xem có sự cố không

## Test từ Command Line

```powershell
# Test HTTP
Invoke-WebRequest -Uri "https://life.hoanong.com" -UseBasicParsing

# Test với curl (nếu có)
curl -I https://life.hoanong.com
```

## Nếu vẫn không được:

1. **Kiểm tra Cloudflare Dashboard:**
   - Vào Zero Trust > Networks > Tunnels
   - Xem tunnel có đang chạy không
   - Kiểm tra Public Hostname có đúng không

2. **Xem logs:**
```bash
docker-compose logs -f cloudflared
docker-compose logs -f lifeos-app
```

3. **Restart containers:**
```bash
docker-compose restart cloudflared lifeos-app
```

## Thông tin hữu ích:

- **Website URL**: https://life.hoanong.com
- **Container**: `lifeos-app` (port 80)
- **Tunnel**: `cloudflared-lifeos`
- **Network**: `affine_traefik-network`

