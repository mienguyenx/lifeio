// Cài app trên điện thoại (PWA) + bật thông báo đẩy + tùy chọn nhắc nhở + thiết bị đã đăng ký.
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BellOff, BellRing, CheckCircle2, Copy, Download, Loader2, MoreVertical, PlusSquare, Send, Share, Smartphone, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { SectionTitle, Surface } from '@/components/lio';
import { fieldCls } from '@/components/lio/form';
import { apiFetch } from '@/integrations/api/httpClient';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { cn } from '@/lib/utils';
import { Pill } from '@/features/admin/shared';
import { disablePush, enablePush, isIOS, isStandalone, usePushState, useInstallState, type PushState } from '@/lib/pwa';

interface Prefs { task_reminders: boolean; habit_reminders: boolean; overdue_alerts: boolean; daily_digest: boolean; digest_time: string; quiet_start: string | null; quiet_end: string | null; timezone: string | null }
interface Device { id: string; device_label: string | null; platform: string | null; created_at: string; last_used_at: string | null; failure_count: number; last_error: string | null; endpoint: string }

const Step = ({ n, children }: { n: number; children: React.ReactNode }) => (
  <li className="flex items-start gap-2.5"><span className="h-6 w-6 rounded-full bg-primary/15 text-primary text-[12px] font-bold grid place-items-center shrink-0">{n}</span><span className="text-[13px] leading-6">{children}</span></li>
);

export function InstallAppCard({ compact }: { compact?: boolean }) {
  const { mode, install } = useInstallState();
  const copy = () => { navigator.clipboard?.writeText(window.location.origin); toast.success('Đã sao chép liên kết'); };
  return (
    <Surface className="p-4 sm:p-5">
      <SectionTitle title={<span className="inline-flex items-center gap-1.5"><Smartphone className="h-4 w-4 text-primary" />Cài LifeOS lên điện thoại</span>}
/>
      <div className="flex items-start gap-3">
        <img src="/icons/icon-192.png" alt="" className="h-14 w-14 rounded-[16px] shadow-soft shrink-0" />
        <div className="min-w-0 flex-1">
          {mode === 'installed' && <><p className="text-[14px] font-bold flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" />Đã cài trên thiết bị này</p><p className="text-[12.5px] text-muted-foreground">Bạn đang dùng LifeOS như một ứng dụng.</p></>}
          {mode === 'prompt' && <><p className="text-[14px] font-bold">Cài ứng dụng chỉ với 1 chạm</p><p className="text-[12.5px] text-muted-foreground mb-3">Không cần cửa hàng ứng dụng, dung lượng rất nhỏ.</p>
            <Button className="h-10 rounded-full px-5 shadow-soft" onClick={async () => { if (await install()) toast.success('Đã cài LifeOS 🎉'); }}><Download className="h-4 w-4 mr-1.5" />Cài đặt ứng dụng</Button></>}
          {mode === 'ios' && <><p className="text-[14px] font-bold">Thêm vào Màn hình chính (iPhone/iPad)</p>
            <ol className="mt-2 space-y-1.5">
              <Step n={1}>Chạm nút <b>Chia sẻ</b> <Share className="inline h-4 w-4 -mt-1 text-primary" /> ở thanh dưới của Safari</Step>
              <Step n={2}>Chọn <b>Thêm vào MH chính</b> <PlusSquare className="inline h-4 w-4 -mt-1 text-primary" /></Step>
              <Step n={3}>Bấm <b>Thêm</b> — rồi mở LifeOS từ biểu tượng mới để bật thông báo</Step>
            </ol></>}
          {mode === 'ios-other-browser' && <><p className="text-[14px] font-bold">Mở bằng Safari để cài</p><p className="text-[12.5px] text-muted-foreground mb-3">Trên iPhone, chỉ Safari mới thêm được app vào Màn hình chính.</p>
            <Button variant="outline" className="h-10 rounded-full" onClick={copy}><Copy className="h-4 w-4 mr-1.5" />Sao chép liên kết</Button></>}
          {mode === 'in-app' && <><p className="text-[14px] font-bold">Mở trong trình duyệt</p><p className="text-[12.5px] text-muted-foreground mb-3">Bạn đang xem trong ứng dụng khác (Zalo, Facebook…). Hãy chọn “Mở bằng trình duyệt” {isIOS() ? '(Safari)' : '(Chrome)'} để cài app.</p>
            <Button variant="outline" className="h-10 rounded-full" onClick={copy}><Copy className="h-4 w-4 mr-1.5" />Sao chép liên kết</Button></>}
          {mode === 'manual' && <><p className="text-[14px] font-bold">Cài từ menu trình duyệt</p>
            <ol className="mt-2 space-y-1.5">
              <Step n={1}>Chạm menu <MoreVertical className="inline h-4 w-4 -mt-1 text-primary" /> của Chrome</Step>
              <Step n={2}>Chọn <b>Cài đặt ứng dụng</b> hoặc <b>Thêm vào màn hình chính</b></Step>
            </ol></>}
          {mode === 'unsupported' && <p className="text-[12.5px] text-muted-foreground">Trình duyệt này chưa hỗ trợ cài app. Hãy mở LifeOS bằng Chrome (Android/máy tính) hoặc Safari (iPhone).</p>}
        </div>
      </div>
      {!compact && mode !== 'installed' && <p className="mt-3 text-[11.5px] text-muted-foreground">Mẹo: {isIOS() ? 'iPhone cần iOS 16.4 trở lên và phải mở từ biểu tượng trên Màn hình chính thì mới nhận được thông báo.' : 'sau khi cài, LifeOS mở toàn màn hình và có thể nhận thông báo khi đóng app.'}</p>}
    </Surface>
  );
}

