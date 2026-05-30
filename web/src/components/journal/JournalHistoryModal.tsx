import { useMemo, useState } from 'react';
import { History, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus, Calendar, Search, X } from 'lucide-react';
import { format, subMonths, addMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { vi } from 'date-fns/locale';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { JournalEntry, JournalTag } from '@/types/lifeos';

const MOOD_OPTIONS = [
  { value: 1, icon: '😢', label: 'Rất tệ' },
  { value: 2, icon: '😕', label: 'Tệ' },
  { value: 3, icon: '😐', label: 'Bình thường' },
  { value: 4, icon: '🙂', label: 'Tốt' },
  { value: 5, icon: '😄', label: 'Rất tốt' },
];

const ENERGY_OPTIONS = [
  { value: 1, icon: '🔋', label: 'Kiệt sức' },
  { value: 2, icon: '🪫', label: 'Mệt' },
  { value: 3, icon: '⚡', label: 'Bình thường' },
  { value: 4, icon: '💪', label: 'Năng lượng' },
  { value: 5, icon: '🚀', label: 'Tràn đầy' },
];

const MOOD_COLORS = {
  1: 'bg-red-500',
  2: 'bg-orange-500',
  3: 'bg-yellow-500',
  4: 'bg-green-500',
  5: 'bg-emerald-500',
};

interface JournalHistoryModalProps {
  entries: JournalEntry[];
  journalTags: JournalTag[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectEntry: (entry: JournalEntry) => void;
}

export function JournalHistoryModal({ entries, journalTags, open, onOpenChange, onSelectEntry }: JournalHistoryModalProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState('calendar');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [moodFilter, setMoodFilter] = useState('all');
  const [energyFilter, setEnergyFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');

  const hasFilters = searchQuery || moodFilter !== 'all' || energyFilter !== 'all' || tagFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setMoodFilter('all');
    setEnergyFilter('all');
    setTagFilter('all');
  };

  // Filtered entries (applies to the selected month)
  const filteredMonthEntries = useMemo(() => {
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);
    
    return entries.filter(e => {
      const date = new Date(e.date);
      if (date < start || date > end) return false;
      
      if (searchQuery && !e.content.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (moodFilter !== 'all' && e.mood !== parseInt(moodFilter)) {
        return false;
      }
      if (energyFilter !== 'all' && e.energy !== parseInt(energyFilter)) {
        return false;
      }
      if (tagFilter !== 'all' && (!e.tags || !e.tags.includes(tagFilter))) {
        return false;
      }
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [entries, selectedMonth, searchQuery, moodFilter, energyFilter, tagFilter]);

  // All month entries (for stats, without filters)
  const allMonthEntries = useMemo(() => {
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);
    return entries.filter(e => {
      const date = new Date(e.date);
      return date >= start && date <= end;
    });
  }, [entries, selectedMonth]);

  // Calendar days
  const calendarDays = useMemo(() => {
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);
    const allDays = eachDayOfInterval({ start, end });
    const startPadding = start.getDay();
    
    const days: { date: Date; isCurrentMonth: boolean; entry?: JournalEntry; isFiltered?: boolean }[] = [];
    
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(start);
      date.setDate(date.getDate() - (i + 1));
      days.push({ date, isCurrentMonth: false });
    }
    
    allDays.forEach(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const entry = entries.find(e => e.date === dateStr);
      const isFiltered = entry ? filteredMonthEntries.some(e => e.id === entry.id) : false;
      days.push({ date, isCurrentMonth: true, entry, isFiltered });
    });
    
    return days;
  }, [selectedMonth, entries, filteredMonthEntries]);

  // Month stats (based on all entries, not filtered)
  const monthStats = useMemo(() => {
    if (allMonthEntries.length === 0) {
      return { avgMood: 0, avgEnergy: 0, totalEntries: 0, moodTrend: 0, energyTrend: 0, filteredCount: 0 };
    }
    
    const avgMood = allMonthEntries.reduce((sum, e) => sum + e.mood, 0) / allMonthEntries.length;
    const avgEnergy = allMonthEntries.reduce((sum, e) => sum + e.energy, 0) / allMonthEntries.length;
    
    const prevMonthStart = startOfMonth(subMonths(selectedMonth, 1));
    const prevMonthEnd = endOfMonth(subMonths(selectedMonth, 1));
    const prevMonthEntries = entries.filter(e => {
      const date = new Date(e.date);
      return date >= prevMonthStart && date <= prevMonthEnd;
    });
    
    let moodTrend = 0;
    let energyTrend = 0;
    if (prevMonthEntries.length > 0) {
      const prevAvgMood = prevMonthEntries.reduce((sum, e) => sum + e.mood, 0) / prevMonthEntries.length;
      const prevAvgEnergy = prevMonthEntries.reduce((sum, e) => sum + e.energy, 0) / prevMonthEntries.length;
      moodTrend = avgMood - prevAvgMood;
      energyTrend = avgEnergy - prevAvgEnergy;
    }
    
    return { 
      avgMood, 
      avgEnergy, 
      totalEntries: allMonthEntries.length, 
      moodTrend, 
      energyTrend,
      filteredCount: filteredMonthEntries.length 
    };
  }, [allMonthEntries, entries, selectedMonth, filteredMonthEntries.length]);

  // Chart data
  const chartData = useMemo(() => {
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);
    const days = eachDayOfInterval({ start, end });
    
    return days.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const entry = filteredMonthEntries.find(e => e.date === dateStr);
      return {
        date: format(date, 'dd'),
        mood: entry?.mood || null,
        energy: entry?.energy || null,
        hasEntry: !!entry,
      };
    });
  }, [filteredMonthEntries, selectedMonth]);

  // Mood distribution
  const moodDistribution = useMemo(() => {
    const distribution = [0, 0, 0, 0, 0];
    filteredMonthEntries.forEach(e => {
      distribution[e.mood - 1]++;
    });
    return MOOD_OPTIONS.map((opt, idx) => ({
      name: opt.icon,
      label: opt.label,
      count: distribution[idx],
    }));
  }, [filteredMonthEntries]);

  const TrendIcon = ({ value }: { value: number }) => {
    if (value > 0.1) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (value < -0.1) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Lịch sử Journal
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-3">
          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-medium">
              {format(selectedMonth, 'MMMM yyyy', { locale: vi })}
            </span>
            <Button variant="ghost" size="icon" onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Filters */}
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[150px]">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8"
                />
              </div>
              <Select value={moodFilter} onValueChange={setMoodFilter}>
                <SelectTrigger className="w-[100px] h-8">
                  <SelectValue placeholder="Mood" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {MOOD_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.icon} {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={energyFilter} onValueChange={setEnergyFilter}>
                <SelectTrigger className="w-[100px] h-8">
                  <SelectValue placeholder="Energy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {ENERGY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.icon} {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={tagFilter} onValueChange={setTagFilter}>
                <SelectTrigger className="w-[100px] h-8">
                  <SelectValue placeholder="Tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {journalTags.map((tag) => (
                    <SelectItem key={tag.id} value={tag.id}>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: `hsl(${tag.color})` }} />
                        {tag.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasFilters && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearFilters}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            {hasFilters && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Hiển thị {monthStats.filteredCount}/{monthStats.totalEntries} entries</span>
                {searchQuery && <Badge variant="secondary" className="text-xs">"{searchQuery}"</Badge>}
                {moodFilter !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    {MOOD_OPTIONS.find(m => String(m.value) === moodFilter)?.icon}
                  </Badge>
                )}
                {energyFilter !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    {ENERGY_OPTIONS.find(e => String(e.value) === energyFilter)?.icon}
                  </Badge>
                )}
                {tagFilter !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    {journalTags.find(t => t.id === tagFilter)?.name}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Month Stats */}
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center p-2 rounded-lg bg-secondary">
              <p className="text-lg font-bold">{monthStats.totalEntries}</p>
              <p className="text-xs text-muted-foreground">Entries</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-secondary">
              <div className="flex items-center justify-center gap-1">
                <span className="text-lg">{MOOD_OPTIONS[Math.round(monthStats.avgMood) - 1]?.icon || '—'}</span>
                <TrendIcon value={monthStats.moodTrend} />
              </div>
              <p className="text-xs text-muted-foreground">Mood TB</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-secondary">
              <div className="flex items-center justify-center gap-1">
                <span className="text-lg">{ENERGY_OPTIONS[Math.round(monthStats.avgEnergy) - 1]?.icon || '—'}</span>
                <TrendIcon value={monthStats.energyTrend} />
              </div>
              <p className="text-xs text-muted-foreground">Energy TB</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-secondary">
              <p className="text-lg font-bold">{monthStats.avgMood > 0 ? monthStats.avgMood.toFixed(1) : '—'}</p>
              <p className="text-xs text-muted-foreground">Điểm Mood</p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="w-full">
              <TabsTrigger value="calendar" className="flex-1">Lịch</TabsTrigger>
              <TabsTrigger value="chart" className="flex-1">Biểu đồ</TabsTrigger>
              <TabsTrigger value="list" className="flex-1">Danh sách</TabsTrigger>
            </TabsList>

            <TabsContent value="calendar" className="flex-1 mt-3">
              <div className="grid grid-cols-7 gap-1 text-center">
                {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => (
                  <div key={day} className="text-xs text-muted-foreground py-1">{day}</div>
                ))}
                {calendarDays.map((day, idx) => {
                  const isToday = format(day.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                  const showEntry = hasFilters ? day.isFiltered : !!day.entry;
                  return (
                    <button
                      key={idx}
                      onClick={() => day.entry && day.isFiltered !== false && onSelectEntry(day.entry)}
                      disabled={!day.entry || (hasFilters && !day.isFiltered)}
                      className={cn(
                        'aspect-square flex items-center justify-center text-sm rounded-md transition-colors relative',
                        !day.isCurrentMonth && 'text-muted-foreground/30',
                        day.isCurrentMonth && !day.entry && 'text-muted-foreground',
                        showEntry && 'cursor-pointer hover:ring-2 hover:ring-primary/50',
                        day.entry && !day.isFiltered && hasFilters && 'opacity-30',
                        isToday && 'ring-2 ring-primary'
                      )}
                    >
                      <span className="relative z-10">{format(day.date, 'd')}</span>
                      {day.entry && (
                        <div
                          className={cn(
                            'absolute inset-1 rounded-sm',
                            MOOD_COLORS[day.entry.mood as keyof typeof MOOD_COLORS],
                            day.isFiltered || !hasFilters ? 'opacity-40' : 'opacity-10'
                          )}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="chart" className="flex-1 mt-3 space-y-3 overflow-y-auto">
              <div className="h-[160px]">
                <p className="text-sm font-medium mb-2">Xu hướng Mood & Energy</p>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={2} />
                    <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="mood" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" strokeWidth={2} connectNulls name="Mood" />
                    <Area type="monotone" dataKey="energy" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2) / 0.2)" strokeWidth={2} connectNulls name="Energy" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              <div className="h-[100px]">
                <p className="text-sm font-medium mb-2">Phân bố Mood</p>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={moodDistribution}>
                    <XAxis dataKey="name" tick={{ fontSize: 14 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(value) => [`${value} entries`, 'Số lượng']} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="list" className="flex-1 mt-3 min-h-0">
              <ScrollArea className="h-[240px]">
                {filteredMonthEntries.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {hasFilters ? 'Không tìm thấy kết quả' : 'Không có entries trong tháng này'}
                  </p>
                ) : (
                  <div className="space-y-2 pr-4">
                    {filteredMonthEntries.map(entry => (
                      <button
                        key={entry.id}
                        onClick={() => {
                          onSelectEntry(entry);
                          onOpenChange(false);
                        }}
                        className="w-full flex items-start gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-left"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-lg">{MOOD_OPTIONS[entry.mood - 1]?.icon}</span>
                          <span className="text-lg">{ENERGY_OPTIONS[entry.energy - 1]?.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {format(new Date(entry.date), 'EEEE, dd/MM', { locale: vi })}
                            </span>
                          </div>
                          {entry.tags && entry.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-1">
                              {entry.tags.map(tagId => {
                                const tag = journalTags.find(t => t.id === tagId);
                                if (!tag) return null;
                                return (
                                  <Badge key={tagId} variant="outline" className="text-xs py-0 h-5">
                                    <span className="w-1.5 h-1.5 rounded-full mr-1" style={{ backgroundColor: `hsl(${tag.color})` }} />
                                    {tag.name}
                                  </Badge>
                                );
                              })}
                            </div>
                          )}
                          <p className="text-sm text-muted-foreground line-clamp-2">{entry.content}</p>
                        </div>
                      </button>
                    ))}
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
