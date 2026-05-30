// Service Worker DISABLED - Self-destructing to clear old caches
// Version: 3.0 - Cleanup only

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => caches.delete(key)))
    ).then(() => self.clients.matchAll()).then((clients) => {
      clients.forEach((client) => client.navigate(client.url));
      return self.registration.unregister();
    })
  );
});

// Core static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/favicon.ico',
  '/offline.html'
];

// Assets that should be cached dynamically
const CACHEABLE_PATTERNS = [
  /\.(js|css|woff|woff2|ttf|eot)$/,
  /\.(png|jpg|jpeg|gif|svg|ico|webp)$/,
  /fonts\.googleapis\.com/,
  /fonts\.gstatic\.com/
];

// Install event - cache static assets and offline page
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      console.log('[SW] Caching static assets');
      
      // Cache static assets one by one to handle missing files gracefully
      for (const asset of STATIC_ASSETS) {
        try {
          await cache.add(asset);
        } catch (error) {
          console.warn(`[SW] Failed to cache: ${asset}`, error);
        }
      }
      
      // Skip waiting to activate immediately
      await self.skipWaiting();
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      const validCaches = [STATIC_CACHE, DYNAMIC_CACHE, OFFLINE_CACHE];
      
      await Promise.all(
        cacheNames
          .filter((name) => name.startsWith(CACHE_PREFIX) && !validCaches.includes(name))
          .map((name) => {
            console.log(`[SW] Deleting old cache: ${name}`);
            return caches.delete(name);
          })
      );
      
      await self.clients.claim();
      console.log('[SW] Activated and claimed clients');
    })()
  );
});

// Fetch event - smart routing with offline fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin except for trusted CDNs
  const trustedOrigins = [
    self.location.origin,
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'cdn.jsdelivr.net'
  ];
  
  const isTrusted = trustedOrigins.some(origin => 
    url.origin.includes(origin) || url.href.includes(origin)
  );
  
  if (!isTrusted) return;

  // Navigation requests - Network first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // API/Supabase calls - Network first, cache fallback
  if (url.pathname.startsWith('/api/') || 
      url.pathname.includes('/functions/') ||
      url.hostname.includes('supabase')) {
    event.respondWith(networkFirstWithTimeout(request, 5000));
    return;
  }

  // Hashed build assets (immutable) - Cache first
  if (url.pathname.startsWith('/assets/') && url.pathname.match(/\.[a-f0-9]{8}\./)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Static assets - Stale while revalidate
  if (isCacheableAsset(url)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Default - Network first
  event.respondWith(networkFirst(request));
});

// Handle navigation with offline fallback
async function handleNavigationRequest(request) {
  try {
    // Try network first
    const response = await fetch(request, { cache: 'no-store' });
    
    if (response.ok) {
      // Cache the successful response
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
      return response;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('[SW] Navigation failed, trying cache');
    
    // Try cached version
    const cached = await caches.match(request);
    if (cached) return cached;
    
    // Try cached index.html for SPA routing
    const indexCached = await caches.match('/index.html');
    if (indexCached) return indexCached;
    
    // Return offline page
    const offlinePage = await caches.match('/offline.html');
    if (offlinePage) return offlinePage;
    
    // Last resort - return a basic offline response
    return new Response(getOfflineHTML(), {
      status: 503,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Cache first strategy (for immutable assets)
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Cache first failed:', request.url);
    return new Response('Offline', { status: 503 });
  }
}

// Network first strategy
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    
    return new Response(JSON.stringify({ error: 'Offline', offline: true }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Network first with timeout
async function networkFirstWithTimeout(request, timeout) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    console.log('[SW] Network timeout, trying cache:', request.url);
    
    const cached = await caches.match(request);
    if (cached) return cached;
    
    return new Response(JSON.stringify({ 
      error: 'Offline', 
      offline: true,
      message: 'Bạn đang offline. Dữ liệu sẽ được đồng bộ khi có kết nối.'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Stale while revalidate strategy
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}

// Check if URL is a cacheable static asset
function isCacheableAsset(url) {
  return CACHEABLE_PATTERNS.some(pattern => pattern.test(url.href));
}

// Generate inline offline HTML
function getOfflineHTML() {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LifeOS - Offline</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: #fff;
      padding: 20px;
    }
    .container {
      text-align: center;
      max-width: 400px;
    }
    .icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 24px;
      background: rgba(255,255,255,0.1);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .icon svg {
      width: 40px;
      height: 40px;
      stroke: #fbbf24;
    }
    h1 { font-size: 24px; margin-bottom: 12px; }
    p { color: rgba(255,255,255,0.7); margin-bottom: 24px; line-height: 1.6; }
    button {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 12px 32px;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover { background: #2563eb; }
    .status {
      margin-top: 24px;
      padding: 12px;
      background: rgba(255,255,255,0.05);
      border-radius: 8px;
      font-size: 14px;
    }
    .dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-right: 8px;
    }
    .dot.offline { background: #ef4444; }
    .dot.online { background: #22c55e; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
          d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"/>
      </svg>
    </div>
    <h1>Bạn đang offline</h1>
    <p>Không thể kết nối internet. Ứng dụng sẽ tự động kết nối lại khi có mạng.</p>
    <button onclick="location.reload()">Thử lại</button>
    <div class="status" id="status">
      <span class="dot offline" id="dot"></span>
      <span id="statusText">Đang kiểm tra kết nối...</span>
    </div>
  </div>
  <script>
    function checkOnline() {
      const dot = document.getElementById('dot');
      const text = document.getElementById('statusText');
      if (navigator.onLine) {
        dot.className = 'dot online';
        text.textContent = 'Đã có kết nối! Đang tải lại...';
        setTimeout(() => location.reload(), 1000);
      } else {
        dot.className = 'dot offline';
        text.textContent = 'Chưa có kết nối internet';
      }
    }
    window.addEventListener('online', checkOnline);
    window.addEventListener('offline', checkOnline);
    checkOnline();
  </script>
</body>
</html>
  `;
}

// Background sync
self.addEventListener('sync', (event) => {
  console.log('[SW] Sync event:', event.tag);
  if (event.tag === 'lifeos-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  console.log('[SW] Background sync started');
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ type: 'SYNC_REQUIRED' });
  });
}

// Periodic sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'lifeos-periodic-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'Bạn có thông báo mới!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: data.url || '/',
    actions: data.actions || [],
    tag: data.tag || 'default',
    renotify: true
  };
  event.waitUntil(
    self.registration.showNotification(data.title || 'LifeOS', options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // If no window open, open a new one
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

// Message handler
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'CACHE_URLS':
      event.waitUntil(cacheUrls(event.data.urls));
      break;
    case 'CLEAR_CACHE':
      event.waitUntil(clearAllCaches());
      break;
    case 'GET_CACHE_SIZE':
      event.waitUntil(getCacheSize().then(size => {
        event.source.postMessage({ type: 'CACHE_SIZE', size });
      }));
      break;
  }
});

// Cache specific URLs on demand
async function cacheUrls(urls) {
  const cache = await caches.open(DYNAMIC_CACHE);
  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
      }
    } catch (error) {
      console.warn('[SW] Failed to cache URL:', url);
    }
  }
}

// Clear all caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  console.log('[SW] All caches cleared');
}

// Get total cache size
async function getCacheSize() {
  let totalSize = 0;
  const cacheNames = await caches.keys();
  
  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.clone().blob();
        totalSize += blob.size;
      }
    }
  }
  
  return totalSize;
}

console.log('[SW] Service Worker loaded - v2.0');