const STATE_META: Record<PushState, { label: string; tone: 'green' | 'gray' | 'red' | 'amber' }> = {
  on: { label: 'Đang bật', tone: 'green' }, off: { label: 'Đang tắt', tone: 'gray' }, denied: { label: 'Bị chặn', tone: 'red' },
  'needs-install': { label: 'Cần cài app', tone: 'amber' }, unsupported: { label: 'Không hỗ trợ', tone: 'gray' },
};

export function PushCard() {
  const { state, refresh, setState } = usePushState();
  const setStoreFlag = useLifeOSStore((s) => s.setPushNotificationsEnabled);
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const toggle = async (on: boolean) => {
    setBusy(true);
    try {
      if (on) {
        const s = await enablePush();
        setState(s);
        if (s === 'on') { setStoreFlag(true); toast.success('Đã bật thông báo trên thiết bị này'); }
        else if (s === 'denied') toast.error('Bạn đã chặn thông báo — mở cài đặt trình duyệt/điện thoại để cho phép lại.');
        else if (s === 'needs-install') toast.info('Hãy cài LifeOS vào Màn hình chính trước.');
      } else { await disablePush(); setStoreFlag(false); setState('off'); toast.success('Đã tắt thông báo trên thiết bị này'); }
      qc.invalidateQueries({ queryKey: ['push-devices'] });
    } catch (e) { toast.error((e as Error).message || 'Không bật được thông báo'); void refresh(); } finally { setBusy(false); }
  };
  const test = useMutation({
    mutationFn: () => apiFetch<{ sent: number; failed: number; devices: number }>('/push/test', { method: 'POST', body: {} }),
    onSuccess: (r) => r.sent ? toast.success(`Đã gửi tới ${r.sent}/${r.devices} thiết bị`) : toast.error(r.devices ? 'Gửi thất bại — thử tắt rồi bật lại thông báo' : 'Chưa có thiết bị nào bật thông báo'),
    onError: (e: Error) => toast.error(e.message),
  });
  const meta = state ? STATE_META[state] : null;
  return (
    <Surface className="p-4 sm:p-5">
      <SectionTitle title={<span className="inline-flex items-center gap-1.5"><BellRing className="h-4 w-4 text-primary" />Thông báo trên thiết bị này</span>} />
      <div className="flex items-center gap-3 rounded-2xl bg-secondary/50 px-3 py-3">
        <span className={cn('h-10 w-10 rounded-xl grid place-items-center shrink-0', state === 'on' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-card text-muted-foreground')}>{state === 'on' ? <BellRing className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}</span>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-semibold">Nhắc việc, thói quen, bản tin sáng</p>
          <p className="text-[11.5px] text-muted-foreground flex items-center gap-1.5 flex-wrap">{meta && <Pill tone={meta.tone}>{meta.label}</Pill>}Nhận cả khi đã đóng LifeOS</p>
        </div>
        {state == null ? <Loader2 className="h-4 w-4 animate-spin" /> : busy ? <Loader2 className="h-4 w-4 animate-spin" />
          : <Switch checked={state === 'on'} disabled={state === 'unsupported' || state === 'needs-install'} onCheckedChange={toggle} aria-label="Bật thông báo" />}
      </div>
      {state === 'needs-install' && <p className="mt-2.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 px-3 py-2 text-[12px]">Trên iPhone/iPad, hãy <b>Thêm vào Màn hình chính</b> (xem hướng dẫn ở trên) rồi mở LifeOS từ biểu tượng đó để bật thông báo.</p>}
      {state === 'denied' && <p className="mt-2.5 rounded-xl bg-destructive/10 text-destructive px-3 py-2 text-[12px]">Thông báo đang bị chặn. {isIOS() ? 'Vào Cài đặt → Thông báo → LifeOS → Cho phép thông báo.' : 'Chạm biểu tượng ổ khóa cạnh địa chỉ web (hoặc Cài đặt app → Thông báo) → Cho phép.'}</p>}
      {state === 'unsupported' && <p className="mt-2.5 text-[12px] text-muted-foreground">Trình duyệt này không hỗ trợ thông báo đẩy{isStandalone() ? '' : ' — hãy dùng Chrome, Edge, Safari (iOS 16.4+) hoặc Firefox'}.</p>}
      {state === 'on' && <Button variant="outline" className="w-full mt-3 h-10 rounded-full" onClick={() => test.mutate()} disabled={test.isPending}>{test.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Send className="h-4 w-4 mr-1.5" />}Gửi thông báo thử</Button>}
    </Surface>
  );
}

export function NotificationPrefsCard() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['push-prefs'], queryFn: () => apiFetch<{ prefs: Prefs }>('/push/prefs') });
  const [p, setP] = useState<Prefs | null>(null);
  useEffect(() => { if (data) setP(data.prefs); }, [data]);
  const save = useMutation({
    mutationFn: (patch: Partial<Prefs>) => apiFetch('/push/prefs', { method: 'PUT', body: patch }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['push-prefs'] }),
    onError: (e: Error) => toast.error(e.message),
  });
  const set = (patch: Partial<Prefs>) => { setP((s) => (s ? { ...s, ...patch } : s)); save.mutate(patch); };
  useEffect(() => {
    // Đồng bộ múi giờ thiết bị lần đầu
    if (p && !p.timezone) { const tz = Intl.DateTimeFormat().resolvedOptions().timeZone; if (tz) set({ timezone: tz }); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p?.timezone]);
  if (!p) return null;
  const quiet = !!(p.quiet_start && p.quiet_end);
  const rows: { k: keyof Prefs; title: string; hint: string }[] = [
    { k: 'task_reminders', title: 'Nhắc công việc', hint: 'Theo thời gian nhắc bạn đặt cho từng việc' },
    { k: 'habit_reminders', title: 'Nhắc thói quen', hint: 'Đúng giờ nhắc của thói quen, nếu hôm nay chưa làm' },
    { k: 'overdue_alerts', title: 'Cảnh báo quá hạn', hint: 'Báo khi có việc trễ hạn' },
    { k: 'daily_digest', title: 'Bản tin buổi sáng', hint: 'Tóm tắt việc & thói quen trong ngày' },
  ];
  return (
    <Surface className="p-4 sm:p-5">
      <SectionTitle title="Nhận thông báo về" hint={p.timezone ?? undefined} />
      <div className="divide-y divide-border/50">
        {rows.map((r) => (
          <div key={r.k} className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0"><p className="text-[13.5px] font-semibold">{r.title}</p><p className="text-[11.5px] text-muted-foreground">{r.hint}</p></div>
            <Switch checked={!!p[r.k]} onCheckedChange={(v) => set({ [r.k]: v } as Partial<Prefs>)} aria-label={r.title} />
          </div>
        ))}
        {p.daily_digest && (
          <div className="flex items-center justify-between gap-3 py-3">
            <p className="text-[13px] text-muted-foreground">Giờ gửi bản tin</p>
            <input type="time" className={cn(fieldCls, 'h-10 w-[120px]')} value={p.digest_time} onChange={(e) => e.target.value && set({ digest_time: e.target.value })} />
          </div>
        )}
        <div className="py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0"><p className="text-[13.5px] font-semibold">Giờ yên tĩnh</p><p className="text-[11.5px] text-muted-foreground">Không gửi thông báo trong khoảng này</p></div>
            <Switch checked={quiet} onCheckedChange={(v) => set(v ? { quiet_start: '22:00', quiet_end: '07:00' } : { quiet_start: null, quiet_end: null })} aria-label="Giờ yên tĩnh" />
          </div>
          {quiet && (
            <div className="grid grid-cols-2 gap-2 mt-2.5">
              <label className="text-[11.5px] text-muted-foreground">Từ<input type="time" className={cn(fieldCls, 'h-10 mt-1')} value={p.quiet_start ?? ''} onChange={(e) => e.target.value && set({ quiet_start: e.target.value })} /></label>
              <label className="text-[11.5px] text-muted-foreground">Đến<input type="time" className={cn(fieldCls, 'h-10 mt-1')} value={p.quiet_end ?? ''} onChange={(e) => e.target.value && set({ quiet_end: e.target.value })} /></label>
            </div>
          )}
        </div>
      </div>
    </Surface>
  );
}

