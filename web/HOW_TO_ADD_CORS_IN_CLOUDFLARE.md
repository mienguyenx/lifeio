# 📋 Hướng dẫn chi tiết: Thêm CORS Headers trong Cloudflare Dashboard

## ⚠️ Lưu ý quan trọng

**KHÔNG** đặt CORS headers vào `httpHostHeader`! 
- `httpHostHeader` chỉ dùng để override Host header
- CORS headers phải là **Response Headers**, không phải request headers

## Các bước thực hiện

### Bước 1: Vào Cloudflare Dashboard

1. Truy cập: https://dash.cloudflare.com
2. Đăng nhập
3. Vào **Zero Trust** (biểu tượng shield ở sidebar)
4. Chọn **Networks** > **Tunnels**
5. Chọn tunnel của bạn (tunnel đang dùng cho `life.hoanong.com`)

### Bước 2: Tìm và Edit route Supabase

1. Vào tab **Published application routes**
2. Tìm dòng: `supabase.hoanong.com`
3. Click vào **menu icon** (3 chấm dọc) ở cột cuối cùng
4. Chọn **Edit**

### Bước 3: Thêm Origin Request Configuration

Trong màn hình Edit, bạn sẽ thấy:

#### Option 1: Có phần "Origin Request" riêng (Khuyến nghị)

1. Tìm phần **Origin Request** hoặc **HTTP Headers**
2. Click **+ Add** hoặc **Edit** trong phần này
3. Tìm phần **HTTP Headers** hoặc **Custom Headers**
4. Click **+ Add header** và thêm từng header:

| Header Name | Header Value |
|------------|--------------|
| `Access-Control-Allow-Origin` | `https://life.hoanong.com` |
| `Access-Control-Allow-Methods` | `POST, GET, OPTIONS, PUT, DELETE, PATCH` |
| `Access-Control-Allow-Headers` | `Content-Type, Authorization, apikey, x-client-info` |
| `Access-Control-Allow-Credentials` | `true` |
| `Access-Control-Max-Age` | `86400` |

#### Option 2: Chỉ có "Origin Request" với JSON/YAML

Nếu chỉ có một text field để nhập JSON hoặc YAML:

```json
{
  "httpHostHeader": "",
  "httpHeaders": {
    "Access-Control-Allow-Origin": "https://life.hoanong.com",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE, PATCH",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400"
  }
}
```

**Lưu ý:** Đảm bảo `httpHostHeader` là empty string `""` (không phải nơi để CORS headers)

#### Option 3: Không có option thêm headers (Dùng Transform Rules)

Nếu không có option thêm HTTP Headers trong Origin Request:

1. Vào **Zero Trust** > **Networks** > **Tunnels**
2. Chọn tunnel của bạn
3. Tìm tab **Transform Rules** hoặc **Access Rules**
4. Tạo rule mới:
   - **Rule name**: `Add CORS for Supabase`
   - **Condition**: `Host eq supabase.hoanong.com`
   - **Action**: Add response headers
   - Thêm các headers như trên

### Bước 4: Save và đợi

1. Click **Save** hoặc **Update**
2. Đợi **30-60 giây** để Cloudflare sync config
3. Cloudflare Tunnel sẽ tự động reload

### Bước 5: Verify trong logs

```powershell
docker-compose logs --tail=5 cloudflared | Select-String "supabase"
```

Bạn sẽ thấy config được update với `originRequest` có `httpHeaders`:

```json
{
  "hostname": "supabase.hoanong.com",
  "originRequest": {
    "httpHeaders": {
      "Access-Control-Allow-Origin": "https://life.hoanong.com",
      ...
    }
  },
  "service": "http://supabase_kong_Supabase:8000"
}
```

## Test CORS Headers

Mở Browser Console tại `https://life.hoanong.com` và chạy:

```javascript
// Test 1: OPTIONS request (preflight)
fetch('https://supabase.hoanong.com/auth/v1/token?grant_type=password', {
  method: 'OPTIONS',
  headers: {
    'Origin': 'https://life.hoanong.com',
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'Content-Type, Authorization, apikey'
  }
})
.then(async r => {
  console.log('✅ OPTIONS Status:', r.status);
  console.log('✅ CORS Headers:', {
    'Access-Control-Allow-Origin': r.headers.get('Access-Control-Allow-Origin'),
    'Access-Control-Allow-Methods': r.headers.get('Access-Control-Allow-Methods'),
    'Access-Control-Allow-Headers': r.headers.get('Access-Control-Allow-Headers'),
    'Access-Control-Allow-Credentials': r.headers.get('Access-Control-Allow-Credentials')
  });
})
.catch(e => console.error('❌ CORS Error:', e));

// Test 2: Actual request
fetch('https://supabase.hoanong.com/rest/v1/', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
  }
})
.then(r => console.log('✅ API Status:', r.status))
.catch(e => console.error('❌ API Error:', e));
```

## Troubleshooting

### Headers không xuất hiện trong response

1. **Kiểm tra logs:**
   ```powershell
   docker-compose logs cloudflared | Select-String "supabase" | Select-Object -Last 5
   ```
   Xem config có `httpHeaders` không

2. **Restart Cloudflare Tunnel:**
   ```powershell
   docker restart cloudflared-lifeos
   ```

3. **Đợi thêm 1-2 phút** để Cloudflare sync

### Vẫn bị CORS error

1. **Kiểm tra Origin:**
   - Phải chính xác: `https://life.hoanong.com` (không có trailing slash `/`)
   - Không có `http://` (phải `https://`)

2. **Kiểm tra `Access-Control-Allow-Origin`:**
   - Phải khớp chính xác với Origin
   - Không dùng wildcard `*` nếu có `Access-Control-Allow-Credentials: true`

3. **Kiểm tra Network tab:**
   - F12 > Network
   - Tìm request đến `supabase.hoanong.com`
   - Xem Response Headers có CORS headers không

### Không tìm thấy option thêm headers

Nếu Cloudflare Dashboard không có option thêm HTTP Headers:

1. **Dùng Cloudflare Workers** (nâng cao):
   - Tạo Worker mới
   - Add CORS headers trong Worker script
   - Route `supabase.hoanong.com` qua Worker

2. **Hoặc cấu hình ở Supabase level:**
   - Nếu Supabase có option cấu hình CORS
   - Thêm vào Supabase config

## Tóm tắt

**Các headers cần thêm:**
```
Access-Control-Allow-Origin: https://life.hoanong.com
Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE, PATCH
Access-Control-Allow-Headers: Content-Type, Authorization, apikey, x-client-info
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400
```

**Nơi thêm:** Cloudflare Dashboard > Zero Trust > Networks > Tunnels > [Your Tunnel] > Published application routes > supabase.hoanong.com > Edit > Origin Request > HTTP Headers

**Lưu ý:** KHÔNG đặt vào `httpHostHeader`!

