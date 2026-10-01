import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, Chrome, Download, ExternalLink, Globe, Loader2, LogOut, Monitor, Moon, Package, RefreshCw, RotateCcw, ShieldAlert, Sun, Trash2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState } from 'react';
import { toast } from 'sonner';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { DataExportImport } from '@/components/data/DataExportImport';
import { useProfileSync } from '@/hooks/sync/useProfileSync';
import { activeSupabase as supabase } from '@/integrations/supabase/externalClient';
import { LifeIcon } from '@/components/icons/LifeIcon';
import { HeroBanner, MascotCard, Page, PageHeader, SectionTitle, SegmentedTabs, StatTile, Surface } from '@/components/lio';
import { Field, fieldCls } from '@/components/lio/form';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const txt = (s: string) => <span className="block text-[15px] leading-tight whitespace-normal line-clamp-2">{s}</span>;
type View = 'general' | 'data' | 'extension' | 'account';
const THEMES = [
  { id: 'light', label: 'Sáng', Icon: Sun },
  { id: 'dark', label: 'Tối', Icon: Moon },
  { id: 'system', label: 'Hệ thống', Icon: Monitor },
] as const;

function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="grid grid-cols-3 gap-2">
      {THEMES.map(({ id, label, Icon }) => (
        <button key={id} type="button" onClick={() => setTheme(id)} className={cn('h-20 rounded-[18px] border flex flex-col items-center justify-center gap-1.5 text-[12.5px] font-semibold transition-all', theme === id ? 'border-primary ring-4 ring-primary/10 text-primary' : 'border-border/70 text-muted-foreground hover:border-primary/40')}>
          <Icon className="h-5 w-5" />{label}
        </button>
      ))}
    </div>
  );
}

