import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, Shield } from 'lucide-react';
import { useAdminRole } from '@/hooks/useAdminRole';
import { NAV_GROUPS, ACCOUNT_ITEMS, isActivePath, type BadgeKey } from './navigationConfig';
import { useEnabledModules } from '@/hooks/useEnabledModules';
import { cn } from '@/lib/utils';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar } from '@/components/ui/sidebar';
import { useNotificationBadges, GoalsBadge, TasksBadge, HabitsBadge } from '@/hooks/useNotificationBadges';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DatabaseIndicator } from './DatabaseIndicator';
import { useBranding } from '@/hooks/useBranding';
import { notificationService } from '@/services/notificationService';
import { useTheme } from 'next-themes';
import { LifeIcon, type LifeIconName } from '@/components/icons/LifeIcon';

// Module 18: menu lấy từ navigationConfig (dùng chung với menu mobile & bảng lệnh Ctrl+K).

function TasksTooltipContent({ tasks }: { tasks: TasksBadge }) {
  return (
    <div className="text-xs space-y-1">
      {tasks.overdue > 0 && (
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-destructive" />
          <span>{tasks.overdue} quá hạn</span>
        </div>
      )}
      {tasks.high > 0 && (
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-400" />
          <span>{tasks.high} ưu tiên cao</span>
        </div>
      )}
      {tasks.medium > 0 && (
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>{tasks.medium} ưu tiên trung bình</span>
        </div>
      )}
      {tasks.low > 0 && (
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-muted-foreground" />
          <span>{tasks.low} ưu tiên thấp</span>
        </div>
      )}
    </div>
  );
}

function HabitsTooltipContent({ habits }: { habits: HabitsBadge }) {
  return (
    <div className="text-xs space-y-1">
      {habits.daily > 0 && (
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary" />
          <span>{habits.daily} thói quen hàng ngày</span>
        </div>
      )}
      {habits.weekly > 0 && (
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span>{habits.weekly} thói quen hàng tuần</span>
        </div>
      )}
    </div>
  );
}

function GoalsTooltipContent({ goals }: { goals: GoalsBadge }) {
  return (
    <div className="text-xs space-y-1">
      {goals.overdue > 0 && (
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-destructive" />
          <span>{goals.overdue} quá hạn</span>
        </div>
      )}
      {goals.approaching > 0 && (
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>{goals.approaching} sắp đến hạn</span>
        </div>
      )}
    </div>
  );
}

function TasksBadgeInline({ tasks }: { tasks: TasksBadge }) {
  if (tasks.total === 0) return null;
  
  const hasUrgent = tasks.overdue > 0 || tasks.high > 0;
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge 
          className={cn(
            "h-5 min-w-5 px-1.5 text-xs cursor-default",
            hasUrgent 
              ? "bg-destructive hover:bg-destructive text-destructive-foreground animate-pulse" 
              : "bg-primary hover:bg-primary text-primary-foreground"
          )}
        >
          {tasks.total > 99 ? '99+' : tasks.total}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="right">
        <TasksTooltipContent tasks={tasks} />
      </TooltipContent>
    </Tooltip>
  );
}

function HabitsBadgeInline({ habits }: { habits: HabitsBadge }) {
  if (habits.total === 0) return null;
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge className="h-5 min-w-5 px-1.5 text-xs cursor-default bg-primary hover:bg-primary text-primary-foreground">
          {habits.total > 99 ? '99+' : habits.total}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="right">
        <HabitsTooltipContent habits={habits} />
      </TooltipContent>
    </Tooltip>
  );
}

function GoalsBadgeInline({ goals }: { goals: GoalsBadge }) {
  if (goals.total === 0) return null;
  
  const isOverdue = goals.overdue > 0;
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge 
          className={cn(
            "h-5 min-w-5 px-1.5 text-xs cursor-default",
            isOverdue 
              ? "bg-destructive hover:bg-destructive text-destructive-foreground animate-pulse" 
              : "bg-amber-500 hover:bg-amber-500 text-white"
          )}
        >
          {goals.total > 99 ? '99+' : goals.total}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="right">
        <GoalsTooltipContent goals={goals} />
      </TooltipContent>
    </Tooltip>
  );
}

function DotIndicator({ badgeKey, badges }: { badgeKey: 'habits' | 'tasks' | 'goals'; badges: ReturnType<typeof useNotificationBadges> }) {
  const getCount = () => {
    if (badgeKey === 'goals') return badges.goals.total;
    if (badgeKey === 'tasks') return badges.tasks.due;
    return badges.habits.total;
  };

  const getColor = () => {
    if (badgeKey === 'goals') return badges.goals.overdue > 0 ? 'bg-destructive animate-pulse' : 'bg-amber-500';
    if (badgeKey === 'tasks') return badges.tasks.overdue > 0 || badges.tasks.high > 0 ? 'bg-destructive animate-pulse' : 'bg-primary';
    return 'bg-primary';
  };

  const getTooltipContent = () => {
    if (badgeKey === 'goals') return <GoalsTooltipContent goals={badges.goals} />;
    if (badgeKey === 'tasks') return <TasksTooltipContent tasks={badges.tasks} />;
    return <HabitsTooltipContent habits={badges.habits} />;
  };

  if (getCount() === 0) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn("absolute -top-1 -right-1 w-2 h-2 rounded-full cursor-default", getColor())} />
      </TooltipTrigger>
      <TooltipContent side="right">
        {getTooltipContent()}
      </TooltipContent>
    </Tooltip>
  );
}

