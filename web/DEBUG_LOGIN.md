# 🔍 Debug Login Issues

## Vấn đề: Đăng nhập thất bại, không thấy log

## ✅ Đã thêm logging chi tiết

Đã thêm logging vào `useAuth.tsx` để debug:
- Log khi bắt đầu đăng nhập
- Log Supabase client đang dùng
- Log chi tiết lỗi nếu có
- Log thông tin user nếu thành công

## 📋 Các bước debug

### Bước 1: Mở Browser Console

1. Mở https://life.hoanong.com
2. F12 > Console tab
3. Clear console (Ctrl+L)

### Bước 2: Kiểm tra Debug Utilities

Chạy trong console:

```javascript
// Kiểm tra debug utilities có sẵn không
console.log('Debug available:', typeof window.__LIFEOS_DEBUG__ !== 'undefined');

// Xem Supabase URL
console.log('Supabase URL:', window.__LIFEOS_DEBUG__?.supabaseUrl);

// Test kết nối
await window.__LIFEOS_DEBUG__.checkConnection()
```

**Kết quả mong đợi:**
- `Debug available: true`
- `Supabase URL: https://supabase.hoanong.com`
- Connection test: `{ success: true }` hoặc error message

### Bước 3: Thử đăng nhập và xem logs

1. Điền email và password
2. Click "Đăng nhập"
3. Xem console logs:

**Logs mong đợi:**
```
[Auth] Attempting sign in for: daimakervn@gmail.com
[Auth] Using Supabase: External
```

**Nếu thành công:**
```
[Auth] Sign in successful: { userId: "...", email: "...", session: "Yes" }
```

**Nếu thất bại:**
```
[Auth] Sign in failed: { message: "...", status: ..., name: "..." }
```

### Bước 4: Kiểm tra Network Tab

1. F12 > Network tab
2. Thử đăng nhập
3. Tìm request: `token` hoặc `auth/v1/token`
4. Click vào request và xem:
   - **Status**: 200 (OK) hoặc 400/401 (Error)
   - **Request URL**: Phải là `https://supabase.hoanong.com/auth/v1/token`
   - **Response**: Xem error message nếu có

### Bước 5: Test Auth trực tiếp

Chạy trong console:

```javascript
// Test với credentials thật
const supabase = window.__LIFEOS_DEBUG__.getActiveSupabase();
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'daimakervn@gmail.com',
  password: 'your-password-here'
});

if (error) {
  console.error('Login error:', error.message, error.status);
} else {
  console.log('Login success:', data.user.email);
}
```

## 🚨 Các lỗi thường gặp

### Lỗi 1: "Invalid login credentials"

**Nguyên nhân:**
- Password sai
- User chưa tồn tại trong database
- Email chưa được confirm

**Giải pháp:**
```sql
-- Kiểm tra user trong database
SELECT id, email, email_confirmed_at, encrypted_password IS NOT NULL as has_password
FROM auth.users 
WHERE email = 'daimakervn@gmail.com';
```

### Lỗi 2: Network Error / CORS Error

**Nguyên nhân:**
- Supabase URL không accessible
- CORS không được config đúng

**Giải pháp:**
```javascript
// Test network
fetch('https://supabase.hoanong.com/rest/v1/', {
  method: 'HEAD',
  headers: { 'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
})
.then(r => console.log('Status:', r.status))
.catch(e => console.error('Error:', e));
```

### Lỗi 3: "Supabase client not initialized"

**Nguyên nhân:**
- `externalSupabase` là null
- Environment variables không được set đúng

**Giải pháp:**
- Kiểm tra `docker-compose.yml` có `VITE_SUPABASE_URL` và `VITE_SUPABASE_PUBLISHABLE_KEY`
- Rebuild container: `docker-compose build --no-cache lifeos-app`

## 🔧 Quick Test Script

Copy và paste vào browser console:

```javascript
async function quickAuthTest() {
  console.log('=== Quick Auth Test ===');
  
  // 1. Check debug
  if (!window.__LIFEOS_DEBUG__) {
    console.error('❌ Debug utilities not available');
    return;
  }
  console.log('✅ Debug utilities OK');
  
  // 2. Check connection
  const conn = await window.__LIFEOS_DEBUG__.checkConnection();
  console.log('Connection:', conn.success ? '✅ OK' : '❌ FAILED - ' + conn.error);
  
  // 3. Check session
  const session = await window.__LIFEOS_DEBUG__.checkSession();
  console.log('Session:', session.hasSession ? '✅ Logged in' : 'ℹ️ Not logged in');
  
  // 4. Test auth endpoint
  const supabase = window.__LIFEOS_DEBUG__.getActiveSupabase();
  if (supabase) {
    console.log('✅ Supabase client available');
    console.log('URL:', window.__LIFEOS_DEBUG__.supabaseUrl);
  } else {
    console.error('❌ Supabase client not available');
  }
  
  console.log('=== Test Complete ===');
}

quickAuthTest();
```

## 📞 Thông tin cần cung cấp khi báo lỗi

1. **Console logs** (screenshot hoặc copy/paste)
   - Tất cả logs có prefix `[Auth]`
   - Bất kỳ error nào

2. **Network tab** (screenshot)
   - Request đến `/auth/v1/token`
   - Status code và response

3. **Debug test results**
   - Kết quả của `quickAuthTest()`
   - Kết quả của `checkConnection()`

4. **Browser info**
   - Browser và version
   - Đã clear cache chưa
   - Test trong tab ẩn danh có được không

