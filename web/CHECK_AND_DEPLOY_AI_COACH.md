# ✅ Kiểm Tra và Deploy AI Coach Edge Function

## 📋 Tình Trạng Hiện Tại

✅ **Đã hoàn thành:**
- Fix UI text thông báo (loại bỏ dấu ngoặc kép)
- Cải thiện sync AI Coach (localStorage + cross-tab sync)
- Tạo scripts deploy và kiểm tra

🔄 **Cần thực hiện:**
- Deploy Edge Function `ai-coach` lên Supabase Local
- Kiểm tra Edge Function hoạt động trên desktop

## 🚀 Hướng Dẫn Deploy Nhanh

### Bước 1: Kiểm tra Supabase Local

```powershell
# Kiểm tra containers
docker ps --filter "name=supabase"

# Kết quả mong đợi: Các containers đều "Up" và "healthy"
```

### Bước 2: Cài đặt Supabase CLI (nếu chưa có)

```powershell
npm install -g supabase
```

### Bước 3: Deploy Edge Function

**Cách 1: Dùng script tự động (Khuyến nghị)**
```powershell
cd remix-of-remix-of-lifeos-mobile-v3.copy
.\scripts\deploy-ai-coach-local.ps1
```

**Cách 2: Deploy thủ công**
```powershell
cd remix-of-remix-of-lifeos-mobile-v3.copy

# Link với local project (nếu chưa link)
supabase link --project-ref local

# Deploy Edge Function
supabase functions deploy ai-coach --no-verify-jwt --project-ref local
```

### Bước 4: Kiểm tra Deployment

```powershell
# Dùng script kiểm tra
.\scripts\check-ai-coach-deployment-local.ps1

# Hoặc test endpoint
.\scripts\test-ai-coach-endpoint.ps1
```

### Bước 5: Test trên Desktop

1. Mở ứng dụng: `https://life.hoanong.com`
2. Mở AI Coach
3. Gửi tin nhắn test
4. Kiểm tra Console (F12) - không có lỗi 404

## 🔍 Cấu Hình Hiện Tại

### Supabase URLs

- **Local**: `http://localhost:54321`
- **Public (via proxy)**: `https://life.hoanong.com/supabase`
- **Public (subdomain)**: `https://supabase.hoanong.com`

### Edge Function URL

Ứng dụng sẽ gọi:
```
https://life.hoanong.com/supabase/functions/v1/ai-coach
```

### Proxy Configuration

✅ **Nginx proxy** (`supabase-proxy/nginx.conf`) đã cấu hình đúng:
- Proxy tất cả requests đến `supabase_kong_Supabase:8000`
- Kong Gateway tự động route `/functions/v1/*` đến Edge Runtime

### API Keys

✅ **Bạn đã cấu hình API keys trong Admin Panel** - không cần làm gì thêm!

## 📝 Checklist Deploy

- [ ] Supabase Local đang chạy
- [ ] Supabase CLI đã cài đặt
- [ ] Đã link với local project (`supabase link --project-ref local`)
- [ ] Edge Function đã deploy (`supabase functions deploy ai-coach`)
- [ ] Test endpoint thành công
- [ ] AI Coach hoạt động trên desktop

## 🐛 Troubleshooting

### Lỗi: "supabase: command not found"

**Giải pháp:**
```powershell
npm install -g supabase
```

### Lỗi: "Project not linked"

**Giải pháp:**
```powershell
supabase link --project-ref local
```

### Lỗi: "Function not found" (404)

**Giải pháp:**
1. Kiểm tra deployment: `supabase functions list`
2. Deploy lại: `supabase functions deploy ai-coach --no-verify-jwt`
3. Kiểm tra logs: `supabase functions logs ai-coach`

### Edge Function không hoạt động

**Kiểm tra:**
1. Logs Edge Function: `supabase functions logs ai-coach`
2. Logs Kong: `docker logs supabase_kong_Supabase`
3. Logs Edge Runtime: `docker logs supabase_edge_runtime_Supabase`

## ✨ Kết Quả Mong Đợi

Sau khi deploy thành công:
- ✅ AI Coach hoạt động với AI thật (Gemini/Perplexity/Lovable)
- ✅ Response streaming từ Edge Function
- ✅ Hoạt động trên desktop qua `https://life.hoanong.com`
- ✅ Messages sync giữa các tab/thiết bị
- ✅ Thông báo hiển thị text sạch sẽ

## 📚 Tài Liệu

- `DEPLOY_AI_COACH_LOCAL.md` - Hướng dẫn chi tiết
- `scripts/deploy-ai-coach-local.ps1` - Script deploy tự động
- `scripts/check-ai-coach-deployment-local.ps1` - Script kiểm tra
- `scripts/test-ai-coach-endpoint.ps1` - Script test endpoint

