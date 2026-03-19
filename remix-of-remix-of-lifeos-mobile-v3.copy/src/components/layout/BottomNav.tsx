import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Target, CheckSquare, BookOpen, MoreHorizontal, LayoutDashboard, Compass, CircleDot, CalendarCheck, User, Flame, TrendingUp, CheckCircle2, StickyNote, Heart, Wallet, GraduationCap, Users, Trash2, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { useNotificationBadges, GoalsBadge, TasksBadge, HabitsBadge } from '@/hooks/useNotificationBadges';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

// Main bottom nav items (always visible)
const mainNavItems = [
  { path: '/', icon: Home, label: 'Today', badgeKey: null },
  { path: '/habits', icon: Target, label: 'Habits', badgeKey: 'habits' as const },
  { path: '/tasks', icon: CheckSquare, label: 'Tasks', badgeKey: 'tasks' as const },
  { path: '/journal', icon: BookOpen, label: 'Journal', badgeKey: null },
];

// Grouped menu items for "More" drawer
const DRAWER_GROUPS = {
  productivity: {
    label: 'Năng suất',
    items: [
      { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', badgeKey: null },
      { path: '/goals', icon: Compass, label: 'Goals', badgeKey: 'goals' as const },
    ],
  },
  reflection: {
    label: 'Phản chiếu',
    items: [
      { path: '/weekly-review', icon: CalendarCheck, label: 'Weekly Review', badgeKey: null },
    ],
  },
  overview: {
    label: 'Tổng quan',
    items: [
      { path: '/life-wheel', icon: CircleDot, label: 'Life Wheel', badgeKey: null },
      { path: '/health', icon: Heart, label: 'Sức khỏe', badgeKey: null },
      { path: '/finance', icon: Wallet, label: 'Tài chính', badgeKey: null },
      { path: '/learning', icon: GraduationCap, label: 'Học tập', badgeKey: null },
      { path: '/relationships', icon: Users, label: 'Quan hệ', badgeKey: null },
    ],
  },
  other: {
    label: 'Khác',
    items: [
      { path: '/notes', icon: StickyNote, label: 'Notes', badgeKey: null },
      { path: '/me', icon: User, label: 'Profile', badgeKey: null },
      { path: '/settings', icon: Settings2, label: 'Cài đặt', badgeKey: null },
      { path: '/trash', icon: Trash2, label: 'Thùng rác', badgeKey: null },
    ],
  },
};

// All drawer paths for checking active state
const allDrawerPaths = Object.values(DRAWER_GROUPS).flatMap(group => group.items.map(item => item.path));

function TasksTooltipContent({ tasks }: { tasks: TasksBadge }) {
  const completionRate = tasks.totalTasks > 0 
    ? Math.round((tasks.completedToday / Math.max(tasks.totalTasks, 1)) * 100) 
    : 0;
  
  return (
    <div className="text-xs space-y-2 min-w-[140px]">
      <div className="flex items-center justify-between pb-1 border-b border-border">
        <span className="font-medium">Hôm nay</span>
        <div className="flex items-center gap-1 text-success">
          <CheckCircle2 className="w-3 h-3" />
          <span>{tasks.completedToday} xong</span>
        </div>
      </div>
      
      <div className="space-y-1">
        {tasks.overdue > 0 && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            <span className="text-destructive font-medium">{tasks.overdue} quá hạn</span>
          </div>
        )}
        {tasks.high > 0 && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-destructive/70" />
            <span>{tasks.high} ưu tiên cao</span>
          </div>
        )}
        {tasks.medium > 0 && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-warning" />
            <span>{tasks.medium} ưu tiên TB</span>
          </div>
        )}
        {tasks.low > 0 && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-muted-foreground" />
            <span>{tasks.low} ưu tiên thấp</span>
          </div>
        )}
      </div>
      
      {tasks.totalTasks > 0 && (
        <div className="pt-1">
          <Progress value={completionRate} className="h-1.5" />
        </div>
      )}
    </div>
  );
}

