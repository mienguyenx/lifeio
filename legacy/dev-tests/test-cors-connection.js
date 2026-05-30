/**
 * Test CORS và kết nối Supabase
 * Chạy trong browser console tại https://life.hoanong.com
 */

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
    const corsHeaders = preflightResponse.headers.get('Access-Control-Allow-Headers');
    
    console.log('   Status:', preflightResponse.status);
    console.log('   Access-Control-Allow-Origin:', corsOrigin || '❌ NOT SET');
    console.log('   Access-Control-Allow-Methods:', corsMethods || '❌ NOT SET');
    console.log('   Access-Control-Allow-Headers:', corsHeaders || '❌ NOT SET');
    
    if (corsOrigin === origin || corsOrigin === '*') {
      console.log('   ✅ CORS configured correctly!');
    } else {
      console.error('   ❌ CORS not configured - need to add headers in Cloudflare Tunnel');
    }
  } catch (err) {
    console.error('   ❌ Preflight test failed:', err.message);
  }
  
  // Test 2: Actual Auth Request (with invalid credentials to test CORS)
  console.log('\n2. Testing Auth Request (CORS)...');
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
      console.log('   ✅ Request reached Supabase (expected 400 for invalid credentials)');
      console.log('   Response:', data.error_description || data.message || 'Invalid credentials');
    } else if (authResponse.status === 0 || !authResponse.ok) {
      console.error('   ❌ Request blocked (likely CORS issue)');
    } else {
      console.log('   Response:', data);
    }
  } catch (err) {
    if (err.message.includes('CORS') || err.message.includes('Failed to fetch')) {
      console.error('   ❌ CORS Error:', err.message);
      console.error('   💡 Need to configure CORS headers in Cloudflare Tunnel');
    } else {
      console.error('   ❌ Error:', err.message);
    }
  }
  
  // Test 3: REST API Connection
  console.log('\n3. Testing REST API Connection...');
  try {
    const restResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
      },
    });
    
    console.log('   Status:', restResponse.status);
    if (restResponse.ok || restResponse.status === 401) {
      console.log('   ✅ REST API accessible');
    } else {
      console.error('   ❌ REST API not accessible');
    }
  } catch (err) {
    console.error('   ❌ REST API test failed:', err.message);
  }
  
  // Test 4: Debug Utilities
  console.log('\n4. Checking Debug Utilities...');
  if (typeof window.__LIFEOS_DEBUG__ !== 'undefined') {
    console.log('   ✅ Debug utilities available');
    console.log('   Supabase URL:', window.__LIFEOS_DEBUG__.supabaseUrl);
    
    try {
      const conn = await window.__LIFEOS_DEBUG__.checkConnection();
      console.log('   Connection test:', conn.success ? '✅ OK' : '❌ FAILED - ' + conn.error);
    } catch (err) {
      console.error('   Connection test error:', err);
    }
  } else {
    console.error('   ❌ Debug utilities not available');
  }
  
  console.log('\n=== Test Complete ===');
  console.log('\nSummary:');
  console.log('- If CORS is configured: You should see "✅ CORS configured correctly!"');
  console.log('- If CORS is NOT configured: You will see CORS errors');
  console.log('- Next step: Add CORS headers in Cloudflare Tunnel if not configured');
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  window.testCORSAndConnection = testCORSAndConnection;
  console.log('Run testCORSAndConnection() to test CORS and connection');
}

