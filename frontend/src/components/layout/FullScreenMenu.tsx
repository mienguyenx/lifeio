import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { X, User, LogOut, Shield, Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { notificationService } from '@/services/notificationService';
import { LifeIcon } from '@/components/icons/LifeIcon';
import { ACCOUNT_ITEMS, isActivePath } from './navigationConfig';
import { useEnabledModules } from '@/hooks/useEnabledModules';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';

interface FullScreenMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Module 18: dùng chung cấu hình với Sidebar desktop → mobile có đủ mọi trang (trước đây thiếu Nhật ký, 10 lĩnh vực, Quyết định, Bộ nhớ AI, Cá nhân hóa).

const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const menuVariants: Variants = {
  hidden: { y: '100%' },
  visible: {
    y: 0,
    transition: { type: 'spring', damping: 28, stiffness: 350 },
  },
  exit: {
    y: '100%',
    transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.05 + i * 0.03, duration: 0.25 },
  }),
};

export function FullScreenMenu({ open, onOpenChange }: FullScreenMenuProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminRole();
  const { compactGroups, hiddenCount } = useEnabledModules();
  const menuGroups = [...compactGroups.map((g) => ({ label: g.label, items: g.items })), { label: 'Tài khoản', items: ACCOUNT_ITEMS.filter((i) => i.path !== '/modules') }];
  const [unread, setUnread] = useState(0);
  useEffect(() => notificationService.subscribe((n) => setUnread(n.filter((x) => !x.read).length)), []);

  const userInitials = user?.user_metadata?.name
    ? user.user_metadata.name.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || 'U';
  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';

  const handleNavigate = (path: string) => {
    onOpenChange(false);
    setTimeout(() => navigate(path), 180);
  };

  const handleSignOut = async () => {
    onOpenChange(false);
    await signOut();
    toast.success('Đã đăng xuất');
    navigate('/auth');
  };

  let globalIndex = 0;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />

          <motion.div
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-x-0 bottom-0 z-50 bg-background rounded-t-3xl max-h-[85vh] flex flex-col safe-bottom overscroll-contain"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 shrink-0">
              <h2 className="text-[20px] font-extrabold">Menu</h2>
              <span className="ml-auto" />
              <button onClick={() => handleNavigate('/notifications')} aria-label="Thông báo" className="relative p-2 mr-1 rounded-full hover:bg-muted tap-transparent active:scale-95 transition-transform">
                <Bell className="w-5 h-5" />
                {unread > 0 && <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold grid place-items-center">{unread > 9 ? '9+' : unread}</span>}
              </button>
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 rounded-full hover:bg-muted tap-transparent active:scale-95 transition-transform"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-6">
              {menuGroups.map((group, gi) => (
                <div key={group.label} className="mb-5">
                  <p className="text-[12px] font-semibold text-muted-foreground mb-2 px-1">
                    {group.label}
                  </p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {group.items.map((item) => {
                      const isActive = isActivePath(location.pathname, item.path);
                      const idx = globalIndex++;
                      return (
                        <motion.button
                          key={item.path}
                          custom={idx}
                          variants={itemVariants}
                          initial="hidden"
                          animate="visible"
                          onClick={() => handleNavigate(item.path)}
                          className={cn(
                            'flex flex-col items-center gap-1.5 p-2.5 rounded-[18px] transition-all tap-transparent active:scale-95',
                            isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground'
                          )}
                        >
                          <span className={cn('h-11 w-11 rounded-[14px] grid place-items-center', isActive ? 'bg-card shadow-soft' : 'bg-secondary/70')}>
                            <LifeIcon name={item.icon} size={24} variant={isActive ? 'filled' : 'duotone'} />
                          </span>
                          <span className="text-[11.5px] font-medium leading-tight text-center">{item.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                  {gi === 0 && (
                    <div className="mt-3">
              <button onClick={() => handleNavigate('/modules')} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-dashed border-primary/40 bg-primary/[0.04] text-left tap-transparent active:scale-[0.98] transition-transform">
                <span className="h-10 w-10 rounded-[13px] bg-primary/10 text-primary grid place-items-center shrink-0"><Plus className="h-5 w-5" /></span>
                <span className="flex-1 min-w-0"><span className="block text-[13.5px] font-semibold">Tính năng</span><span className="block text-[11.5px] text-muted-foreground">{hiddenCount ? `Mở thêm ${hiddenCount} tính năng khi bạn cần` : 'Bật/tắt tính năng hiển thị trong menu'}</span></span>
              </button>

                    </div>
                  )}
                </div>
              ))}

              {/* Admin Link */}
              {isAdmin && (
                <button
                  onClick={() => handleNavigate('/admin')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-muted tap-transparent active:scale-[0.98] transition-transform mb-4"
                >
                  <Shield className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">Quản trị</span>
                </button>
              )}

              {/* User section */}
              <div className="border-t border-border pt-4 mt-2">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => handleNavigate('/me')}
                    className="p-2 rounded-full hover:bg-muted tap-transparent"
                  >
                    <User className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-destructive/10 text-destructive hover:bg-destructive/20 tap-transparent active:scale-[0.98] transition-transform"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Đăng xuất</span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
