/**
 * Script kiểm tra kết nối Supabase
 * Chạy: node check-supabase.js
 */

import { createClient } from '@supabase/supabase-js';

// Lấy từ externalClient.ts
const EXTERNAL_SUPABASE_URL = 'https://pxgdmyszzwamwygvifvj.supabase.co';
const EXTERNAL_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4Z2RteXN6endhbXd5Z3ZpZnZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMTExOTUsImV4cCI6MjA4MTg4NzE5NX0.NHtDHa5NUd6UdqpywQt8YEj8xxRW9Qz4MbgCoqvB9gM';

// Lấy từ env vars (nếu có)
const VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const VITE_SUPABASE_PUBLISHABLE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log('🔍 Kiểm tra kết nối Supabase...\n');

// Kiểm tra External Supabase
console.log('1. Kiểm tra External Supabase:');
console.log(`   URL: ${EXTERNAL_SUPABASE_URL}`);
console.log(`   Key: ${EXTERNAL_SUPABASE_ANON_KEY.substring(0, 20)}...`);

try {
  const externalClient = createClient(EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_ANON_KEY);
  
  // Test connection bằng cách lấy health status
  const { data, error } = await externalClient.from('profiles').select('count').limit(1);
  
  if (error && error.code !== 'PGRST116') { // PGRST116 = table not found (có thể chưa setup)
    console.log(`   ❌ Lỗi: ${error.message}`);
    console.log(`   💡 Có thể database chưa được setup. Chạy script SQL trong docs/external-supabase-setup.sql`);
  } else {
    console.log('   ✅ Kết nối thành công!');
  }
} catch (err) {
  console.log(`   ❌ Lỗi kết nối: ${err.message}`);
}

console.log('\n2. Kiểm tra Environment Variables:');
if (VITE_SUPABASE_URL && VITE_SUPABASE_PUBLISHABLE_KEY) {
  console.log(`   ✅ VITE_SUPABASE_URL: ${VITE_SUPABASE_URL}`);
  console.log(`   ✅ VITE_SUPABASE_PUBLISHABLE_KEY: ${VITE_SUPABASE_PUBLISHABLE_KEY.substring(0, 20)}...`);
  
  try {
    const envClient = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY);
    const { data, error } = await envClient.from('profiles').select('count').limit(1);
    
    if (error && error.code !== 'PGRST116') {
      console.log(`   ❌ Lỗi: ${error.message}`);
    } else {
      console.log('   ✅ Kết nối thành công!');
    }
  } catch (err) {
    console.log(`   ❌ Lỗi kết nối: ${err.message}`);
  }
} else {
  console.log('   ⚠️  Chưa có environment variables');
  console.log('   💡 Tạo file .env với VITE_SUPABASE_URL và VITE_SUPABASE_PUBLISHABLE_KEY');
}

console.log('\n📝 Lưu ý:');
console.log('   - Ứng dụng sẽ ưu tiên sử dụng External Supabase nếu được cấu hình');
console.log('   - Nếu không có External Supabase, sẽ fallback về Lovable Cloud Supabase');
console.log('   - Để deploy lên Vercel, thêm env vars trong Vercel Dashboard');

