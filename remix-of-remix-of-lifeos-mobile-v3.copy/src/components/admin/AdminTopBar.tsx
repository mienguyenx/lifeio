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
import { Badge } from '@/components/ui/badge';

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
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-card/95 backdrop-blur-sm px-4">
      {/* Sidebar toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onToggleCollapse}>
            {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {collapsed ? 'Mở sidebar' : 'Thu gọn sidebar'} <kbd className="ml-1.5 text-[10px] bg-muted px-1 rounded">Ctrl+B</kbd>
        </TooltipContent>
      </Tooltip>

      {/* Breadcrumb */}
      <div className="flex-1 min-w-0">
        <AdminBreadcrumb />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* Search trigger */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onOpenSearch}>
              <Search className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            Tìm kiếm <kbd className="ml-1.5 text-[10px] bg-muted px-1 rounded">Ctrl+K</kbd>
          </TooltipContent>
        </Tooltip>

        {/* Back to App */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Quay lại App</TooltipContent>
        </Tooltip>

        {/* Admin avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
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
