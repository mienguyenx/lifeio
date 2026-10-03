import { useEffect } from 'react';
import { usePreferencesSync } from '@/hooks/sync/usePreferencesSync';
import { ReactNode, CSSProperties } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useOverdueNotification } from '@/hooks/useOverdueNotification';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { BottomNav } from './BottomNav';
import { AppSidebar } from './AppSidebar';
import { PomodoroWidget } from '../pomodoro/PomodoroWidget';
import { SyncStatusIndicator } from './SyncStatusIndicator';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ContextAwareAICoach } from '@/components/ai/ContextAwareAICoach';
import { GlobalVoiceChat, openVoiceChat } from '@/features/ai-coach/components/GlobalVoiceChat';
import { AudioLines } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Keyboard, StickyNote, Trash2, User, LogOut, Settings, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useKeyboardShortcuts, SHORTCUTS } from '@/hooks/useKeyboardShortcuts';
import { toast } from 'sonner';
import { CommandPalette } from './CommandPalette';
import { ALL_NAV_ITEMS } from './navigationConfig';
import { useNotificationSync } from '@/features/notifications/useNotificationSync';
import { MobileNudges } from '@/features/notifications/MobileNudges';

interface AppLayoutProps {
  children: ReactNode;
}

// Sửa lỗi: hộp thoại phím tắt trước đây ghi sai (Alt+7/8/9 = Sức khỏe/Tài chính/Học tập) so với SHORTCUTS thật.
// Nay đọc trực tiếp từ SHORTCUTS, nhãn tiếng Việt lấy từ navigationConfig.
const SHORTCUT_ITEMS = SHORTCUTS.map((s) => ({ ...s, label: ALL_NAV_ITEMS.find((i) => i.path === s.path)?.label ?? s.label }));

export function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { loadOnboardingState } = usePreferencesSync();
  // Tải tuỳ chọn (tính năng đã bật…) từ server một lần cho mọi trang, không chỉ trang Hôm nay.
  useEffect(() => { if (user) void loadOnboardingState(); }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const { isAdmin } = useAdminRole();
  
  // Enable overdue notification sounds
  useOverdueNotification();
  useNotificationSync(!!user);
  useKeyboardShortcuts();

  const handleSignOut = async () => {
    await signOut();
    toast.success('Đã đăng xuất');
    navigate('/auth');
  };

  const userInitials = user?.user_metadata?.name 
    ? user.user_metadata.name.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || 'U';
  
  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';

  if (isMobile) {
    // Mobile: Bottom navigation with Pomodoro at top when active
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Pomodoro Widget - positioned at top via CSS in the component */}
        <PomodoroWidget />
        <main className="flex-1 pb-20 pt-0 overflow-y-auto">
          {children}
        </main>
        <BottomNav />
        {user && <MobileNudges />}
        <GlobalVoiceChat />
      </div>
    );
  }

  // Desktop/Tablet: Sidebar + Multi-column
  return (
    <SidebarProvider 
      className="h-dvh" 
      style={{ "--app-gutter": "max(0px, calc((100vw - 1920px) / 2))" } as CSSProperties}
    >
      <div className="h-full w-full bg-muted flex justify-center">
        <div className="flex w-full max-w-[1920px] h-full bg-background shadow-[0_0_50px_rgba(0,0,0,0.1)] dark:shadow-[0_0_50px_rgba(0,0,0,0.3)]">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {/* Header with Sidebar Toggle and Utility Icons */}
          <header className="h-14 flex items-center justify-between gap-4 border-b border-border/60 bg-background/80 backdrop-blur px-4 shrink-0">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <SidebarTrigger className="h-9 w-9 rounded-full" />
              <CommandPalette />
            </div>
            
            {/* Right side utilities */}
            <div className="flex items-center gap-1">
              {/* Notes */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn("h-8 w-8", location.pathname === '/notes' && 'bg-primary/10 text-primary')}
                    asChild
                  >
                    <Link to="/notes">
                      <StickyNote className="h-4 w-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Ghi chú</TooltipContent>
              </Tooltip>

              {/* Trash */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn("h-8 w-8", location.pathname === '/trash' && 'bg-primary/10 text-primary')}
                    asChild
                  >
                    <Link to="/trash">
                      <Trash2 className="h-4 w-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Thùng rác</TooltipContent>
              </Tooltip>

              {/* Keyboard Shortcuts */}
              <Dialog>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Keyboard className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Phím tắt</TooltipContent>
                </Tooltip>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Keyboard className="w-5 h-5" />
                      Phím tắt
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-2 mt-4">
                    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/50">
                      <span>Tìm trang / Thêm nhanh</span>
                      <kbd className="h-6 items-center gap-1 rounded border bg-muted px-2 font-mono text-xs font-medium">Ctrl + K</kbd>
                    </div>
                    {SHORTCUT_ITEMS.map((item) => (
                      <div key={item.path} className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/50">
                        <span>{item.label}</span>
                        <kbd className="h-6 items-center gap-1 rounded border bg-muted px-2 font-mono text-xs font-medium">
                          Alt + {item.key}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>

              {/* Sync Status */}
              <SyncStatusIndicator />

              <GlobalVoiceChat />
              {/* Voice assistant (Alt+V) */}
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Trợ lý giọng nói" title="Trợ lý giọng nói (Alt+V)" onClick={openVoiceChat}>
                <AudioLines className="h-4 w-4" />
              </Button>

              {/* AI Coach Button */}
              <ContextAwareAICoach />

              {/* Notification Center */}
              <NotificationCenter />

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-10 gap-2 pl-1.5 pr-3 rounded-full">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[13px] font-semibold hidden sm:inline-block max-w-[120px] truncate">
                      {displayName}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/me" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Hồ sơ
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Cài đặt
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer">
                          <Shield className="mr-2 h-4 w-4" />
                          Quản trị
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto min-h-0">
            {children}
          </main>
        </div>
        <PomodoroWidget />
        </div>
      </div>
    </SidebarProvider>
  );
}
