# ✅ Test sau khi fix Network

## Đã thực hiện

1. ✅ Thêm Supabase Kong vào `affine_traefik-network`
2. ✅ Restart Cloudflare Tunnel

## Test ngay trong Browser

### Bước 1: Mở Browser Console

1. Mở https://life.hoanong.com
2. F12 > Console
3. Clear console (Ctrl+L)

### Bước 2: Test CORS và Connection

Copy và paste script này vào console:

```javascript
async function testAfterFix() {
  console.log('=== Testing After Network Fix ===\n');
  
  const supabaseUrl = 'https://supabase.hoanong.com';
  
  // Test 1: CORS Preflight
  console.log('1. Testing CORS Preflight...');
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://life.hoanong.com',
        'Access-Control-Request-Method': 'POST',
      },
    });
    
    const corsOrigin = response.headers.get('Access-Control-Allow-Origin');
    console.log('   Status:', response.status);
    console.log('   CORS Origin:', corsOrigin || '❌ NOT SET');
    
    if (response.status === 200 || response.status === 204) {
      console.log('   ✅ Preflight OK (network connected)');
    } else {
      console.error('   ❌ Preflight failed');
    }
  } catch (err) {
    if (err.message.includes('Failed to fetch')) {
      console.error('   ❌ Network error - Cloudflare Tunnel still cannot reach Supabase');
      console.error('   💡 May need to use IP address instead of hostname');
    } else {
      console.error('   ❌ Error:', err.message);
    }
  }
  
  // Test 2: Auth Request
  console.log('\n2. Testing Auth Request...');
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
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
    
    console.log('   Status:', response.status);
    const data = await response.json();
    
    if (response.status === 400) {
      console.log('   ✅ Request reached Supabase! (Network OK)');
      console.log('   Response:', data.error_description || data.message);
    } else if (response.status === 0) {
      console.error('   ❌ Request blocked (CORS or Network issue)');
    } else {
      console.log('   Response:', data);
    }
  } catch (err) {
    if (err.message.includes('CORS')) {
      console.error('   ❌ CORS Error:', err.message);
      console.error('   💡 Need to add CORS headers in Cloudflare Tunnel');
    } else if (err.message.includes('Failed to fetch')) {
      console.error('   ❌ Network Error:', err.message);
      console.error('   💡 Cloudflare Tunnel cannot reach Supabase');
    } else {
      console.error('   ❌ Error:', err.message);
    }
  }
  
  console.log('\n=== Test Complete ===');
  console.log('\nNext steps:');
  console.log('1. If network OK but CORS error → Add CORS headers in Cloudflare Tunnel');
  console.log('2. If network error → Use IP address in Cloudflare Tunnel config');
  console.log('3. If both OK → Try logging in with real credentials');
}

testAfterFix();
```

### Bước 3: Thử đăng nhập

1. Điền email và password
2. Click "Đăng nhập"
3. Xem console logs:
   - `[Auth] Attempting sign in for: ...`
   - `[Auth] Using Supabase: External`
   - `[Auth] Sign in failed: ...` hoặc `[Auth] Sign in successful: ...`

## Kết quả mong đợi

### Nếu Network đã fix:
- ✅ Preflight request trả về 200/204
- ✅ Auth request trả về 400 (invalid credentials) - không phải network error
- ✅ Console không còn "no such host" error

### Nếu vẫn có Network error:
- ❌ "Failed to fetch" hoặc "no such host"
- 💡 Cần dùng IP address thay vì hostname trong Cloudflare Tunnel

### Nếu Network OK nhưng có CORS error:
- ❌ "CORS policy" error
- 💡 Cần thêm CORS headers trong Cloudflare Tunnel

## Vui lòng cung cấp

1. Kết quả của `testAfterFix()` script
2. Console logs khi thử đăng nhập
3. Network tab - Status code của request đến `/auth/v1/token`

