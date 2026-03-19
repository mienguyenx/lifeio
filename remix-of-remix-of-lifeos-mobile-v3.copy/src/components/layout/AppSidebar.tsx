import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutDashboard, Target, CheckSquare, Compass, BookOpen, Calendar, PieChart, Heart, Wallet, GraduationCap, Users, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar } from '@/components/ui/sidebar';
import { useNotificationBadges, GoalsBadge, TasksBadge, HabitsBadge } from '@/hooks/useNotificationBadges';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DatabaseIndicator } from './DatabaseIndicator';

// Menu groups configuration
const MENU_GROUPS = {
  daily: {
    label: 'Hàng ngày',
    items: [
      { path: '/', icon: Home, label: 'Today', badgeKey: null },
      { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', badgeKey: null },
    ],
  },
  productivity: {
    label: 'Năng suất',
    items: [
      { path: '/tasks', icon: CheckSquare, label: 'Tasks', badgeKey: 'tasks' as const },
      { path: '/habits', icon: Target, label: 'Habits', badgeKey: 'habits' as const },
      { path: '/goals', icon: Compass, label: 'Goals', badgeKey: 'goals' as const },
    ],
  },
  reflection: {
    label: 'Phản chiếu',
    items: [
      { path: '/journal', icon: BookOpen, label: 'Journal', badgeKey: null },
      { path: '/weekly-review', icon: Calendar, label: 'Weekly Review', badgeKey: null },
    ],
  },
  overview: {
    label: 'Tổng quan',
    collapsible: true,
    items: [
      { path: '/life-wheel', icon: PieChart, label: 'Life Wheel', badgeKey: null },
      { path: '/health', icon: Heart, label: 'Sức khỏe', badgeKey: null },
      { path: '/finance', icon: Wallet, label: 'Tài chính', badgeKey: null },
      { path: '/learning', icon: GraduationCap, label: 'Học tập', badgeKey: null },
      { path: '/relationships', icon: Users, label: 'Quan hệ', badgeKey: null },
    ],
  },
};

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
    if (badgeKey === 'tasks') return badges.tasks.total;
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
  icon: any;
  label: string;
  badgeKey: 'habits' | 'tasks' | 'goals' | null;
  isCollapsed: boolean;
  badges: ReturnType<typeof useNotificationBadges>;
}

function MenuItem({ path, icon: Icon, label, badgeKey, isCollapsed, badges }: MenuItemProps) {
  const location = useLocation();
  const isActive = location.pathname === path;

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
    if (badgeKey === 'tasks') return badges.tasks.total;
    return badges.habits.total;
  };

  const menuContent = (
    <Link 
      to={path} 
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors relative',
        isActive ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-secondary'
      )}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
      )}
      <div className="relative">
        <Icon className="w-5 h-5" />
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
  
  // Check if any overview item is active to auto-expand
  const isOverviewActive = MENU_GROUPS.overview.items.some(item => location.pathname === item.path);
  const [overviewOpen, setOverviewOpen] = useState(isOverviewActive);

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">L</span>
          </div>
          {!isCollapsed && <span className="font-bold text-lg">LifeOS</span>}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Daily Group */}
        <SidebarGroup>
          {!isCollapsed && <SidebarGroupLabel>{MENU_GROUPS.daily.label}</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {MENU_GROUPS.daily.items.map((item) => (
                <MenuItem
                  key={item.path}
                  path={item.path}
                  icon={item.icon}
                  label={item.label}
                  badgeKey={item.badgeKey}
                  isCollapsed={isCollapsed}
                  badges={badges}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Productivity Group */}
        <SidebarGroup>
          {!isCollapsed && <SidebarGroupLabel>{MENU_GROUPS.productivity.label}</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {MENU_GROUPS.productivity.items.map((item) => (
                <MenuItem
                  key={item.path}
                  path={item.path}
                  icon={item.icon}
                  label={item.label}
                  badgeKey={item.badgeKey}
                  isCollapsed={isCollapsed}
                  badges={badges}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Reflection Group */}
        <SidebarGroup>
          {!isCollapsed && <SidebarGroupLabel>{MENU_GROUPS.reflection.label}</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {MENU_GROUPS.reflection.items.map((item) => (
                <MenuItem
                  key={item.path}
                  path={item.path}
                  icon={item.icon}
                  label={item.label}
                  badgeKey={item.badgeKey}
                  isCollapsed={isCollapsed}
                  badges={badges}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Overview Group - Collapsible */}
        <SidebarGroup>
          {!isCollapsed ? (
            <Collapsible open={overviewOpen} onOpenChange={setOverviewOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">
                <span>{MENU_GROUPS.overview.label}</span>
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform",
                  overviewOpen && "rotate-180"
                )} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {MENU_GROUPS.overview.items.map((item) => (
                      <MenuItem
                        key={item.path}
                        path={item.path}
                        icon={item.icon}
                        label={item.label}
                        badgeKey={item.badgeKey}
                        isCollapsed={isCollapsed}
                        badges={badges}
                      />
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          ) : (
            <SidebarGroupContent>
              <SidebarMenu>
                {MENU_GROUPS.overview.items.map((item) => (
                  <MenuItem
                    key={item.path}
                    path={item.path}
                    icon={item.icon}
                    label={item.label}
                    badgeKey={item.badgeKey}
                    isCollapsed={isCollapsed}
                    badges={badges}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          )}
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 space-y-2">
        <div className="flex justify-center">
          <DatabaseIndicator />
        </div>
        {!isCollapsed && (
          <div className="text-xs text-muted-foreground text-center">
            LifeOS v1.0
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