function Row({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0"><p className="text-[13.5px] font-semibold">{title}</p><p className="text-[11.5px] text-muted-foreground">{desc}</p></div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user: authUser, signOut } = useAuth();
  const pomodoroSettings = useLifeOSStore((s) => s.pomodoroSettings);
  const setPomodoroSettings = useLifeOSStore((s) => s.setPomodoroSettings);
  const loadSampleData = useLifeOSStore((s) => s.loadSampleData);
  const clearAllData = useLifeOSStore((s) => s.clearAllData);
  const getState = useLifeOSStore.getState;
  const notificationSoundEnabled = useLifeOSStore((s) => s.notificationSoundEnabled);
  const setNotificationSoundEnabled = useLifeOSStore((s) => s.setNotificationSoundEnabled);
  const pushNotificationsEnabled = useLifeOSStore((s) => s.pushNotificationsEnabled);
  const setPushNotificationsEnabled = useLifeOSStore((s) => s.setPushNotificationsEnabled);
  const isMobile = useIsMobile();
  const { theme } = useTheme();
  // /settings?tab=data mở thẳng tab tương ứng (dùng từ Thùng rác)
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab');
  const [view, setView] = useState<View>(initialTab === 'data' || initialTab === 'extension' || initialTab === 'account' ? initialTab : 'general');
  const [extensionGuideOpen, setExtensionGuideOpen] = useState(false);
  
  const { clearAllAreaModuleData } = useProfileSync();
  const [isClearingAreaData, setIsClearingAreaData] = useState(false);
  const [areaConfirmOpen, setAreaConfirmOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const RESET_CONFIRM_PHRASE = 'XOA TAT CA';

  const handleClearAreaModuleData = async () => {
    setAreaConfirmOpen(false);

    setIsClearingAreaData(true);
    try {
      const success = await clearAllAreaModuleData();
      if (success) {
        // Force clear state immediately before reload
        const currentState = getState();
        useLifeOSStore.setState({
          user: {
            ...currentState.user,
            personalValues: undefined,
            lifeRoles: undefined,
            visions: undefined,
            traits: undefined,
            milestones: undefined,
          }
        });

        toast.success('Đã xóa tất cả dữ liệu module area!');
        
        // Force hard reload with cache bypass
        setTimeout(() => {
          // Clear all caches and reload
          if ('caches' in window) {
            caches.keys().then(names => {
              names.forEach(name => caches.delete(name));
            });
          }
          // Hard reload with cache bypass
          window.location.href = window.location.href.split('#')[0] + '?clear=' + Date.now();
        }, 500);
      } else {
        toast.error('Không thể xóa dữ liệu. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error clearing area module data:', error);
      toast.error('Có lỗi xảy ra khi xóa dữ liệu.');
    } finally {
      setIsClearingAreaData(false);
    }
  };

  const handleFullReset = async () => {
    if (!authUser) return;
    setIsResetting(true);
    try {
      const userId = authUser.id;
      const tables = [
        'habits', 'tasks', 'goals', 'journal_entries', 'journal_tags',
        'notes', 'note_tags', 'life_wheel_scores', 'weekly_reviews',
        'monthly_reviews', 'yearly_plannings', 'yearly_reviews',
        'daily_intentions', 'chat_messages', 'pomodoro_sessions',
        'task_tags', 'personal_values', 'life_roles', 'life_visions',
        'personal_traits', 'life_milestones', 'saved_conversations',
      ];
      for (const table of tables) {
        await (supabase as unknown as { from: (t: string) => { delete: () => { eq: (k: string, v: string) => Promise<unknown> } } }).from(table).delete().eq('user_id', userId);
      }
      // Reset onboarding
      await supabase.from('user_settings').upsert({
        user_id: userId,
        onboarding_completed: false,
        preferences: {},
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      // Clear local store
      clearAllData();
      toast.success('Đã xóa toàn bộ dữ liệu. Đang tải lại...');
      setResetDialogOpen(false);
      setTimeout(() => { window.location.href = '/'; }, 1200);
    } catch (err) {
      toast.error(`Lỗi: ${(err as Error).message}`);
    } finally {
      setIsResetting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Đã đăng xuất');
    navigate('/auth');
  };

  const handlePushNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      if (!('Notification' in window)) {
        toast.error('Trình duyệt không hỗ trợ thông báo push');
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setPushNotificationsEnabled(true);
        toast.success('Đã bật thông báo push');
        new Notification('✅ LifeOS', {
          body: 'Thông báo push đã được bật thành công!',
          icon: '/favicon.svg',
        });
      } else if (permission === 'denied') {
        toast.error('Bạn đã từ chối quyền thông báo. Vui lòng bật lại trong cài đặt trình duyệt.');
      } else {
        toast.info('Vui lòng cho phép thông báo để nhận cảnh báo');
      }
    } else {
      setPushNotificationsEnabled(false);
      toast.success('Đã tắt thông báo push');
    }
  };

  const handleDownloadExtension = () => {
    try {
      // Tải file extension.zip từ public folder
      const link = document.createElement('a');
      link.href = '/extension.zip';
      link.download = 'lifeos-extension.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Đang tải xuống tiện ích mở rộng...');
    } catch (error) {
      console.error('Error downloading extension:', error);
      toast.error('Không thể tải extension. Vui lòng thử lại.');
    }
  };

  const themeLabel = theme === 'dark' ? 'Tối' : theme === 'light' ? 'Sáng' : 'Hệ thống';
  const notifOn = [notificationSoundEnabled, pushNotificationsEnabled].filter(Boolean).length;
  const num = (v: string, d: number) => parseInt(v) || d;

  const side = (
    <div className="space-y-4">
      <Surface className="p-4">
        <SectionTitle title="Tài khoản" />
        <div className="rounded-2xl bg-secondary/50 px-3 py-2.5">
          <p className="text-[12px] text-muted-foreground">Email đăng nhập</p>
          <p className="text-[13.5px] font-semibold truncate">{authUser?.email || 'Chưa đăng nhập'}</p>
        </div>
        <Button variant="outline" className="w-full mt-3 rounded-full" onClick={() => navigate('/me')}>Xem hồ sơ</Button>
        {authUser && <Button variant="ghost" className="w-full mt-1 rounded-full text-destructive hover:text-destructive" onClick={handleSignOut}><LogOut className="h-4 w-4 mr-1.5" />Đăng xuất</Button>}
      </Surface>
      <MascotCard mascot="mochi" pose="default" title="Theo cách của bạn" quote="Điều chỉnh LifeOS cho vừa nhịp làm việc và nghỉ ngơi của bạn." />
    </div>
  );

  return (
    <Page>
      <PageHeader title="Cài đặt" subtitle="Quản lý cấu hình ứng dụng ⚙️"
        actions={!isMobile && <Button variant="outline" className="h-10 rounded-full px-5" onClick={() => navigate('/personalization')}>Cá nhân hóa</Button>} />
      <SegmentedTabs items={[{ id: 'general', label: 'Chung' }, { id: 'data', label: 'Dữ liệu' }, { id: 'extension', label: 'Tiện ích' }, { id: 'account', label: 'Tài khoản' }]} value={view} onChange={setView} full={isMobile} className="mb-5" />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] items-start">
        <div className="space-y-4 min-w-0">
          <HeroBanner mascot="mochi" pose="default" title="Thiết lập LifeOS" subtitle="Giao diện, Pomodoro, thông báo, dữ liệu và tiện ích trình duyệt — tất cả ở một nơi." />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile icon={theme === 'dark' ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-[#E8961C]" />} tint="amber" value={txt(themeLabel)} label="Giao diện" onClick={() => setView('general')} />
            <StatTile icon="module/focus" tint="rose" value={`${pomodoroSettings.workDuration}/${pomodoroSettings.breakDuration}`} label="Pomodoro" hint="phút làm / nghỉ" onClick={() => setView('general')} />
            <StatTile icon="module/notifications" tint="sky" value={`${notifOn}/2`} label="Thông báo" hint="đang bật" onClick={() => setView('general')} />
            <StatTile icon="module/sync" tint="mint" value={txt(authUser ? 'Đã đăng nhập' : 'Khách')} label="Tài khoản" onClick={() => setView('account')} />
          </div>

          {view === 'general' && (
            <>
              <Surface className="p-4 sm:p-5"><SectionTitle title="Giao diện" /><ThemeSelector /></Surface>
              <Surface className="p-4 sm:p-5">
                <SectionTitle title="Pomodoro" hint="phút" />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Làm việc"><input type="number" min="1" max="60" className={fieldCls} value={pomodoroSettings.workDuration} onChange={(e) => setPomodoroSettings({ workDuration: num(e.target.value, 25) })} /></Field>
                  <Field label="Nghỉ ngắn"><input type="number" min="1" max="30" className={fieldCls} value={pomodoroSettings.breakDuration} onChange={(e) => setPomodoroSettings({ breakDuration: num(e.target.value, 5) })} /></Field>
                  <Field label="Nghỉ dài"><input type="number" min="1" max="60" className={fieldCls} value={pomodoroSettings.longBreakDuration} onChange={(e) => setPomodoroSettings({ longBreakDuration: num(e.target.value, 15) })} /></Field>
                  <Field label="Số phiên trước nghỉ dài"><input type="number" min="1" max="10" className={fieldCls} value={pomodoroSettings.sessionsBeforeLongBreak} onChange={(e) => setPomodoroSettings({ sessionsBeforeLongBreak: num(e.target.value, 4) })} /></Field>
                </div>
              </Surface>
              <Surface className="p-4 sm:p-5">
                <SectionTitle title="Thông báo" />
                <div className="divide-y divide-border/50">
                  <Row title="Âm thanh thông báo" desc="Phát âm thanh khi có công việc/mục tiêu quá hạn mới">
                    <Switch checked={notificationSoundEnabled} onCheckedChange={(checked) => { setNotificationSoundEnabled(checked); toast.success(checked ? 'Đã bật âm thanh thông báo' : 'Đã tắt âm thanh thông báo'); }} />
                  </Row>
                  <Row title="Thông báo đẩy" desc="Nhận thông báo trình duyệt khi có công việc/mục tiêu quá hạn">
                    <Switch checked={pushNotificationsEnabled} onCheckedChange={handlePushNotificationToggle} />
                  </Row>
                </div>
              </Surface>
            </>
          )}

          {view === 'data' && (
            <>
              <DataExportImport />
              <Surface className="p-4 sm:p-5">
                <SectionTitle title="Dữ liệu mẫu" />
                <div className="grid sm:grid-cols-2 gap-2">
                  <Button variant="outline" className="h-11 rounded-full justify-start" onClick={() => { loadSampleData(); toast.success('Đã tải dữ liệu mẫu!'); }}><RefreshCw className="h-4 w-4 mr-2" />Tải dữ liệu mẫu</Button>
                  <Button variant="outline" className="h-11 rounded-full justify-start text-destructive hover:text-destructive" onClick={() => { clearAllData(); toast.success('Đã xóa tất cả dữ liệu!'); }}><Trash2 className="h-4 w-4 mr-2" />Xóa dữ liệu trên thiết bị</Button>
                </div>
              </Surface>
              <Surface className="p-4 sm:p-5">
                <SectionTitle title={<span className="inline-flex items-center gap-1.5"><AlertTriangle className="h-4 w-4 text-[#E8961C]" />Xóa dữ liệu Module Area</span>} />
                <div className="rounded-2xl bg-[#FFF6D9] dark:bg-amber-500/10 p-3 text-[12.5px]">
                  <p className="font-semibold text-[#B7791F] mb-1">Cảnh báo — xóa vĩnh viễn dữ liệu trong:</p>
                  <p className="text-muted-foreground">Giá trị cá nhân · Vai trò cuộc sống · Tầm nhìn · Đặc điểm cá nhân · Cột mốc cuộc sống</p>
                </div>
                <Button variant="destructive" className="w-full mt-3 h-11 rounded-full" onClick={() => setAreaConfirmOpen(true)} disabled={isClearingAreaData}>
                  {isClearingAreaData ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang xóa...</> : <><Trash2 className="h-4 w-4 mr-2" />Xóa tất cả dữ liệu Module Area</>}
                </Button>
              </Surface>
              <Surface className="p-4 sm:p-5 border-destructive/30">
                <SectionTitle title={<span className="inline-flex items-center gap-1.5 text-destructive"><ShieldAlert className="h-4 w-4" />Vùng nguy hiểm</span>} />
                <div className="rounded-2xl bg-destructive/10 p-3 text-[12.5px]">
                  <p className="font-semibold text-destructive mb-1">Xóa toàn bộ dữ liệu & cài đặt lại</p>
                  <p className="text-muted-foreground">Xóa vĩnh viễn <strong>tất cả</strong> dữ liệu trên máy chủ và thiết bị này: thói quen, công việc, mục tiêu, nhật ký, ghi chú, review, phiên Pomodoro... Tài khoản vẫn giữ nguyên nhưng bạn sẽ làm onboarding lại từ đầu.</p>
                </div>
                <Button variant="destructive" className="w-full mt-3 h-11 rounded-full" disabled={!authUser} onClick={() => { setResetConfirmText(''); setResetDialogOpen(true); }}><RotateCcw className="h-4 w-4 mr-2" />Xóa toàn bộ & cài đặt lại</Button>
              </Surface>
            </>
          )}

          {view === 'extension' && (
            <Surface className="p-4 sm:p-5">
              <SectionTitle title={<span className="inline-flex items-center gap-1.5"><Package className="h-4 w-4 text-primary" />Tiện ích trình duyệt</span>} />
              <p className="text-[13px] text-muted-foreground mb-3">Cài tiện ích để dùng LifeOS trong tab mới và widget trên mọi trang web.</p>
              <div className="grid sm:grid-cols-2 gap-2 mb-4">
                <Button className="h-11 rounded-full justify-start" onClick={handleDownloadExtension}><Download className="h-4 w-4 mr-2" />Tải tiện ích (ZIP)</Button>
                <Button variant="outline" className="h-11 rounded-full justify-start" onClick={() => setExtensionGuideOpen(true)}><ExternalLink className="h-4 w-4 mr-2" />Xem hướng dẫn</Button>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="flex items-start gap-3 rounded-2xl bg-secondary/50 p-3">
                  <Chrome className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div><p className="text-[13px] font-semibold">Chrome / Edge</p><p className="text-[12px] text-muted-foreground mt-1">1. Mở chrome://extensions/ → bật Developer mode<br />2. Nhấn “Load unpacked” → chọn thư mục extension<br />3. Mở tab mới để sử dụng</p></div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl bg-secondary/50 p-3">
                  <Globe className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div><p className="text-[13px] font-semibold">Tính năng</p><ul className="text-[12px] text-muted-foreground mt-1 space-y-0.5 list-disc list-inside"><li>LifeOS trong tab mới</li><li>Widget trên mọi trang web</li><li>Tạo ghi chú & dịch từ menu chuột phải</li><li>Đồng bộ phiên giữa các tab</li></ul></div>
                </div>
              </div>
            </Surface>
          )}

          {view === 'account' && (
            <Surface className="p-4 sm:p-5">
              <SectionTitle title="Tài khoản" />
              <div className="flex items-center gap-3 rounded-2xl bg-secondary/50 p-3">
                <span className="h-10 w-10 rounded-[13px] bg-lavender dark:bg-primary/15 grid place-items-center"><LifeIcon name="module/profile" size={22} variant="duotone" /></span>
                <div className="min-w-0"><p className="text-[12px] text-muted-foreground">Email đăng nhập</p><p className="text-[14px] font-semibold truncate">{authUser?.email || 'Chưa đăng nhập'}</p></div>
              </div>
              <Button variant="destructive" className="w-full mt-3 h-11 rounded-full" onClick={handleSignOut}><LogOut className="h-4 w-4 mr-2" />Đăng xuất</Button>
            </Surface>
          )}
          {isMobile && side}
        </div>
        {!isMobile && <aside className="hidden xl:block sticky top-4">{side}</aside>}
      </div>

      <AlertDialog open={areaConfirmOpen} onOpenChange={setAreaConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa dữ liệu Module Area?</AlertDialogTitle>
            <AlertDialogDescription>Giá trị cá nhân, vai trò, tầm nhìn, đặc điểm và cột mốc sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác!</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleClearAreaModuleData}>Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={resetDialogOpen} onOpenChange={(o) => { if (!isResetting) { setResetDialogOpen(o); setResetConfirmText(''); } }}>
        <DialogContent className="max-w-md rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive"><ShieldAlert className="h-5 w-5" />Xác nhận xóa toàn bộ dữ liệu</DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              <span className="block text-sm">Hành động này sẽ:</span>
              <ul className="text-sm list-disc list-inside space-y-1 text-foreground">
                <li>Xóa <strong>tất cả</strong> dữ liệu trên máy chủ</li>
                <li>Đặt lại về trạng thái ban đầu (onboarding lại)</li>
                <li>Không thể hoàn tác</li>
              </ul>
              <span className="block text-sm mt-3">Nhập <strong className="font-mono text-destructive">{RESET_CONFIRM_PHRASE}</strong> để xác nhận:</span>
            </DialogDescription>
          </DialogHeader>
          <input className={cn(fieldCls, 'font-mono')} placeholder={RESET_CONFIRM_PHRASE} value={resetConfirmText} onChange={(e) => setResetConfirmText(e.target.value.toUpperCase())} disabled={isResetting} />
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-full" onClick={() => { setResetDialogOpen(false); setResetConfirmText(''); }} disabled={isResetting}>Hủy</Button>
            <Button variant="destructive" className="rounded-full" onClick={handleFullReset} disabled={resetConfirmText !== RESET_CONFIRM_PHRASE || isResetting}>
              {isResetting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang xóa...</> : <><Trash2 className="h-4 w-4 mr-2" />Xóa toàn bộ</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extension Guide Modal */}
      <Dialog open={extensionGuideOpen} onOpenChange={setExtensionGuideOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Hướng dẫn cài đặt Extension LifeOS
            </DialogTitle>
            <DialogDescription>
              Cài đặt extension để sử dụng LifeOS trong tab mới và widget trên mọi trang web
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            {/* Bước 1: Tải Extension */}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">1</span>
                Tải Extension
              </h3>
              <div className="pl-10 space-y-2">
                <p className="text-sm text-muted-foreground">
                  Click nút <strong>"Tải Extension (ZIP)"</strong> ở trên để tải file <code className="bg-secondary px-1.5 py-0.5 rounded">lifeos-extension.zip</code>
                </p>
                <p className="text-sm text-muted-foreground">
                  Sau khi tải xong, giải nén file ZIP vào một thư mục dễ tìm (ví dụ: Desktop)
                </p>
              </div>
            </div>

            {/* Bước 2: Cài đặt Chrome/Edge */}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">2</span>
                Cài đặt trên Chrome / Edge
              </h3>
              <div className="pl-10 space-y-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Bước 2.1: Mở trang quản lý Extension</p>
                  <p className="text-sm text-muted-foreground">
                    Mở trình duyệt Chrome hoặc Edge, gõ vào thanh địa chỉ:
                  </p>
                  <code className="block bg-secondary px-3 py-2 rounded text-sm font-mono">
                    chrome://extensions/
                  </code>
                  <p className="text-xs text-muted-foreground mt-1">
                    Hoặc vào <strong>Menu (⋮)</strong> → <strong>Extensions</strong> → <strong>Manage Extensions</strong>
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium">Bước 2.2: Bật Developer Mode</p>
                  <p className="text-sm text-muted-foreground">
                    Tìm và bật công tắc <strong>"Developer mode"</strong> ở góc trên bên phải trang
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium">Bước 2.3: Load Extension</p>
                  <p className="text-sm text-muted-foreground">
                    Click nút <strong>"Load unpacked"</strong> hoặc <strong>"Tải tiện ích đã giải nén"</strong>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Chọn thư mục <code className="bg-secondary px-1.5 py-0.5 rounded">extension</code> đã giải nén từ file ZIP
                  </p>
                </div>
              </div>
            </div>

            {/* Bước 3: Sử dụng */}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">3</span>
                Sử dụng Extension
              </h3>
              <div className="pl-10 space-y-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Tab mới</p>
                  <p className="text-sm text-muted-foreground">
                    Mở tab mới trong trình duyệt, bạn sẽ thấy LifeOS hiển thị như một ứng dụng di động
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium">Widget trên trang web</p>
                  <p className="text-sm text-muted-foreground">
                    Khi duyệt bất kỳ trang web nào, bạn sẽ thấy widget LifeOS ở góc màn hình với các tính năng:
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                    <li>Pomodoro Timer</li>
                    <li>Danh sách công việc hôm nay</li>
                    <li>Mở LifeOS trong tab mới</li>
                    <li>Thu gọn/mở rộng widget</li>
                  </ul>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium">Context Menu (Menu chuột phải)</p>
                  <p className="text-sm text-muted-foreground">
                    Khi chọn (highlight) văn bản trên trang web, click chuột phải sẽ thấy:
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                    <li><strong>LifeOS: Tạo Note</strong> - Tạo ghi chú từ văn bản đã chọn</li>
                    <li><strong>LifeOS: Dịch</strong> - Dịch văn bản đã chọn</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Lưu ý */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">⚠️ Lưu ý quan trọng</p>
              <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-300 space-y-1 ml-2">
                <li>Extension chỉ hoạt động khi bạn đã đăng nhập vào LifeOS</li>
                <li>Widget sẽ tự động đồng bộ với tài khoản LifeOS của bạn</li>
                <li>Nếu gặp lỗi, thử tắt và bật lại extension trong trang quản lý</li>
                <li>Đảm bảo bạn đang sử dụng Chrome hoặc Edge (Chromium) phiên bản mới nhất</li>
              </ul>
            </div>

            {/* Troubleshooting */}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Khắc phục sự cố</h3>
              <div className="pl-4 space-y-2 text-sm text-muted-foreground">
                <div>
                  <p className="font-medium">Extension không hiển thị trong tab mới?</p>
                  <p className="ml-4">→ Kiểm tra xem extension đã được bật chưa trong trang quản lý</p>
                </div>
                <div>
                  <p className="font-medium">Widget không xuất hiện trên trang web?</p>
                  <p className="ml-4">→ Refresh trang web (F5) hoặc kiểm tra xem extension có đang chạy không</p>
                </div>
                <div>
                  <p className="font-medium">Lỗi "Extension context invalidated"?</p>
                  <p className="ml-4">→ Tắt và bật lại extension, sau đó refresh trang web</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Page>
  );
}
