# 🔧 Cách thêm nhiều CORS Headers trong Cloudflare

## ⚠️ Vấn đề

Trong màn hình **Service** của Cloudflare Tunnel, bạn chỉ thấy:
- **HTTP Host Header** (chỉ dùng cho request, không phải response)
- Không có option thêm **Response Headers** (CORS headers)

## ✅ Giải pháp: Dùng Transform Rules

Cloudflare Zero Trust có **Transform Rules** để thêm response headers.

### Cách 1: Transform Rules (Khuyến nghị) ⭐

1. **Vào Cloudflare Dashboard:**
   - Zero Trust > Networks > Tunnels
   - Chọn tunnel của bạn
   - Vào tab **Transform Rules** hoặc **Access Rules**

2. **Tạo Rule mới:**
   - Click **+ Add rule** hoặc **Create rule**
   - **Rule name**: `Add CORS headers for Supabase`

3. **Cấu hình Rule:**
   - **Condition** (Khi nào áp dụng):
     ```
     Host eq supabase.hoanong.com
     ```
   - **Action** (Hành động):
     - Chọn **Add response header** hoặc **Set response header**
     - Thêm từng header một:

   | Header Name | Header Value |
   |------------|--------------|
   | `Access-Control-Allow-Origin` | `https://life.hoanong.com` |
   | `Access-Control-Allow-Methods` | `POST, GET, OPTIONS, PUT, DELETE, PATCH` |
   | `Access-Control-Allow-Headers` | `Content-Type, Authorization, apikey, x-client-info` |
   | `Access-Control-Allow-Credentials` | `true` |
   | `Access-Control-Max-Age` | `86400` |

4. **Save** và đợi 30-60 giây

### Cách 2: Cấu hình ở Supabase (Kong) Level

Nếu Supabase Local dùng Kong, có thể thêm CORS headers ở Kong level:

1. **Truy cập Supabase Studio:**
   ```
   http://localhost:54323
   ```

2. **Vào Kong Admin API** (nếu có):
   ```
   http://localhost:8001
   ```

3. **Thêm CORS plugin cho Kong:**
   ```bash
   curl -X POST http://localhost:8001/services/supabase/plugins \
     --data "name=cors" \
     --data "config.origins=https://life.hoanong.com" \
     --data "config.methods=GET,POST,PUT,DELETE,PATCH,OPTIONS" \
     --data "config.headers=Content-Type,Authorization,apikey,x-client-info" \
     --data "config.credentials=true" \
     --data "config.max_age=86400"
   ```

   **Hoặc** nếu có file config Kong:
   ```yaml
   # kong.yml
   plugins:
     - name: cors
       config:
         origins:
           - https://life.hoanong.com
         methods:
           - GET
           - POST
           - PUT
           - DELETE
           - PATCH
           - OPTIONS
         headers:
           - Content-Type
           - Authorization
           - apikey
           - x-client-info
         credentials: true
         max_age: 86400
   ```

### Cách 3: Cloudflare Workers (Nâng cao)

Nếu Transform Rules không có, dùng Cloudflare Workers:

1. **Vào Cloudflare Dashboard:**
   - Workers & Pages > Create application
   - Create Worker

2. **Code Worker:**
   ```javascript
   addEventListener('fetch', event => {
     event.respondWith(handleRequest(event.request));
   });

   async function handleRequest(request) {
     // Forward request to Supabase
     const url = new URL(request.url);
     url.hostname = 'supabase_kong_Supabase';
     url.port = '8000';
     
     const response = await fetch(url.toString(), request);
     
     // Clone response để modify headers
     const newResponse = new Response(response.body, response);
     
     // Thêm CORS headers
     newResponse.headers.set('Access-Control-Allow-Origin', 'https://life.hoanong.com');
     newResponse.headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, PUT, DELETE, PATCH');
     newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey, x-client-info');
     newResponse.headers.set('Access-Control-Allow-Credentials', 'true');
     newResponse.headers.set('Access-Control-Max-Age', '86400');
     
     // Handle preflight (OPTIONS)
     if (request.method === 'OPTIONS') {
       return new Response(null, {
         status: 204,
         headers: newResponse.headers
       });
     }
     
     return newResponse;
   }
   ```

3. **Route qua Worker:**
   - Trong Cloudflare Tunnel, route `supabase.hoanong.com` đến Worker

## Khuyến nghị: Dùng Cách 1 (Transform Rules)

**Lý do:**
- ✅ Đơn giản, không cần code
- ✅ Quản lý tập trung trong Cloudflare
- ✅ Dễ thay đổi sau này

## Kiểm tra sau khi thêm

```javascript
// Trong Browser Console tại https://life.hoanong.com
fetch('https://supabase.hoanong.com/rest/v1/', {
  method: 'OPTIONS',
  headers: {
    'Origin': 'https://life.hoanong.com',
    'Access-Control-Request-Method': 'POST'
  }
})
.then(async r => {
  console.log('✅ CORS Headers:');
  console.log('  Access-Control-Allow-Origin:', r.headers.get('Access-Control-Allow-Origin'));
  console.log('  Access-Control-Allow-Methods:', r.headers.get('Access-Control-Allow-Methods'));
  console.log('  Access-Control-Allow-Headers:', r.headers.get('Access-Control-Allow-Headers'));
  console.log('  Access-Control-Allow-Credentials:', r.headers.get('Access-Control-Allow-Credentials'));
});
```

## Nếu không tìm thấy Transform Rules

1. **Kiểm tra quyền truy cập:**
   - Cần quyền Admin hoặc có quyền edit Transform Rules
   - Một số plan có thể không có tính năng này

2. **Dùng cách thay thế:**
   - Cấu hình ở Supabase (Kong) level (Cách 2)
   - Hoặc dùng Cloudflare Workers (Cách 3)

## Tóm tắt

**Cách đơn giản nhất:** Transform Rules trong Cloudflare Zero Trust
- Zero Trust > Networks > Tunnels > [Your Tunnel] > Transform Rules
- Tạo rule với condition: `Host eq supabase.hoanong.com`
- Thêm response headers: Access-Control-Allow-Origin, Access-Control-Allow-Methods, v.v.

**Nếu không có Transform Rules:** Cấu hình ở Supabase (Kong) level hoặc dùng Cloudflare Workers

















