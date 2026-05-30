# ✅ Đồng bộ Google Drive Token vào Supabase Database

## 🎯 Mục đích

Thay vì chỉ lưu token vào `localStorage` (chỉ tồn tại trên một thiết bị), giờ token được đồng bộ vào Supabase database để:
- ✅ **Sync giữa các thiết bị** - Token có thể được dùng trên nhiều thiết bị
- ✅ **Không mất khi clear cache** - Token được lưu trong database
- ✅ **Quản lý tốt hơn** - Admin có thể xem và quản lý tokens
- ✅ **Backup tự động** - Token được backup cùng với dữ liệu khác

## 📋 Các thay đổi

### 1. Database Migration

**File**: `supabase/migrations/20251227000001_add_google_drive_tokens.sql`

Tạo bảng `google_drive_tokens` với các trường:
- `user_id` - ID của user (unique, một token per user)
- `access_token` - Google Drive access token
- `refresh_token` - Refresh token (nếu có)
- `expires_at` - Thời gian hết hạn
- `scope` - OAuth scopes đã được cấp
- `created_at`, `updated_at` - Timestamps

**RLS Policies**:
- Users chỉ có thể xem/sửa token của chính mình
- Admins có thể xem/quản lý tất cả tokens

### 2. Service Updates

**File**: `src/services/googleDriveService.ts`

**Thay đổi chính**:
- ✅ `loadToken()` - Load từ Supabase trước, fallback về localStorage
- ✅ `saveToken()` - Lưu vào cả Supabase và localStorage
- ✅ `clearToken()` - Xóa từ cả Supabase và localStorage
- ✅ `isSignedIn()` - Giờ là async function, check Supabase trước
- ✅ `signOut()` - Giờ là async function, xóa từ Supabase

**Flow**:
1. Khi user kết nối Google Drive → Token được lưu vào Supabase + localStorage
2. Khi load lại → Ưu tiên load từ Supabase, nếu không có thì load từ localStorage
3. Khi sign out → Xóa từ cả Supabase và localStorage

### 3. Hook Updates

**Files**:
- `src/hooks/useAdminGoogleDriveBackup.ts`
- `src/hooks/useGoogleDriveBackup.ts`

**Thay đổi**:
- Tất cả calls đến `isSignedIn()` và `signOut()` đã được update để await

## 🚀 Cách sử dụng

### Bước 1: Chạy Migration

Chạy migration SQL trong Supabase Dashboard:

```sql
-- Copy nội dung từ file: run-google-drive-tokens-migration.sql
-- Hoặc chạy migration file: supabase/migrations/20251227000001_add_google_drive_tokens.sql
```

### Bước 2: Rebuild Application

```bash
cd remix-of-remix-of-lifeos-mobile-v3.copy
docker-compose build lifeos-app
docker-compose up -d --force-recreate lifeos-app
```

### Bước 3: Test

1. **Kết nối Google Drive**:
   - Vào Admin Panel → Backup
   - Click "Kết nối Google Drive"
   - Chọn tài khoản và cấp quyền

2. **Kiểm tra token được lưu**:
   - Mở Supabase Dashboard → Table Editor → `google_drive_tokens`
   - Kiểm tra có record với `user_id` của bạn
   - Kiểm tra `access_token` và `expires_at`

3. **Test sync giữa các thiết bị**:
   - Kết nối Google Drive trên thiết bị A
   - Mở ứng dụng trên thiết bị B (cùng user)
   - Kiểm tra tự động kết nối (không cần đăng nhập lại)

4. **Test refresh**:
   - Refresh trang
   - Token được load từ Supabase
   - Vẫn hiển thị "Đã kết nối"

## 🔒 Bảo mật

### Hiện tại
- Token được lưu dạng plain text trong database
- RLS policies đảm bảo users chỉ thấy token của mình
- Token tự động expire sau 1 giờ

### Khuyến nghị cho Production
- **Encrypt token** trước khi lưu vào database
- Sử dụng Supabase Vault hoặc encryption functions
- Hoặc encrypt ở application level trước khi save

## 📊 Database Schema

```sql
CREATE TABLE public.google_drive_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type TEXT DEFAULT 'Bearer',
  expires_at TIMESTAMPTZ NOT NULL,
  scope TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
```

## ✅ Kết quả

Sau khi implement:
- ✅ Token được lưu vào Supabase database
- ✅ Token được sync giữa các thiết bị
- ✅ Token không mất khi clear browser cache
- ✅ Token tự động expire và được xóa khi hết hạn
- ✅ localStorage vẫn được dùng làm fallback/cache
- ✅ Admin có thể quản lý tokens của tất cả users

## 🔍 Troubleshooting

### Token không được lưu vào Supabase
- Kiểm tra user đã đăng nhập chưa (`auth.uid()`)
- Kiểm tra RLS policies đã được tạo chưa
- Kiểm tra console logs để xem lỗi

### Token không được load từ Supabase
- Kiểm tra có record trong bảng `google_drive_tokens`
- Kiểm tra `expires_at` chưa hết hạn
- Kiểm tra `user_id` khớp với user hiện tại

### Lỗi RLS Policy
- Đảm bảo migration đã chạy thành công
- Kiểm tra function `has_role()` đã tồn tại
- Kiểm tra user có role 'admin' nếu cần