interface MenuItemProps {
  path: string;
  icon: LifeIconName;
  label: string;
  badgeKey?: BadgeKey;
  isCollapsed: boolean;
  badges: ReturnType<typeof useNotificationBadges>;
}

function MenuItem({ path, icon, label, badgeKey = null, isCollapsed, badges }: MenuItemProps) {
  const location = useLocation();
  const isActive = isActivePath(location.pathname, path);

  const renderBadge = () => {
    if (!badgeKey) return null;
    if (badgeKey === 'goals') return <GoalsBadgeInline goals={badges.goals} />;
    if (badgeKey === 'tasks') return <TasksBadgeInline tasks={badges.tasks} />;
    if (badgeKey === 'habits') return <HabitsBadgeInline habits={badges.habits} />;
    return null;
  };

  const getBadgeCount = () => {
    if (!badgeKey) return 0;
    if (badgeKey === 'goals') return badges.goals.total;
    if (badgeKey === 'tasks') return badges.tasks.due;
    return badges.habits.total;
  };

  const menuContent = (
    <Link 
      to={path} 
      className={cn(
        'flex items-center gap-3 px-3 h-10 rounded-[14px] text-[13.5px] transition-colors relative',
        isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground/80 hover:bg-secondary hover:text-foreground'
      )}
    >
      <div className="relative">
        <LifeIcon name={icon} size={20} variant={isActive ? 'filled' : 'duotone'} />
        {getBadgeCount() > 0 && isCollapsed && badgeKey && (
          <DotIndicator badgeKey={badgeKey} badges={badges} />
        )}
      </div>
      {!isCollapsed && (
        <div className="flex items-center justify-between flex-1">
          <span>{label}</span>
          {renderBadge()}
        </div>
      )}
    </Link>
  );

  return (
    <SidebarMenuItem>
      {isCollapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarMenuButton asChild isActive={isActive}>
              {menuContent}
            </SidebarMenuButton>
          </TooltipTrigger>
          <TooltipContent side="right">
            <span className="font-medium">{label}</span>
          </TooltipContent>
        </Tooltip>
      ) : (
        <SidebarMenuButton asChild isActive={isActive}>
          {menuContent}
        </SidebarMenuButton>
      )}
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const badges = useNotificationBadges();
  const branding = useBranding();
  const { resolvedTheme } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);
  
  const { isAdmin } = useAdminRole();
  const { compactGroups: navGroups } = useEnabledModules();
  const moreGroup = NAV_GROUPS.find((g) => g.collapsible);
  const isMoreActive = !!moreGroup?.items.some((item) => isActivePath(location.pathname, item.path));
  const [overviewOpen, setOverviewOpen] = useState(isMoreActive);

  useEffect(() => {
    const unsub = notificationService.subscribe((notifs) => {
      setUnreadCount(notifs.filter(n => !n.read).length);
    });
    setUnreadCount(notificationService.getUnreadCount());
    return unsub;
  }, []);

  const logoUrl = resolvedTheme === 'dark' && branding.logo_dark_url
    ? branding.logo_dark_url
    : branding.logo_url;
  const showBadge = branding.show_notification_badge_on_logo && unreadCount > 0;

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            {logoUrl ? (
              <img src={logoUrl} alt={branding.app_name} className="w-8 h-8 rounded-lg object-contain" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">{branding.app_name.charAt(0)}</span>
              </div>
            )}
            {showBadge && (
              <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 text-[10px] font-bold flex items-center justify-center rounded-full bg-destructive text-destructive-foreground border-2 border-background">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          {!isCollapsed && branding.sidebar_logo_style !== 'icon' && (
            <span className="font-bold text-lg">{branding.app_name}</span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => {
          const items = (
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => <MenuItem key={item.path} {...item} isCollapsed={isCollapsed} badges={badges} />)}
              </SidebarMenu>
            </SidebarGroupContent>
          );
          return (
            <SidebarGroup key={group.id} className="py-1">
              {group.collapsible && !isCollapsed ? (
                <Collapsible open={overviewOpen} onOpenChange={setOverviewOpen}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1.5 text-[11.5px] font-semibold text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors">
                    <span>{group.label}</span>
                    <ChevronDown className={cn('w-4 h-4 transition-transform', overviewOpen && 'rotate-180')} />
                  </CollapsibleTrigger>
                  <CollapsibleContent>{items}</CollapsibleContent>
                </Collapsible>
              ) : (
                <>
                  {!isCollapsed && <SidebarGroupLabel className="text-[11.5px] font-semibold text-sidebar-foreground/60">{group.label}</SidebarGroupLabel>}
                  {items}
                </>
              )}
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="p-3 space-y-2">
        <SidebarMenu>
          {ACCOUNT_ITEMS.map((item) => <MenuItem key={item.path} {...item} isCollapsed={isCollapsed} badges={badges} />)}
          {isAdmin && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/admin" className="flex items-center gap-3 px-3 h-10 rounded-[14px] text-[13.5px] text-foreground/80 hover:bg-secondary">
                  <Shield className="w-5 h-5 text-primary" />
                  {!isCollapsed && <span className="flex-1 flex items-center justify-between">Quản trị<span className="rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5">ADMIN</span></span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
        <div className="flex justify-center">
          <DatabaseIndicator />
        </div>
        {!isCollapsed && (
          <div className="text-xs text-muted-foreground text-center">
            {branding.app_name} v1.0
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
