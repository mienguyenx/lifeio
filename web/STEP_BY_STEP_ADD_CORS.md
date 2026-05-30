# 📝 Hướng dẫn từng bước: Thêm CORS Headers trong Cloudflare

## ⚠️ Vấn đề

Trong màn hình **Service** (như bạn đang thấy), chỉ có:
- **HTTP Host Header** - Chỉ dùng cho request, không phải response
- **Không có option** thêm Response Headers (CORS headers)

## ✅ Giải pháp: Dùng Transform Rules

### Bước 1: Vào Transform Rules

1. Trong Cloudflare Dashboard, bạn đang ở: **Zero Trust > Networks > Tunnels**
2. Ở sidebar bên trái, tìm phần **"Access controls"** hoặc **"Policies"**
3. Click vào **"Transform Rules"** hoặc **"Response Headers"**

   **Nếu không thấy:**
   - Thử tìm trong **"Networks"** > **"Tunnels"** > [Your Tunnel] > **"Policies"**
   - Hoặc **"Zero Trust"** > **"Access"** > **"Transform Rules"**

### Bước 2: Tạo Rule mới

1. Click nút **"+ Add rule"** hoặc **"Create rule"**
2. Đặt tên: `Add CORS for Supabase`

### Bước 3: Cấu hình Condition (Điều kiện)

Trong phần **"When"** hoặc **"Match"**:
- Chọn **"Host"** hoặc **"Request hostname"**
- Operator: **"equals"** hoặc **"eq"**
- Value: `supabase.hoanong.com`

**Kết quả:** Rule sẽ chỉ áp dụng cho requests đến `supabase.hoanong.com`

### Bước 4: Cấu hình Action (Hành động)

Trong phần **"Then"** hoặc **"Action"**:

1. Chọn **"Add response header"** hoặc **"Set response header"**

2. **Thêm từng header một** (click **"+ Add header"** cho mỗi header):

   **Header 1:**
   - Name: `Access-Control-Allow-Origin`
   - Value: `https://life.hoanong.com`

   **Header 2:**
   - Name: `Access-Control-Allow-Methods`
   - Value: `POST, GET, OPTIONS, PUT, DELETE, PATCH`

   **Header 3:**
   - Name: `Access-Control-Allow-Headers`
   - Value: `Content-Type, Authorization, apikey, x-client-info`

   **Header 4:**
   - Name: `Access-Control-Allow-Credentials`
   - Value: `true`

   **Header 5:**
   - Name: `Access-Control-Max-Age`
   - Value: `86400`

### Bước 5: Save và Deploy

1. Click **"Save"** hoặc **"Deploy"**
2. Đợi **30-60 giây** để Cloudflare apply changes

## Nếu không tìm thấy Transform Rules

### Option A: Kiểm tra Plan

Transform Rules có thể chỉ có trong:
- **Zero Trust Paid plans**
- Hoặc **Enterprise plans**

Nếu không có, dùng cách khác:

### Option B: Cấu hình ở Supabase (Kong) Level

Supabase Local dùng Kong API Gateway, có thể thêm CORS plugin:

1. **Truy cập Supabase Studio:**
   ```
   http://localhost:54323
   ```

2. **Tìm file config Kong:**
   - Thường ở: `supabase/kong.yml` hoặc trong Supabase config
   - Hoặc dùng Kong Admin API: `http://localhost:8001`

3. **Thêm CORS plugin:**

   Nếu có quyền truy cập Kong config file:
   ```yaml
   # Thêm vào kong.yml
   plugins:
     - name: cors
       service: supabase
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

   Sau đó restart Supabase:
   ```powershell
   docker restart supabase_kong_Supabase
   ```

### Option C: Dùng Cloudflare Workers

1. **Tạo Worker mới:**
   - Workers & Pages > Create application > Create Worker

2. **Paste code:**
   ```javascript
   addEventListener('fetch', event => {
     event.respondWith(handleRequest(event.request));
   });

   async function handleRequest(request) {
     // Forward to Supabase
     const url = new URL(request.url);
     url.hostname = 'supabase_kong_Supabase';
     url.port = '8000';
     url.protocol = 'http:';
     
     const response = await fetch(url.toString(), {
       method: request.method,
       headers: request.headers,
       body: request.body
     });
     
     // Clone để modify headers
     const newResponse = new Response(response.body, {
       status: response.status,
       statusText: response.statusText,
       headers: response.headers
     });
     
     // Add CORS headers
     newResponse.headers.set('Access-Control-Allow-Origin', 'https://life.hoanong.com');
     newResponse.headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, PUT, DELETE, PATCH');
     newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey, x-client-info');
     newResponse.headers.set('Access-Control-Allow-Credentials', 'true');
     newResponse.headers.set('Access-Control-Max-Age', '86400');
     
     // Handle OPTIONS (preflight)
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
   - Trong Cloudflare Tunnel, thay đổi Service từ `http://supabase_kong_Supabase:8000` thành Worker URL

## Test sau khi thêm

```javascript
// Trong Browser Console tại https://life.hoanong.com
fetch('https://supabase.hoanong.com/rest/v1/', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
  }
})
.then(async r => {
  console.log('✅ Status:', r.status);
  console.log('✅ CORS Headers:');
  console.log('  Origin:', r.headers.get('Access-Control-Allow-Origin'));
  console.log('  Methods:', r.headers.get('Access-Control-Allow-Methods'));
  console.log('  Headers:', r.headers.get('Access-Control-Allow-Headers'));
  console.log('  Credentials:', r.headers.get('Access-Control-Allow-Credentials'));
})
.catch(e => console.error('❌ Error:', e));
```

## Tóm tắt nhanh

**Cách đơn giản nhất:**
1. Zero Trust > Access > Transform Rules (hoặc Policies)
2. Create rule: Condition = `Host eq supabase.hoanong.com`
3. Action = Add response header (thêm 5 headers như trên)
4. Save

**Nếu không có Transform Rules:**
- Cấu hình ở Supabase (Kong) level
- Hoặc dùng Cloudflare Workers

















