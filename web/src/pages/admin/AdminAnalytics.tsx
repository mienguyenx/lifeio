import { Users, Target, BookOpen, CheckSquare, FileText, Calendar, Notebook, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useExtendedAdminStats } from '@/hooks/useAdminData';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { PageTransition } from '@/components/admin/AdminAnimations';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';

export default function AdminAnalytics() {
  const { data: stats, isLoading } = useExtendedAdminStats();

  const statCards = [
    { title: 'Total Users', value: stats?.totalUsers ?? 0, icon: Users, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    { title: 'Total Goals', value: stats?.totalGoals ?? 0, icon: Target, color: 'text-green-500', bgColor: 'bg-green-500/10' },
    { title: 'Total Habits', value: stats?.totalHabits ?? 0, icon: BookOpen, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
    { title: 'Total Tasks', value: stats?.totalTasks ?? 0, icon: CheckSquare, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
    { title: 'Journal Entries', value: stats?.totalJournalEntries ?? 0, icon: FileText, color: 'text-pink-500', bgColor: 'bg-pink-500/10' },
    { title: 'Notes', value: stats?.totalNotes ?? 0, icon: Notebook, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10' },
    { title: 'Weekly Reviews', value: stats?.totalWeeklyReviews ?? 0, icon: Calendar, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
  ];

  const barChartData = [
    { name: 'Goals', value: stats?.totalGoals ?? 0, fill: 'hsl(var(--chart-1))' },
    { name: 'Habits', value: stats?.totalHabits ?? 0, fill: 'hsl(var(--chart-2))' },
    { name: 'Tasks', value: stats?.totalTasks ?? 0, fill: 'hsl(var(--chart-3))' },
    { name: 'Journal', value: stats?.totalJournalEntries ?? 0, fill: 'hsl(var(--chart-4))' },
    { name: 'Notes', value: stats?.totalNotes ?? 0, fill: 'hsl(var(--chart-5))' },
  ];

  const pieData = barChartData.filter(d => d.value > 0);

  // Calculate engagement metrics
  const totalContent = (stats?.totalGoals ?? 0) + (stats?.totalHabits ?? 0) + (stats?.totalTasks ?? 0);
  const avgContentPerUser = stats?.totalUsers ? (totalContent / stats.totalUsers).toFixed(1) : '0';

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(7)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <PageTransition className="p-6 space-y-6">
      <AdminPageHeader
        title="Analytics Dashboard"
        description="Comprehensive app usage statistics"
        icon={TrendingUp}
        actions={
          <Card className="px-4 py-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">{avgContentPerUser} avg items/user</span>
            </div>
          </Card>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center shrink-0`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground truncate">{stat.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Content Overview</CardTitle>
            <CardDescription>Distribution of user-generated content</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={true} vertical={false} />
                  <XAxis type="number" className="text-xs" />
                  <YAxis type="category" dataKey="name" className="text-xs" width={60} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {barChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content Distribution</CardTitle>
            <CardDescription>Proportional view of all content types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={50}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No data to display
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">User Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Avg Goals/User</span>
                <span className="font-medium">{stats?.totalUsers ? (stats.totalGoals / stats.totalUsers).toFixed(1) : '0'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Avg Habits/User</span>
                <span className="font-medium">{stats?.totalUsers ? (stats.totalHabits / stats.totalUsers).toFixed(1) : '0'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Avg Tasks/User</span>
                <span className="font-medium">{stats?.totalUsers ? (stats.totalTasks / stats.totalUsers).toFixed(1) : '0'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Content Quality</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Content Items</span>
                <span className="font-medium">{totalContent.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Journal Entries</span>
                <span className="font-medium">{(stats?.totalJournalEntries ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Weekly Reviews</span>
                <span className="font-medium">{(stats?.totalWeeklyReviews ?? 0).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Platform Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Registered Users</span>
                <span className="font-medium">{(stats?.totalUsers ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Notes Created</span>
                <span className="font-medium">{(stats?.totalNotes ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Data Points</span>
                <span className="font-medium">{(totalContent + (stats?.totalJournalEntries ?? 0) + (stats?.totalNotes ?? 0)).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}