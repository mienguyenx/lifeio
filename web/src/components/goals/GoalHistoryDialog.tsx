import { useState, useMemo } from 'react';
import { Archive, CheckCircle2, Trash2, History, Undo2, Filter, TrendingUp, Calendar, Target, Clock, BarChart3, GitCompare } from 'lucide-react';
import { format, parseISO, differenceInDays, subMonths, isAfter, startOfMonth, endOfMonth } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { LIFE_AREAS, type Goal } from '@/types/lifeos';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { GoalPerformanceComparison } from './GoalPerformanceComparison';

interface GoalHistoryDialogProps {
  onViewDetail: (goal: Goal) => void;
}

const TIME_FILTERS = [
  { value: 'all', label: 'Tất cả' },
  { value: '1month', label: '1 tháng' },
  { value: '3months', label: '3 tháng' },
  { value: '6months', label: '6 tháng' },
  { value: '1year', label: '1 năm' },
];

export function GoalHistoryDialog({ onViewDetail }: GoalHistoryDialogProps) {
  const goals = useLifeOSStore((s) => s.goals);
  const updateGoal = useLifeOSStore((s) => s.updateGoal);
  const deleteGoal = useLifeOSStore((s) => s.deleteGoal);
  const [isOpen, setIsOpen] = useState(false);
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all');

  const archivedGoals = goals.filter(g => g.status === 'archived');
  const completedGoals = goals.filter(g => g.completedAt && g.status !== 'archived');
  const totalCount = archivedGoals.length + completedGoals.length;

  // Filter logic
  const filterGoals = (goalsList: Goal[]) => {
    let filtered = goalsList;
    
    if (areaFilter !== 'all') {
      filtered = filtered.filter(g => g.area === areaFilter);
    }
    
    if (timeFilter !== 'all') {
      const now = new Date();
      let startDate: Date;
      switch (timeFilter) {
        case '1month': startDate = subMonths(now, 1); break;
        case '3months': startDate = subMonths(now, 3); break;
        case '6months': startDate = subMonths(now, 6); break;
        case '1year': startDate = subMonths(now, 12); break;
        default: startDate = new Date(0);
      }
      filtered = filtered.filter(g => {
        const date = g.completedAt ? parseISO(g.completedAt) : g.archivedAt ? parseISO(g.archivedAt) : null;
        return date && isAfter(date, startDate);
      });
    }
    
    return filtered;
  };

  const filteredCompleted = useMemo(() => filterGoals(completedGoals), [completedGoals, areaFilter, timeFilter]);
  const filteredArchived = useMemo(() => filterGoals(archivedGoals), [archivedGoals, areaFilter, timeFilter]);

  // Statistics
  const stats = useMemo(() => {
    const allHistoryGoals = [...completedGoals, ...archivedGoals];
    const totalDays = completedGoals.reduce((sum, g) => {
      if (g.completedAt) {
        return sum + differenceInDays(parseISO(g.completedAt), parseISO(g.createdAt));
      }
      return sum;
    }, 0);
    const avgDays = completedGoals.length > 0 ? Math.round(totalDays / completedGoals.length) : 0;
    const avgProgress = allHistoryGoals.length > 0 
      ? Math.round(allHistoryGoals.reduce((sum, g) => sum + g.progress, 0) / allHistoryGoals.length)
      : 0;
    
    return {
      totalCompleted: completedGoals.length,
      totalArchived: archivedGoals.length,
      avgCompletionDays: avgDays,
      avgProgress,
    };
  }, [completedGoals, archivedGoals]);

  // Chart data - Goals by area
  const areaChartData = useMemo(() => {
    const areaCount: Record<string, number> = {};
    completedGoals.forEach(g => {
      areaCount[g.area] = (areaCount[g.area] || 0) + 1;
    });
    return LIFE_AREAS.map(area => ({
      name: area.name,
      value: areaCount[area.id] || 0,
      icon: area.icon,
    })).filter(d => d.value > 0);
  }, [completedGoals]);

  // Chart data - Monthly completions
  const monthlyChartData = useMemo(() => {
    const months: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const month = subMonths(now, i);
      const key = format(month, 'MM/yyyy');
      months[key] = 0;
    }
    completedGoals.forEach(g => {
      if (g.completedAt) {
        const key = format(parseISO(g.completedAt), 'MM/yyyy');
        if (months[key] !== undefined) {
          months[key]++;
        }
      }
    });
    return Object.entries(months).map(([month, count]) => ({
      month: month.split('/')[0],
      count,
    }));
  }, [completedGoals]);

  const PIE_COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--info))', 'hsl(var(--accent))'];

  const handleArchive = (goalId: string) => {
    updateGoal(goalId, { status: 'archived', archivedAt: new Date().toISOString() });
    toast.success('Đã lưu trữ goal');
  };

  const handleRestore = (goalId: string) => {
    updateGoal(goalId, { status: 'active', archivedAt: undefined });
    toast.success('Đã khôi phục goal');
  };

  const handleDelete = (goalId: string) => {
    deleteGoal(goalId);
    toast.success('Đã xóa goal');
  };

  const GoalItem = ({ goal, showArchiveButton = false }: { goal: Goal; showArchiveButton?: boolean }) => {
    const area = LIFE_AREAS.find((a) => a.id === goal.area);
    const completionDays = goal.completedAt 
      ? differenceInDays(parseISO(goal.completedAt), parseISO(goal.createdAt))
      : null;
    
    return (
      <Card 
        className="bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
        onClick={() => {
          onViewDetail(goal);
          setIsOpen(false);
        }}
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <div className="relative w-10 h-10 shrink-0">
              <svg className="w-10 h-10 transform -rotate-90">
                <circle cx="20" cy="20" r="16" stroke="hsl(var(--secondary))" strokeWidth="3" fill="none" />
                <circle
                  cx="20" cy="20" r="16"
                  stroke="hsl(var(--success))"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray={`${(goal.progress / 100) * 100.5} 100.5`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
                {goal.progress}%
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium truncate text-sm">{goal.title}</h3>
                {goal.completedAt && (
                  <Badge variant="secondary" className="bg-success/20 text-success text-[10px]">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Xong
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{area?.icon} {area?.name}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {goal.completedAt ? (
                  <>{format(parseISO(goal.completedAt), 'dd/MM/yyyy', { locale: vi })} • {completionDays} ngày</>
                ) : goal.archivedAt ? (
                  <>Lưu trữ: {format(parseISO(goal.archivedAt), 'dd/MM/yyyy', { locale: vi })}</>
                ) : null}
              </p>
            </div>
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              {showArchiveButton && goal.completedAt && !goal.archivedAt && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleArchive(goal.id)}
                  title="Lưu trữ"
                >
                  <Archive className="w-3 h-3" />
                </Button>
              )}
              {goal.status === 'archived' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleRestore(goal.id)}
                  title="Khôi phục"
                >
                  <Undo2 className="w-3 h-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => handleDelete(goal.id)}
                title="Xóa vĩnh viễn"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <History className="w-4 h-4" />
          <span className="hidden sm:inline ml-2">Lịch sử</span>
          {totalCount > 0 && (
            <Badge variant="secondary" className="ml-1 sm:ml-2 h-5 px-1.5">{totalCount}</Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Lịch sử & Lưu trữ Goals
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="stats" className="mt-2">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="stats" className="text-xs">
              <BarChart3 className="w-3.5 h-3.5 mr-1" />
              Thống kê
            </TabsTrigger>
            <TabsTrigger value="compare" className="text-xs">
              <GitCompare className="w-3.5 h-3.5 mr-1" />
              So sánh
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Xong ({completedGoals.length})
            </TabsTrigger>
            <TabsTrigger value="archived" className="text-xs">
              <Archive className="w-3.5 h-3.5 mr-1" />
              Lưu trữ ({archivedGoals.length})
            </TabsTrigger>
          </TabsList>

          {/* Statistics Tab */}
          <TabsContent value="stats">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4 mt-2">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Card className="bg-success/10 border-success/20">
                    <CardContent className="p-3 text-center">
                      <Target className="w-5 h-5 mx-auto text-success mb-1" />
                      <p className="text-2xl font-bold text-success">{stats.totalCompleted}</p>
                      <p className="text-[10px] text-muted-foreground">Hoàn thành</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/50">
                    <CardContent className="p-3 text-center">
                      <Archive className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                      <p className="text-2xl font-bold">{stats.totalArchived}</p>
                      <p className="text-[10px] text-muted-foreground">Lưu trữ</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-primary/10 border-primary/20">
                    <CardContent className="p-3 text-center">
                      <Clock className="w-5 h-5 mx-auto text-primary mb-1" />
                      <p className="text-2xl font-bold text-primary">{stats.avgCompletionDays}</p>
                      <p className="text-[10px] text-muted-foreground">Ngày TB</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-warning/10 border-warning/20">
                    <CardContent className="p-3 text-center">
                      <TrendingUp className="w-5 h-5 mx-auto text-warning mb-1" />
                      <p className="text-2xl font-bold text-warning">{stats.avgProgress}%</p>
                      <p className="text-[10px] text-muted-foreground">Tiến độ TB</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Monthly Chart */}
                <Card>
                  <CardContent className="p-4">
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Goals hoàn thành theo tháng
                    </h4>
                    {monthlyChartData.some(d => d.count > 0) ? (
                      <ResponsiveContainer width="100%" height={150}>
                        <BarChart data={monthlyChartData}>
                          <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                          <Tooltip 
                            formatter={(value) => [`${value} goals`, 'Hoàn thành']}
                            contentStyle={{ fontSize: 12 }}
                          />
                          <Bar dataKey="count" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[150px] flex items-center justify-center text-muted-foreground text-sm">
                        Chưa có dữ liệu
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Area Distribution */}
                <Card>
                  <CardContent className="p-4">
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Phân bố theo lĩnh vực
                    </h4>
                    {areaChartData.length > 0 ? (
                      <div className="flex items-center gap-4">
                        <ResponsiveContainer width="50%" height={150}>
                          <PieChart>
                            <Pie
                              data={areaChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={30}
                              outerRadius={60}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {areaChartData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value, name) => [`${value} goals`, name]} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="flex-1 space-y-1">
                          {areaChartData.map((item, index) => (
                            <div key={item.name} className="flex items-center gap-2 text-xs">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                              />
                              <span>{item.icon}</span>
                              <span className="flex-1 truncate">{item.name}</span>
                              <span className="font-medium">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="h-[150px] flex items-center justify-center text-muted-foreground text-sm">
                        Chưa có dữ liệu
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Performance Comparison Tab */}
          <TabsContent value="compare">
            <ScrollArea className="h-[400px] pr-4">
              <div className="mt-2">
                <GoalPerformanceComparison goals={goals} />
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Completed Tab */}
          <TabsContent value="completed">
            {/* Filters */}
            <div className="flex gap-2 mb-3 mt-2">
              <Select value={areaFilter} onValueChange={setAreaFilter}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <Filter className="w-3 h-3 mr-1" />
                  <SelectValue placeholder="Lĩnh vực" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả lĩnh vực</SelectItem>
                  {LIFE_AREAS.map(area => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.icon} {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-[120px] h-8 text-xs">
                  <Calendar className="w-3 h-3 mr-1" />
                  <SelectValue placeholder="Thời gian" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_FILTERS.map(tf => (
                    <SelectItem key={tf.value} value={tf.value}>{tf.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ScrollArea className="h-[320px] pr-4">
              <div className="space-y-2">
                {filteredCompleted.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Không có goal nào</p>
                    <p className="text-xs mt-1">Thử thay đổi bộ lọc</p>
                  </div>
                ) : (
                  filteredCompleted
                    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
                    .map((goal) => (
                      <GoalItem key={goal.id} goal={goal} showArchiveButton />
                    ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Archived Tab */}
          <TabsContent value="archived">
            {/* Filters */}
            <div className="flex gap-2 mb-3 mt-2">
              <Select value={areaFilter} onValueChange={setAreaFilter}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <Filter className="w-3 h-3 mr-1" />
                  <SelectValue placeholder="Lĩnh vực" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả lĩnh vực</SelectItem>
                  {LIFE_AREAS.map(area => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.icon} {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-[120px] h-8 text-xs">
                  <Calendar className="w-3 h-3 mr-1" />
                  <SelectValue placeholder="Thời gian" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_FILTERS.map(tf => (
                    <SelectItem key={tf.value} value={tf.value}>{tf.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ScrollArea className="h-[320px] pr-4">
              <div className="space-y-2">
                {filteredArchived.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Archive className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Không có goal nào</p>
                    <p className="text-xs mt-1">Thử thay đổi bộ lọc</p>
                  </div>
                ) : (
                  filteredArchived
                    .sort((a, b) => new Date(b.archivedAt!).getTime() - new Date(a.archivedAt!).getTime())
                    .map((goal) => (
                      <GoalItem key={goal.id} goal={goal} />
                    ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
