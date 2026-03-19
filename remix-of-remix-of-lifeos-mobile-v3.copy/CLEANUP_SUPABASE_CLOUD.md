# ✅ Đã xóa Supabase Cloud/Lovable Cloud - Chỉ dùng Supabase Local

## Những thay đổi đã thực hiện

### 1. ✅ Docker Compose
- **File**: `docker-compose.yml`
- **Thay đổi**: Revert về Supabase Local (`https://supabase.hoanong.com`)
- **Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0`

### 2. ✅ External Client (`src/integrations/supabase/externalClient.ts`)
- **Xóa**: Fallback về Supabase Cloud (`pxgdmyszzwamwygvifvj.supabase.co`)
- **Xóa**: Fallback về Lovable Cloud
- **Thay đổi**: Bắt buộc phải có `VITE_SUPABASE_URL` và `VITE_SUPABASE_PUBLISHABLE_KEY`
- **Thay đổi**: `getActiveSupabase()` không còn fallback, throw error nếu không config

### 3. ✅ Schema Fixes
- **File**: `src/hooks/sync/useHabitsSync.ts`
  - Thay `title` → `name`
  - Thay `longest_streak` → `best_streak`
  - Xóa `last_completed`, `archived`, `position` (không có trong schema local)
  - Thêm các columns đúng: `reminder_time`, `reminder_enabled`, `target_per_day`, `target_unit`, `target_days`, `custom_days`, `color`, `icon`, `completed_dates`

- **File**: `src/hooks/sync/useTasksSync.ts`
  - Xóa `reminder_time` (không có trong schema local)
  - Giữ `reminder_minutes` (đúng với schema local)

### 4. ✅ Log Messages
- **File**: `src/hooks/useAuth.tsx`
  - Thay "Lovable Cloud" → "Supabase Local"
  
- **File**: `src/hooks/sync/useDataSync.ts`
  - Thay "Lovable Cloud" → "Supabase Local"

- **File**: `src/components/admin/DatabaseStatusCard.tsx`
  - Thay "Lovable Cloud" → "Supabase Local"

### 5. ✅ CORS Proxy
- **Tạo**: `supabase-cors-proxy/` (nginx reverse proxy)
- **Chức năng**: Thêm CORS headers cho Supabase
- **Routing**: 
  - Cloudflare Tunnel → Traefik → `supabase-cors-proxy` → `supabase_kong_Supabase:8000`

## ⚠️ Cần cập nhật Cloudflare Tunnel

**Bước quan trọng**: Cập nhật Cloudflare Tunnel để route `supabase.hoanong.com` qua Traefik:

1. Vào **Cloudflare Dashboard** > **Zero Trust** > **Networks** > **Tunnels**
2. Chọn tunnel của bạn
3. Tìm route `supabase.hoanong.com`
4. **Cập nhật Service** từ:
   ```
   http://supabase_kong_Supabase:8000
   ```
   Thành:
   ```
   http://traefik:80
   ```
5. **Lưu** và đợi 30-60 giây để Cloudflare cập nhật

## ✅ Kiểm tra

Sau khi cập nhật Cloudflare Tunnel:

1. **Test CORS**: Mở browser console tại `https://life.hoanong.com`
2. **Kiểm tra logs**: `docker logs supabase-cors-proxy` - sẽ thấy OPTIONS requests trả về 204
3. **Test data sync**: Thử tạo habit/task mới và kiểm tra xem có lỗi CORS không

## 📝 Files đã thay đổi

- ✅ `docker-compose.yml`
- ✅ `src/integrations/supabase/externalClient.ts`
- ✅ `src/hooks/sync/useHabitsSync.ts`
- ✅ `src/hooks/sync/useTasksSync.ts`
- ✅ `src/hooks/useAuth.tsx`
- ✅ `src/hooks/sync/useDataSync.ts`
- ✅ `src/components/admin/DatabaseStatusCard.tsx`
- ✅ `supabase-cors-proxy/Dockerfile` (mới)
- ✅ `supabase-cors-proxy/nginx.conf` (mới)

## 🎯 Kết quả

- ✅ App chỉ dùng Supabase Local (`https://supabase.hoanong.com`)
- ✅ Không còn fallback về Supabase Cloud/Lovable Cloud
- ✅ Schema đã match với database local
- ✅ CORS proxy đã sẵn sàng (chờ cập nhật Cloudflare Tunnel)

