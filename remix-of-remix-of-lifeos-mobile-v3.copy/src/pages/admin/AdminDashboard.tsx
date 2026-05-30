import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardStats, useSystemLogs, useRecentUsers, useRecentGoals } from '@/hooks/useAdminData';
import { 
  Users, Target, BookOpen, CheckSquare, AlertTriangle, CheckCircle, Info, XCircle,
  TrendingUp, FileText, Notebook, Timer, Puzzle, Flag, Globe, Activity, UserPlus,
  RefreshCw, Settings, Bot, Database, BarChart3, Zap, Shield, Clock
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DatabaseStatusCard } from '@/components/admin/DatabaseStatusCard';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { PageTransition, StaggerContainer, StaggerItem, FadeIn } from '@/components/admin/AdminAnimations';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const getLevelIcon = (level: string) => {
  switch (level) {
    case 'error':
      return <XCircle className="h-4 w-4 text-destructive" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case 'success':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    default:
      return <Info className="h-4 w-4 text-blue-500" />;
  }
};

const getLevelBadgeVariant = (level: string) => {
  switch (level) {
    case 'error':
      return 'destructive';
    case 'warning':
      return 'secondary';
    case 'success':
      return 'default';
    default:
      return 'outline';
  }
};

const QUICK_ACTIONS = [
  { title: 'Users', icon: Users, href: '/admin/users', color: 'text-blue-500', bgColor: 'bg-blue-500/10', shortcut: 'U' },
  { title: 'Analytics', icon: BarChart3, href: '/admin/analytics', color: 'text-green-500', bgColor: 'bg-green-500/10', shortcut: 'A' },
  { title: 'Plugins', icon: Puzzle, href: '/admin/features', color: 'text-purple-500', bgColor: 'bg-purple-500/10', shortcut: 'P' },
  { title: 'AI Models', icon: Bot, href: '/admin/ai/models', color: 'text-orange-500', bgColor: 'bg-orange-500/10', shortcut: 'M' },
  { title: 'Flags', icon: Flag, href: '/admin/flags', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', shortcut: 'F' },
  { title: 'Settings', icon: Settings, href: '/admin/settings', color: 'text-pink-500', bgColor: 'bg-pink-500/10', shortcut: 'S' },
  { title: 'Logs', icon: AlertTriangle, href: '/admin/logs', color: 'text-amber-500', bgColor: 'bg-amber-500/10', shortcut: 'L' },
  { title: 'Backup', icon: Database, href: '/admin/backup', color: 'text-cyan-500', bgColor: 'bg-cyan-500/10', shortcut: 'B' },
];

const AUTO_REFRESH_INTERVAL = 30000; // 30s

export default function AdminDashboard() {
  const isMobile = useIsMobile();
  const { data: stats, isLoading: statsLoading, refetch: refetchStats, dataUpdatedAt } = useDashboardStats();
  const { data: logs, isLoading: logsLoading, refetch: refetchLogs } = useSystemLogs();
  const { data: recentUsers, refetch: refetchUsers } = useRecentUsers();
  const { data: recentGoals, refetch: refetchGoals } = useRecentGoals();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([refetchStats(), refetchLogs(), refetchUsers(), refetchGoals()]);
    setLastRefreshed(new Date());
    setIsRefreshing(false);
  }, [refetchStats, refetchLogs, refetchUsers, refetchGoals]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefreshEnabled) return;
    const timer = setInterval(handleRefresh, AUTO_REFRESH_INTERVAL);
    return () => clearInterval(timer);
  }, [autoRefreshEnabled, handleRefresh]);

  const statCards = [
    { 
      title: 'Người dùng', 
      value: stats?.users.total ?? 0, 
      icon: Users, 
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      subValue: `+${stats?.users.newThisWeek ?? 0} tuần này`,
      href: '/admin/users'
    },
    { 
      title: 'Mục tiêu', 
      value: stats?.goals.total ?? 0, 
      icon: Target, 
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      subValue: `${stats?.goals.completionRate ?? 0}% hoàn thành`,
      progress: stats?.goals.completionRate ?? 0,
      href: '/admin/analytics'
    },
    { 
      title: 'Thói quen', 
      value: stats?.habits.total ?? 0, 
      icon: BookOpen, 
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      href: '/admin/analytics'
    },
    { 
      title: 'Công việc', 
      value: stats?.tasks.total ?? 0, 
      icon: CheckSquare, 
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      subValue: `${stats?.tasks.completionRate ?? 0}% hoàn thành`,
      progress: stats?.tasks.completionRate ?? 0,
      href: '/admin/analytics'
    },
  ];

  const contentStats = [
    { title: 'Nhật ký', value: stats?.content.journalEntries ?? 0, icon: FileText, color: 'text-pink-500', bgColor: 'bg-pink-500/10' },
    { title: 'Ghi chú', value: stats?.content.notes ?? 0, icon: Notebook, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10' },
    { title: 'Pomodoro', value: stats?.content.pomodoroSessions ?? 0, icon: Timer, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  ];

  const systemStats = [
    { title: 'Plugins', value: stats?.system.activePlugins ?? 0, icon: Puzzle, color: 'text-indigo-500', bgColor: 'bg-indigo-500/10', href: '/admin/features' },
    { title: 'Feature Flags', value: stats?.system.activeFeatureFlags ?? 0, icon: Flag, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', href: '/admin/flags' },
    { title: 'Ngôn ngữ', value: stats?.system.activeLanguages ?? 0, icon: Globe, color: 'text-rose-500', bgColor: 'bg-rose-500/10', href: '/admin/languages' },
  ];

  // Error logs count
  const errorCount = logs?.filter(l => l.level === 'error').length ?? 0;
  const warnCount = logs?.filter(l => l.level === 'warning').length ?? 0;

  return (
    <PageTransition className="p-6 space-y-6">
      <AdminPageHeader
        title="Admin Dashboard"
        description="Tổng quan hệ thống LifeOS"
        icon={Activity}
        actions={
          <div className="flex items-center gap-2">
            {/* Auto-refresh indicator */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={autoRefreshEnabled ? 'default' : 'outline'}
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                >
                  <div className={cn('w-1.5 h-1.5 rounded-full', autoRefreshEnabled ? 'bg-green-400 animate-pulse' : 'bg-muted-foreground')} />
                  <span className="text-xs hidden sm:inline">Auto</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {autoRefreshEnabled ? 'Auto-refresh mỗi 30s (bấm để tắt)' : 'Auto-refresh đã tắt (bấm để bật)'}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                  <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Refresh — cập nhật lúc {format(lastRefreshed, 'HH:mm:ss')}
              </TooltipContent>
            </Tooltip>

            {/* System status badge */}
            <Badge variant={errorCount > 0 ? 'destructive' : 'outline'} className="gap-1">
              {errorCount > 0 ? (
                <><AlertTriangle className="w-3 h-3" />{errorCount} lỗi</>
              ) : (
                <><Zap className="w-3 h-3" />Hệ thống OK</>
              )}
            </Badge>
          </div>
        }
      />

      {/* Database Status */}
      <DatabaseStatusCard />

      {/* Main Stats Grid */}
      <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <StaggerItem key={stat.title}>
          <Link to={stat.href || '#'}>
            <Card className="hover:shadow-md transition-all duration-200 cursor-pointer group border-transparent hover:border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110',
                    stat.bgColor
                  )}>
                    <stat.icon className={cn('w-6 h-6', stat.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    {statsLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <>
                        <div className="text-2xl font-bold tabular-nums">{stat.value.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{stat.title}</div>
                      </>
                    )}
                  </div>
                </div>
                {!statsLoading && stat.subValue && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-green-500" />
                        {stat.subValue}
                      </span>
                    </div>
                    {stat.progress !== undefined && (
                      <Progress value={stat.progress} className="h-1 mt-1.5" />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* System Health + Content Stats */}
      <FadeIn delay={0.15}>
      <div className="grid gap-4 md:grid-cols-3">
        {/* System Health */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-2 rounded-lg bg-green-500/10">
                <div className="text-lg font-bold text-green-600">{stats?.users.total ?? 0}</div>
                <div className="text-[10px] text-muted-foreground">Users</div>
              </div>
              <div className={cn('p-2 rounded-lg', errorCount > 0 ? 'bg-red-500/10' : 'bg-green-500/10')}>
                <div className={cn('text-lg font-bold', errorCount > 0 ? 'text-red-600' : 'text-green-600')}>{errorCount}</div>
                <div className="text-[10px] text-muted-foreground">Errors</div>
              </div>
              <div className={cn('p-2 rounded-lg', warnCount > 0 ? 'bg-amber-500/10' : 'bg-green-500/10')}>
                <div className={cn('text-lg font-bold', warnCount > 0 ? 'text-amber-600' : 'text-green-600')}>{warnCount}</div>
                <div className="text-[10px] text-muted-foreground">Warnings</div>
              </div>
            </div>
            <div className="space-y-2">
              {systemStats.map((stat) => (
                <Link key={stat.title} to={stat.href || '#'}>
                  <div className="flex items-center justify-between hover:bg-muted/50 rounded-lg p-1.5 -mx-1.5 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className={cn('w-7 h-7 rounded-md flex items-center justify-center', stat.bgColor)}>
                        <stat.icon className={cn('w-3.5 h-3.5', stat.color)} />
                      </div>
                      <span className="text-sm">{stat.title}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">{stat.value}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Content Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Nội dung người dùng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {contentStats.map((stat) => (
                <div key={stat.title} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', stat.bgColor)}>
                      <stat.icon className={cn('w-4 h-4', stat.color)} />
                    </div>
                    <span className="text-sm">{stat.title}</span>
                  </div>
                  <span className="font-semibold tabular-nums">{stat.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tổng nội dung</span>
                <span className="font-bold tabular-nums">
                  {(contentStats.reduce((a, s) => a + s.value, 0)).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* New Users + Recent Users merged */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-primary" />
                Người dùng mới
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                <Link to="/admin/users">Xem tất cả</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentUsers?.slice(0, 5).map((user) => (
                <div key={user.id} className="flex items-center gap-2.5">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="text-[10px]">
                      {user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.name || 'Chưa đặt tên'}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {user.created_at && formatDistanceToNow(new Date(user.created_at), { addSuffix: true, locale: vi })}
                  </span>
                </div>
              ))}
              {(!recentUsers || recentUsers.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">Chưa có người dùng</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      </FadeIn>

      {/* Recent Goals + Logs Row */}
      <FadeIn delay={0.25}>
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Goals */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Mục tiêu gần đây
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                <Link to="/admin/analytics">Analytics</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentGoals?.map((goal) => (
                <div key={goal.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate flex-1">{goal.title}</p>
                    <Badge variant="outline" className="text-[10px] capitalize ml-2">{goal.area}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={goal.progress || 0} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground w-8 text-right tabular-nums">{goal.progress || 0}%</span>
                  </div>
                </div>
              ))}
              {(!recentGoals || recentGoals.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">Chưa có mục tiêu</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Logs */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                System Logs
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                <Link to="/admin/logs">Xem tất cả</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : logs && logs.length > 0 ? (
              <ScrollArea className="h-[220px]">
                <div className="space-y-2 pr-4">
                  {logs.slice(0, 10).map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-2.5 p-2.5 rounded-lg border bg-card/50 hover:bg-muted/30 transition-colors"
                    >
                      {getLevelIcon(log.level)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-snug">{log.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {format(new Date(log.created_at), 'dd/MM HH:mm:ss', { locale: vi })}
                        </p>
                      </div>
                      <Badge variant={getLevelBadgeVariant(log.level) as any} className="text-[10px] shrink-0">
                        {log.level}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-muted-foreground text-center py-8">Chưa có system logs</p>
            )}
          </CardContent>
        </Card>
      </div>
      </FadeIn>

      {/* Quick Actions */}
      <FadeIn delay={0.35}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Truy cập nhanh
          </CardTitle>
          <CardDescription>Bấm Ctrl+K để mở Command Palette</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
            {QUICK_ACTIONS.map((action) => (
              <Link key={action.title} to={action.href}>
                <Button variant="outline" className="w-full h-auto py-3 flex-col gap-1.5 group hover:border-primary/30 transition-all">
                  <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110', action.bgColor)}>
                    <action.icon className={cn('w-4 h-4', action.color)} />
                  </div>
                  <span className="text-xs font-medium">{action.title}</span>
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
      </FadeIn>
    </PageTransition>
  );
}