// LifeOS Service Worker v4 — cài app (PWA), thông báo đẩy, offline cơ bản.
// Chiến lược an toàn: trang HTML luôn lấy từ mạng trước (tránh kẹt bản cũ),
// file /assets/* có hash → cache-first; không bao giờ cache /api.
const VERSION = 'v4';
const SHELL = `lifeos-shell-${VERSION}`;
const ASSETS = `lifeos-assets-${VERSION}`;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((c) => c.addAll(['/offline.html', '/manifest.json', '/icons/icon-192.png'])).catch(() => undefined));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== SHELL && k !== ASSETS).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        if (res.ok) caches.open(SHELL).then((c) => c.put('/', res.clone())).catch(() => undefined);
        return res;
      } catch {
        return (await caches.match('/')) || (await caches.match('/offline.html')) || Response.error();
      }
    })());
    return;
  }

  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/')) {
    event.respondWith((async () => {
      const hit = await caches.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) { const c = await caches.open(ASSETS); c.put(req, res.clone()); }
      return res;
    })());
  }
});

// ---------------------------- Thông báo đẩy ----------------------------
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { body: event.data && event.data.text() }; }
  const title = data.title || 'LifeOS';
  const options = {
    body: data.body || 'Bạn có thông báo mới',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: data.tag || undefined,
    renotify: !!data.tag,
    vibrate: [120, 60, 120],
    data: { url: data.url || '/', id: data.id || null, type: data.type || 'system' },
    actions: Array.isArray(data.actions) ? data.actions.slice(0, 2) : [],
  };
  event.waitUntil((async () => {
    await self.registration.showNotification(title, options);
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    clients.forEach((c) => c.postMessage({ type: 'PUSH_RECEIVED', payload: { title, ...data } }));
    if (self.navigator && 'setAppBadge' in self.navigator) self.navigator.setAppBadge().catch(() => undefined);
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL((event.notification.data && event.notification.data.url) || '/', self.location.origin).href;
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of clients) {
      if (c.url.startsWith(self.location.origin) && 'focus' in c) {
        await c.focus();
        c.postMessage({ type: 'NAVIGATE', url: target });
        return;
      }
    }
    if (self.clients.openWindow) await self.clients.openWindow(target);
  })());
});

// Trình duyệt đổi subscription (hết hạn) → báo app đăng ký lại khi mở
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(self.clients.matchAll({ type: 'window' }).then((cs) => cs.forEach((c) => c.postMessage({ type: 'PUSH_RESUBSCRIBE' }))));
});

self.addEventListener('message', (event) => {
  const d = event.data || {};
  if (d.type === 'SKIP_WAITING') self.skipWaiting();
  if (d.type === 'SHOW_NOTIFICATION') {
    event.waitUntil(self.registration.showNotification(d.title || 'LifeOS', { icon: '/icons/icon-192.png', badge: '/icons/badge-72.png', ...(d.options || {}) }));
  }
});
