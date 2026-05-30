import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek, isToday, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarDays, CheckCircle2, Target, BookOpen, Timer, Star, Flame, FileText, CalendarCheck, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useIsMobile } from '@/hooks/use-mobile';
import { Link } from 'react-router-dom';

type EventType = 'task' | 'habit' | 'journal' | 'pomodoro' | 'review' | 'goal';

interface CalendarEvent {
  id: string;
  type: EventType;
  title: string;
  date: string;
  color: string;
  icon: React.ElementType;
  completed?: boolean;
  meta?: string;
}

const EVENT_COLORS: Record<EventType, { dot: string; bg: string; text: string }> = {
  task: { dot: 'bg-green-500', bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400' },
  habit: { dot: 'bg-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' },
  journal: { dot: 'bg-purple-500', bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400' },
  pomodoro: { dot: 'bg-red-500', bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400' },
  review: { dot: 'bg-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' },
  goal: { dot: 'bg-cyan-500', bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400' },
};

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export default function CalendarPage() {
  const tasks = useLifeOSStore((s) => s.tasks);
  const habits = useLifeOSStore((s) => s.habits);
  const journalEntries = useLifeOSStore((s) => s.journalEntries);
  const pomodoroSessions = useLifeOSStore((s) => s.pomodoroSessions);
  const weeklyReviews = useLifeOSStore((s) => s.weeklyReviews);
  const monthlyReviews = useLifeOSStore((s) => s.monthlyReviews);
  const goals = useLifeOSStore((s) => s.goals);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filterTypes, setFilterTypes] = useState<EventType[]>(['task', 'habit', 'journal', 'pomodoro', 'review', 'goal']);
  const isMobile = useIsMobile();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Build events for the visible calendar range
  const events = useMemo(() => {
    const result: CalendarEvent[] = [];
    const startStr = format(calendarStart, 'yyyy-MM-dd');
    const endStr = format(calendarEnd, 'yyyy-MM-dd');

    // Tasks with due dates
    tasks.filter(t => !t.deletedAt && t.dueDate && t.dueDate >= startStr && t.dueDate <= endStr).forEach(t => {
      result.push({
        id: `task-${t.id}`,
        type: 'task',
        title: t.title,
        date: t.dueDate!,
        color: EVENT_COLORS.task.dot,
        icon: CheckCircle2,
        completed: t.status === 'done',
        meta: t.priority,
      });
    });

    // Completed tasks (by completedAt date)
    tasks.filter(t => !t.deletedAt && t.completedAt && t.completedAt.slice(0, 10) >= startStr && t.completedAt.slice(0, 10) <= endStr && !t.dueDate).forEach(t => {
      result.push({
        id: `task-done-${t.id}`,
        type: 'task',
        title: t.title,
        date: t.completedAt!.slice(0, 10),
        color: EVENT_COLORS.task.dot,
        icon: CheckCircle2,
        completed: true,
        meta: 'completed',
      });
    });

    // Habits - completed dates
    const activeHabits = habits.filter(h => !h.deletedAt && !h.archivedAt);
    activeHabits.forEach(h => {
      h.completedDates.filter(d => d >= startStr && d <= endStr).forEach(d => {
        result.push({
          id: `habit-${h.id}-${d}`,
          type: 'habit',
          title: h.name,
          date: d,
          color: EVENT_COLORS.habit.dot,
          icon: Flame,
          completed: true,
          meta: `streak ${h.streak}`,
        });
      });
    });

    // Journal entries
    journalEntries.filter(j => j.date >= startStr && j.date <= endStr).forEach(j => {
      result.push({
        id: `journal-${j.id}`,
        type: 'journal',
        title: j.content?.slice(0, 40) || 'Journal entry',
        date: j.date,
        color: EVENT_COLORS.journal.dot,
        icon: BookOpen,
        meta: j.mood ? ['😢', '😕', '😐', '🙂', '😊'][j.mood - 1] : undefined,
      });
    });

    // Pomodoro sessions
    pomodoroSessions.filter(s => s.phase === 'work' && s.completedAt.slice(0, 10) >= startStr && s.completedAt.slice(0, 10) <= endStr).forEach(s => {
      result.push({
        id: `pomo-${s.id}`,
        type: 'pomodoro',
        title: `Focus ${s.duration || 25} phút`,
        date: s.completedAt.slice(0, 10),
        color: EVENT_COLORS.pomodoro.dot,
        icon: Timer,
        meta: `${s.duration || 25}m`,
      });
    });

    // Weekly reviews
    weeklyReviews.filter(r => r.weekStart >= startStr && r.weekStart <= endStr).forEach(r => {
      result.push({
        id: `weekly-${r.id}`,
        type: 'review',
        title: `Weekly Review - ${r.overallRating}/5`,
        date: r.weekStart,
        color: EVENT_COLORS.review.dot,
        icon: CalendarCheck,
        meta: `⭐ ${r.overallRating}/5`,
      });
    });

    // Monthly reviews
    monthlyReviews.filter(r => {
      const rDate = r.month + '-01';
      return rDate >= startStr && rDate <= endStr;
    }).forEach(r => {
      result.push({
        id: `monthly-${r.id}`,
        type: 'review',
        title: `Monthly Review ${r.month} - ${r.overallRating}/5`,
        date: r.month + '-01',
        color: EVENT_COLORS.review.dot,
        icon: CalendarDays,
        meta: `⭐ ${r.overallRating}/5`,
      });
    });

    // Goal deadlines
    goals.filter(g => !g.deletedAt && g.targetDate && g.targetDate >= startStr && g.targetDate <= endStr).forEach(g => {
      result.push({
        id: `goal-${g.id}`,
        type: 'goal',
        title: g.title,
        date: g.targetDate!,
        color: EVENT_COLORS.goal.dot,
        icon: Target,
        completed: g.progress >= 100,
        meta: `${g.progress}%`,
      });
    });

    return result;
  }, [tasks, habits, journalEntries, pomodoroSessions, weeklyReviews, monthlyReviews, goals, calendarStart, calendarEnd]);

  // Filter events
  const filteredEvents = events.filter(e => filterTypes.includes(e.type));

  // Events grouped by date
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    filteredEvents.forEach(e => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [filteredEvents]);

  // Selected day events
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const selectedEvents = eventsByDate[selectedDateStr] || [];

  // Month stats
  const monthStats = useMemo(() => {
    const monthEvents = filteredEvents.filter(e => {
      const d = parseISO(e.date);
      return isSameMonth(d, currentMonth);
    });
    return {
      total: monthEvents.length,
      tasks: monthEvents.filter(e => e.type === 'task').length,
      habits: monthEvents.filter(e => e.type === 'habit').length,
      journals: monthEvents.filter(e => e.type === 'journal').length,
      pomodoros: monthEvents.filter(e => e.type === 'pomodoro').length,
    };
  }, [filteredEvents, currentMonth]);

  const toggleFilter = (type: EventType) => {
    setFilterTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  const filterButtons: { type: EventType; label: string; icon: React.ElementType }[] = [
    { type: 'task', label: 'Tasks', icon: CheckCircle2 },
    { type: 'habit', label: 'Habits', icon: Flame },
    { type: 'journal', label: 'Journal', icon: BookOpen },
    { type: 'pomodoro', label: 'Focus', icon: Timer },
    { type: 'review', label: 'Reviews', icon: CalendarCheck },
    { type: 'goal', label: 'Goals', icon: Target },
  ];

  return (
    <div className={cn("p-3 md:p-6 space-y-4", isMobile && "pb-24")}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <CalendarDays className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            Calendar
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Tổng hợp tất cả hoạt động theo ngày
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={goToToday}>
          Hôm nay
        </Button>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-1.5">
        {filterButtons.map(fb => {
          const active = filterTypes.includes(fb.type);
          const colors = EVENT_COLORS[fb.type];
          return (
            <Button
              key={fb.type}
              variant={active ? 'default' : 'outline'}
              size="sm"
              className={cn("h-7 text-xs gap-1 px-2", active && colors.bg + ' ' + colors.text + ' border-0 hover:opacity-80')}
              onClick={() => toggleFilter(fb.type)}
            >
              <fb.icon className="w-3 h-3" />
              {fb.label}
              {active && <span className="text-[10px]">({events.filter(e => e.type === fb.type).length})</span>}
            </Button>
          );
        })}
      </div>

      <div className={cn("grid gap-4", isMobile ? "grid-cols-1" : "grid-cols-3")}>
        {/* Calendar Grid */}
        <Card className={cn(isMobile ? "col-span-1" : "col-span-2")}>
          <CardHeader className="pb-2 px-3 pt-3">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <CardTitle className="text-base md:text-lg">
                {format(currentMonth, 'MMMM yyyy', { locale: vi })}
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-1">
              {WEEKDAYS.map(d => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7">
              {calendarDays.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const dayEvents = eventsByDate[dateStr] || [];
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isSelected = isSameDay(day, selectedDate);
                const isTodayDate = isToday(day);

                // Unique event types for this day (for dots)
                const uniqueTypes = [...new Set(dayEvents.map(e => e.type))];

                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "relative flex flex-col items-center justify-start py-1 rounded-lg transition-colors min-h-[48px] md:min-h-[60px]",
                      isCurrentMonth ? "text-foreground" : "text-muted-foreground/40",
                      isSelected && "bg-primary/10 ring-1 ring-primary",
                      isTodayDate && !isSelected && "bg-accent",
                      "hover:bg-accent/50"
                    )}
                  >
                    <span className={cn(
                      "text-xs md:text-sm font-medium",
                      isTodayDate && "text-primary font-bold",
                    )}>
                      {format(day, 'd')}
                    </span>

                    {/* Event dots */}
                    {uniqueTypes.length > 0 && (
                      <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center max-w-full">
                        {uniqueTypes.slice(0, 4).map(type => (
                          <div
                            key={type}
                            className={cn("w-1.5 h-1.5 rounded-full", EVENT_COLORS[type].dot)}
                          />
                        ))}
                        {uniqueTypes.length > 4 && (
                          <span className="text-[7px] text-muted-foreground">+{uniqueTypes.length - 4}</span>
                        )}
                      </div>
                    )}

                    {/* Event count badge for desktop */}
                    {!isMobile && dayEvents.length > 0 && (
                      <span className="text-[9px] text-muted-foreground mt-0.5">
                        {dayEvents.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Side Panel - Selected Day Detail */}
        <div className="space-y-4">
          {/* Month stats */}
          <Card>
            <CardHeader className="pb-2 px-3 pt-3">
              <CardTitle className="text-sm">Tháng {format(currentMonth, 'M/yyyy')}</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1.5 p-1.5 rounded bg-green-500/10">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  <span className="text-xs">{monthStats.tasks} tasks</span>
                </div>
                <div className="flex items-center gap-1.5 p-1.5 rounded bg-blue-500/10">
                  <Flame className="w-3 h-3 text-blue-500" />
                  <span className="text-xs">{monthStats.habits} habits</span>
                </div>
                <div className="flex items-center gap-1.5 p-1.5 rounded bg-purple-500/10">
                  <BookOpen className="w-3 h-3 text-purple-500" />
                  <span className="text-xs">{monthStats.journals} journal</span>
                </div>
                <div className="flex items-center gap-1.5 p-1.5 rounded bg-red-500/10">
                  <Timer className="w-3 h-3 text-red-500" />
                  <span className="text-xs">{monthStats.pomodoros} focus</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selected Day Events */}
          <Card>
            <CardHeader className="pb-2 px-3 pt-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" />
                {format(selectedDate, 'EEEE, dd/MM/yyyy', { locale: vi })}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              {selectedEvents.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  Không có hoạt động nào
                </p>
              ) : (
                <ScrollArea className={cn(selectedEvents.length > 5 ? "h-[300px]" : "")}>
                  <div className="space-y-2">
                    {selectedEvents.map(event => {
                      const colors = EVENT_COLORS[event.type];
                      return (
                        <div
                          key={event.id}
                          className={cn("flex items-start gap-2 p-2 rounded-lg border", colors.bg)}
                        >
                          <div className={cn("w-6 h-6 rounded-full flex items-center justify-center shrink-0", colors.bg)}>
                            <event.icon className={cn("w-3 h-3", colors.text)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-xs font-medium truncate", event.completed && "line-through text-muted-foreground")}>
                              {event.title}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
                                {event.type}
                              </Badge>
                              {event.meta && (
                                <span className="text-[9px] text-muted-foreground">{event.meta}</span>
                              )}
                            </div>
                          </div>
                          {event.completed && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}

              {/* Quick links */}
              <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t">
                <Link to="/today">
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2">Today</Button>
                </Link>
                <Link to="/weekly-review">
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2">Weekly</Button>
                </Link>
                <Link to="/monthly-review">
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2">Monthly</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
