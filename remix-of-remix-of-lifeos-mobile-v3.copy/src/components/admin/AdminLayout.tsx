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
  ArrowLeft,
  Mail,
  History,
  Database,
  Key,
  Menu,
  X,
  CheckSquare,
  Cloud
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState } from 'react';

const adminNavItems = [
  { 
    group: 'Overview',
    items: [
      { title: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    ]
  },
  {
    group: 'User Management',
    items: [
      { title: 'Users', href: '/admin/users', icon: Users },
      { title: 'Workspaces', href: '/admin/workspaces', icon: Building2 },
    ]
  },
  {
    group: 'Subscription',
    items: [
      { title: 'Plans', href: '/admin/plans', icon: CreditCard },
      { title: 'Features', href: '/admin/features', icon: Sparkles },
    ]
  },
  {
    group: 'Content Templates',
    items: [
      { title: 'Goal Templates', href: '/admin/templates/goals', icon: Target },
      { title: 'Habit Templates', href: '/admin/templates/habits', icon: BookOpen },
      { title: 'Task Templates', href: '/admin/templates/tasks', icon: CheckSquare },
      { title: 'Journal Templates', href: '/admin/templates/journal', icon: FileText },
      { title: 'Review Templates', href: '/admin/templates/review', icon: CalendarCheck },
    ]
  },
  {
    group: 'Customization',
    items: [
      { title: 'Themes', href: '/admin/themes', icon: Palette },
      { title: 'Languages', href: '/admin/languages', icon: Languages },
      { title: 'Translations', href: '/admin/translations', icon: FileText },
    ]
  },
  {
    group: 'AI Config',
    items: [
      { title: 'AI Models', href: '/admin/ai/models', icon: Bot },
      { title: 'Prompts', href: '/admin/ai/prompts', icon: MessageSquare },
      { title: 'API Keys', href: '/admin/api-keys', icon: Key },
    ]
  },
  {
    group: 'Monitoring',
    items: [
      { title: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
      { title: 'Logs', href: '/admin/logs', icon: ScrollText },
    ]
  },
  {
    group: 'System',
    items: [
      { title: 'Runtime Flags', href: '/admin/flags', icon: Flag },
      { title: 'Email Templates', href: '/admin/email-templates', icon: Mail },
      { title: 'Email Logs', href: '/admin/email-logs', icon: History },
      { title: 'Data Management', href: '/admin/data', icon: Database },
      { title: 'Google Drive Backup', href: '/admin/backup', icon: Cloud },
      { title: 'Settings', href: '/admin/settings', icon: Settings },
    ]
  },
];

export default function AdminLayout() {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/"><ArrowLeft className="w-4 h-4" /></Link>
            </Button>
            <h1 className="font-bold text-lg">Admin Panel</h1>
          </div>
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-3">
        <nav className="space-y-4">
          {adminNavItems.map((group) => (
            <div key={group.group}>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 mb-2">
                {group.group}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => isMobile && setSidebarOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                        isActive 
                          ? 'bg-primary text-primary-foreground' 
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.title}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="w-64 border-r bg-card flex flex-col hidden md:flex">
          <SidebarContent />
        </aside>
      )}

      {/* Mobile Sidebar - Sheet */}
      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="fixed top-4 left-4 z-50 bg-background shadow-md"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      )}

      {/* Main Content */}
      <main className={cn(
        "flex-1 overflow-auto",
        isMobile && "pt-16"
      )}>
        <Outlet />
      </main>
    </div>
  );
}
