// PWA: đăng ký service worker, bắt sự kiện "cài app", thông báo cục bộ và Web Push.
import { useEffect, useState, useSyncExternalStore } from 'react';
import { apiFetch } from '@/integrations/api/httpClient';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// ------------------------------ nền tảng ------------------------------
const ua = () => (typeof navigator === 'undefined' ? '' : navigator.userAgent);
export const isIOS = () => /iPad|iPhone|iPod/.test(ua()) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const isAndroid = () => /Android/i.test(ua());
export const isMobileDevice = () => isIOS() || isAndroid();
export const isInAppBrowser = () => /FBAN|FBAV|Instagram|Zalo|Line\/|MicroMessenger|TikTok/i.test(ua());
export const isIOSNonSafari = () => isIOS() && /CriOS|FxiOS|EdgiOS/i.test(ua());
export const isStandalone = () =>
  typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
export const platformName = () => (isIOS() ? 'ios' : isAndroid() ? 'android' : /Mac/.test(ua()) ? 'macos' : /Win/.test(ua()) ? 'windows' : 'desktop');
export const deviceLabel = () => {
  const u = ua();
  const os = isIOS() ? (/iPad/.test(u) ? 'iPad' : 'iPhone') : isAndroid() ? 'Android' : /Mac/.test(u) ? 'Mac' : /Win/.test(u) ? 'Windows' : 'Máy tính';
  const br = /Edg\//.test(u) ? 'Edge' : /SamsungBrowser/.test(u) ? 'Samsung Internet' : /CriOS|Chrome\//.test(u) ? 'Chrome' : /FxiOS|Firefox\//.test(u) ? 'Firefox' : /Safari\//.test(u) ? 'Safari' : 'Trình duyệt';
  return `${os} · ${br}${isStandalone() ? ' (app)' : ''}`;
};

// --------------------------- service worker ---------------------------
let swReg: Promise<ServiceWorkerRegistration | null> | null = null;
export function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (swReg) return swReg;
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator) || (!import.meta.env.PROD && !import.meta.env.VITE_SW_DEV)) {
    swReg = Promise.resolve(null);
    return swReg;
  }
  swReg = navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).then((r) => {
    setInterval(() => r.update().catch(() => undefined), 60 * 60 * 1000);
    return r;
  }).catch((e) => { console.warn('[pwa] SW register failed', e); return null; });
  navigator.serviceWorker.addEventListener('message', (ev) => {
    const d = ev.data || {};
    if (d.type === 'NAVIGATE' && d.url) {
      const u = new URL(d.url);
      window.history.pushState({}, '', u.pathname + u.search);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
    if (d.type === 'PUSH_RECEIVED') window.dispatchEvent(new CustomEvent('lifeos:push', { detail: d.payload }));
    if (d.type === 'PUSH_RESUBSCRIBE') void ensurePushSubscription();
  });
  return swReg;
}

// ----------------------------- cài đặt app -----------------------------
let deferred: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e as BeforeInstallPromptEvent; emit(); });
  window.addEventListener('appinstalled', () => { installed = true; deferred = null; emit(); });
}

export type InstallMode = 'installed' | 'prompt' | 'ios' | 'ios-other-browser' | 'in-app' | 'manual' | 'unsupported';
function installMode(): InstallMode {
  if (installed || isStandalone()) return 'installed';
  if (deferred) return 'prompt';
  if (isInAppBrowser()) return 'in-app';
  if (isIOS()) return isIOSNonSafari() ? 'ios-other-browser' : 'ios';
  if (isAndroid() || /Chrome|Edg/.test(ua())) return 'manual';
  return 'unsupported';
}
export function useInstallState() {
  const mode = useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb); }, installMode, () => 'unsupported' as InstallMode);
  const install = async () => {
    if (!deferred) return false;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    deferred = null; emit();
    return outcome === 'accepted';
  };
  return { mode, install };
}

