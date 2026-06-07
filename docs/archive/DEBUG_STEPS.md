# 🔍 Hướng dẫn Debug Màn hình trắng

## ⚠️ Vấn đề có thể xảy ra

Ứng dụng LifeOS sử dụng **ProtectedRoute** - nó sẽ:
1. Hiển thị **loader** khi đang kiểm tra auth (`loading = true`)
2. **Redirect** đến `/auth` nếu chưa đăng nhập
3. Hiển thị app nếu đã đăng nhập

Nếu màn hình trắng, có thể:
- JavaScript error khi khởi tạo Supabase
- Supabase không kết nối được
- `loading` state không bao giờ set về `false`

## 📋 Các bước kiểm tra

### Bước 1: Mở Browser Console

1. Truy cập: https://life.hoanong.com
2. Nhấn `F12` để mở Developer Tools
3. Vào tab **Console**
4. Reload trang (`F5`)

**Kiểm tra:**
- ✅ Có log `"Auth using: External Supabase"` hoặc `"Auth using: Lovable Cloud"`?
- ❌ Có lỗi màu đỏ nào không?
- ❌ Có lỗi về Supabase không?

### Bước 2: Kiểm tra Network Requests

1. Vào tab **Network**
2. Reload trang (`F5`)
3. Kiểm tra các file:

| File | Status | Ghi chú |
|------|--------|---------|
| `index.html` | 200? | HTML chính |
| `index-BIMjmGHk.js` | 200? | JavaScript bundle |
| `index-DBw992pm.css` | 200? | CSS styles |

**Nếu có file nào failed:**
- Kiểm tra lỗi trong tab Network
- Xem có lỗi CORS không

### Bước 3: Test Supabase Connection

**Trong Browser Console, chạy:**

```javascript
// Test Supabase connection
fetch('https://pxgdmyszzwamwygvifvj.supabase.co/rest/v1/', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4Z2RteXN6endhbXd5Z3ZpZnZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMTExOTUsImV4cCI6MjA4MTg4NzE5NX0.NHtDHa5NUd6UdqpywQt8YEj8xxRW9Qz4MbgCoqvB9gM'
  }
})
.then(r => console.log('✅ Supabase OK:', r.status))
.catch(e => console.error('❌ Supabase Error:', e));
```

**Kết quả mong đợi:**
- ✅ `Supabase OK: 200` hoặc `401` (401 là bình thường, chỉ cần kết nối được)
- ❌ Nếu lỗi: Có thể Supabase bị block hoặc không truy cập được

### Bước 4: Kiểm tra React Root

**Trong Browser Console:**

```javascript
// Kiểm tra root element
const root = document.getElementById('root');
console.log('Root:', root);
console.log('Root innerHTML:', root?.innerHTML);

// Kiểm tra React đã mount chưa
console.log('React mounted:', root?.hasChildNodes());
```

**Kết quả mong đợi:**
- Root element phải tồn tại
- Nếu React đã mount, sẽ có child nodes

### Bước 5: Kiểm tra Auth State

**Trong Browser Console:**

```javascript
// Kiểm tra localStorage
console.log('localStorage:', {
  'supabase.auth.token': localStorage.getItem('supabase.auth.token'),
  'external-supabase-auth': localStorage.getItem('external-supabase-auth')
});

// Kiểm tra session
import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm').then(({ createClient }) => {
  const supabase = createClient(
    'https://pxgdmyszzwamwygvifvj.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4Z2RteXN6endhbXd5Z3ZpZnZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMTExOTUsImV4cCI6MjA4MTg4NzE5NX0.NHtDHa5NUd6UdqpywQt8YEj8xxRW9Qz4MbgCoqvB9gM'
  );
  supabase.auth.getSession().then(({ data, error }) => {
    console.log('Session:', data?.session ? '✅ Có session' : '❌ Không có session');
    console.log('Error:', error);
  });
});
```

## 🛠️ Các lỗi thường gặp

### Lỗi 1: "Failed to fetch" hoặc CORS error

**Nguyên nhân:** Supabase bị block hoặc CORS không đúng

**Giải pháp:**
- Kiểm tra firewall/antivirus
- Kiểm tra network connection
- Thử browser khác

### Lỗi 2: "Cannot read property 'auth' of undefined"

**Nguyên nhân:** Supabase client không khởi tạo được

**Giải pháp:**
- Kiểm tra environment variables
- Kiểm tra Supabase URL và Key

### Lỗi 3: Màn hình trắng, không có lỗi

**Nguyên nhân:** React app crash im lặng hoặc loading state không bao giờ false

**Giải pháp:**
- Kiểm tra React DevTools
- Kiểm tra xem có component nào render không
- Thử truy cập `/auth` trực tiếp

## 🎯 Test nhanh

**Truy cập trực tiếp trang auth:**
```
https://life.hoanong.com/auth
```

Nếu trang auth hiển thị được → Vấn đề là ở ProtectedRoute hoặc auth flow
Nếu trang auth cũng trắng → Vấn đề là ở React app initialization

## 📞 Thông tin cần cung cấp khi báo lỗi

1. **Console errors:** Copy tất cả lỗi trong Console
2. **Network tab:** Screenshot các request failed
3. **Browser:** Tên và version (Chrome, Firefox, Edge...)
4. **OS:** Windows, Mac, Linux...
5. **Kết quả test Supabase:** Status code khi test connection