function HabitsTooltipContent({ habits }: { habits: HabitsBadge }) {
  const completionRate = habits.totalActive > 0 
    ? Math.round((habits.completedToday / habits.totalActive) * 100) 
    : 0;
  
  return (
    <div className="text-xs space-y-2 min-w-[140px]">
      <div className="flex items-center justify-between pb-1 border-b border-border">
        <span className="font-medium">Hôm nay</span>
        <span className="text-success font-bold">{habits.completedToday}/{habits.totalActive}</span>
      </div>
      
      {habits.totalStreak > 0 && (
        <div className="flex items-center justify-between bg-streak/10 rounded px-2 py-1">
          <div className="flex items-center gap-1 text-streak">
            <Flame className="w-3 h-3" />
            <span className="font-medium">{habits.totalStreak} streaks</span>
          </div>
          {habits.topStreak > 0 && (
            <span className="text-muted-foreground">max: {habits.topStreak}</span>
          )}
        </div>
      )}
      
      {habits.total > 0 && (
        <div className="space-y-1">
          {habits.daily > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span>{habits.daily} hàng ngày còn lại</span>
            </div>
          )}
          {habits.weekly > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>{habits.weekly} hàng tuần còn lại</span>
            </div>
          )}
        </div>
      )}
      
      <Progress value={completionRate} className="h-1.5" />
    </div>
  );
}

function GoalsTooltipContent({ goals }: { goals: GoalsBadge }) {
  return (
    <div className="text-xs space-y-2 min-w-[140px]">
      <div className="flex items-center justify-between pb-1 border-b border-border">
        <span className="font-medium">Mục tiêu</span>
        <span className="text-success font-bold">{goals.completedGoals}/{goals.totalGoals}</span>
      </div>
      
      {goals.avgProgress > 0 && (
        <div className="flex items-center justify-between bg-primary/10 rounded px-2 py-1">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-primary" />
            <span>Tiến độ TB</span>
          </div>
          <span className="font-medium text-primary">{goals.avgProgress}%</span>
        </div>
      )}
      
      {goals.total > 0 && (
        <div className="space-y-1">
          {goals.overdue > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              <span className="text-destructive font-medium">{goals.overdue} quá hạn</span>
            </div>
          )}
          {goals.approaching > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-warning" />
              <span>{goals.approaching} sắp đến hạn</span>
            </div>
          )}
        </div>
      )}
      
      <Progress value={goals.avgProgress} className="h-1.5" />
    </div>
  );
}

function TasksBadgeDisplay({ tasks }: { tasks: TasksBadge }) {
  if (tasks.total === 0) return null;
  
  const baseClass = "absolute -top-2 -right-2 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center";
  const hasUrgent = tasks.overdue > 0 || tasks.high > 0;
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge 
          className={cn(
            baseClass, 
            hasUrgent 
              ? "bg-destructive hover:bg-destructive text-destructive-foreground animate-pulse" 
              : "bg-primary hover:bg-primary text-primary-foreground"
          )}
        >
          {tasks.total > 99 ? '99+' : tasks.total}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top" className="z-50">
        <TasksTooltipContent tasks={tasks} />
      </TooltipContent>
    </Tooltip>
  );
}

function HabitsBadgeDisplay({ habits }: { habits: HabitsBadge }) {
  if (habits.total === 0) return null;
  
  const baseClass = "absolute -top-2 -right-2 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center";
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge className={cn(baseClass, "bg-primary hover:bg-primary text-primary-foreground")}>
          {habits.total > 99 ? '99+' : habits.total}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top" className="z-50">
        <HabitsTooltipContent habits={habits} />
      </TooltipContent>
    </Tooltip>
  );
}

function GoalsBadgeDisplay({ goals }: { goals: GoalsBadge }) {
  if (goals.total === 0) return null;
  
  const baseClass = "absolute -top-2 -right-2 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center";
  const isOverdue = goals.overdue > 0;
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge 
          className={cn(
            baseClass, 
            isOverdue 
              ? "bg-destructive hover:bg-destructive text-destructive-foreground animate-pulse" 
              : "bg-amber-500 hover:bg-amber-500 text-white"
          )}
        >
          {goals.total > 99 ? '99+' : goals.total}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top" className="z-50">
        <GoalsTooltipContent goals={goals} />
      </TooltipContent>
    </Tooltip>
  );
}

interface MenuItemProps {
  path: string;
  icon: any;
  label: string;
  badgeKey: 'habits' | 'tasks' | 'goals' | null;
  onClose: () => void;
  badges: ReturnType<typeof useNotificationBadges>;
}

