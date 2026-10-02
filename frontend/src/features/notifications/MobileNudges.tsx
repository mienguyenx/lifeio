// Gợi ý trên mobile: cài app (khi đang dùng trình duyệt) / bật thông báo (khi đã cài).
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BellRing, Download, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { enablePush, getPushState, isMobileDevice, useInstallState } from '@/lib/pwa';
import { useLifeOSStore } from '@/stores/useLifeOSStore';

const KEY = 'lifeos.nudge.dismissed';
const SNOOZE = 7 * 86400_000;
const snoozed = (k: string) => { try { const m = JSON.parse(localStorage.getItem(KEY) || '{}'); return m[k] && Date.now() - m[k] < SNOOZE; } catch { return false; } };
const snooze = (k: string) => { try { const m = JSON.parse(localStorage.getItem(KEY) || '{}'); m[k] = Date.now(); localStorage.setItem(KEY, JSON.stringify(m)); } catch { /* noop */ } };

export function MobileNudges() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { mode, install } = useInstallState();
  const setStoreFlag = useLifeOSStore((s) => s.setPushNotificationsEnabled);
  const [pushOff, setPushOff] = useState(false);
  const [hidden, setHidden] = useState<string | null>(null);
  useEffect(() => {
    const t = setTimeout(() => {
      getPushState().then((s) => setPushOff(s === 'off')).catch(() => undefined);
    }, 2500);
    return () => clearTimeout(t);
  }, [mode]);

  if (!isMobileDevice() || pathname.startsWith('/settings') || pathname.startsWith('/notifications') || pathname.startsWith('/onboarding')) return null;
  const kind = mode !== 'installed' && mode !== 'unsupported' ? 'install' : pushOff ? 'push' : null;
  if (!kind || hidden === kind || snoozed(kind)) return null;
  const close = () => { snooze(kind); setHidden(kind); };

  const onAction = async () => {
    if (kind === 'install') {
      if (mode === 'prompt') { if (await install()) toast.success('Đã cài LifeOS 🎉'); return; }
      navigate('/settings?tab=app'); return;
    }
    try {
      const s = await enablePush();
      if (s === 'on') { setStoreFlag(true); setPushOff(false); toast.success('Đã bật thông báo 🔔'); }
      else if (s === 'denied') { toast.error('Thông báo bị chặn — bật lại trong cài đặt điện thoại.'); close(); }
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="fixed inset-x-3 z-40 bottom-[calc(76px+env(safe-area-inset-bottom))] animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="flex items-center gap-3 rounded-[20px] bg-card border border-border/70 shadow-card p-3 pr-2">
        {kind === 'install'
          ? <img src="/icons/icon-192.png" alt="" className="h-11 w-11 rounded-[13px] shrink-0" />
          : <span className="h-11 w-11 rounded-[13px] bg-primary/15 text-primary grid place-items-center shrink-0"><BellRing className="h-5 w-5" /></span>}
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-bold leading-tight">{kind === 'install' ? 'Cài LifeOS lên điện thoại' : 'Bật thông báo nhắc việc'}</p>
          <p className="text-[11.5px] text-muted-foreground leading-snug">{kind === 'install' ? 'Mở nhanh từ màn hình chính, nhận thông báo' : 'Nhắc task, thói quen & bản tin sáng — cả khi đóng app'}</p>
        </div>
        <Button size="sm" className="h-9 rounded-full px-3.5 shrink-0" onClick={onAction}>{kind === 'install' ? <><Download className="h-4 w-4 mr-1" />{mode === 'prompt' ? 'Cài' : 'Xem cách'}</> : 'Bật'}</Button>
        <button onClick={close} aria-label="Để sau" className="h-8 w-8 rounded-full grid place-items-center text-muted-foreground hover:bg-secondary shrink-0"><X className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
