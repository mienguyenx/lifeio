import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, subMonths, addMonths } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { JournalEntry } from '@/types/lifeos';

const MOOD_COLORS = {
  1: 'bg-red-500',
  2: 'bg-orange-500',
  3: 'bg-yellow-500',
  4: 'bg-green-500',
  5: 'bg-emerald-500',
};

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

interface JournalCalendarViewProps {
  entries: JournalEntry[];
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  onSelectDate: (date: string) => void;
}

export function JournalCalendarView({
  entries,
  currentMonth,
  onMonthChange,
  onSelectDate,
}: JournalCalendarViewProps) {
  const entriesByDate = useMemo(() => {
    const map = new Map<string, JournalEntry>();
    entries.forEach(entry => {
      map.set(entry.date, entry);
    });
    return map;
  }, [entries]);

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const allDays = eachDayOfInterval({ start, end });
    
    // Pad start with days from previous month
    const startDay = start.getDay();
    const paddedDays = [];
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(start);
      date.setDate(date.getDate() - (i + 1));
      paddedDays.push({ date, isCurrentMonth: false });
    }
    
    allDays.forEach(date => {
      paddedDays.push({ date, isCurrentMonth: true });
    });
    
    // Pad end to complete the grid
    const remaining = 7 - (paddedDays.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const date = new Date(end);
        date.setDate(date.getDate() + i);
        paddedDays.push({ date, isCurrentMonth: false });
      }
    }
    
    return paddedDays;
  }, [currentMonth]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Lịch Journal</CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onMonthChange(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-[100px] text-center">
              {format(currentMonth, 'MMMM yyyy', { locale: vi })}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onMonthChange(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map(day => (
            <div key={day} className="text-center text-xs text-muted-foreground py-1">
              {day}
            </div>
          ))}
          {days.map(({ date, isCurrentMonth }, idx) => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const entry = entriesByDate.get(dateStr);
            const hasEntry = !!entry;
            
            return (
              <button
                key={idx}
                onClick={() => hasEntry && onSelectDate(dateStr)}
                disabled={!hasEntry}
                className={cn(
                  "aspect-square rounded-md text-xs flex items-center justify-center relative transition-colors",
                  !isCurrentMonth && "text-muted-foreground/40",
                  isCurrentMonth && !hasEntry && "text-muted-foreground",
                  isToday(date) && "ring-1 ring-primary",
                  hasEntry && "cursor-pointer hover:ring-2 hover:ring-primary/50",
                  !hasEntry && "cursor-default"
                )}
              >
                <span className={cn(
                  "relative z-10",
                  hasEntry && "font-medium"
                )}>
                  {format(date, 'd')}
                </span>
                {hasEntry && entry && (
                  <div
                    className={cn(
                      "absolute inset-1 rounded-sm opacity-30",
                      MOOD_COLORS[entry.mood as keyof typeof MOOD_COLORS]
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>
        
        <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-red-500 opacity-50" />
            <span className="text-xs text-muted-foreground">Tệ</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-yellow-500 opacity-50" />
            <span className="text-xs text-muted-foreground">OK</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-emerald-500 opacity-50" />
            <span className="text-xs text-muted-foreground">Tốt</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
