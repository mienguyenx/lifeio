/**
 * Test script để debug auth issues
 * Chạy trong browser console tại https://life.hoanong.com
 */

async function testAuthDebug() {
  console.log('=== Testing Auth Debug ===\n');
  
  // 1. Check if debug utilities are available
  console.log('1. Checking debug utilities...');
  if (typeof window.__LIFEOS_DEBUG__ === 'undefined') {
    console.error('   ❌ __LIFEOS_DEBUG__ not available. Make sure you are on the app page.');
    return;
  }
  console.log('   ✅ Debug utilities available');
  
  // 2. Check Supabase connection
  console.log('\n2. Testing Supabase connection...');
  try {
    const connectionResult = await window.__LIFEOS_DEBUG__.checkConnection();
    if (connectionResult.success) {
      console.log('   ✅ Connection successful');
    } else {
      console.error('   ❌ Connection failed:', connectionResult.error);
      console.log('   💡 Check Supabase URL:', window.__LIFEOS_DEBUG__.supabaseUrl);
    }
  } catch (err) {
    console.error('   ❌ Connection test error:', err);
  }
  
  // 3. Check current session
  console.log('\n3. Checking current session...');
  try {
    const sessionResult = await window.__LIFEOS_DEBUG__.checkSession();
    console.log('   Session:', sessionResult);
    if (sessionResult.hasSession) {
      console.log('   ✅ User is logged in');
    } else {
      console.log('   ℹ️  No active session');
    }
  } catch (err) {
    console.error('   ❌ Session check error:', err);
  }
  
  // 4. Test auth endpoint directly
  console.log('\n4. Testing auth endpoint...');
  try {
    const supabase = window.__LIFEOS_DEBUG__.getActiveSupabase();
    if (!supabase) {
      console.error('   ❌ Supabase client not available');
      return;
    }
    
    // Test with invalid credentials first
    console.log('   Testing with invalid credentials...');
    const { data: invalidData, error: invalidError } = await supabase.auth.signInWithPassword({
      email: 'test@invalid.com',
      password: 'wrongpassword',
    });
    
    if (invalidError) {
      console.log('   ✅ Auth endpoint responding (expected error):', invalidError.message);
    } else {
      console.warn('   ⚠️  Auth endpoint accepted invalid credentials (unexpected)');
    }
  } catch (err) {
    console.error('   ❌ Auth endpoint test error:', err);
  }
  
  // 5. Check network connectivity
  console.log('\n5. Testing network connectivity...');
  try {
    const url = window.__LIFEOS_DEBUG__.supabaseUrl;
    const response = await fetch(`${url}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
      },
    });
    console.log(`   REST API Status: ${response.status} ${response.statusText}`);
    if (response.ok || response.status === 401) {
      console.log('   ✅ Network connectivity OK');
    } else {
      console.error('   ❌ Network connectivity issue');
    }
  } catch (err) {
    console.error('   ❌ Network test error:', err);
  }
  
  console.log('\n=== Test Complete ===');
  console.log('\nNext steps:');
  console.log('1. Check console for any errors above');
  console.log('2. Try logging in and watch for [Auth] logs');
  console.log('3. Check Network tab for failed requests');
}

// Auto-run if in browser console
if (typeof window !== 'undefined') {
  window.testAuthDebug = testAuthDebug;
  console.log('Run testAuthDebug() to start debugging');
}

