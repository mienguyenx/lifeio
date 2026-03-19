import { useMemo } from 'react';
import { format, subDays, differenceInDays } from 'date-fns';
import { Flame, Calendar, TrendingUp, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { JournalEntry } from '@/types/lifeos';

interface JournalStreakCardProps {
  entries: JournalEntry[];
  compact?: boolean;
}

export function JournalStreakCard({ entries, compact = false }: JournalStreakCardProps) {
  const stats = useMemo(() => {
    if (entries.length === 0) {
      return { currentStreak: 0, longestStreak: 0, totalDays: 0, thisMonth: 0 };
    }

    // Sort entries by date
    const sortedDates = entries
      .map(e => e.date)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    const uniqueDates = [...new Set(sortedDates)];
    
    // Calculate current streak
    let currentStreak = 0;
    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    
    // Check if there's an entry today or yesterday to start the streak
    if (uniqueDates.includes(today) || uniqueDates.includes(yesterday)) {
      const startDate = uniqueDates.includes(today) ? today : yesterday;
      let checkDate = new Date(startDate);
      
      while (uniqueDates.includes(format(checkDate, 'yyyy-MM-dd'))) {
        currentStreak++;
        checkDate = subDays(checkDate, 1);
      }
    }
    
    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 1;
    
    for (let i = 0; i < uniqueDates.length - 1; i++) {
      const curr = new Date(uniqueDates[i]);
      const next = new Date(uniqueDates[i + 1]);
      const diff = differenceInDays(curr, next);
      
      if (diff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // This month entries
    const currentMonth = format(new Date(), 'yyyy-MM');
    const thisMonth = entries.filter(e => e.date.startsWith(currentMonth)).length;

    return {
      currentStreak,
      longestStreak,
      totalDays: uniqueDates.length,
      thisMonth,
    };
  }, [entries]);

  // Compact version for sidebar
  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            Streak & Thống kê
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-500/10">
              <Flame className="w-4 h-4 text-orange-500" />
              <div>
                <p className="text-lg font-bold">{stats.currentStreak}</p>
                <p className="text-[10px] text-muted-foreground">Streak</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-500/10">
              <TrendingUp className="w-4 h-4 text-yellow-500" />
              <div>
                <p className="text-lg font-bold">{stats.longestStreak}</p>
                <p className="text-[10px] text-muted-foreground">Tốt nhất</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/10">
              <Calendar className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-lg font-bold">{stats.thisMonth}</p>
                <p className="text-[10px] text-muted-foreground">Tháng này</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10">
              <BookOpen className="w-4 h-4 text-primary" />
              <div>
                <p className="text-lg font-bold">{stats.totalDays}</p>
                <p className="text-[10px] text-muted-foreground">Tổng ngày</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2 md:gap-3">
      <Card>
        <CardContent className="p-2 md:p-3 flex items-center gap-2 md:gap-3">
          <div className="p-1.5 md:p-2 rounded-lg bg-orange-500/10">
            <Flame className="w-4 h-4 md:w-5 md:h-5 text-orange-500" />
          </div>
          <div className="min-w-0">
            <p className="text-lg md:text-2xl font-bold">{stats.currentStreak}</p>
            <p className="text-[10px] md:text-xs text-muted-foreground truncate">Streak</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-2 md:p-3 flex items-center gap-2 md:gap-3">
          <div className="p-1.5 md:p-2 rounded-lg bg-yellow-500/10">
            <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />
          </div>
          <div className="min-w-0">
            <p className="text-lg md:text-2xl font-bold">{stats.longestStreak}</p>
            <p className="text-[10px] md:text-xs text-muted-foreground truncate">Tốt nhất</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-2 md:p-3 flex items-center gap-2 md:gap-3">
          <div className="p-1.5 md:p-2 rounded-lg bg-blue-500/10">
            <Calendar className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
          </div>
          <div className="min-w-0">
            <p className="text-lg md:text-2xl font-bold">{stats.thisMonth}</p>
            <p className="text-[10px] md:text-xs text-muted-foreground truncate">Tháng</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-2 md:p-3 flex items-center gap-2 md:gap-3">
          <div className="p-1.5 md:p-2 rounded-lg bg-primary/10">
            <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-lg md:text-2xl font-bold">{stats.totalDays}</p>
            <p className="text-[10px] md:text-xs text-muted-foreground truncate">Tổng</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
