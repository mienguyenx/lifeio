import { useState, useMemo, useEffect } from 'react';
import { Activity, Dumbbell, Moon, Heart, Droplets, Apple, TrendingUp, Plus, Target, Calendar, BarChart3, ChevronLeft, ChevronRight, Lightbulb, Zap, PanelRightClose, PanelRight, Edit, Trash2, MoreVertical } from 'lucide-react';
import { format, subDays, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import { AreaDashboardSection } from '@/components/area/AreaDashboardSection';
import { ModuleHelpButton } from '@/components/ui/ModuleHelpButton';
import { useHealthSync, type HealthLog } from '@/hooks/sync/useHealthSync';

const HEALTH_METRICS = [
  { id: 'weight', name: 'Cân nặng', icon: Activity, unit: 'kg', color: 'text-blue-500' },
  { id: 'sleep', name: 'Giấc ngủ', icon: Moon, unit: 'giờ', color: 'text-purple-500' },
  { id: 'water', name: 'Nước uống', icon: Droplets, unit: 'ly', color: 'text-cyan-500' },
  { id: 'exercise', name: 'Tập luyện', icon: Dumbbell, unit: 'phút', color: 'text-orange-500' },
  { id: 'steps', name: 'Bước chân', icon: Activity, unit: 'bước', color: 'text-green-500' },
];

const HEALTH_TIPS = [
  { icon: '💧', text: 'Uống 8 ly nước mỗi ngày để giữ cơ thể khỏe mạnh' },
  { icon: '🏃', text: 'Tập thể dục ít nhất 30 phút mỗi ngày' },
  { icon: '😴', text: 'Ngủ đủ 7-8 tiếng mỗi đêm' },
  { icon: '🥗', text: 'Ăn nhiều rau xanh và trái cây' },
  { icon: '🧘', text: 'Dành 10 phút thiền định mỗi ngày' },
];

const QUICK_LOG_PRESETS = [
  { label: '1 ly nước', type: 'water', value: 1 },
  { label: '30 phút tập', type: 'exercise', value: 30 },
  { label: '8 giờ ngủ', type: 'sleep', value: 8 },
  { label: '5000 bước', type: 'steps', value: 5000 },
];

export default function HealthPage() {
  const { habits, goals, lifeWheelScores, healthLogs, addHealthLog, updateHealthLog, deleteHealthLog } = useLifeOSStore();
  const { saveHealthLog, updateHealthLog: syncUpdateHealthLog, deleteHealthLog: syncDeleteHealthLog } = useHealthSync();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<HealthLog | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMetric, setSelectedMetric] = useState('weight');
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('health-sidebar-open');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [newLog, setNewLog] = useState({
    type: 'weight',
    value: '',
    notes: '',
  });

  const toggleSidebar = () => {
    const newValue = !isSidebarOpen;
    setIsSidebarOpen(newValue);
    localStorage.setItem('health-sidebar-open', JSON.stringify(newValue));
  };

  // Health-related habits
  const healthHabits = useMemo(() => 
    habits.filter(h => h.area === 'health' && !h.deletedAt && !h.archivedAt),
    [habits]
  );

  // Health-related goals
  const healthGoals = useMemo(() => 
    goals.filter(g => g.area === 'health' && !g.deletedAt),
    [goals]
  );

  // Current health score from life wheel
  const healthScore = lifeWheelScores['health'] || 5;

  // Today's logs
  const todayLogs = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return healthLogs.filter(log => log.date === today);
  }, [healthLogs]);

  // Chart data for selected metric
  const chartData = useMemo(() => {
    return healthLogs
      .filter(log => log.type === selectedMetric)
      .map(log => ({
        date: format(parseISO(log.date), 'dd/MM'),
        value: log.value,
      }))
      .slice(-7);
  }, [healthLogs, selectedMetric]);

  const handleAddLog = async () => {
    if (!newLog.value) return;
    
    const metric = HEALTH_METRICS.find(m => m.id === newLog.type);
    const log: HealthLog = {
      id: crypto.randomUUID(),
      date: format(new Date(), 'yyyy-MM-dd'),
      type: newLog.type as any,
      value: parseFloat(newLog.value),
      unit: metric?.unit || '',
      notes: newLog.notes || undefined,
    };
    
    // Add to store immediately for optimistic update
    addHealthLog(log);
    
    // Sync to database
    const success = await saveHealthLog(log);
    if (!success) {
      toast.error('Không thể lưu vào database');
    } else {
      toast.success('Đã ghi nhận!');
    }
    
    setNewLog({ type: 'weight', value: '', notes: '' });
    setIsAddDialogOpen(false);
  };

  const handleQuickLog = async (preset: typeof QUICK_LOG_PRESETS[0]) => {
    const metric = HEALTH_METRICS.find(m => m.id === preset.type);
    const log: HealthLog = {
      id: crypto.randomUUID(),
      date: format(new Date(), 'yyyy-MM-dd'),
      type: preset.type as any,
      value: preset.value,
      unit: metric?.unit || '',
    };
    
    // Add to store immediately for optimistic update
    addHealthLog(log);
    
    // Sync to database
    const success = await saveHealthLog(log);
    if (!success) {
      toast.error('Không thể lưu vào database');
    } else {
      toast.success(`Đã ghi nhận: ${preset.label}`);
    }
  };

  const handleEditLog = (log: HealthLog) => {
    setEditingLog(log);
    setNewLog({
      type: log.type,
      value: log.value.toString(),
      notes: log.notes || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateLog = async () => {
    if (!editingLog || !newLog.value) return;
    
    const metric = HEALTH_METRICS.find(m => m.id === newLog.type);
    const updates: Partial<HealthLog> = {
      type: newLog.type as any,
      value: parseFloat(newLog.value),
      unit: metric?.unit || '',
      notes: newLog.notes || undefined,
    };
    
    // Update store immediately for optimistic update
    updateHealthLog(editingLog.id, updates);
    
    // Sync to database
    const success = await syncUpdateHealthLog(editingLog.id, updates);
    if (!success) {
      toast.error('Không thể cập nhật vào database');
    } else {
      toast.success('Đã cập nhật!');
    }
    
    setNewLog({ type: 'weight', value: '', notes: '' });
    setEditingLog(null);
    setIsEditDialogOpen(false);
  };

  const handleDeleteLog = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa ghi nhận này?')) return;
    
    // Delete from store immediately for optimistic update
    deleteHealthLog(id);
    
    // Sync to database
    const success = await syncDeleteHealthLog(id);
    if (!success) {
      toast.error('Không thể xóa khỏi database');
    } else {
      toast.success('Đã xóa!');
    }
  };

  const getLatestValue = (type: string) => {
    const logs = healthLogs.filter(l => l.type === type);
    return logs.length > 0 ? logs[logs.length - 1].value : 0;
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Heart className="w-7 h-7 text-rose-500" />
            Sức khỏe
          </h1>
          <p className="text-muted-foreground mt-1">Theo dõi và cải thiện sức khỏe của bạn</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button className="gap-2" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Ghi nhận</span>
          </Button>
          <AdaptiveModal open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} title="Ghi nhận sức khỏe">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Chỉ số</Label>
                  <Select value={newLog.type} onValueChange={(v) => setNewLog(prev => ({ ...prev, type: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HEALTH_METRICS.map(metric => (
                        <SelectItem key={metric.id} value={metric.id}>
                          {metric.name} ({metric.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Giá trị</Label>
                  <Input
                    type="number"
                    placeholder={`Nhập ${HEALTH_METRICS.find(m => m.id === newLog.type)?.unit}`}
                    value={newLog.value}
                    onChange={(e) => setNewLog(prev => ({ ...prev, value: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ghi chú (tùy chọn)</Label>
                  <Input
                    placeholder="Ghi chú thêm..."
                    value={newLog.notes}
                    onChange={(e) => setNewLog(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
                <Button className="w-full" onClick={handleAddLog}>Lưu</Button>
              </div>
          </AdaptiveModal>
          <AdaptiveModal open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} title="Chỉnh sửa ghi nhận sức khỏe">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Chỉ số</Label>
                  <Select value={newLog.type} onValueChange={(v) => setNewLog(prev => ({ ...prev, type: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HEALTH_METRICS.map(metric => (
                        <SelectItem key={metric.id} value={metric.id}>
                          {metric.name} ({metric.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Giá trị</Label>
                  <Input
                    type="number"
                    placeholder={`Nhập ${HEALTH_METRICS.find(m => m.id === newLog.type)?.unit}`}
                    value={newLog.value}
                    onChange={(e) => setNewLog(prev => ({ ...prev, value: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ghi chú (tùy chọn)</Label>
                  <Input
                    placeholder="Ghi chú thêm..."
                    value={newLog.notes}
                    onChange={(e) => setNewLog(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
                <Button className="w-full" onClick={handleUpdateLog}>Cập nhật</Button>
              </div>
          </AdaptiveModal>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="h-8 px-2 gap-1 hidden xl:flex"
          >
            {isSidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRight className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Main Content */}
        <div className="flex-1 space-y-6 min-w-0">
          {/* Health Score Overview */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Điểm sức khỏe tổng quan</h3>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {healthScore}/10
                </Badge>
              </div>
              <Progress value={healthScore * 10} className="h-3" />
              <p className="text-sm text-muted-foreground mt-2">
                Dựa trên đánh giá Life Wheel của bạn
              </p>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {HEALTH_METRICS.map(metric => {
              const Icon = metric.icon;
              const value = getLatestValue(metric.id);
              const todayLog = todayLogs.find(l => l.type === metric.id);
              
              return (
                <Card 
                  key={metric.id} 
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    selectedMetric === metric.id && "ring-2 ring-primary"
                  )}
                  onClick={() => setSelectedMetric(metric.id)}
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={cn("w-4 h-4", metric.color)} />
                      <span className="text-xs sm:text-sm font-medium truncate">{metric.name}</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold">{value}</p>
                    <p className="text-xs text-muted-foreground">{metric.unit}</p>
                    {todayLog && (
                      <Badge variant="secondary" className="mt-2 text-[10px]">
                        Hôm nay ✓
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Tổng quan</TabsTrigger>
              <TabsTrigger value="tracking">Theo dõi</TabsTrigger>
              <TabsTrigger value="linked">Liên kết</TabsTrigger>
              <TabsTrigger value="history">Lịch sử</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Biểu đồ {HEALTH_METRICS.find(m => m.id === selectedMetric)?.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--primary))' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Logs */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Lịch sử gần đây</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {healthLogs.slice(-10).reverse().map(log => {
                      const metric = HEALTH_METRICS.find(m => m.id === log.type);
                      const Icon = metric?.icon || Activity;
                      
                      return (
                        <div key={log.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Icon className={cn("w-4 h-4 shrink-0", metric?.color)} />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium">{metric?.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(parseISO(log.date), 'dd/MM/yyyy', { locale: vi })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="secondary">
                              {log.value} {log.unit}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditLog(log)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Chỉnh sửa
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => handleDeleteLog(log.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Xóa
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tracking" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Theo dõi chỉ số sức khỏe
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Ghi nhận các chỉ số sức khỏe hàng ngày như cân nặng, giấc ngủ, lượng nước uống...
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {HEALTH_METRICS.map(metric => {
                      const Icon = metric.icon;
                      const value = getLatestValue(metric.id);
                      return (
                        <div key={metric.id} className="flex items-center gap-2 p-2 rounded border">
                          <Icon className={cn("w-4 h-4", metric.color)} />
                          <div>
                            <p className="text-xs font-medium">{metric.name}</p>
                            <p className="text-sm font-bold">{value} {metric.unit}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="linked" className="space-y-4">
              <AreaDashboardSection area="health" />
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Lịch sử đầy đủ</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {healthLogs.slice().reverse().map(log => {
                      const metric = HEALTH_METRICS.find(m => m.id === log.type);
                      const Icon = metric?.icon || Activity;
                      
                      return (
                        <div key={log.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Icon className={cn("w-4 h-4 shrink-0", metric?.color)} />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium">{metric?.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(parseISO(log.date), 'dd/MM/yyyy', { locale: vi })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="secondary">
                              {log.value} {log.unit}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditLog(log)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Chỉnh sửa
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => handleDeleteLog(log.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Xóa
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className={cn(
          "hidden lg:block transition-all duration-300",
          isSidebarOpen ? "w-80" : "w-0"
        )}>
          {isSidebarOpen && (
            <div className="sticky top-4 space-y-4 max-h-[calc(100vh-2rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
              {/* Help Button */}
              <div className="flex justify-end">
                <ModuleHelpButton module="health" />
              </div>

              {/* Quick Log */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Ghi nhanh
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {QUICK_LOG_PRESETS.map((preset, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => handleQuickLog(preset)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </CardContent>
              </Card>

              {/* Health Tips */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    Mẹo sức khỏe
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {HEALTH_TIPS.map((tip, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 text-xs">
                      <span>{tip.icon}</span>
                      <span className="text-muted-foreground">{tip.text}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Today Summary */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    Hôm nay
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {todayLogs.length > 0 ? (
                    <div className="space-y-2">
                      {todayLogs.map(log => {
                        const metric = HEALTH_METRICS.find(m => m.id === log.type);
                        return (
                          <div key={log.id} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{metric?.name}</span>
                            <span className="font-medium">{log.value} {log.unit}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      Chưa có ghi nhận nào hôm nay
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Health Goals */}
              {healthGoals.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Target className="w-4 h-4 text-green-500" />
                      Mục tiêu sức khỏe
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {healthGoals.slice(0, 3).map(goal => (
                      <div key={goal.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="truncate">{goal.title}</span>
                          <span className="text-muted-foreground">{goal.progress}%</span>
                        </div>
                        <Progress value={goal.progress} className="h-1" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:flex fixed right-4 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background border shadow-sm"
          onClick={toggleSidebar}
        >
          {isSidebarOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
