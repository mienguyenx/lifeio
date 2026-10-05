import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/integrations/api/httpClient';

// Nút "Đăng nhập với Google" (Google Identity Services, popup → ID token → /auth/google).
// Client id lấy lúc chạy từ /auth/providers; chưa cấu hình thì nút tự ẩn.

interface GsiApi {
  accounts: { id: {
    initialize: (o: Record<string, unknown>) => void;
    renderButton: (el: HTMLElement, o: Record<string, unknown>) => void;
    cancel: () => void;
  } };
}
const gsi = () => (window as unknown as { google?: GsiApi }).google;

let providersP: Promise<string | null> | null = null;
const getClientId = () =>
  (providersP ??= apiFetch<{ google: { clientId: string } | null }>('/auth/providers', { auth: false })
    .then((r) => r.google?.clientId ?? null)
    .catch(() => { providersP = null; return null; }));

let gsiP: Promise<GsiApi> | null = null;
const loadGsi = () =>
  (gsiP ??= new Promise<GsiApi>((resolve, reject) => {
    const g0 = gsi(); if (g0?.accounts?.id) return resolve(g0);
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true; s.defer = true;
    s.onload = () => { const g = gsi(); if (g?.accounts?.id) resolve(g); else reject(new Error('GSI unavailable')); };
    s.onerror = () => { gsiP = null; reject(new Error('Không tải được Google')); };
    document.head.appendChild(s);
  }));

// Callback toàn cục — GIS chỉ giữ 1 callback; trỏ tới nút đang hiển thị gần nhất.
let activeHandler: ((credential: string) => void) | null = null;
let initializedFor: string | null = null;

export function GoogleSignInButton({ text = 'continue_with', onCredential, onError, divider = 'after' }: {
  text?: 'signin_with' | 'signup_with' | 'continue_with';
  onCredential: (credential: string) => void;
  onError?: (msg: string) => void;
  divider?: 'before' | 'after' | 'none';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [clientId, setClientId] = useState<string | null | undefined>(undefined);
  const handler = useRef(onCredential);
  handler.current = onCredential;

  useEffect(() => { let alive = true; getClientId().then((id) => alive && setClientId(id)); return () => { alive = false; }; }, []);

  useEffect(() => {
    if (!clientId || !ref.current) return;
    const el = ref.current;
    activeHandler = (c) => handler.current(c);
    let cancelled = false;
    loadGsi().then((g) => {
      if (cancelled) return;
      if (initializedFor !== clientId) {
        g.accounts.id.initialize({
          client_id: clientId,
          callback: (r: { credential?: string }) => { if (r.credential) activeHandler?.(r.credential); },
          ux_mode: 'popup',
          auto_select: false,
          cancel_on_tap_outside: true,
          itp_support: true,
        });
        initializedFor = clientId;
      }
      const dark = document.documentElement.classList.contains('dark');
      el.innerHTML = '';
      g.accounts.id.renderButton(el, {
        type: 'standard', theme: dark ? 'filled_black' : 'outline', size: 'large', shape: 'pill',
        text, logo_alignment: 'center', locale: 'vi', width: Math.max(200, Math.min(400, Math.floor(el.offsetWidth || 320))),
      });
    }).catch((e) => onError?.(e instanceof Error ? e.message : 'Không tải được Google'));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, text]);

  if (clientId === null) return null; // chưa bật Google
  const line = (
    <div className="flex items-center gap-3 text-[12px] text-muted-foreground" aria-hidden>
      <span className="h-px flex-1 bg-border" />hoặc<span className="h-px flex-1 bg-border" />
    </div>
  );
  return (
    <div className="space-y-4">
      {divider === 'before' && line}
      <div className="flex justify-center min-h-[44px]">
        <div ref={ref} className="w-full max-w-[400px] flex justify-center" data-testid="google-signin" />
      </div>
      {divider === 'after' && line}
    </div>
  );
}
