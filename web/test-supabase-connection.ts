/**
 * Test Supabase connection and verify configuration
 * Run this in browser console or as a test script
 */

import { externalSupabase, isExternalSupabaseConfigured, EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_ANON_KEY } from './src/integrations/supabase/externalClient';

async function testSupabaseConnection() {
  console.log('=== Testing Supabase Connection ===');
  
  // 1. Check configuration
  console.log('\n1. Configuration Check:');
  console.log('   External Supabase configured:', isExternalSupabaseConfigured);
  console.log('   URL:', EXTERNAL_SUPABASE_URL);
  console.log('   Key:', EXTERNAL_SUPABASE_ANON_KEY?.substring(0, 20) + '...');
  
  if (!isExternalSupabaseConfigured || !externalSupabase) {
    console.error('   ❌ External Supabase not configured!');
    return;
  }
  
  // 2. Test basic connection
  console.log('\n2. Connection Test:');
  try {
    const { data, error } = await externalSupabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('   ⚠️  Table not found (may need migration)');
      } else {
        console.error('   ❌ Connection error:', error.message, error.code);
      }
    } else {
      console.log('   ✅ Connection successful!');
    }
  } catch (err) {
    console.error('   ❌ Connection failed:', err);
  }
  
  // 3. Test auth endpoint
  console.log('\n3. Auth Endpoint Test:');
  try {
    const { data: { session }, error } = await externalSupabase.auth.getSession();
    if (error) {
      console.error('   ❌ Auth error:', error.message);
    } else if (session) {
      console.log('   ✅ Session exists:', session.user.email);
    } else {
      console.log('   ℹ️  No active session (user not logged in)');
    }
  } catch (err) {
    console.error('   ❌ Auth test failed:', err);
  }
  
  // 4. Test REST API endpoint
  console.log('\n4. REST API Test:');
  try {
    const response = await fetch(`${EXTERNAL_SUPABASE_URL}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': EXTERNAL_SUPABASE_ANON_KEY || '',
      },
    });
    
    if (response.ok || response.status === 401) {
      console.log('   ✅ REST API accessible (status:', response.status, ')');
    } else {
      console.error('   ❌ REST API error (status:', response.status, ')');
    }
  } catch (err) {
    console.error('   ❌ REST API test failed:', err);
  }
  
  console.log('\n=== Test Complete ===');
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).testSupabaseConnection = testSupabaseConnection;
}

export default testSupabaseConnection;

