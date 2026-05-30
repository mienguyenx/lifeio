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
  Globe
} from 'lucide-react';
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
      { title: 'AI Memory', href: '/admin/ai/memory', icon: MessageSquare },
      { title: 'Prompts', href: '/admin/ai/prompts', icon: FileText },
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
        'flex items-center gap-3 rounded-lg text-sm transition-all duration-150',
        collapsed ? 'justify-center p-2' : 'px-3 py-2',
        isActive
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      )}
    >
      <item.icon className="w-4 h-4 shrink-0" />
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
  const hasActive = group.items.some(i => i.href === location.pathname);
  const [open, setOpen] = useState(group.defaultOpen || hasActive);

  if (collapsed) {
    return (
      <div className="space-y-1 py-1">
        {group.items.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            isActive={location.pathname === item.href}
            collapsed
            onClick={onItemClick}
          />
        ))}
      </div>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors rounded-md">
        {group.group}
        <ChevronDown className={cn('w-3 h-3 transition-transform duration-200', open && 'rotate-180')} />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-0.5 mt-1">
        {group.items.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            isActive={location.pathname === item.href}
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
      try { localStorage.setItem('admin-sidebar-collapsed', String(next)); } catch { /* ignore storage errors */ }
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

  const sidebarWidth = collapsed ? 'w-16' : 'w-60';

  const SidebarInner = ({ onItemClick }: { onItemClick?: () => void }) => (
    <div className="flex flex-col h-full">
      {/* Sidebar header */}
      <div className={cn('flex items-center border-b h-14 shrink-0', collapsed ? 'justify-center px-2' : 'px-4 gap-2')}>
        <div className={cn('flex items-center gap-2', collapsed && 'justify-center')}>
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-primary-foreground" />
          </div>
          {!collapsed && <span className="font-bold text-base whitespace-nowrap">Admin Panel</span>}
        </div>
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1">
        <nav className={cn('space-y-2 py-3', collapsed ? 'px-2' : 'px-3')}>
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

      {/* Sidebar footer */}
      <div className={cn('border-t p-3 space-y-2 shrink-0', collapsed && 'flex flex-col items-center')}>
        <DatabaseIndicator />
        {!collapsed && (
          <p className="text-[10px] text-muted-foreground text-center">LifeOS Admin v1.0</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className={cn(
          'border-r bg-card flex flex-col shrink-0 transition-[width] duration-200 ease-in-out overflow-hidden',
          sidebarWidth
        )}>
          <SidebarInner />
        </aside>
      )}

      {/* Mobile Sidebar - Sheet */}
      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-60 p-0">
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
