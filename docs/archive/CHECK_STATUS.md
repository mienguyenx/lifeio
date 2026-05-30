# ✅ Kiểm tra trạng thái hệ thống

## Containers Status

- ✅ `lifeos-app`: Up 14 minutes
- ✅ `cloudflared-lifeos`: Up 3 days
- ✅ Supabase containers: Đang chạy (không thấy trong output nhưng có thể đang chạy)

## Các bước kiểm tra

### 1. Kiểm tra CORS trong Browser Console

Mở https://life.hoanong.com và chạy script test:

```javascript
// Copy và paste vào console
async function testCORSAndConnection() {
  console.log('=== Testing CORS and Supabase Connection ===\n');
  
  const supabaseUrl = 'https://supabase.hoanong.com';
  const origin = 'https://life.hoanong.com';
  
  // Test 1: CORS Preflight
  console.log('1. Testing CORS Preflight...');
  try {
    const preflightResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'OPTIONS',
      headers: {
        'Origin': origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type,authorization,apikey',
      },
    });
    
    const corsOrigin = preflightResponse.headers.get('Access-Control-Allow-Origin');
    const corsMethods = preflightResponse.headers.get('Access-Control-Allow-Methods');
    
    console.log('   Status:', preflightResponse.status);
    console.log('   Access-Control-Allow-Origin:', corsOrigin || '❌ NOT SET');
    console.log('   Access-Control-Allow-Methods:', corsMethods || '❌ NOT SET');
    
    if (corsOrigin === origin || corsOrigin === '*') {
      console.log('   ✅ CORS configured correctly!');
    } else {
      console.error('   ❌ CORS not configured');
      console.error('   💡 Need to add CORS headers in Cloudflare Tunnel');
    }
  } catch (err) {
    console.error('   ❌ Preflight test failed:', err.message);
  }
  
  // Test 2: Auth Request
  console.log('\n2. Testing Auth Request...');
  try {
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
      },
      body: JSON.stringify({
        email: 'test@invalid.com',
        password: 'wrongpassword',
      }),
    });
    
    console.log('   Status:', authResponse.status);
    const data = await authResponse.json();
    
    if (authResponse.status === 400) {
      console.log('   ✅ Request reached Supabase (CORS OK)');
    } else {
      console.error('   ❌ Request blocked (CORS issue)');
    }
  } catch (err) {
    console.error('   ❌ Error:', err.message);
    if (err.message.includes('CORS') || err.message.includes('Failed to fetch')) {
      console.error('   💡 CORS not configured - add headers in Cloudflare Tunnel');
    }
  }
  
  console.log('\n=== Test Complete ===');
}

testCORSAndConnection();
```

### 2. Kiểm tra Debug Utilities

```javascript
// Kiểm tra debug utilities
if (typeof window.__LIFEOS_DEBUG__ !== 'undefined') {
  console.log('✅ Debug utilities available');
  console.log('Supabase URL:', window.__LIFEOS_DEBUG__.supabaseUrl);
  
  // Test connection
  await window.__LIFEOS_DEBUG__.checkConnection();
  
  // Test session
  await window.__LIFEOS_DEBUG__.checkSession();
} else {
  console.error('❌ Debug utilities not available');
}
```

### 3. Kiểm tra Logs khi đăng nhập

1. Mở Console (F12)
2. Clear console
3. Thử đăng nhập
4. Xem logs có prefix `[Auth]`:
   - `[Auth] Attempting sign in for: ...`
   - `[Auth] Using Supabase: External`
   - `[Auth] Sign in failed: ...` hoặc `[Auth] Sign in successful: ...`

## Kết quả mong đợi

### Nếu CORS đã được config:
- ✅ `Access-Control-Allow-Origin: https://life.hoanong.com`
- ✅ Auth request trả về 400 (invalid credentials) thay vì CORS error
- ✅ Đăng nhập có thể thử (sẽ fail với invalid credentials nhưng không phải CORS)

### Nếu CORS chưa được config:
- ❌ `Access-Control-Allow-Origin: null` hoặc không có
- ❌ CORS error trong console
- ❌ `Failed to fetch` error

## Next Steps

1. **Nếu CORS chưa config**: Thêm CORS headers trong Cloudflare Tunnel
2. **Nếu CORS đã config nhưng vẫn lỗi**: Kiểm tra:
   - Password có đúng không
   - User có tồn tại trong database không
   - Email có được confirm chưa

