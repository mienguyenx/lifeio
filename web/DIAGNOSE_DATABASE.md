# 🔍 Chẩn đoán vấn đề kết nối Database

## ✅ Kết quả kiểm tra

### 1. Supabase Containers
- ✅ Tất cả containers đang chạy (healthy)
- ✅ `supabase_kong_Supabase`: Port 54321 → 8000
- ✅ `supabase_db_Supabase`: Port 54322 → 5432
- ✅ `supabase_auth_Supabase`: Healthy

### 2. Database
- ✅ Database accessible
- ✅ Có 1 user trong database: `daimakervn@gmail.com`
- ✅ User có password

### 3. Network
- ✅ `supabase.hoanong.com` trả về 200 OK
- ✅ Health endpoint hoạt động
- ✅ Container `lifeos-app` có thể ping đến `supabase_kong_Supabase`

### 4. Built Code
- ✅ Đang dùng `https://supabase.hoanong.com` (đúng)
- ✅ Không còn `localhost:54321` trong built code

---

## ⚠️ Vấn đề có thể gặp

### 1. CORS Issues

**Triệu chứng:**
- Browser Console: `CORS policy: No 'Access-Control-Allow-Origin'`
- Network tab: Request bị block

**Giải pháp:**
- Kiểm tra CORS headers trong Supabase config
- Đảm bảo `https://life.hoanong.com` được allow

### 2. Auth Endpoint không hoạt động

**Triệu chứng:**
- Sign in không thành công
- Error: `Invalid login credentials` hoặc `Network error`

**Giải pháp:**
- Test auth endpoint trực tiếp
- Kiểm tra logs của `supabase_auth_Supabase`

### 3. Session không được lưu

**Triệu chứng:**
- Đăng nhập thành công nhưng mất session ngay
- Redirect về trang login

**Giải pháp:**
- Kiểm tra localStorage
- Kiểm tra cookie settings

### 4. Browser Cache

**Triệu chứng:**
- Vẫn dùng code cũ với `localhost:54321`
- Console vẫn log `localhost:54321`

**Giải pháp:**
- Clear browser cache
- Hard reload (Ctrl+Shift+R)
- Test trong tab ẩn danh

---

## 🔧 Các bước debug

### Bước 1: Kiểm tra Browser Console

1. Mở https://life.hoanong.com
2. F12 > Console
3. Tìm log:
   - `Using external Supabase: https://supabase.hoanong.com` ✅
   - `Using local Supabase: http://localhost:54321` ❌
4. Tìm errors:
   - CORS errors
   - Network errors
   - Auth errors

### Bước 2: Kiểm tra Network Tab

1. F12 > Network
2. Thử đăng nhập
3. Tìm request đến Supabase:
   - URL: `https://supabase.hoanong.com/auth/v1/token`
   - Status: 200 (OK) hoặc 400/401 (Error)
   - Response: Xem error message

### Bước 3: Test Auth trực tiếp

```javascript
// Trong Browser Console
const supabaseUrl = 'https://supabase.hoanong.com';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Test sign in
fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': supabaseKey
  },
  body: JSON.stringify({
    email: 'daimakervn@gmail.com',
    password: 'your-password'
  })
})
.then(r => r.json())
.then(data => console.log('Result:', data))
.catch(e => console.error('Error:', e));
```

### Bước 4: Kiểm tra Logs

```powershell
# Supabase Auth logs
docker logs supabase_auth_Supabase --tail=50 | Select-String "error|ERROR|daimakervn"

# Supabase Kong logs
docker logs supabase_kong_Supabase --tail=50 | Select-String "error|ERROR|401|403"

# Application logs
docker logs lifeos-app --tail=50 | Select-String "error|ERROR|supabase"
```

---

## 🎯 Các lỗi thường gặp

### Lỗi 1: "Invalid login credentials"

**Nguyên nhân:**
- Password sai
- User chưa được tạo trong auth.users
- Email chưa được confirm

**Giải pháp:**
```sql
-- Kiểm tra user
SELECT id, email, email_confirmed_at, encrypted_password IS NOT NULL 
FROM auth.users 
WHERE email = 'daimakervn@gmail.com';

-- Reset password (nếu cần)
-- (Cần dùng Supabase Admin API hoặc SQL trực tiếp)
```

### Lỗi 2: CORS Error

**Nguyên nhân:**
- Supabase không allow origin `https://life.hoanong.com`

**Giải pháp:**
- Kiểm tra CORS config trong Supabase
- Thêm `https://life.hoanong.com` vào allowed origins

### Lỗi 3: Network Error

**Nguyên nhân:**
- `supabase.hoanong.com` không accessible từ browser
- Cloudflare Tunnel chưa route đúng

**Giải pháp:**
- Test: `curl https://supabase.hoanong.com/rest/v1/`
- Kiểm tra Cloudflare Tunnel logs
- Kiểm tra DNS

---

## 📋 Checklist Debug

- [ ] Browser Console không có CORS errors
- [ ] Network tab hiển thị request đến `https://supabase.hoanong.com`
- [ ] Auth request trả về 200 hoặc 400 (không phải network error)
- [ ] User tồn tại trong `auth.users`
- [ ] User có password
- [ ] Supabase containers đang healthy
- [ ] `supabase.hoanong.com` accessible từ browser
- [ ] Built code đang dùng `https://supabase.hoanong.com`

---

## 🔍 Test nhanh

### Test 1: Kiểm tra URL trong Console

```javascript
// Trong Browser Console (https://life.hoanong.com)
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
// Kết quả mong đợi: https://supabase.hoanong.com
```

### Test 2: Test kết nối

```javascript
// Trong Browser Console
const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
const supabase = createClient(
  'https://supabase.hoanong.com',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
);

// Test connection
const { data, error } = await supabase.from('profiles').select('id').limit(1);
console.log('Connection test:', error ? 'FAILED' : 'SUCCESS', error);
```

### Test 3: Test Auth

```javascript
// Test sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'daimakervn@gmail.com',
  password: 'your-password'
});
console.log('Auth test:', error ? error.message : 'SUCCESS');
```

---

## 🚨 Nếu vẫn không được

1. **Clear browser cache hoàn toàn:**
   - Ctrl+Shift+Delete
   - Chọn "Cached images and files"
   - Clear data

2. **Test trong tab ẩn danh:**
   - Mở tab ẩn danh
   - Truy cập https://life.hoanong.com
   - Thử đăng nhập

3. **Kiểm tra password:**
   - Đảm bảo password đúng
   - Có thể reset password qua email

4. **Kiểm tra logs chi tiết:**
   ```powershell
   # Xem tất cả logs
   docker logs supabase_auth_Supabase --tail=100
   docker logs supabase_kong_Supabase --tail=100
   docker logs lifeos-app --tail=100
   ```

5. **Test từ máy khác:**
   - Thử từ máy/network khác
   - Xem có phải vấn đề local không

---

## 📞 Thông tin cần cung cấp khi báo lỗi

1. Browser Console errors (screenshot)
2. Network tab - Request đến Supabase (screenshot)
3. Error message chính xác
4. Browser và version
5. Đã thử clear cache chưa
6. Test trong tab ẩn danh có được không

