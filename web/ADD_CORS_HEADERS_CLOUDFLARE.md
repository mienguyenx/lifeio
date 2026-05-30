# 🔧 Thêm CORS Headers trong Cloudflare Tunnel

## Vấn đề

Supabase cần CORS headers để browser có thể gọi API từ `https://life.hoanong.com`. Nếu không có, sẽ bị lỗi:
```
Access to fetch at 'https://supabase.hoanong.com/...' from origin 'https://life.hoanong.com' has been blocked by CORS policy
```

## Cách thêm CORS Headers trong Cloudflare Dashboard

### Bước 1: Vào Cloudflare Dashboard

1. Truy cập: https://dash.cloudflare.com
2. Đăng nhập vào tài khoản của bạn
3. Vào **Zero Trust** > **Networks** > **Tunnels**
4. Chọn tunnel của bạn (tunnel đang dùng cho `life.hoanong.com`)

### Bước 2: Tìm route Supabase

1. Vào tab **Published application routes**
2. Tìm route: `supabase.hoanong.com`
3. Click vào menu (3 chấm dọc) bên phải > **Edit**

### Bước 3: Thêm Origin Request Configuration

Trong màn hình edit route, tìm phần **Origin Request** hoặc **HTTP Headers**:

1. Click **+ Add** hoặc **Edit** trong phần **Origin Request**
2. Tìm phần **HTTP Headers** hoặc **Custom Headers**
3. Thêm các headers sau:

#### Cách 1: Thêm từng header riêng lẻ

Click **+ Add header** và thêm từng header:

| Header Name | Header Value |
|------------|--------------|
| `Access-Control-Allow-Origin` | `https://life.hoanong.com` |
| `Access-Control-Allow-Methods` | `POST, GET, OPTIONS, PUT, DELETE, PATCH` |
| `Access-Control-Allow-Headers` | `Content-Type, Authorization, apikey, x-client-info` |
| `Access-Control-Allow-Credentials` | `true` |
| `Access-Control-Max-Age` | `86400` |

#### Cách 2: Dùng Origin Request Config (nếu có)

Nếu Cloudflare có phần **Origin Request** với format JSON hoặc YAML:

```yaml
originRequest:
  httpHostHeader: ""
  noHappyEyeballs: false
  keepAliveConnections: 0
  keepAliveTimeout: 0s
  httpHeaders:
    Access-Control-Allow-Origin: "https://life.hoanong.com"
    Access-Control-Allow-Methods: "POST, GET, OPTIONS, PUT, DELETE, PATCH"
    Access-Control-Allow-Headers: "Content-Type, Authorization, apikey, x-client-info"
    Access-Control-Allow-Credentials: "true"
    Access-Control-Max-Age: "86400"
```

### Bước 4: Save và đợi

1. Click **Save** hoặc **Update**
2. Đợi 30-60 giây để Cloudflare cập nhật config
3. Cloudflare Tunnel sẽ tự động reload config

### Bước 5: Test CORS

Mở Browser Console tại `https://life.hoanong.com` và chạy:

```javascript
// Test CORS
fetch('https://supabase.hoanong.com/rest/v1/', {
  method: 'OPTIONS',
  headers: {
    'Origin': 'https://life.hoanong.com',
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'Content-Type, Authorization, apikey'
  }
})
.then(r => {
  console.log('✅ CORS Headers:', {
    'Access-Control-Allow-Origin': r.headers.get('Access-Control-Allow-Origin'),
    'Access-Control-Allow-Methods': r.headers.get('Access-Control-Allow-Methods'),
    'Access-Control-Allow-Headers': r.headers.get('Access-Control-Allow-Headers'),
    'Access-Control-Allow-Credentials': r.headers.get('Access-Control-Allow-Credentials')
  });
})
.catch(e => console.error('❌ CORS Error:', e));
```

