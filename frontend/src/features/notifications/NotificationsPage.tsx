// Trang Thông báo (mobile + desktop): hộp thư thông báo trong app + máy chủ, lối tắt bật thông báo đẩy.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { AlertTriangle, Bell, CheckCheck, CheckCircle2, Info, Settings2, Sparkles, Target, Trash2, Repeat, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/brand/EmptyState';
import { Page, PageHeader, SegmentedTabs, Surface } from '@/components/lio';
import { notificationService, type Notification } from '@/services/notificationService';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { InstallAppCard, PushCard } from './MobileAppSection';
import { syncServerNotifications } from './useNotificationSync';

const ICON: Record<Notification['type'], { icon: React.ReactNode; cls: string }> = {
  task: { icon: <ListChecks className="h-4 w-4" />, cls: 'bg-[#EEE9FF] text-primary dark:bg-primary/15' },
  goal: { icon: <Target className="h-4 w-4" />, cls: 'bg-[#FFE8EF] text-[#E14B7A] dark:bg-pink-500/15 dark:text-pink-300' },
  habit: { icon: <Repeat className="h-4 w-4" />, cls: 'bg-[#E3F7EE] text-[#1E9E6A] dark:bg-emerald-500/15 dark:text-emerald-300' },
  success: { icon: <CheckCircle2 className="h-4 w-4" />, cls: 'bg-[#E3F7EE] text-[#1E9E6A] dark:bg-emerald-500/15 dark:text-emerald-300' },
  warning: { icon: <AlertTriangle className="h-4 w-4" />, cls: 'bg-[#FFF3D6] text-[#C98A0B] dark:bg-amber-500/15 dark:text-amber-300' },
  error: { icon: <AlertTriangle className="h-4 w-4" />, cls: 'bg-destructive/10 text-destructive' },
  system: { icon: <Sparkles className="h-4 w-4" />, cls: 'bg-[#E6F1FF] text-[#2F7CF6] dark:bg-sky-500/15 dark:text-sky-300' },
  info: { icon: <Info className="h-4 w-4" />, cls: 'bg-[#E6F1FF] text-[#2F7CF6] dark:bg-sky-500/15 dark:text-sky-300' },
};

export default function NotificationsPage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [items, setItems] = useState<Notification[]>([]);
  const [view, setView] = useState<'all' | 'unread'>('all');
  useEffect(() => {
    const un = notificationService.subscribe(setItems);
    notificationService.checkNotifications();
    void syncServerNotifications();
    return un;
  }, []);
  const unread = items.filter((n) => !n.read).length;
  const list = useMemo(() => (view === 'unread' ? items.filter((n) => !n.read) : items), [items, view]);
  const open = (n: Notification) => { notificationService.markAsRead(n.id); if (n.actionUrl) navigate(n.actionUrl); };

  const side = (
    <div className="space-y-4">
      <PushCard />
      <InstallAppCard compact />
      <Button variant="outline" className="w-full h-10 rounded-full" onClick={() => navigate('/settings?tab=app')}><Settings2 className="h-4 w-4 mr-1.5" />Tùy chọn thông báo</Button>
    </div>
  );

  return (
    <Page className={isMobile ? 'pb-24' : undefined}>
      <PageHeader title="Thông báo" subtitle={unread ? `${unread} thông báo chưa đọc` : 'Bạn đã xem hết thông báo 🎉'}
        actions={<>
          {unread > 0 && <Button variant="outline" className="h-10 rounded-full px-4" onClick={() => notificationService.markAllAsRead()}><CheckCheck className="h-4 w-4 mr-1.5" />{isMobile ? 'Đọc hết' : 'Đánh dấu đã đọc'}</Button>}
          {!isMobile && items.length > 0 && <Button variant="ghost" className="h-10 rounded-full px-4 text-destructive hover:text-destructive" onClick={() => notificationService.deleteAllNotifications()}><Trash2 className="h-4 w-4 mr-1.5" />Xóa tất cả</Button>}
        </>} />
      <SegmentedTabs className="mb-5" full={isMobile} value={view} onChange={setView} items={[{ id: 'all', label: 'Tất cả', count: items.length }, { id: 'unread', label: 'Chưa đọc', count: unread }]} />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px] items-start">
        <div className="space-y-4 min-w-0">
          <Surface className="p-2 sm:p-3">
            {list.length === 0 ? <EmptyState mascot="mochi" compact title={view === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo'} description="Nhắc việc, thói quen và bản tin sáng sẽ xuất hiện ở đây." />
              : <div className="divide-y divide-border/50">
                {list.map((n) => (
                  <div key={n.id} role="button" tabIndex={0} onClick={() => open(n)} onKeyDown={(e) => e.key === 'Enter' && open(n)}
                    className={cn('group flex items-start gap-3 px-2.5 py-3 rounded-2xl cursor-pointer transition-colors hover:bg-secondary/60', !n.read && 'bg-primary/[0.06]')}>
                    <span className={cn('h-9 w-9 rounded-xl grid place-items-center shrink-0', ICON[n.type]?.cls ?? ICON.info.cls)}>{ICON[n.type]?.icon ?? <Bell className="h-4 w-4" />}</span>
                    <div className="min-w-0 flex-1">
                      <p className={cn('text-[13.5px] leading-snug', n.read ? 'font-medium' : 'font-bold')}>{n.title}</p>
                      {n.message && <p className="text-[12.5px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>}
                      <p className="text-[11px] text-muted-foreground mt-1">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: vi })}</p>
                    </div>
                    {!n.read && <span className="h-2.5 w-2.5 rounded-full bg-primary mt-1.5 shrink-0" />}
                    <button aria-label="Xóa" title="Xóa" className="h-8 w-8 rounded-full grid place-items-center text-muted-foreground hover:bg-card hover:text-destructive opacity-60 sm:opacity-0 sm:group-hover:opacity-100 shrink-0" onClick={(e) => { e.stopPropagation(); notificationService.deleteNotification(n.id); }}><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
              </div>}
          </Surface>
          {isMobile && side}
        </div>
        {!isMobile && <aside className="hidden xl:block sticky top-4">{side}</aside>}
      </div>
    </Page>
  );
}
