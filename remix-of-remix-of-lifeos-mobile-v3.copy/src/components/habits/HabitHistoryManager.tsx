import { useState, useMemo } from 'react';
import { History, Calendar, Search, Trash2, Filter, X, BarChart3, List } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { LIFE_AREAS, type LifeArea, type Habit, type HabitCompletion } from '@/types/lifeos';
import { format, parseISO, isWithinInterval, subMonths, startOfWeek, endOfWeek, eachWeekOfInterval, eachMonthOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { vi } from 'date-fns/locale';
import { safeParseISO, safeGetTime } from '@/utils/dateUtils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface HabitHistoryManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface HistoryEntry {
  habit: Habit;
  completion: HabitCompletion;
}

export function HabitHistoryManager({ open, onOpenChange }: HabitHistoryManagerProps) {
  const habits = useLifeOSStore((s) => s.habits);
  const deleteHabitCompletion = useLifeOSStore((s) => s.deleteHabitCompletion);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterHabitId, setFilterHabitId] = useState<string>('all');
  const [filterArea, setFilterArea] = useState<LifeArea | 'all'>('all');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subMonths(new Date(), 3),
    to: new Date(),
  });
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'charts'>('charts');

  // Collect all history entries
  const allEntries = useMemo(() => {
    const entries: HistoryEntry[] = [];
    
    habits.filter(h => !h.deletedAt).forEach(habit => {
      (habit.completions || []).forEach(completion => {
        entries.push({ habit, completion });
      });
      
      habit.completedDates.forEach(dateStr => {
        const exists = (habit.completions || []).some(c => c.date === dateStr);
        if (!exists) {
          entries.push({
            habit,
            completion: { date: dateStr, count: 1 },
          });
        }
      });
    });
    
    return entries.sort((a, b) => 
      new Date(b.completion.date).getTime() - new Date(a.completion.date).getTime()
    );
  }, [habits]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    return allEntries.filter(entry => {
      if (!entry.completion.date) return false;
      const entryDate = safeParseISO(entry.completion.date);
      if (!entryDate) return false;
      if (!isWithinInterval(entryDate, { start: dateRange.from, end: dateRange.to })) {
        return false;
      }
      if (filterHabitId !== 'all' && entry.habit.id !== filterHabitId) {
        return false;
      }
      if (filterArea !== 'all' && entry.habit.area !== filterArea) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = entry.habit.name.toLowerCase().includes(query);
        const matchesNotes = entry.completion.notes?.toLowerCase().includes(query);
        if (!matchesName && !matchesNotes) return false;
      }
      return true;
    });
  }, [allEntries, dateRange, filterHabitId, filterArea, searchQuery]);

  // Weekly chart data
  const weeklyChartData = useMemo(() => {
    const weeks = eachWeekOfInterval({ start: dateRange.from, end: dateRange.to }, { weekStartsOn: 1 });
    
    return weeks.map(weekStart => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const weekEntries = filteredEntries.filter(e => {
        if (!e.completion.date) return false;
        const date = safeParseISO(e.completion.date);
        if (!date) return false;
        return isWithinInterval(date, { start: weekStart, end: weekEnd });
      });
      
      const completions = weekEntries.reduce((sum, e) => sum + e.completion.count, 0);
      const uniqueDays = new Set(weekEntries.map(e => e.completion.date)).size;
      
      return {
        week: format(weekStart, 'dd/MM', { locale: vi }),
        completions,
        days: uniqueDays,
      };
    });
  }, [filteredEntries, dateRange]);

  // Monthly chart data
  const monthlyChartData = useMemo(() => {
    const months = eachMonthOfInterval({ start: dateRange.from, end: dateRange.to });
    
    return months.map(monthStart => {
      const monthEnd = endOfMonth(monthStart);
      const monthEntries = filteredEntries.filter(e => {
        if (!e.completion.date) return false;
        const date = safeParseISO(e.completion.date);
        if (!date) return false;
        return isWithinInterval(date, { start: monthStart, end: monthEnd });
      });
      
      const completions = monthEntries.reduce((sum, e) => sum + e.completion.count, 0);
      const uniqueDays = new Set(monthEntries.map(e => e.completion.date)).size;
      const daysInMonth = monthEnd.getDate();
      const rate = Math.round((uniqueDays / daysInMonth) * 100);
      
      return {
        month: format(monthStart, 'MMM', { locale: vi }),
        completions,
        days: uniqueDays,
        rate,
      };
    });
  }, [filteredEntries, dateRange]);

  // Stats
  const stats = useMemo(() => {
    const uniqueHabits = new Set(filteredEntries.map(e => e.habit.id)).size;
    const totalCompletions = filteredEntries.reduce((sum, e) => sum + e.completion.count, 0);
    const uniqueDays = new Set(filteredEntries.map(e => e.completion.date)).size;
    
    return { uniqueHabits, totalCompletions, uniqueDays };
  }, [filteredEntries]);

  // Colors for habits comparison
  const habitColors = [
    'hsl(var(--success))',
    'hsl(var(--primary))',
    'hsl(217, 91%, 60%)',
    'hsl(280, 65%, 60%)',
    'hsl(350, 80%, 60%)',
    'hsl(45, 93%, 47%)',
    'hsl(160, 60%, 45%)',
    'hsl(200, 80%, 50%)',
  ];

  // Get unique habits in filtered entries
  const uniqueHabitsInData = useMemo(() => {
    const habitMap = new Map<string, Habit>();
    filteredEntries.forEach(e => {
      if (!habitMap.has(e.habit.id)) {
        habitMap.set(e.habit.id, e.habit);
      }
    });
    return Array.from(habitMap.values()).slice(0, 8); // Limit to 8 for colors
  }, [filteredEntries]);

  // Monthly comparison data (per habit)
  const monthlyComparisonData = useMemo(() => {
    const months = eachMonthOfInterval({ start: dateRange.from, end: dateRange.to });
    
    return months.map(monthStart => {
      const monthEnd = endOfMonth(monthStart);
      const dataPoint: Record<string, number | string> = {
        month: format(monthStart, 'MMM', { locale: vi }),
      };
      
      uniqueHabitsInData.forEach(habit => {
        const habitEntries = allEntries.filter(e => {
          if (e.habit.id !== habit.id) return false;
          if (!e.completion.date) return false;
          const date = safeParseISO(e.completion.date);
          if (!date) return false;
          return isWithinInterval(date, { start: monthStart, end: monthEnd });
        });
        dataPoint[habit.name] = habitEntries.reduce((sum, e) => sum + e.completion.count, 0);
      });
      
      return dataPoint;
    });
  }, [allEntries, dateRange, uniqueHabitsInData]);

  // Radar chart data (overall performance)
  const radarData = useMemo(() => {
    return uniqueHabitsInData.map(habit => {
      const habitEntries = filteredEntries.filter(e => e.habit.id === habit.id);
      const totalCompletions = habitEntries.reduce((sum, e) => sum + e.completion.count, 0);
      const uniqueDays = new Set(habitEntries.map(e => e.completion.date)).size;
      const target = habit.targetPerDay || 1;
      
      // Calculate completion rate (days with target met / total days in range)
      const totalDaysInRange = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
      const rate = Math.round((uniqueDays / totalDaysInRange) * 100);
      
      return {
        habit: habit.name.length > 12 ? habit.name.slice(0, 12) + '...' : habit.name,
        fullName: habit.name,
        completions: totalCompletions,
        days: uniqueDays,
        rate: Math.min(rate, 100),
      };
    });
  }, [filteredEntries, uniqueHabitsInData, dateRange]);

  const handleDeleteCompletion = (habitId: string, date: string) => {
    deleteHabitCompletion(habitId, date);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterHabitId('all');
    setFilterArea('all');
    setDateRange({
      from: subMonths(new Date(), 3),
      to: new Date(),
    });
  };

  const hasActiveFilters = filterHabitId !== 'all' || filterArea !== 'all' || searchQuery.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Quản lý lịch sử Habits
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Search and Filters */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm habit hoặc ghi chú..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant={showFilters ? 'secondary' : 'outline'}
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4" />
              </Button>
              {hasActiveFilters && (
                <Button variant="ghost" size="icon" onClick={clearFilters}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {showFilters && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-lg bg-secondary/50 animate-fade-in">
                <Select value={filterHabitId} onValueChange={setFilterHabitId}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Habit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả habits</SelectItem>
                    {habits.map(h => (
                      <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterArea} onValueChange={(v) => setFilterArea(v as LifeArea | 'all')}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Lĩnh vực" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả lĩnh vực</SelectItem>
                    {LIFE_AREAS.map(area => (
                      <SelectItem key={area.id} value={area.id}>{area.icon} {area.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 justify-start">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span className="truncate text-xs">
                        {format(dateRange.from, 'dd/MM')} - {format(dateRange.to, 'dd/MM')}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="range"
                      selected={{ from: dateRange.from, to: dateRange.to }}
                      onSelect={(range) => {
                        if (range?.from && range?.to) {
                          setDateRange({ from: range.from, to: range.to });
                        }
                      }}
                      locale={vi}
                      numberOfMonths={1}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded-lg bg-secondary">
              <p className="text-lg font-bold">{stats.uniqueHabits}</p>
              <p className="text-xs text-muted-foreground">Habits</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-secondary">
              <p className="text-lg font-bold text-success">{stats.totalCompletions}</p>
              <p className="text-xs text-muted-foreground">Lần hoàn thành</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-secondary">
              <p className="text-lg font-bold">{stats.uniqueDays}</p>
              <p className="text-xs text-muted-foreground">Ngày</p>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'list' | 'charts')} className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="charts" className="gap-2">
                <BarChart3 className="w-4 h-4" /> Biểu đồ
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-2">
                <List className="w-4 h-4" /> Danh sách
              </TabsTrigger>
            </TabsList>

            <TabsContent value="charts" className="flex-1 mt-4 space-y-4 overflow-auto">
              {/* Weekly Chart */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Hoàn thành theo tuần</h4>
                <div className="h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis 
                        dataKey="week" 
                        tick={{ fontSize: 10 }} 
                        className="text-muted-foreground"
                      />
                      <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                        formatter={(value: number, name: string) => [
                          value, 
                          name === 'completions' ? 'Lần hoàn thành' : 'Ngày'
                        ]}
                      />
                      <Bar 
                        dataKey="completions" 
                        fill="hsl(var(--success))" 
                        radius={[4, 4, 0, 0]}
                        name="completions"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Monthly Chart */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Tỷ lệ hoàn thành theo tháng</h4>
                <div className="h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 10 }} 
                        className="text-muted-foreground"
                      />
                      <YAxis 
                        tick={{ fontSize: 10 }} 
                        className="text-muted-foreground"
                        domain={[0, 100]}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                        formatter={(value: number, name: string) => [
                          name === 'rate' ? `${value}%` : value,
                          name === 'rate' ? 'Tỷ lệ' : name === 'completions' ? 'Lần hoàn thành' : 'Ngày'
                        ]}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="rate" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary) / 0.2)"
                        name="rate"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Monthly Completions Bar */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Số lần hoàn thành theo tháng</h4>
                <div className="h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 10 }} 
                        className="text-muted-foreground"
                      />
                      <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                        formatter={(value: number) => [value, 'Lần hoàn thành']}
                      />
                      <Bar 
                        dataKey="completions" 
                        fill="hsl(var(--primary))" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Habit Comparison - Monthly */}
              {uniqueHabitsInData.length > 1 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">So sánh Habits theo tháng</h4>
                  <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyComparisonData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis 
                          dataKey="month" 
                          tick={{ fontSize: 10 }} 
                          className="text-muted-foreground"
                        />
                        <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                        />
                        <Legend 
                          wrapperStyle={{ fontSize: '10px' }}
                          iconSize={10}
                        />
                        {uniqueHabitsInData.map((habit, idx) => (
                          <Bar 
                            key={habit.id}
                            dataKey={habit.name}
                            fill={habitColors[idx % habitColors.length]}
                            radius={[2, 2, 0, 0]}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Radar Chart - Overall Performance */}
              {radarData.length > 1 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Tổng quan hiệu suất Habits</h4>
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                        <PolarGrid className="stroke-border" />
                        <PolarAngleAxis 
                          dataKey="habit" 
                          tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <PolarRadiusAxis 
                          angle={30} 
                          domain={[0, 100]} 
                          tick={{ fontSize: 8 }}
                          tickFormatter={(v) => `${v}%`}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                          formatter={(value: number, name: string) => [
                            name === 'rate' ? `${value}%` : value,
                            name === 'rate' ? 'Tỷ lệ hoàn thành' : 'Số lần'
                          ]}
                        />
                        <Radar 
                          name="rate"
                          dataKey="rate" 
                          stroke="hsl(var(--primary))" 
                          fill="hsl(var(--primary))" 
                          fillOpacity={0.4}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Tỷ lệ % ngày hoàn thành trong khoảng thời gian đã chọn
                  </p>
                </div>
              )}

              {/* Habit Performance Table */}
              {uniqueHabitsInData.length > 1 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Bảng xếp hạng Habits</h4>
                  <div className="space-y-1">
                    {radarData
                      .sort((a, b) => b.rate - a.rate)
                      .map((item, idx) => (
                        <div 
                          key={idx}
                          className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50"
                        >
                          <div className={cn(
                            'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                            idx === 0 ? 'bg-amber-500 text-white' :
                            idx === 1 ? 'bg-gray-400 text-white' :
                            idx === 2 ? 'bg-amber-700 text-white' :
                            'bg-muted text-muted-foreground'
                          )}>
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.fullName}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.completions} lần • {item.days} ngày
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={cn(
                              'text-sm font-bold',
                              item.rate >= 70 ? 'text-success' :
                              item.rate >= 40 ? 'text-amber-500' :
                              'text-destructive'
                            )}>
                              {item.rate}%
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="list" className="flex-1 mt-4 min-h-0">
              <ScrollArea className="h-[400px]">
                {filteredEntries.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Không có lịch sử nào</p>
                  </div>
                ) : (
                  <div className="space-y-2 pr-4">
                    {filteredEntries.map((entry, idx) => {
                      const area = LIFE_AREAS.find(a => a.id === entry.habit.area);
                      const target = entry.habit.targetPerDay || 1;
                      const isComplete = entry.completion.count >= target;
                      
                      return (
                        <div
                          key={`${entry.habit.id}-${entry.completion.date}-${idx}`}
                          className="flex items-center gap-3 p-3 rounded-lg bg-card border hover:shadow-sm transition-shadow"
                        >
                          <div
                            className={cn(
                              'w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0',
                              isComplete ? 'bg-success text-success-foreground' : 'bg-success/40 text-success'
                            )}
                          >
                            {entry.completion.count}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{entry.habit.name}</span>
                              <Badge variant="secondary" className="text-xs shrink-0">
                                {area?.icon} {area?.name}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              <span>
                                {(() => {
                                  const date = safeParseISO(entry.completion.date);
                                  if (!date) return entry.completion.date;
                                  return format(date, 'EEEE, dd/MM/yyyy', { locale: vi });
                                })()}
                              </span>
                              {entry.completion.time && (
                                <span className="text-muted-foreground/60">
                                  • {(() => {
                                    const time = safeParseISO(entry.completion.time);
                                    if (!time) return entry.completion.time;
                                    return format(time, 'HH:mm');
                                  })()}
                                </span>
                              )}
                            </div>
                            {entry.completion.notes && (
                              <p className="text-xs text-muted-foreground mt-1 truncate">
                                📝 {entry.completion.notes}
                              </p>
                            )}
                          </div>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="shrink-0 text-destructive hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Xóa lịch sử?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Bạn có chắc muốn xóa bản ghi hoàn thành này? Hành động này không thể hoàn tác.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteCompletion(entry.habit.id, entry.completion.date)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Xóa
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
