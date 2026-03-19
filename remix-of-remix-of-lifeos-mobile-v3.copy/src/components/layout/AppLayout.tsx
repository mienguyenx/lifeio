import { ReactNode, useState, CSSProperties } from 'react';
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

interface AppLayoutProps {
  children: ReactNode;
}

// Shortcut config for dialog
const SHORTCUT_ITEMS = [
  { path: '/', label: 'Today', key: '1' },
  { path: '/dashboard', label: 'Dashboard', key: '2' },
  { path: '/habits', label: 'Habits', key: '3' },
  { path: '/tasks', label: 'Tasks', key: '4' },
  { path: '/goals', label: 'Goals', key: '5' },
  { path: '/journal', label: 'Journal', key: '6' },
  { path: '/health', label: 'Sức khỏe', key: '7' },
  { path: '/finance', label: 'Tài chính', key: '8' },
  { path: '/learning', label: 'Học tập', key: '9' },
  { path: '/me', label: 'Profile', key: '0' },
];

export function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminRole();
  
  // Enable overdue notification sounds
  useOverdueNotification();
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
          <header className="h-12 flex items-center justify-between border-b border-border px-4 shrink-0">
            <SidebarTrigger className="h-8 w-8" />
            
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
                <TooltipContent>Notes</TooltipContent>
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
                      Keyboard Shortcuts
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-2 mt-4">
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

              {/* AI Coach Button */}
              <ContextAwareAICoach />

              {/* Notification Center */}
              <NotificationCenter />

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 gap-2 px-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm hidden sm:inline-block max-w-[100px] truncate">
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
                      Profile
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