**Kết quả mong đợi:**
- `Access-Control-Allow-Origin: https://life.hoanong.com`
- `Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE, PATCH`
- `Access-Control-Allow-Headers: Content-Type, Authorization, apikey, x-client-info`
- `Access-Control-Allow-Credentials: true`

## Lưu ý quan trọng

### ⚠️ Vấn đề: Headers trong `httpHostHeader`

Nếu Cloudflare chỉ có field `httpHostHeader` (không có phần HTTP Headers riêng), **KHÔNG** đặt CORS headers vào đó!

`httpHostHeader` chỉ dùng để override Host header, không phải response headers.

### ✅ Giải pháp thay thế: Dùng Cloudflare Transform Rules

Nếu Cloudflare Dashboard không có option thêm HTTP Headers trong Origin Request:

1. Vào **Zero Trust** > **Networks** > **Tunnels**
2. Chọn tunnel của bạn
3. Vào tab **Transform Rules** hoặc **Access Rules**
4. Tạo rule mới:
   - **Rule name**: `Add CORS headers for Supabase`
   - **Condition**: `Host eq supabase.hoanong.com`
   - **Action**: Add response headers
   - **Headers**: (giống như trên)

### Hoặc: Dùng Cloudflare Workers (Nâng cao)

Nếu không có option trên, có thể dùng Cloudflare Workers để thêm CORS headers:

```javascript
// Worker script
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const response = await fetch(request);
  
  // Clone response để có thể modify headers
  const newResponse = new Response(response.body, response);
  
  // Thêm CORS headers
  newResponse.headers.set('Access-Control-Allow-Origin', 'https://life.hoanong.com');
  newResponse.headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, PUT, DELETE, PATCH');
  newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey, x-client-info');
  newResponse.headers.set('Access-Control-Allow-Credentials', 'true');
  newResponse.headers.set('Access-Control-Max-Age', '86400');
  
  return newResponse;
}
```

## Kiểm tra sau khi thêm

1. **Test trong Browser Console:**
   ```javascript
   fetch('https://supabase.hoanong.com/auth/v1/token?grant_type=password', {
     method: 'OPTIONS',
     headers: { 'Origin': 'https://life.hoanong.com' }
   })
   .then(r => console.log('CORS OK:', r.status === 200 || r.status === 204))
   ```

2. **Test login thực tế:**
   - Mở https://life.hoanong.com
   - Thử đăng nhập
   - Kiểm tra Console - không còn CORS error

3. **Kiểm tra Network tab:**
   - F12 > Network
   - Tìm request đến `supabase.hoanong.com`
   - Xem Response Headers có CORS headers không

## Troubleshooting

### Headers không xuất hiện

1. Đợi thêm 1-2 phút để Cloudflare sync
2. Restart Cloudflare Tunnel:
   ```powershell
   docker restart cloudflared-lifeos
   ```
3. Kiểm tra logs:
   ```powershell
   docker-compose logs cloudflared | Select-String "supabase"
   ```

### Vẫn bị CORS error

1. Kiểm tra Origin header trong request:
   - Phải là `https://life.hoanong.com` (không có trailing slash)
2. Kiểm tra `Access-Control-Allow-Origin`:
   - Phải khớp chính xác với Origin
   - Không có wildcard `*` nếu dùng credentials
3. Kiểm tra preflight (OPTIONS) request:
   - Browser sẽ gửi OPTIONS request trước
   - OPTIONS request phải trả về 200/204 với CORS headers

## Tóm tắt

**Các headers cần thêm:**
- `Access-Control-Allow-Origin: https://life.hoanong.com`
- `Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE, PATCH`
- `Access-Control-Allow-Headers: Content-Type, Authorization, apikey, x-client-info`
- `Access-Control-Allow-Credentials: true`
- `Access-Control-Max-Age: 86400`

**Nơi thêm:** Cloudflare Dashboard > Zero Trust > Networks > Tunnels > [Your Tunnel] > Published application routes > supabase.hoanong.com > Edit > Origin Request > HTTP Headers

