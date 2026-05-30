# 🔧 Fix Lỗi 406 Not Acceptable - Google Drive Tokens

## ⚠️ Vấn đề

Lỗi **406 (Not Acceptable)** khi gọi API đến bảng `google_drive_tokens`:
```
GET https://supabase.hoanong.com/rest/v1/google_drive_tokens?select=access_token%2Cexpires_at&user_id=eq.xxx
Status: 406 Not Acceptable
```

## 🔍 Nguyên nhân

Lỗi 406 thường xảy ra khi:
1. **Bảng `google_drive_tokens` chưa được tạo** trong database
2. **RLS policies chưa được setup**
3. **Migration SQL chưa được chạy**

## ✅ Giải pháp

### Bước 1: Chạy Migration SQL

**Quan trọng**: Bạn cần chạy migration SQL để tạo bảng `google_drive_tokens`.

#### Cách 1: Chạy trong Supabase Dashboard (Khuyến nghị)

1. Mở Supabase Dashboard:
   - Local: `http://localhost:54323` hoặc `https://supabase.hoanong.com`
   - Cloud: `https://supabase.com/dashboard`

2. Vào **SQL Editor**

3. Copy toàn bộ nội dung từ file:
   ```
   run-google-drive-tokens-migration.sql
   ```
   Hoặc từ:
   ```
   supabase/migrations/20251227000001_add_google_drive_tokens.sql
   ```

4. Paste vào SQL Editor

5. Click **Run** để chạy migration

6. Kiểm tra kết quả:
   - Nếu thành công: Sẽ thấy message "Success. No rows returned"
   - Nếu có lỗi: Xem error message và sửa

#### Cách 2: Chạy bằng Supabase CLI

```bash
# Nếu dùng Supabase CLI
cd remix-of-remix-of-lifeos-mobile-v3.copy
supabase migration up
```

#### Cách 3: Chạy trực tiếp trong PostgreSQL

```bash
# Nếu dùng Docker
docker exec -i supabase_db_Supabase psql -U postgres -d postgres < run-google-drive-tokens-migration.sql
```

### Bước 2: Kiểm tra bảng đã được tạo

Sau khi chạy migration, kiểm tra:

#### Trong Supabase Dashboard:
1. Vào **Table Editor**
2. Tìm bảng `google_drive_tokens`
3. Kiểm tra có các columns:
   - `id`
   - `user_id`
   - `access_token`
   - `expires_at`
   - `token_type`
   - `scope`
   - `created_at`
   - `updated_at`

#### Hoặc chạy SQL:
```sql
-- Kiểm tra bảng tồn tại
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'google_drive_tokens'
);

-- Kiểm tra RLS policies
SELECT * FROM pg_policies 
WHERE tablename = 'google_drive_tokens';
```

### Bước 3: Rebuild Application

```bash
cd remix-of-remix-of-lifeos-mobile-v3.copy
docker-compose build lifeos-app
docker-compose up -d --force-recreate lifeos-app
```

### Bước 4: Test lại

1. **Refresh trang** Admin Panel
2. **Kiểm tra Console**:
   - Không còn lỗi 406
   - Có thể thấy log: "Token saved to Supabase successfully"

3. **Kết nối Google Drive lại**:
   - Click "Kết nối Google Drive"
   - Chọn tài khoản và cấp quyền
   - Kiểm tra token được lưu vào Supabase

## 🔍 Troubleshooting

### Vẫn còn lỗi 406 sau khi chạy migration

**Kiểm tra**:
1. Migration có chạy thành công không?
   ```sql
   SELECT * FROM google_drive_tokens LIMIT 1;
   ```

2. RLS policies có được tạo không?
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'google_drive_tokens';
   ```

3. User có đăng nhập không?
   - Kiểm tra trong console: `auth.uid()` có giá trị không

4. User có trong bảng `profiles` không?
   ```sql
   SELECT id FROM profiles WHERE id = auth.uid();
   ```

### Lỗi "relation does not exist"

**Nguyên nhân**: Migration chưa chạy hoặc chạy sai database

**Giải pháp**:
- Chạy lại migration SQL
- Kiểm tra đang kết nối đúng database (local vs cloud)

### Lỗi "permission denied"

**Nguyên nhân**: RLS policies chưa được setup đúng

**Giải pháp**:
- Chạy lại phần RLS policies trong migration SQL
- Kiểm tra user có đăng nhập không

## 📝 Code Changes

Đã cải thiện error handling trong code:

1. **Sử dụng `maybeSingle()`** thay vì `single()` để tránh lỗi khi không có rows
2. **Handle lỗi 406 gracefully** - Fallback về localStorage nếu Supabase không accessible
3. **Better error messages** - Log rõ ràng khi nào cần chạy migration

## ✅ Kết quả mong đợi

Sau khi fix:
- ✅ Không còn lỗi 406 trong console
- ✅ Token được lưu vào Supabase database
- ✅ Token được sync giữa các thiết bị
- ✅ Token không mất khi refresh trang
- ✅ Fallback về localStorage nếu Supabase không available

## 🔗 Files liên quan

- `run-google-drive-tokens-migration.sql` - SQL script để chạy migration
- `supabase/migrations/20251227000001_add_google_drive_tokens.sql` - Migration file
- `src/services/googleDriveService.ts` - Service với improved error handling