export function DevicesCard() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['push-devices'], queryFn: () => apiFetch<{ devices: Device[] }>('/push/devices') });
  const remove = useMutation({
    mutationFn: (id: string) => apiFetch(`/push/devices/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['push-devices'] }); toast.success('Đã gỡ thiết bị'); },
  });
  const mine = localStorage.getItem('lifeos.push.endpoint');
  const devices = data?.devices ?? [];
  return (
    <Surface className="p-4 sm:p-5">
      <SectionTitle title="Thiết bị nhận thông báo" hint={`${devices.length} thiết bị`} />
      {devices.length === 0 ? <p className="text-[12.5px] text-muted-foreground">Chưa có thiết bị nào. Bật thông báo ở trên trên từng điện thoại/máy tính bạn dùng.</p> : (
        <div className="space-y-2">
          {devices.map((d) => (
            <div key={d.id} className="flex items-center gap-3 rounded-2xl bg-secondary/50 px-3 py-2.5">
              <Smartphone className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold truncate flex items-center gap-1.5">{d.device_label || d.platform || 'Thiết bị'}{d.endpoint === mine && <Pill tone="violet">Máy này</Pill>}{d.failure_count > 0 && <Pill tone="red">Lỗi gửi</Pill>}</p>
                <p className="text-[11px] text-muted-foreground truncate">{d.last_used_at ? `Nhận gần nhất ${new Date(d.last_used_at).toLocaleString('vi-VN')}` : `Đăng ký ${new Date(d.created_at).toLocaleDateString('vi-VN')}`}</p>
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" aria-label="Gỡ thiết bị" onClick={() => remove.mutate(d.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          ))}
        </div>
      )}
    </Surface>
  );
}

export function MobileAppSection() {
  return (
    <>
      <InstallAppCard />
      <PushCard />
      <NotificationPrefsCard />
      <DevicesCard />
    </>
  );
}
