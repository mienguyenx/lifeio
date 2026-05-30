import { useNavigate } from 'react-router-dom';
import { Settings, Timer, Trash2, RefreshCw, Moon, Sun, Bell, BellOff, LogOut, Download, Upload, Package, ExternalLink, Chrome, Globe, X, RotateCcw, ShieldAlert } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { DataExportImport } from '@/components/data/DataExportImport';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useState, useEffect } from 'react';
import { useProfileSync } from '@/hooks/sync/useProfileSync';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { activeSupabase as supabase } from '@/integrations/supabase/externalClient';

function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  
  return (
    <div className="grid grid-cols-3 gap-2">
      <button
        onClick={() => setTheme('light')}
        className={cn(
          'flex flex-col items-center gap-2 p-3 rounded-lg transition-all',
          theme === 'light' ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'
        )}
      >
        <Sun className="w-5 h-5" />
        <span className="text-xs">Sáng</span>
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={cn(
          'flex flex-col items-center gap-2 p-3 rounded-lg transition-all',
          theme === 'dark' ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'
        )}
      >
        <Moon className="w-5 h-5" />
        <span className="text-xs">Tối</span>
      </button>
      <button
        onClick={() => setTheme('system')}
        className={cn(
          'flex flex-col items-center gap-2 p-3 rounded-lg transition-all',
          theme === 'system' ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'
        )}
      >
        <Settings className="w-5 h-5" />
        <span className="text-xs">Hệ thống</span>
      </button>
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
  const [extensionGuideOpen, setExtensionGuideOpen] = useState(false);
  
  const { clearAllAreaModuleData } = useProfileSync();
  const [isClearingAreaData, setIsClearingAreaData] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const RESET_CONFIRM_PHRASE = 'XOA TAT CA';

  const handleClearAreaModuleData = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa tất cả dữ liệu module area (Personal Values, Life Roles, Visions, Traits, Milestones)? Hành động này không thể hoàn tác!')) {
      return;
    }

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
        await (supabase as any).from(table).delete().eq('user_id', userId);
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
    } catch (err: any) {
      toast.error(`Lỗi: ${err.message}`);
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

  return (
    <div className={cn("p-4 md:p-6 space-y-6", !isMobile && "max-w-2xl mx-auto")}>
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6" /> Cài đặt
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Quản lý cấu hình ứng dụng</p>
      </div>

      {/* Theme Settings */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Moon className="w-5 h-5" /> Giao diện
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ThemeSelector />
        </CardContent>
      </Card>

      {/* Pomodoro Settings */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Timer className="w-5 h-5" /> Cài đặt Pomodoro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Làm việc (phút)</Label>
              <Input
                type="number"
                min="1"
                max="60"
                value={pomodoroSettings.workDuration}
                onChange={(e) => setPomodoroSettings({ workDuration: parseInt(e.target.value) || 25 })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Nghỉ ngắn (phút)</Label>
              <Input
                type="number"
                min="1"
                max="30"
                value={pomodoroSettings.breakDuration}
                onChange={(e) => setPomodoroSettings({ breakDuration: parseInt(e.target.value) || 5 })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Nghỉ dài (phút)</Label>
              <Input
                type="number"
                min="1"
                max="60"
                value={pomodoroSettings.longBreakDuration}
                onChange={(e) => setPomodoroSettings({ longBreakDuration: parseInt(e.target.value) || 15 })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Sessions trước nghỉ dài</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={pomodoroSettings.sessionsBeforeLongBreak}
                onChange={(e) => setPomodoroSettings({ sessionsBeforeLongBreak: parseInt(e.target.value) || 4 })}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="w-5 h-5" /> Thông báo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Sound Notification */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {notificationSoundEnabled ? (
                  <Bell className="w-5 h-5 text-primary" />
                ) : (
                  <BellOff className="w-5 h-5 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-medium">Âm thanh thông báo</p>
                  <p className="text-xs text-muted-foreground">
                    Phát âm thanh khi có task/goal quá hạn mới
                  </p>
                </div>
              </div>
              <Switch
                checked={notificationSoundEnabled}
                onCheckedChange={(checked) => {
                  setNotificationSoundEnabled(checked);
                  toast.success(checked ? 'Đã bật âm thanh thông báo' : 'Đã tắt âm thanh thông báo');
                }}
              />
            </div>

            <Separator />

            {/* Push Notification */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className={cn("w-5 h-5", pushNotificationsEnabled ? "text-primary" : "text-muted-foreground")} />
                <div>
                  <p className="text-sm font-medium">Thông báo Push</p>
                  <p className="text-xs text-muted-foreground">
                    Nhận thông báo trình duyệt khi có task/goal quá hạn
                  </p>
                </div>
              </div>
              <Switch
                checked={pushNotificationsEnabled}
                onCheckedChange={handlePushNotificationToggle}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Export/Import */}
      <DataExportImport />

      {/* Clear Area Module Data */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" /> Xóa dữ liệu Module Area
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-warning/10 rounded-lg border border-warning/20">
            <p className="text-sm font-medium text-warning mb-1">Cảnh báo</p>
            <p className="text-xs text-muted-foreground">
              Hành động này sẽ xóa vĩnh viễn tất cả dữ liệu trong các module:
            </p>
            <ul className="text-xs text-muted-foreground list-disc list-inside mt-2 space-y-1">
              <li>Personal Values (Giá trị cá nhân)</li>
              <li>Life Roles (Vai trò cuộc sống)</li>
              <li>Life Visions (Tầm nhìn)</li>
              <li>Personal Traits (Đặc điểm cá nhân)</li>
              <li>Life Milestones (Cột mốc cuộc sống)</li>
            </ul>
          </div>
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleClearAreaModuleData}
            disabled={isClearingAreaData}
          >
            {isClearingAreaData ? (
              <>
                <RefreshCwIcon className="w-4 h-4 mr-2 animate-spin" />
                Đang xóa...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Xóa tất cả dữ liệu Module Area
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Browser Extension */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="w-5 h-5" /> Extension trình duyệt
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Cài đặt extension để sử dụng LifeOS trong tab mới và widget trên mọi trang web.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleDownloadExtension}
              >
                <Download className="w-4 h-4 mr-2" />
                Tải Extension (ZIP)
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setExtensionGuideOpen(true)}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Xem hướng dẫn
              </Button>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
              <Chrome className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Chrome / Edge</p>
                <p className="text-xs text-muted-foreground mt-1">
                  1. Mở chrome://extensions/ → Bật Developer mode<br/>
                  2. Click "Load unpacked" → Chọn thư mục extension<br/>
                  3. Mở tab mới để sử dụng
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
              <Globe className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Tính năng</p>
                <ul className="text-xs text-muted-foreground mt-1 space-y-1 list-disc list-inside">
                  <li>Hiển thị LifeOS trong tab mới</li>
                  <li>Widget trên mọi trang web</li>
                  <li>Tạo Note và Dịch văn bản từ context menu</li>
                  <li>Đồng bộ session giữa các tab</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Dữ liệu mẫu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start" onClick={() => { loadSampleData(); toast.success('Đã load sample data!'); }}>
            <RefreshCw className="w-4 h-4 mr-2" /> Load Sample Data
          </Button>
          <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive" onClick={() => { clearAllData(); toast.success('Đã xóa tất cả dữ liệu!'); }}>
            <Trash2 className="w-4 h-4 mr-2" /> Xóa tất cả dữ liệu
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2 text-destructive">
            <ShieldAlert className="w-5 h-5" /> Vùng nguy hiểm
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20 space-y-2">
            <p className="text-sm font-medium text-destructive">Xóa toàn bộ dữ liệu & cài đặt lại</p>
            <p className="text-xs text-muted-foreground">
              Xóa vĩnh viễn <strong>tất cả</strong> dữ liệu của bạn trên máy chủ và thiết bị này: habits, tasks, goals, journal, notes, reviews, pomodoro sessions... Tài khoản vẫn giữ nguyên nhưng bạn sẽ trải qua onboarding lại từ đầu.
            </p>
          </div>
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => { setResetConfirmText(''); setResetDialogOpen(true); }}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Xóa toàn bộ & Cài đặt lại
          </Button>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Tài khoản</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-secondary/50 rounded-lg">
              <p className="text-sm font-medium">Email đăng nhập</p>
              <p className="text-xs text-muted-foreground">{authUser?.email || 'Chưa đăng nhập'}</p>
            </div>
            <Button 
              variant="destructive" 
              className="w-full" 
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" /> Đăng xuất
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Full Reset Confirmation Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={(o) => { if (!isResetting) { setResetDialogOpen(o); setResetConfirmText(''); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="w-5 h-5" /> Xác nhận xóa toàn bộ dữ liệu
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              <span className="block text-sm">Hành động này sẽ:</span>
              <ul className="text-sm list-disc list-inside space-y-1 text-foreground">
                <li>Xóa <strong>tất cả</strong> dữ liệu trên máy chủ</li>
                <li>Reset về trạng thái ban đầu (onboarding lại)</li>
                <li>Không thể hoàn tác</li>
              </ul>
              <span className="block text-sm mt-3">
                Nhập <strong className="font-mono text-destructive">{RESET_CONFIRM_PHRASE}</strong> để xác nhận:
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              placeholder={RESET_CONFIRM_PHRASE}
              value={resetConfirmText}
              onChange={(e) => setResetConfirmText(e.target.value.toUpperCase())}
              className="font-mono"
              disabled={isResetting}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setResetDialogOpen(false); setResetConfirmText(''); }} disabled={isResetting}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleFullReset}
              disabled={resetConfirmText !== RESET_CONFIRM_PHRASE || isResetting}
            >
              {isResetting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang xóa...</> : <><Trash2 className="w-4 h-4 mr-2" />Xóa toàn bộ</>}
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
    </div>
  );
}
