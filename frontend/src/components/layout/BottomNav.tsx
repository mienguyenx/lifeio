import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Target, CheckSquare, Plus, MoreHorizontal } from 'lucide-react';
// import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useNotificationBadges } from '@/hooks/useNotificationBadges';
import { Badge } from '@/components/ui/badge';
import { QuickAddSheet } from './QuickAddSheet';
import { FullScreenMenu } from './FullScreenMenu';
import { LifeIcon, ROUTE_ICON } from '@/components/icons/LifeIcon';
import { ALL_NAV_ITEMS, isActivePath } from './navigationConfig';

// "Thêm" sáng khi đang ở bất kỳ trang nào ngoài 3 tab chính (lấy từ navigationConfig dùng chung).
const MAIN_TABS = ['/', '/tasks', '/habits'];
const MORE_PATHS = ALL_NAV_ITEMS.map((i) => i.path).filter((p) => !MAIN_TABS.includes(p));

interface NavTabProps {
  path: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  badge?: number;
  badgeUrgent?: boolean;
}

function NavTab({ path, icon: Icon, label, isActive, badge, badgeUrgent }: NavTabProps) {
  return (
    <Link
      to={path}
      className={cn(
        'relative flex flex-col items-center justify-center gap-0.5 flex-1 py-1 tap-transparent',
        'active:scale-90 transition-transform duration-150',
      )}
    >
      <div className="relative">
        {ROUTE_ICON[path] ? (
          <LifeIcon
            name={ROUTE_ICON[path]}
            size={24}
            variant={isActive ? 'duotone' : 'outline'}
            color={isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
          />
        ) : (
          <Icon
            className={cn('w-6 h-6 transition-colors duration-200', isActive ? 'text-primary' : 'text-muted-foreground')}
            strokeWidth={2}
          />
        )}
        {badge != null && badge > 0 && (
          <Badge
            className={cn(
              'absolute -top-1.5 -right-2.5 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center border-2 border-card',
              badgeUrgent
                ? 'bg-destructive hover:bg-destructive text-destructive-foreground'
                : 'bg-primary hover:bg-primary text-primary-foreground',
            )}
          >
            {badge > 99 ? '99+' : badge}
          </Badge>
        )}
      </div>
      <span
        className={cn(
          'text-[10px] font-medium transition-colors duration-200',
          isActive ? 'text-primary' : 'text-muted-foreground',
        )}
      >
        {label}
      </span>
      {/* Active pill indicator */}
      {isActive && (
        <div
          className="absolute -bottom-0.5 w-5 h-[3px] rounded-full bg-primary transition-all"
        />
      )}
    </Link>
  );
}

export function BottomNav() {
  const location = useLocation();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const badges = useNotificationBadges();

  const isMoreActive = MORE_PATHS.some((p) => p !== '/' && isActivePath(location.pathname, p));

  // Vibrate on quick add open (haptic feedback)
  const handleQuickAdd = () => {
    if (navigator.vibrate) navigator.vibrate(10);
    setQuickAddOpen(true);
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border/50 safe-bottom">
        <div className="flex items-center h-16 max-w-lg mx-auto px-2">
          {/* Today */}
          <NavTab
            path="/"
            icon={Home}
            label="Hôm nay"
            isActive={location.pathname === '/'}
          />

          {/* Tasks */}
          <NavTab
            path="/tasks"
            icon={CheckSquare}
            label="Công việc"
            isActive={isActivePath(location.pathname, '/tasks')}
            badge={badges.tasks.total}
            badgeUrgent={badges.tasks.overdue > 0 || badges.tasks.high > 0}
          />

          {/* Center FAB — Quick Add */}
          <div className="flex-1 flex items-center justify-center -mt-5">
            <button
              onClick={handleQuickAdd}
              aria-label="Thêm nhanh"
              className={cn(
                'w-14 h-14 rounded-full flex items-center justify-center',
                'bg-gradient-to-br from-[#8B7CF6] to-primary shadow-fab ring-4 ring-background',
                'tap-transparent active:scale-90 transition-transform',
              )}
            >
              <Plus className="w-7 h-7 text-primary-foreground" strokeWidth={2.5} />
            </button>
          </div>

          {/* Habits */}
          <NavTab
            path="/habits"
            icon={Target}
            label="Thói quen"
            isActive={isActivePath(location.pathname, '/habits')}
            badge={badges.habits.total}
          />

          {/* More */}
          <button
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(5);
              setMenuOpen(true);
            }}
            className={cn(
              'relative flex flex-col items-center justify-center gap-0.5 flex-1 py-1 tap-transparent',
              'active:scale-90 transition-transform duration-150',
            )}
          >
            <MoreHorizontal
              className={cn(
                'w-6 h-6 transition-colors duration-200',
                isMoreActive ? 'text-primary' : 'text-muted-foreground',
              )}
              strokeWidth={isMoreActive ? 2.5 : 2}
            />
            <span
              className={cn(
                'text-[10px] font-medium transition-colors duration-200',
                isMoreActive ? 'text-primary' : 'text-muted-foreground',
              )}
            >Thêm</span>
            {isMoreActive && (
              <div
                className="absolute -bottom-0.5 w-5 h-[3px] rounded-full bg-primary transition-all"
              />
            )}
          </button>
        </div>
      </nav>

      {/* Quick Add Bottom Sheet — lazy mount */}
      {quickAddOpen && (
        <QuickAddSheet open={quickAddOpen} onOpenChange={setQuickAddOpen} />
      )}

      {/* Full Screen Menu — lazy mount */}
      {menuOpen && (
        <FullScreenMenu open={menuOpen} onOpenChange={setMenuOpen} />
      )}
    </>
  );
}
