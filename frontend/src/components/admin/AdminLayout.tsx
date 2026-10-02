import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  CreditCard, 
  Sparkles,
  Target,
  BookOpen,
  FileText,
  CalendarCheck,
  Palette,
  Languages,
  Bot,
  MessageSquare,
  BarChart3,
  ScrollText,
  Flag,
  Settings,
  Mail,
  History,
  Database,
  Key,
  Menu,
  CheckSquare,
  Cloud,
  ChevronDown,
  Shield,
  Globe,
  ArrowLeft,
  AudioLines,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useBranding } from '@/hooks/useBranding';
import { Mascot } from '@/components/brand/Mascot';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState, useEffect, useCallback } from 'react';
import { AdminTopBar } from './AdminTopBar';
import { AdminCommandPalette } from './AdminCommandPalette';
import { DatabaseIndicator } from '@/components/layout/DatabaseIndicator';
import { AdminErrorBoundary } from './AdminErrorBoundary';

const adminNavItems = [
  { 
    group: 'Overview',
    defaultOpen: true,
    items: [
      { title: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { title: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    ]
  },
  {
    group: 'Users',
    defaultOpen: true,
    items: [
      { title: 'Users', href: '/admin/users', icon: Users },
      { title: 'Workspaces', href: '/admin/workspaces', icon: Building2 },
      { title: 'Plans', href: '/admin/plans', icon: CreditCard },
    ]
  },
  {
    group: 'Content',
    defaultOpen: false,
    items: [
      { title: 'Features', href: '/admin/features', icon: Sparkles },
      { title: 'Goal Templates', href: '/admin/templates/goals', icon: Target },
      { title: 'Habit Templates', href: '/admin/templates/habits', icon: BookOpen },
      { title: 'Task Templates', href: '/admin/templates/tasks', icon: CheckSquare },
      { title: 'Journal Templates', href: '/admin/templates/journal', icon: FileText },
      { title: 'Review Templates', href: '/admin/templates/review', icon: CalendarCheck },
    ]
  },
  {
    group: 'Customization',
    defaultOpen: false,
    items: [
      { title: 'Themes', href: '/admin/themes', icon: Palette },
      { title: 'Languages', href: '/admin/languages', icon: Languages },
      { title: 'Translations', href: '/admin/translations', icon: FileText },
    ]
  },
  {
    group: 'AI',
    defaultOpen: false,
    items: [
      { title: 'AI Providers', href: '/admin/ai/providers', icon: Globe },
      { title: 'AI Models', href: '/admin/ai/models', icon: Bot },
      { title: 'Model theo tính năng', href: '/admin/ai/features', icon: Bot },
      { title: 'AI Memory', href: '/admin/ai/memory', icon: MessageSquare },
      { title: 'Prompts', href: '/admin/ai/prompts', icon: FileText },
      { title: 'Giọng nói AI', href: '/admin/ai/voice', icon: AudioLines },
      { title: 'API Keys', href: '/admin/api-keys', icon: Key },
    ]
  },
  {
    group: 'System',
    defaultOpen: false,
    items: [
      { title: 'Logs', href: '/admin/logs', icon: ScrollText },
      { title: 'Runtime Flags', href: '/admin/flags', icon: Flag },
      { title: 'Email Templates', href: '/admin/email-templates', icon: Mail },
      { title: 'Email Logs', href: '/admin/email-logs', icon: History },
      { title: 'Data Management', href: '/admin/data', icon: Database },
      { title: 'Backup', href: '/admin/backup', icon: Cloud },
      { title: 'Settings', href: '/admin/settings', icon: Settings },
    ]
  },
];

// Trang con (vd. /admin/users/classic) vẫn sáng mục cha; /admin chỉ sáng khi đúng trang chủ
function isAdminActive(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin' || pathname === '/admin/';
  return pathname === href || pathname.startsWith(href + '/');
}

function NavItem({ item, isActive, collapsed, onClick }: {
  item: { title: string; href: string; icon: React.ElementType };
  isActive: boolean;
  collapsed: boolean;
  onClick?: () => void;
}) {
  const link = (
    <Link
      to={item.href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-[14px] text-[13.5px] transition-colors duration-150',
        collapsed ? 'justify-center h-10 w-10 mx-auto' : 'px-3 h-10',
        isActive
          ? 'bg-primary/10 text-primary font-semibold'
          : 'text-foreground/80 hover:bg-secondary'
      )}
    >
      <item.icon className={cn('w-[18px] h-[18px] shrink-0', isActive ? 'text-primary' : 'text-foreground/60')} />
      {!collapsed && <span className="truncate">{item.title}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {item.title}
        </TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

function NavGroup({ group, collapsed, location, onItemClick }: {
  group: typeof adminNavItems[0];
  collapsed: boolean;
  location: { pathname: string };
  onItemClick?: () => void;
}) {
  const hasActive = group.items.some(i => isAdminActive(location.pathname, i.href));
  const [open, setOpen] = useState(group.defaultOpen || hasActive);

  if (collapsed) {
    return (
      <div className="space-y-1 py-1">
        {group.items.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            isActive={isAdminActive(location.pathname, item.href)}
            collapsed
            onClick={onItemClick}
          />
        ))}
      </div>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-1.5 text-[11.5px] font-semibold text-muted-foreground/80 hover:text-foreground transition-colors rounded-md">
        {group.group}
        <ChevronDown className={cn('w-3 h-3 transition-transform duration-200', open && 'rotate-180')} />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-0.5 mt-1">
        {group.items.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            isActive={isAdminActive(location.pathname, item.href)}
            collapsed={false}
            onClick={onItemClick}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function AdminLayout() {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('admin-sidebar-collapsed') === 'true'; } catch { return false; }
  });

  const toggleCollapse = useCallback(() => {
    setCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('admin-sidebar-collapsed', String(next)); } catch { /* localStorage có thể bị chặn */ }
      return next;
    });
  }, []);

  // Ctrl+B toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        if (isMobile) {
          setSidebarOpen(prev => !prev);
        } else {
          toggleCollapse();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isMobile, toggleCollapse]);

  const sidebarWidth = collapsed ? 'w-[68px]' : 'w-[260px]';
  const branding = useBranding();
  const { resolvedTheme } = useTheme();
  const logoUrl = resolvedTheme === 'dark' && branding.logo_dark_url ? branding.logo_dark_url : branding.logo_url;

  const SidebarInner = ({ onItemClick }: { onItemClick?: () => void }) => (
    <div className="flex flex-col h-full">
      {/* Sidebar header — cùng kiểu logo với app shell */}
      <div className={cn('flex items-center h-16 shrink-0', collapsed ? 'justify-center px-2' : 'px-4 gap-2.5')}>
        {logoUrl ? (
          <img src={logoUrl} alt={branding.app_name} className="w-8 h-8 rounded-lg object-contain shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-bold text-sm">{branding.app_name.charAt(0)}</span>
          </div>
        )}
        {!collapsed && (
          <div className="min-w-0 flex items-center gap-2">
            <span className="font-bold text-lg truncate">{branding.app_name}</span>
            <span className="rounded-full px-2 py-0.5 text-[10.5px] font-bold bg-primary/10 text-primary inline-flex items-center gap-1"><Shield className="w-3 h-3" />Admin</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1">
        <nav className={cn('space-y-3 py-2', collapsed ? 'px-2' : 'px-3')}>
          {adminNavItems.map((group) => (
            <NavGroup
              key={group.group}
              group={group}
              collapsed={collapsed}
              location={location}
              onItemClick={onItemClick}
            />
          ))}
        </nav>
      </ScrollArea>

      {/* Sidebar footer — thẻ mascot như app shell */}
      <div className={cn('p-3 space-y-2 shrink-0', collapsed && 'flex flex-col items-center')}>
        {!collapsed && (
          <div className="rounded-[20px] bg-gradient-to-br from-primary/10 to-[#FFE9D6]/60 dark:to-primary/5 p-3 flex items-center gap-2.5">
            <Mascot name="lumi" pose="happy" size={44} />
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-bold leading-tight">Chế độ quản trị</p>
              <Link to="/" className="text-[11.5px] font-semibold text-primary inline-flex items-center gap-1 mt-0.5"><ArrowLeft className="w-3 h-3" />Quay lại ứng dụng</Link>
            </div>
          </div>
        )}
        <DatabaseIndicator />
      </div>
    </div>
  );

  return (
    <div className="flex h-dvh bg-background">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className={cn(
          'border-r border-border bg-card flex flex-col shrink-0 transition-[width] duration-200 ease-in-out overflow-hidden',
          sidebarWidth
        )}>
          <SidebarInner />
        </aside>
      )}

      {/* Mobile Sidebar - Sheet */}
      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-[280px] p-0 bg-card">
            <SidebarInner onItemClick={() => setSidebarOpen(false)} />
          </SheetContent>
        </Sheet>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <AdminTopBar
          collapsed={isMobile ? false : collapsed}
          onToggleCollapse={isMobile ? () => setSidebarOpen(true) : toggleCollapse}
          onOpenSearch={() => setSearchOpen(true)}
        />

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <AdminErrorBoundary>
            <Outlet />
          </AdminErrorBoundary>
        </main>
      </div>

      {/* Command Palette */}
      <AdminCommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
