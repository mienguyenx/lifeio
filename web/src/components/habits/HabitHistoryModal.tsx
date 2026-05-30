import { useMemo, useState } from 'react';
import { History, Calendar, Clock, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Habit, HabitCompletion } from '@/types/lifeos';

interface HabitHistoryModalProps {
  habit: Habit;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HabitHistoryModal({ habit, open, onOpenChange }: HabitHistoryModalProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  
  // Get all completions for the selected month
  const monthCompletions = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    
    const completions: (HabitCompletion & { fromLegacy?: boolean })[] = [];
    
    // Add completions from the completions array
    if (habit.completions) {
      habit.completions.forEach(c => {
        if (!c.date) continue;
        const date = new Date(c.date);
        if (isNaN(date.getTime())) continue;
        if (date >= startDate && date <= endDate) {
          completions.push(c);
        }
      });
    }
    
    // Add legacy completedDates that aren't in completions
    habit.completedDates.forEach(dateStr => {
      if (!dateStr) continue;
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) continue;
      if (date >= startDate && date <= endDate) {
        const exists = completions.some(c => c.date === dateStr);
        if (!exists) {
          completions.push({ date: dateStr, count: 1, fromLegacy: true });
        }
      }
    });
    
    return completions
      .filter(c => c.date && !isNaN(new Date(c.date).getTime()))
      .sort((a, b) => {
        const aTime = new Date(a.date).getTime();
        const bTime = new Date(b.date).getTime();
        return bTime - aTime;
      });
  }, [habit, selectedMonth]);

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay(); // 0 = Sunday
    
    const days: { date: Date; isCurrentMonth: boolean; completion?: HabitCompletion }[] = [];
    
    // Padding for previous month
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false });
    }
    
    // Current month days
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const dateStr = date.toISOString().split('T')[0];
      const completion = monthCompletions.find(c => c.date === dateStr);
      days.push({ date, isCurrentMonth: true, completion });
    }
    
    return days;
  }, [selectedMonth, monthCompletions]);

  const prevMonth = () => {
    setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const monthStats = useMemo(() => {
    const target = habit.targetPerDay || 1;
    const totalDays = monthCompletions.length;
    const totalCount = monthCompletions.reduce((sum, c) => sum + c.count, 0);
    const perfectDays = monthCompletions.filter(c => c.count >= target).length;
    
    return { totalDays, totalCount, perfectDays };
  }, [monthCompletions, habit.targetPerDay]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Lịch sử: {habit.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-medium">
              {selectedMonth.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
            </span>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Month Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded-lg bg-secondary">
              <p className="text-lg font-bold">{monthStats.totalDays}</p>
              <p className="text-xs text-muted-foreground">Ngày hoàn thành</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-secondary">
              <p className="text-lg font-bold">{monthStats.totalCount}</p>
              <p className="text-xs text-muted-foreground">Tổng số lần</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-secondary">
              <p className="text-lg font-bold text-success">{monthStats.perfectDays}</p>
              <p className="text-xs text-muted-foreground">Đạt mục tiêu</p>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => (
              <div key={day} className="text-xs text-muted-foreground py-1">{day}</div>
            ))}
            {calendarDays.map((day, idx) => {
              const target = habit.targetPerDay || 1;
              const isComplete = day.completion && day.completion.count >= target;
              const isPartial = day.completion && day.completion.count > 0 && day.completion.count < target;
              const isToday = day.date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
              
              return (
                <div
                  key={idx}
                  className={cn(
                    'aspect-square flex items-center justify-center text-sm rounded-md transition-colors',
                    !day.isCurrentMonth && 'text-muted-foreground/30',
                    day.isCurrentMonth && 'hover:bg-secondary',
                    isComplete && 'bg-success text-success-foreground',
                    isPartial && 'bg-success/40',
                    isToday && 'ring-2 ring-primary'
                  )}
                  title={day.completion ? `${day.completion.count} lần${day.completion.notes ? ` - ${day.completion.notes}` : ''}` : ''}
                >
                  {day.date.getDate()}
                </div>
              );
            })}
          </div>

          {/* Completion List */}
          <div className="flex-1 min-h-0">
            <p className="text-sm font-medium mb-2">Chi tiết hoàn thành</p>
            <ScrollArea className="h-[180px]">
              {monthCompletions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Không có dữ liệu trong tháng này
                </p>
              ) : (
                <div className="space-y-2 pr-4">
                  {monthCompletions.map((completion, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-2 rounded-lg bg-secondary/50">
                      <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center text-success shrink-0">
                        {completion.count}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm">
                            {(() => {
                              const date = new Date(completion.date);
                              if (isNaN(date.getTime())) return completion.date;
                              return date.toLocaleDateString('vi-VN', { 
                                weekday: 'short', 
                                day: 'numeric', 
                                month: 'short' 
                              });
                            })()}
                          </span>
                          {completion.time && (
                            <>
                              <Clock className="w-3 h-3 text-muted-foreground ml-2" />
                              <span className="text-xs text-muted-foreground">
                                {(() => {
                                  if (!completion.time) return null;
                                  const time = new Date(completion.time);
                                  if (isNaN(time.getTime())) return null;
                                  return time.toLocaleTimeString('vi-VN', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  });
                                })()}
                              </span>
                            </>
                          )}
                        </div>
                        {completion.notes && (
                          <div className="flex items-start gap-1 mt-1">
                            <MessageSquare className="w-3 h-3 text-muted-foreground mt-0.5" />
                            <span className="text-xs text-muted-foreground">{completion.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