function DrawerMenuItem({ path, icon: Icon, label, badgeKey, onClose, badges }: MenuItemProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = location.pathname === path;

  const renderBadge = () => {
    if (!badgeKey) return null;
    if (badgeKey === 'goals') return <GoalsBadgeDisplay goals={badges.goals} />;
    if (badgeKey === 'tasks') return <TasksBadgeDisplay tasks={badges.tasks} />;
    if (badgeKey === 'habits') return <HabitsBadgeDisplay habits={badges.habits} />;
    return null;
  };

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Close drawer first
    onClose();
    
    // Use setTimeout with delay to ensure drawer closes completely before navigation
    // This is especially important for PWA on mobile devices
    setTimeout(() => {
      navigate(path);
    }, 200);
  };

  // Handle touch events for better mobile/PWA support
  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleClick(e);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={cn(
        'relative flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-all flex-1 min-w-0 touch-manipulation active:scale-95',
        isActive 
          ? 'bg-primary/10 text-primary' 
          : 'text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted'
      )}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <div className="relative">
        <Icon className="w-5 h-5" />
        {renderBadge()}
      </div>
      <span className="text-[9px] font-medium text-center leading-tight truncate w-full">{label}</span>
    </button>
  );
}

export function BottomNav() {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const badges = useNotificationBadges();

  const isMoreActive = allDrawerPaths.some(path => location.pathname === path);

  const renderBadge = (badgeKey: 'habits' | 'tasks' | 'goals' | null) => {
    if (!badgeKey) return null;
    
    if (badgeKey === 'goals') return <GoalsBadgeDisplay goals={badges.goals} />;
    if (badgeKey === 'tasks') return <TasksBadgeDisplay tasks={badges.tasks} />;
    if (badgeKey === 'habits') return <HabitsBadgeDisplay habits={badges.habits} />;
    
    return null;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-bottom z-50 pointer-events-auto touch-action-manipulation">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {mainNavItems.map(({ path, icon: Icon, label, badgeKey }) => {
          const isActive = location.pathname === path;
          return (
            <Link 
              key={path} 
              to={path} 
              className={cn(
                'relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all touch-manipulation active:scale-95', 
                'pointer-events-auto touch-action-manipulation',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground active:text-foreground'
              )}
              onTouchStart={(e) => {
                e.stopPropagation();
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
              }}
            >
              <div className="relative">
                <Icon className={cn('w-5 h-5 transition-transform', isActive && 'scale-110')} />
                {renderBadge(badgeKey)}
              </div>
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}

        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <button 
              type="button"
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all touch-manipulation active:scale-95', 
                'pointer-events-auto touch-action-manipulation',
                isMoreActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground active:text-foreground'
              )}
              onTouchStart={(e) => {
                e.stopPropagation();
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
              }}
            >
              <MoreHorizontal className={cn('w-5 h-5 transition-transform', isMoreActive && 'scale-110')} />
              <span className="text-xs font-medium">More</span>
            </button>
          </DrawerTrigger>
          <DrawerContent className="pb-safe">
            <DrawerHeader className="sr-only">
              <DrawerTitle>Menu</DrawerTitle>
              <DrawerDescription>Chọn một mục để điều hướng</DrawerDescription>
            </DrawerHeader>
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-2 mt-2" />
            
            <ScrollArea className="max-h-[50vh]">
              <div className="px-4 pb-4 space-y-3" style={{ touchAction: 'manipulation' }}>
                {/* Row 1: Productivity + Reflection */}
                <div className="flex gap-2">
                  {DRAWER_GROUPS.productivity.items.map((item) => (
                    <DrawerMenuItem
                      key={item.path}
                      path={item.path}
                      icon={item.icon}
                      label={item.label}
                      badgeKey={item.badgeKey}
                      onClose={() => setDrawerOpen(false)}
                      badges={badges}
                    />
                  ))}
                  {DRAWER_GROUPS.reflection.items.map((item) => (
                    <DrawerMenuItem
                      key={item.path}
                      path={item.path}
                      icon={item.icon}
                      label={item.label}
                      badgeKey={item.badgeKey}
                      onClose={() => setDrawerOpen(false)}
                      badges={badges}
                    />
                  ))}
                </div>

                {/* Row 2: Overview (Life Areas) */}
                <div className="flex gap-2">
                  {DRAWER_GROUPS.overview.items.map((item) => (
                    <DrawerMenuItem
                      key={item.path}
                      path={item.path}
                      icon={item.icon}
                      label={item.label}
                      badgeKey={item.badgeKey}
                      onClose={() => setDrawerOpen(false)}
                      badges={badges}
                    />
                  ))}
                </div>

                {/* Row 3: Other */}
                <div className="flex gap-2">
                  {DRAWER_GROUPS.other.items.map((item) => (
                    <DrawerMenuItem
                      key={item.path}
                      path={item.path}
                      icon={item.icon}
                      label={item.label}
                      badgeKey={item.badgeKey}
                      onClose={() => setDrawerOpen(false)}
                      badges={badges}
                    />
                  ))}
                </div>
              </div>
            </ScrollArea>
          </DrawerContent>
        </Drawer>
      </div>
    </nav>
  );
}
