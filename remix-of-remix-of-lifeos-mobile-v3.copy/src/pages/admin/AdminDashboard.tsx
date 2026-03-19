import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardStats, useSystemLogs, useRecentUsers, useRecentGoals } from '@/hooks/useAdminData';
import { 
  Users, Target, BookOpen, CheckSquare, AlertTriangle, CheckCircle, Info, XCircle,
  TrendingUp, FileText, Notebook, Timer, Puzzle, Flag, Globe, Activity, UserPlus
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
import { DatabaseStatusCard } from '@/components/admin/DatabaseStatusCard';
import { useIsMobile } from '@/hooks/use-mobile';
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

export default function AdminDashboard() {
  const isMobile = useIsMobile();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: logs, isLoading: logsLoading } = useSystemLogs();
  const { data: recentUsers } = useRecentUsers();
  const { data: recentGoals } = useRecentGoals();

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
      href: '/admin/analytics'
    },
  ];

  const contentStats = [
    { 
      title: 'Nhật ký', 
      value: stats?.content.journalEntries ?? 0, 
      icon: FileText, 
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
    },
    { 
      title: 'Ghi chú', 
      value: stats?.content.notes ?? 0, 
      icon: Notebook, 
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
    },
    { 
      title: 'Pomodoro', 
      value: stats?.content.pomodoroSessions ?? 0, 
      icon: Timer, 
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
  ];

  const systemStats = [
    { 
      title: 'Plugins hoạt động', 
      value: stats?.system.activePlugins ?? 0, 
      icon: Puzzle, 
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
      href: '/admin/features'
    },
    { 
      title: 'Feature Flags', 
      value: stats?.system.activeFeatureFlags ?? 0, 
      icon: Flag, 
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      href: '/admin/flags'
    },
    { 
      title: 'Ngôn ngữ', 
      value: stats?.system.activeLanguages ?? 0, 
      icon: Globe, 
      color: 'text-rose-500',
      bgColor: 'bg-rose-500/10',
      href: '/admin/languages'
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Tổng quan hệ thống LifeOS</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Activity className="w-3 h-3" />
            Hệ thống hoạt động
          </Badge>
        </div>
      </div>

      {/* Database Status */}
      <DatabaseStatusCard />

      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.title} to={stat.href || '#'}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className="flex-1">
                    {statsLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <>
                        <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{stat.title}</div>
                        {stat.subValue && (
                          <div className="text-xs text-green-500 mt-1 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {stat.subValue}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Content & System Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Nội dung người dùng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {contentStats.map((stat) => (
                <div key={stat.title} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                      <stat.icon className={`w-4 h-4 ${stat.color}`} />
                    </div>
                    <span className="text-sm">{stat.title}</span>
                  </div>
                  <span className="font-medium">{stat.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Cấu hình hệ thống</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {systemStats.map((stat) => (
                <Link key={stat.title} to={stat.href || '#'}>
                  <div className="flex items-center justify-between hover:bg-muted/50 rounded-lg p-1 -m-1 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                        <stat.icon className={`w-4 h-4 ${stat.color}`} />
                      </div>
                      <span className="text-sm">{stat.title}</span>
                    </div>
                    <Badge variant="secondary">{stat.value}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Users */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Người dùng mới
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/admin/users">Xem tất cả</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentUsers?.map((user) => (
                <div key={user.id} className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.name || 'Chưa đặt tên'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
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

        {/* Recent Goals */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-4 h-4" />
                Mục tiêu gần đây
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/admin/analytics">Xem analytics</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentGoals?.map((goal) => (
                <div key={goal.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate flex-1">{goal.title}</p>
                    <Badge variant="outline" className="text-xs capitalize ml-2">{goal.area}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={goal.progress || 0} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground w-8">{goal.progress || 0}%</span>
                  </div>
                </div>
              ))}
              {(!recentGoals || recentGoals.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">Chưa có mục tiêu</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>System Logs</CardTitle>
              <CardDescription>Hoạt động hệ thống gần đây</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/logs">Xem tất cả</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : logs && logs.length > 0 ? (
            <ScrollArea className="h-[250px]">
              <div className="space-y-3 pr-4">
                {logs.slice(0, 10).map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                  >
                    {getLevelIcon(log.level)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{log.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: vi })}
                      </p>
                    </div>
                    <Badge variant={getLevelBadgeVariant(log.level) as any}>
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

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Truy cập nhanh</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { title: 'Users', icon: Users, href: '/admin/users', color: 'text-blue-500' },
              { title: 'Plans', icon: Target, href: '/admin/plans', color: 'text-green-500' },
              { title: 'Plugins', icon: Puzzle, href: '/admin/features', color: 'text-purple-500' },
              { title: 'AI Models', icon: Activity, href: '/admin/ai-models', color: 'text-orange-500' },
              { title: 'Settings', icon: Flag, href: '/admin/settings', color: 'text-pink-500' },
              { title: 'Workspaces', icon: Globe, href: '/admin/workspaces', color: 'text-cyan-500' },
            ].map((action) => (
              <Link key={action.title} to={action.href}>
                <Button variant="outline" className="w-full h-20 flex-col gap-2">
                  <action.icon className={`w-5 h-5 ${action.color}`} />
                  <span className="text-xs">{action.title}</span>
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}