// --------------------------- thông báo cục bộ ---------------------------
export const notificationsSupported = () => typeof window !== 'undefined' && 'Notification' in window;
export const pushSupported = () => notificationsSupported() && 'serviceWorker' in navigator && 'PushManager' in window;

/**
 * Hiện thông báo hệ thống. Trên Android/iOS `new Notification()` bị chặn —
 * phải đi qua service worker.
 */
export async function showLocalNotification(title: string, options: NotificationOptions & { url?: string } = {}) {
  if (!notificationsSupported() || Notification.permission !== 'granted') return false;
  const { url, ...opts } = options;
  const full: NotificationOptions = { icon: '/icons/icon-192.png', badge: '/icons/badge-72.png', ...opts, data: { url: url || '/', ...(opts.data as object | undefined) } };
  try {
    const reg = await (registerServiceWorker() ?? Promise.resolve(null));
    if (reg) { await reg.showNotification(title, full); return true; }
  } catch { /* fallthrough */ }
  try { new Notification(title, full); return true; } catch { return false; }
}

// ------------------------------- Web Push -------------------------------
const b64ToUint8 = (b64: string) => {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};
const PUSH_FLAG = 'lifeos.push.endpoint';
export const hasPushOnThisDevice = () => !!localStorage.getItem(PUSH_FLAG);

export type PushState = 'unsupported' | 'needs-install' | 'denied' | 'off' | 'on';
export async function getPushState(): Promise<PushState> {
  if (!pushSupported()) return isIOS() && !isStandalone() ? 'needs-install' : 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  const reg = await registerServiceWorker();
  const sub = await reg?.pushManager.getSubscription();
  if (sub && Notification.permission === 'granted') return 'on';
  return 'off';
}

async function subscribeOnServer(sub: PushSubscription) {
  await apiFetch('/push/subscribe', { method: 'POST', body: { subscription: sub.toJSON(), device_label: deviceLabel(), platform: platformName() } });
  localStorage.setItem(PUSH_FLAG, sub.endpoint);
}

/** Xin quyền + đăng ký nhận thông báo đẩy. Phải gọi từ thao tác chạm/bấm (iOS). */
export async function enablePush(): Promise<PushState> {
  if (!pushSupported()) return getPushState();
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return perm === 'denied' ? 'denied' : 'off';
  const reg = await registerServiceWorker();
  if (!reg) throw new Error('Service worker chưa sẵn sàng — hãy tải lại trang.');
  await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    const { publicKey } = await apiFetch<{ publicKey: string }>('/push/public-key');
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToUint8(publicKey) });
  }
  await subscribeOnServer(sub);
  return 'on';
}

export async function disablePush() {
  const reg = await registerServiceWorker();
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    await apiFetch('/push/unsubscribe', { method: 'POST', body: { endpoint: sub.endpoint } }).catch(() => undefined);
    await sub.unsubscribe().catch(() => undefined);
  }
  localStorage.removeItem(PUSH_FLAG);
}

/** Khi mở app: nếu đã cấp quyền thì đồng bộ lại subscription với máy chủ (đổi máy chủ/khóa…). */
export async function ensurePushSubscription() {
  try {
    if (!pushSupported() || Notification.permission !== 'granted') return;
    const reg = await registerServiceWorker();
    if (!reg) return;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      if (!hasPushOnThisDevice()) return; // người dùng chưa từng bật
      const { publicKey } = await apiFetch<{ publicKey: string }>('/push/public-key');
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToUint8(publicKey) });
    }
    await subscribeOnServer(sub);
  } catch (e) { console.warn('[pwa] resubscribe failed', e); }
}

export function usePushState() {
  const [state, setState] = useState<PushState | null>(null);
  const refresh = () => getPushState().then(setState).catch(() => setState('unsupported'));
  useEffect(() => { void refresh(); }, []);
  return { state, refresh, setState };
}
