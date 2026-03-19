# 🔍 Cách kiểm tra Supabase trong Browser Console

## ✅ Đã thêm Debug Helper

App đã expose thông tin debug ra `window.__LIFEOS_DEBUG__` để có thể kiểm tra trong browser console.

## 📋 Cách sử dụng:

### 1. Mở Browser Console (F12)

### 2. Kiểm tra thông tin Supabase:

```javascript
// Xem thông tin Supabase
__LIFEOS_DEBUG__.supabaseUrl
// Kết quả: "https://supabase.hoanong.com" hoặc "https://pxgdmyszzwamwygvifvj.supabase.co"

// Kiểm tra có phải Local Supabase không
__LIFEOS_DEBUG__.isLocal
// Kết quả: true hoặc false

// Kiểm tra có được cấu hình không
__LIFEOS_DEBUG__.isConfigured
// Kết quả: true hoặc false
```

### 3. Kiểm tra kết nối Supabase:

```javascript
// Test kết nối đến Supabase
await __LIFEOS_DEBUG__.checkConnection()
// Kết quả: { success: true/false, error: "..." }
```

### 4. Kiểm tra Session (đăng nhập):

```javascript
// Kiểm tra user có đăng nhập không
await __LIFEOS_DEBUG__.checkSession()
// Kết quả: { hasSession: true/false, userId: "...", expiresAt: ..., error: "..." }
```

### 5. Kiểm tra tất cả thông tin:

```javascript
// Xem tất cả thông tin
console.log(__LIFEOS_DEBUG__)
```

## 🎯 Ví dụ kiểm tra đầy đủ:

```javascript
// 1. Kiểm tra Supabase URL
console.log('Supabase URL:', __LIFEOS_DEBUG__.supabaseUrl);

// 2. Kiểm tra kết nối
const connection = await __LIFEOS_DEBUG__.checkConnection();
console.log('Connection:', connection);

// 3. Kiểm tra session
const session = await __LIFEOS_DEBUG__.checkSession();
console.log('Session:', session);

// 4. Nếu có session, test query
if (session.hasSession) {
  const { data, error } = await __LIFEOS_DEBUG__.getActiveSupabase()
    .from('learning_books')
    .select('*')
    .limit(5);
  console.log('Learning Books:', data, error);
}
```

## ⚠️ Lưu ý:

- `import.meta.env` không thể dùng trong browser console (chỉ hoạt động trong ES modules)
- Dùng `__LIFEOS_DEBUG__` thay thế để kiểm tra
- Tất cả thông tin đã được log khi app khởi động (xem console khi load trang)

## 🔧 Debug Sync Issues:

Nếu không thấy data sync:

1. **Kiểm tra Supabase URL:**
   ```javascript
   __LIFEOS_DEBUG__.supabaseUrl
   ```
   - Nếu là `https://supabase.hoanong.com` → Local Supabase (đã có migration)
   - Nếu là `https://pxgdmyszzwamwygvifvj.supabase.co` → External Cloud (cần chạy migration)

2. **Kiểm tra Session:**
   ```javascript
   await __LIFEOS_DEBUG__.checkSession()
   ```
   - Nếu `hasSession: false` → User chưa đăng nhập → Cần đăng nhập trước

3. **Kiểm tra Connection:**
   ```javascript
   await __LIFEOS_DEBUG__.checkConnection()
   ```
   - Nếu `success: false` → Có lỗi kết nối → Xem `error` để biết chi tiết

4. **Test Query:**
   ```javascript
   const { data, error } = await __LIFEOS_DEBUG__.getActiveSupabase()
     .from('learning_books')
     .select('*');
   console.log('Data:', data, 'Error:', error);
   ```

