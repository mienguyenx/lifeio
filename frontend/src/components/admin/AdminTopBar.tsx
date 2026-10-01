import { Link } from 'react-router-dom';
import { Bell, Search, PanelLeftClose, PanelLeft, LogOut, User, Settings, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AdminBreadcrumb } from './AdminBreadcrumb';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface AdminTopBarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenSearch?: () => void;
}

export function AdminTopBar({ collapsed, onToggleCollapse, onOpenSearch }: AdminTopBarProps) {
  const { user, signOut } = useAuth();
  const email = user?.email || '';
  const initials = email.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/60 bg-background/80 backdrop-blur px-4">
      {/* Sidebar toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full shrink-0" onClick={onToggleCollapse} aria-label={collapsed ? 'Mở sidebar' : 'Thu gọn sidebar'}>
            {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {collapsed ? 'Mở sidebar' : 'Thu gọn sidebar'} <kbd className="ml-1.5 text-[10px] bg-muted px-1 rounded">Ctrl+B</kbd>
        </TooltipContent>
      </Tooltip>

      {/* Breadcrumb + ô tìm kiếm dạng pill như app shell */}
      <div className="flex-1 min-w-0 flex items-center gap-4">
        <div className="min-w-0 hidden md:block"><AdminBreadcrumb /></div>
        <button type="button" onClick={onOpenSearch} className="hidden sm:flex items-center gap-2 h-9 w-full max-w-[340px] rounded-full border border-border/70 bg-card px-3.5 text-[13px] text-muted-foreground hover:border-primary/40 transition-colors">
          <Search className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left truncate">Tìm trang quản trị...</span>
          <kbd className="text-[10.5px] font-semibold bg-secondary rounded-md px-1.5 py-0.5">Ctrl K</kbd>
        </button>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* Search trigger */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:hidden" onClick={onOpenSearch} aria-label="Tìm kiếm">
              <Search className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            Tìm kiếm <kbd className="ml-1.5 text-[10px] bg-muted px-1 rounded">Ctrl+K</kbd>
          </TooltipContent>
        </Tooltip>

        <ThemeToggle />

        {/* Back to App */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <Link to="/" aria-label="Quay lại App">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Quay lại App</TooltipContent>
        </Tooltip>

        {/* Admin avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-10 gap-2 pl-1.5 pr-3 rounded-full">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-[13px] font-semibold max-w-[140px] truncate">{email.split('@')[0] || 'Admin'}</span>
                <span className="text-[10.5px] text-muted-foreground">Quản trị viên</span>
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="text-sm font-medium">Admin</p>
              <p className="text-xs text-muted-foreground truncate">{email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/admin/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/me" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()} className="text-destructive cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
