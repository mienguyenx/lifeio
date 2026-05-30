# 🔧 Fix CORS Error trong Supabase

## Vấn đề

Console logs cho thấy:
```
Access to fetch at 'https://supabase.hoanong.com/auth/v1/token?grant_type=password' 
from origin 'https://life.hoanong.com' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Nguyên nhân

Supabase Kong gateway có CORS plugin nhưng chưa được config với allowed origins.

## Giải pháp

Cần cấu hình CORS trong Supabase Kong để cho phép requests từ `https://life.hoanong.com`.

### Cách 1: Cấu hình qua Supabase Studio (Khuyến nghị)

1. Truy cập Supabase Studio: `http://localhost:54323` (hoặc domain tương ứng)
2. Vào **Settings** > **API**
3. Tìm phần **CORS Configuration**
4. Thêm `https://life.hoanong.com` vào allowed origins
5. Save và restart Supabase

### Cách 2: Cấu hình trực tiếp trong Kong config

Cần update `kong.yml` trong Supabase container để thêm CORS config với origins.

**Lưu ý**: Supabase tự động generate `kong.yml` từ config, nên cách tốt nhất là config qua Supabase Studio hoặc environment variables.

### Cách 3: Thêm CORS headers qua Cloudflare Tunnel (Workaround)

Có thể thêm CORS headers ở Cloudflare Tunnel level, nhưng không khuyến nghị vì:
- Không phải giải pháp đúng đắn
- Có thể gây conflict với Supabase CORS

## Kiểm tra

Sau khi fix, test lại:

```javascript
// Trong Browser Console (https://life.hoanong.com)
fetch('https://supabase.hoanong.com/auth/v1/token?grant_type=password', {
  method: 'OPTIONS',
  headers: {
    'Origin': 'https://life.hoanong.com',
    'Access-Control-Request-Method': 'POST',
  }
})
.then(r => {
  console.log('CORS Headers:', {
    'Access-Control-Allow-Origin': r.headers.get('Access-Control-Allow-Origin'),
    'Access-Control-Allow-Methods': r.headers.get('Access-Control-Allow-Methods'),
  });
})
.catch(e => console.error('Error:', e));
```

**Kết quả mong đợi:**
- `Access-Control-Allow-Origin: https://life.hoanong.com` hoặc `*`
- `Access-Control-Allow-Methods: POST, GET, OPTIONS`

## Quick Fix (Temporary)

Nếu cần fix ngay, có thể thêm CORS headers ở Cloudflare Tunnel level:

1. Vào Cloudflare Dashboard > Zero Trust > Networks > Tunnels
2. Chọn tunnel của bạn
3. Vào **Configure** > **Public Hostname** > `supabase.hoanong.com`
4. Thêm **HTTP Headers**:
   - `Access-Control-Allow-Origin: https://life.hoanong.com`
   - `Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE`
   - `Access-Control-Allow-Headers: Content-Type, Authorization, apikey`
   - `Access-Control-Allow-Credentials: true`

**⚠️ Lưu ý**: Đây chỉ là workaround tạm thời. Nên fix ở Supabase level.

