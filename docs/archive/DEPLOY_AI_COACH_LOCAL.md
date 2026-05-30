# 🚀 Hướng Dẫn Deploy AI Coach Edge Function trên Supabase Local

## 📋 Tổng Quan

Bạn có:
- ✅ **Supabase Local** đang chạy (các containers đã Up và healthy)
- ✅ **Supabase Public** với subdomain `supabase.hoanong.com`
- ✅ **Ứng dụng** đang dùng `https://life.hoanong.com/supabase` (same-origin proxy)

## 🎯 Mục Tiêu

Deploy Edge Function `ai-coach` lên Supabase Local để AI Coach hoạt động trên desktop.

## ✅ Các Bước Deploy

### Bước 1: Kiểm tra Supabase Local

```powershell
# Kiểm tra containers đang chạy
docker ps --filter "name=supabase"

# Kết quả mong đợi:
# - supabase_kong_Supabase (Kong Gateway - port 54321)
# - supabase_edge_runtime_Supabase (Edge Runtime - port 8081)
```

### Bước 2: Cài đặt Supabase CLI (nếu chưa có)

```powershell
# Cách 1: Dùng npm
npm install -g supabase

# Cách 2: Dùng scoop (Windows)
scoop install supabase

# Kiểm tra
supabase --version
```

### Bước 3: Link với Supabase Local

```powershell
cd remix-of-remix-of-lifeos-mobile-v3.copy

# Link với local project
supabase link --project-ref local
```

**Lưu ý**: Nếu lỗi, có thể cần khởi động lại Supabase:
```powershell
supabase stop
supabase start
```

### Bước 4: Kiểm tra API Keys

Đảm bảo bạn đã cấu hình API keys trong **Admin Panel > API Keys**:
- ✅ GEMINI_API_KEY (khuyến nghị)
- ✅ PERPLEXITY_API_KEY
- ✅ LOVABLE_API_KEY

**Bạn đã nói rằng đã cấu hình API keys rồi, vậy bước này đã xong!**

### Bước 5: Deploy Edge Function

**Cách 1: Dùng script tự động (Khuyến nghị)**
```powershell
.\scripts\deploy-ai-coach-local.ps1
```

**Cách 2: Deploy thủ công**
```powershell
supabase functions deploy ai-coach --no-verify-jwt --project-ref local
```

### Bước 6: Kiểm tra Deployment

**Cách 1: Dùng script kiểm tra**
```powershell
.\scripts\check-ai-coach-deployment-local.ps1
```

**Cách 2: Test thủ công**
```powershell
# Test local endpoint
curl -X OPTIONS http://localhost:54321/functions/v1/ai-coach

# Test qua proxy (nếu có)
curl -X OPTIONS https://life.hoanong.com/supabase/functions/v1/ai-coach
```

## 🔍 Kiểm Tra URL Edge Function

Ứng dụng sẽ gọi Edge Function tại:
```
${VITE_SUPABASE_URL}/functions/v1/ai-coach
```

Với cấu hình hiện tại:
- **VITE_SUPABASE_URL**: `https://life.hoanong.com/supabase`
- **Edge Function URL**: `https://life.hoanong.com/supabase/functions/v1/ai-coach`

## ⚠️ Lưu Ý Quan Trọng

### 1. Same-Origin Proxy

Ứng dụng đang dùng **same-origin proxy** (`/supabase/*`) để tránh CORS. Edge Functions cũng cần được expose qua proxy này.

**Kiểm tra nginx proxy config:**
```powershell
# Xem file nginx config
cat supabase-proxy/nginx.conf
```

Đảm bảo có route cho `/functions/v1/*`:
```nginx
location /functions/v1/ {
    proxy_pass http://supabase_kong_Supabase:8000;
    ...
}
```

### 2. Kong Gateway Routing

Supabase Kong Gateway (port 8000) tự động route `/functions/v1/*` đến Edge Runtime (port 8081). Không cần cấu hình thêm.

### 3. Edge Function Environment Variables

Edge Function cần các biến môi trường:
- `SUPABASE_URL`: Tự động set bởi Supabase
- `SUPABASE_ANON_KEY`: Tự động set bởi Supabase
- `GEMINI_API_KEY` / `PERPLEXITY_API_KEY` / `LOVABLE_API_KEY`: Cần set trong Admin Panel

## 🧪 Test AI Coach trên Desktop

### 1. Mở ứng dụng
```
https://life.hoanong.com
```

### 2. Mở AI Coach
- Click button AI Coach
- Hoặc vào trang AI Chat

### 3. Gửi tin nhắn test
```
"Xin chào, bạn có thể giúp tôi không?"
```

### 4. Kiểm tra Console (F12)
- Không có lỗi 404
- Không có lỗi CORS
- Response từ Edge Function (không phải fallback)

## 🐛 Troubleshooting

### Lỗi: "Function not found" hoặc 404

**Nguyên nhân**: Edge Function chưa được deploy hoặc URL sai.

**Giải pháp**:
1. Kiểm tra deployment: `supabase functions list`
2. Kiểm tra URL: Đảm bảo đúng `/functions/v1/ai-coach`
3. Kiểm tra proxy: Đảm bảo nginx proxy route đúng

### Lỗi: "No available AI provider/API key"

**Nguyên nhân**: API keys chưa được cấu hình.

**Giải pháp**:
1. Vào Admin Panel > API Keys
2. Thêm ít nhất một API key (GEMINI_API_KEY, PERPLEXITY_API_KEY, hoặc LOVABLE_API_KEY)
3. Restart Edge Function: `supabase functions deploy ai-coach --no-verify-jwt`

### Lỗi: CORS

**Nguyên nhân**: Edge Function không được expose qua same-origin proxy.

**Giải pháp**:
1. Kiểm tra nginx proxy config có route `/functions/v1/*`
2. Đảm bảo proxy forward đến `supabase_kong_Supabase:8000`
3. Restart proxy: `docker restart supabase-proxy`

### Edge Function không hoạt động

**Kiểm tra logs**:
```powershell
# Xem logs Edge Function
supabase functions logs ai-coach

# Xem logs Kong Gateway
docker logs supabase_kong_Supabase

# Xem logs Edge Runtime
docker logs supabase_edge_runtime_Supabase
```

## 📝 Checklist

- [ ] Supabase Local đang chạy
- [ ] Supabase CLI đã cài đặt
- [ ] Đã link với local project
- [ ] API keys đã cấu hình trong Admin Panel
- [ ] Edge Function đã deploy
- [ ] Proxy route `/functions/v1/*` đúng
- [ ] Test Edge Function endpoint thành công
- [ ] AI Coach hoạt động trên desktop

## ✨ Kết Quả Mong Đợi

Sau khi deploy thành công:
- ✅ AI Coach hoạt động với AI thật (không phải fallback)
- ✅ Response streaming từ Edge Function
- ✅ Hoạt động trên desktop qua `https://life.hoanong.com`
- ✅ Sync messages giữa các tab/thiết bị

## 📚 Tài Liệu Tham Khảo

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Supabase Local Development](https://supabase.com/docs/guides/cli/local-development)

