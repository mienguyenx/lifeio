# Khắc phục màn hình trắng - life.hoanong.com

## Nguyên nhân có thể

### 1. JavaScript Error trong Console

Mở Browser Console (F12) và kiểm tra:
- **Tab Console**: Xem có lỗi màu đỏ không
- **Tab Network**: Xem các file JS/CSS có load được không (status 200)

### 2. Supabase Connection Error

Ứng dụng cần kết nối Supabase để khởi tạo. Kiểm tra:

**Trong Browser Console:**
```javascript
// Kiểm tra Supabase URL
console.log(import.meta.env.VITE_SUPABASE_URL);

// Kiểm tra Supabase Key
console.log(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
```

**Nếu không có environment variables:**
- Ứng dụng sẽ dùng hardcoded values từ `externalClient.ts`
- URL: `https://pxgdmyszzwamwygvifvj.supabase.co`
- Key: Đã có trong code

### 3. CORS Issues

Đã thêm CORS headers trong nginx.conf. Nếu vẫn lỗi:
- Kiểm tra browser console có lỗi CORS không
- Kiểm tra Network tab xem request có bị block không

### 4. Service Worker Issues

Ứng dụng có code unregister service workers. Nếu vẫn có vấn đề:

**Trong Browser Console:**
```javascript
// Unregister tất cả service workers
navigator.serviceWorker.getRegistrations().then(r => r.forEach(sw => sw.unregister()));
```

### 5. React App Crash

Nếu React app crash khi khởi tạo, sẽ thấy màn hình trắng. Kiểm tra:

**Trong Browser Console:**
- Xem có lỗi "Uncaught Error" không
- Xem có lỗi "Cannot read property" không
- Xem có lỗi về imports không

## Các bước khắc phục

### Bước 1: Clear Browser Cache hoàn toàn

1. Mở Developer Tools: `F12`
2. Right-click vào nút Reload
3. Chọn "Empty Cache and Hard Reload"

Hoặc:
- `Ctrl + Shift + Delete`
- Chọn "Cached images and files"
- Chọn "All time"
- Clear data

### Bước 2: Kiểm tra Console Errors

1. Mở Console (F12 > Console tab)
2. Reload trang
3. Xem có lỗi gì không
4. Copy lỗi và kiểm tra

### Bước 3: Kiểm tra Network Requests

1. Mở Network tab (F12 > Network)
2. Reload trang
3. Kiểm tra:
   - `index.html` - Status 200?
   - `index-BIMjmGHk.js` - Status 200?
   - `index-DBw992pm.css` - Status 200?
   - Có request nào bị failed không?

### Bước 4: Test Supabase Connection

**Trong Browser Console:**
```javascript
// Test Supabase connection
fetch('https://pxgdmyszzwamwygvifvj.supabase.co/rest/v1/', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4Z2RteXN6endhbXd5Z3ZpZnZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMTExOTUsImV4cCI6MjA4MTg4NzE5NX0.NHtDHa5NUd6UdqpywQt8YEj8xxRW9Qz4MbgCoqvB9gM'
  }
}).then(r => console.log('Supabase OK:', r.status))
  .catch(e => console.error('Supabase Error:', e));
```

### Bước 5: Kiểm tra React Root

**Trong Browser Console:**
```javascript
// Kiểm tra root element
console.log(document.getElementById('root'));

// Kiểm tra React đã mount chưa
console.log(document.querySelector('#root').innerHTML);
```

## Debug Commands

```bash
# Test từ server
curl -I https://life.hoanong.com
curl -I https://life.hoanong.com/assets/index-BIMjmGHk.js

# Xem logs
docker-compose logs -f lifeos-app
docker-compose logs -f cloudflared

# Test kết nối
docker exec lifeos-app curl http://localhost:80
```

## Nếu vẫn không được

1. **Kiểm tra build có đúng không:**
   - File JS có tồn tại trong container
   - File có size > 0

2. **Kiểm tra nginx config:**
   - CORS headers đã được thêm
   - Content-Type đúng

3. **Kiểm tra browser compatibility:**
   - Thử browser khác
   - Thử Incognito mode

4. **Kiểm tra Supabase:**
   - Supabase project có đang hoạt động không
   - API key có đúng không

