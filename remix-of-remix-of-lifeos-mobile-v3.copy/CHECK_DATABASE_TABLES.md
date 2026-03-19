# 🔍 Kiểm tra Database Tables

## Kết quả kiểm tra

### ✅ Các bảng đã được tạo trong Local Supabase:

1. **health_logs** - ✓ Đã tạo
2. **finance_transactions** - ✓ Đã tạo  
3. **learning_courses** - ✓ Đã tạo
4. **learning_books** - ✓ Đã tạo
5. **relationships_contacts** - ✓ Đã tạo
6. **relationships_interactions** - ✓ Đã tạo

### ✅ RLS Policies đã được tạo:

Tất cả 6 bảng đều có đầy đủ 4 policies (SELECT, INSERT, UPDATE, DELETE)

### ⚠️ Vấn đề:

**Các bảng mới không có data**, trong khi các bảng cũ đã có:
- `habits`: 77 rows
- `goals`: 50 rows  
- `tasks`: 117 rows
- `journal_entries`: 54 rows

**Các bảng mới:**
- `health_logs`: 0 rows
- `finance_transactions`: 0 rows
- `learning_courses`: 0 rows
- `learning_books`: 0 rows
- `relationships_contacts`: 0 rows
- `relationships_interactions`: 0 rows

## 🔍 Nguyên nhân có thể:

1. **App đang kết nối đến Supabase khác** (external cloud thay vì local)
2. **User chưa thêm data vào các module mới**
3. **Có lỗi khi sync data** (cần kiểm tra browser console)

## ✅ Cách kiểm tra:

### 1. Kiểm tra app đang kết nối đến Supabase nào:

**Trong Browser Console (F12):**
```javascript
// Kiểm tra environment variables
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);

// Kiểm tra Supabase client
import { activeSupabase } from '@/integrations/supabase/externalClient';
console.log('Supabase URL:', activeSupabase.supabaseUrl);
```

**Kết quả mong đợi:**
- Nếu dùng local: `https://supabase.hoanong.com` hoặc `http://localhost:54321`
- Nếu dùng external cloud: `https://pxgdmyszzwamwygvifvj.supabase.co`

### 2. Kiểm tra có lỗi khi sync:

**Trong Browser Console khi thêm data:**
- Tìm logs: `[LearningSync]`, `[HealthSync]`, `[FinanceSync]`, `[RelationshipsSync]`
- Xem có lỗi: `Error saving...` hoặc `Error syncing...`

### 3. Test thêm data:

1. Mở module "Học tập" (Learning)
2. Thêm một sách mới
3. Xem console logs
4. Kiểm tra database:
   ```sql
   SELECT * FROM learning_books ORDER BY created_at DESC LIMIT 5;
   ```

## 🔧 Giải pháp:

### Nếu app đang kết nối đến External Supabase Cloud:

Cần chạy migration trên External Supabase Cloud:

1. Mở Supabase Dashboard: https://app.supabase.com
2. Vào SQL Editor
3. Copy và chạy migration file: `supabase/migrations/20250122000000_add_area_modules_tables.sql`

### Nếu app đang kết nối đến Local Supabase:

Migration đã chạy rồi, nhưng cần:
1. Kiểm tra user có đăng nhập không
2. Kiểm tra có lỗi khi sync không (xem console logs)
3. Test thêm data và xem có được lưu không

## 📝 Lưu ý:

- Migration chỉ chạy trên database mà app đang kết nối
- Nếu app kết nối đến external cloud, cần chạy migration trên cloud
- Nếu app kết nối đến local, migration đã chạy rồi (đã kiểm tra)

