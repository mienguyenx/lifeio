import { useState, useMemo, useEffect } from 'react';
import { Trophy, Plus, Flag, Medal, Crown, Trash2, Play, Target, History, Calendar, TrendingUp, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import type { Habit, HabitCompetition } from '@/types/lifeos';
import { differenceInDays, parseISO, addDays, format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { safeParseISO } from '@/utils/dateUtils';
import { toast } from 'sonner';

interface HabitCompetitionCardProps {
  habits: Habit[];
  compact?: boolean;
}

const TARGET_OPTIONS = [
  { value: 70, label: '70%' },
  { value: 80, label: '80%' },
  { value: 90, label: '90%' },
  { value: 95, label: '95%' },
  { value: 100, label: '100%' },
];

const DURATION_OPTIONS = [
  { value: 7, label: '7 ngày' },
  { value: 14, label: '14 ngày' },
  { value: 21, label: '21 ngày' },
  { value: 30, label: '30 ngày' },
];

export function HabitCompetitionCard({ habits, compact = false }: HabitCompetitionCardProps) {
  const habitCompetitions = useLifeOSStore((s) => s.habitCompetitions);
  const addHabitCompetition = useLifeOSStore((s) => s.addHabitCompetition);
  const completeHabitCompetition = useLifeOSStore((s) => s.completeHabitCompetition);
  const deleteHabitCompetition = useLifeOSStore((s) => s.deleteHabitCompetition);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [competitionName, setCompetitionName] = useState('');
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);
  const [targetRate, setTargetRate] = useState(90);
  const [durationDays, setDurationDays] = useState(14);

  const activeCompetitions = useMemo(() => 
    habitCompetitions.filter(c => c.status === 'active'),
  [habitCompetitions]);

  const allCompletedCompetitions = useMemo(() => 
    habitCompetitions
      .filter(c => c.status === 'completed')
      .sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime()),
  [habitCompetitions]);

  const completedCompetitions = allCompletedCompetitions.slice(0, 3);

  const activeHabits = useMemo(() => 
    habits.filter(h => !h.archivedAt && !h.deletedAt),
  [habits]);

  // Calculate completion rate for a habit within competition period
  const getHabitRate = (habit: Habit, competition: HabitCompetition) => {
    const startDate = safeParseISO(competition.startDate);
    if (!startDate) return null;
    const endDate = addDays(startDate, competition.durationDays);
    const today = new Date();
    const effectiveEndDate = today < endDate ? today : endDate;
    
    const totalDays = differenceInDays(effectiveEndDate, startDate) + 1;
    if (totalDays <= 0) return 0;

    let completedDays = 0;
    const target = habit.targetPerDay || 1;

    for (let i = 0; i < totalDays; i++) {
      const checkDate = addDays(startDate, i);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      const completion = habit.completions?.find(c => c.date === dateStr);
      const count = completion?.count || (habit.completedDates.includes(dateStr) ? 1 : 0);
      
      if (count >= target) {
        completedDays++;
      }
    }

    return Math.round((completedDays / totalDays) * 100);
  };

  // Check for winners in active competitions
  useEffect(() => {
    activeCompetitions.forEach(competition => {
      const habitRates = competition.habitIds.map(id => {
        const habit = habits.find(h => h.id === id);
        if (!habit) return { id, rate: 0 };
        return { id, rate: getHabitRate(habit, competition) };
      });

      // Check if any habit reached the target
      const winner = habitRates.find(hr => hr.rate >= competition.targetRate);
      if (winner) {
        completeHabitCompetition(competition.id, winner.id);
        const winnerHabit = habits.find(h => h.id === winner.id);
        toast.success(`🏆 ${winnerHabit?.name} thắng cuộc đua "${competition.name}"!`);
      }

      // Check if competition time has ended
      const startDate = safeParseISO(competition.startDate);
      if (!startDate) return null;
      const endDate = addDays(startDate, competition.durationDays);
      if (new Date() > endDate) {
        // Find highest rate
        const sortedRates = [...habitRates].sort((a, b) => b.rate - a.rate);
        if (sortedRates[0]) {
          completeHabitCompetition(competition.id, sortedRates[0].id);
          const winnerHabit = habits.find(h => h.id === sortedRates[0].id);
          toast.info(`⏰ Cuộc đua "${competition.name}" kết thúc! ${winnerHabit?.name} dẫn đầu với ${sortedRates[0].rate}%`);
        }
      }
    });
  }, [activeCompetitions, habits]);

  const handleCreateCompetition = () => {
    if (!competitionName.trim()) {
      toast.error('Vui lòng nhập tên cuộc đua');
      return;
    }
    if (selectedHabits.length < 2) {
      toast.error('Chọn ít nhất 2 habits để cạnh tranh');
      return;
    }

    addHabitCompetition({
      name: competitionName,
      habitIds: selectedHabits,
      targetRate,
      durationDays,
      startDate: new Date().toISOString().split('T')[0],
    });

    setCompetitionName('');
    setSelectedHabits([]);
    setTargetRate(90);
    setDurationDays(14);
    setIsDialogOpen(false);
    toast.success('Đã tạo cuộc đua mới!');
  };

  const toggleHabitSelection = (habitId: string) => {
    setSelectedHabits(prev => 
      prev.includes(habitId) 
        ? prev.filter(id => id !== habitId)
        : [...prev, habitId]
    );
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-4 h-4 text-amber-500" />;
    if (rank === 2) return <Medal className="w-4 h-4 text-gray-400" />;
    if (rank === 3) return <Medal className="w-4 h-4 text-amber-700" />;
    return <span className="w-4 h-4 text-xs text-muted-foreground">{rank}</span>;
  };

  if (activeHabits.length < 2) return null;

  // Compact mode for sidebar - no Card wrapper
  if (compact) {
    return (
      <div className="space-y-3">
        {/* Active Competitions - compact */}
        {activeCompetitions.length > 0 ? (
          <div className="space-y-2">
            {activeCompetitions.slice(0, 1).map(competition => {
              const startDate = safeParseISO(competition.startDate);
              if (!startDate) return null;
              const endDate = addDays(startDate, competition.durationDays);
              const daysLeft = Math.max(0, differenceInDays(endDate, new Date()));
              
              const habitRates = competition.habitIds
                .map(id => {
                  const habit = habits.find(h => h.id === id);
                  if (!habit) return null;
                  return { habit, rate: getHabitRate(habit, competition) };
                })
                .filter(Boolean)
                .sort((a, b) => b!.rate - a!.rate) as { habit: Habit; rate: number }[];

              if (habitRates.length === 0) return null;

              return (
                <div key={competition.id} className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium truncate">{competition.name}</span>
                    <Badge variant="outline" className="text-[10px] h-5 shrink-0">
                      {daysLeft}d
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    {habitRates.slice(0, 3).map((hr, idx) => (
                      <div key={hr.habit.id} className="flex items-center gap-2">
                        <div className="w-4 flex justify-center">
                          {getRankIcon(idx + 1)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Progress value={hr.rate} className="h-1.5" />
                        </div>
                        <span className="text-xs tabular-nums">{hr.rate}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }).filter(Boolean)}
            {activeCompetitions.length > 1 && (
              <p className="text-xs text-muted-foreground text-center">
                +{activeCompetitions.length - 1} cuộc đua khác
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-xs text-muted-foreground">Chưa có cuộc đua</p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 text-xs mt-1">
                  <Plus className="w-3 h-3 mr-1" />
                  Tạo mới
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Flag className="w-5 h-5" />
                    Tạo cuộc đua mới
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>Tên cuộc đua</Label>
                    <Input
                      placeholder="VD: Tuần lành mạnh"
                      value={competitionName}
                      onChange={(e) => setCompetitionName(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Mục tiêu</Label>
                      <Select value={String(targetRate)} onValueChange={(v) => setTargetRate(Number(v))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TARGET_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={String(opt.value)}>
                              <div className="flex items-center gap-2">
                                <Target className="w-3 h-3" />
                                {opt.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Thời gian</Label>
                      <Select value={String(durationDays)} onValueChange={(v) => setDurationDays(Number(v))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DURATION_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={String(opt.value)}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Chọn Habits tham gia (ít nhất 2)</Label>
                    <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                      {activeHabits.map(habit => (
                        <div
                          key={habit.id}
                          className={cn(
                            'flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors',
                            selectedHabits.includes(habit.id) 
                              ? 'bg-primary/10 border-primary' 
                              : 'hover:bg-secondary'
                          )}
                          onClick={() => toggleHabitSelection(habit.id)}
                        >
                          <Checkbox
                            checked={selectedHabits.includes(habit.id)}
                            onCheckedChange={() => toggleHabitSelection(habit.id)}
                          />
                          <span className="text-sm">{habit.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={handleCreateCompetition}
                    disabled={selectedHabits.length < 2 || !competitionName.trim()}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Bắt đầu cuộc đua
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-primary" />
            Habit Race
            {activeCompetitions.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeCompetitions.length} đang chạy
              </Badge>
            )}
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8 px-2">
                <Plus className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Flag className="w-5 h-5" />
                  Tạo cuộc đua mới
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Tên cuộc đua</Label>
                  <Input
                    placeholder="VD: Tuần lành mạnh"
                    value={competitionName}
                    onChange={(e) => setCompetitionName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Mục tiêu</Label>
                    <Select value={String(targetRate)} onValueChange={(v) => setTargetRate(Number(v))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TARGET_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={String(opt.value)}>
                            <div className="flex items-center gap-2">
                              <Target className="w-3 h-3" />
                              {opt.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Thời gian</Label>
                    <Select value={String(durationDays)} onValueChange={(v) => setDurationDays(Number(v))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DURATION_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={String(opt.value)}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Chọn Habits tham gia (ít nhất 2)</Label>
                  <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                    {activeHabits.map(habit => (
                      <div
                        key={habit.id}
                        className={cn(
                          'flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors',
                          selectedHabits.includes(habit.id) 
                            ? 'bg-primary/10 border-primary' 
                            : 'hover:bg-secondary'
                        )}
                        onClick={() => toggleHabitSelection(habit.id)}
                      >
                        <Checkbox
                          checked={selectedHabits.includes(habit.id)}
                          onCheckedChange={() => toggleHabitSelection(habit.id)}
                        />
                        <span className="text-sm">{habit.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleCreateCompetition}
                  disabled={selectedHabits.length < 2 || !competitionName.trim()}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Bắt đầu cuộc đua
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Active Competitions */}
        {activeCompetitions.length > 0 ? (
          <div className="space-y-3">
            {activeCompetitions.map(competition => {
              const startDate = safeParseISO(competition.startDate);
              if (!startDate) return null;
              const endDate = addDays(startDate, competition.durationDays);
              const daysLeft = Math.max(0, differenceInDays(endDate, new Date()));
              
              const habitRates = competition.habitIds
                .map(id => {
                  const habit = habits.find(h => h.id === id);
                  if (!habit) return null;
                  return { habit, rate: getHabitRate(habit, competition) };
                })
                .filter(Boolean)
                .sort((a, b) => b!.rate - a!.rate) as { habit: Habit; rate: number }[];

              if (habitRates.length === 0) return null;

              return (
                <div key={competition.id} className="p-3 rounded-lg bg-secondary/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-warning" />
                      <span className="font-medium">{competition.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {daysLeft} ngày còn lại
                      </Badge>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Xóa cuộc đua?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Bạn có chắc muốn xóa cuộc đua này?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteHabitCompetition(competition.id)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Xóa
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <Target className="w-3 h-3" />
                    Mục tiêu: {competition.targetRate}% trong {competition.durationDays} ngày
                  </div>

                  {/* Leaderboard */}
                  <div className="space-y-2">
                    {habitRates.map((hr, idx) => {
                      const isLeading = idx === 0;
                      const reachedTarget = hr.rate >= competition.targetRate;
                      
                      return (
                        <div
                          key={hr.habit.id}
                          className={cn(
                            'flex items-center gap-2 p-2 rounded-lg',
                            isLeading ? 'bg-primary/10' : 'bg-background/50'
                          )}
                        >
                          <div className="w-5 flex justify-center">
                            {getRankIcon(idx + 1)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              'text-sm truncate',
                              isLeading && 'font-medium'
                            )}>
                              {hr.habit.name}
                            </p>
                            <Progress 
                              value={hr.rate} 
                              className="h-1.5 mt-1" 
                            />
                          </div>
                          <span className={cn(
                            'text-sm font-bold tabular-nums',
                            reachedTarget ? 'text-success' : 
                            hr.rate >= competition.targetRate * 0.8 ? 'text-warning' : 
                            'text-muted-foreground'
                          )}>
                            {hr.rate}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <Flag className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Chưa có cuộc đua nào</p>
            <p className="text-xs mt-1">Tạo cuộc đua để xem habit nào đạt mục tiêu trước!</p>
          </div>
        )}

        {/* Completed Competitions */}
        {completedCompetitions.length > 0 && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Đã hoàn thành</p>
              {allCompletedCompetitions.length > 3 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-xs"
                  onClick={() => setIsHistoryOpen(true)}
                >
                  <History className="w-3 h-3 mr-1" />
                  Xem tất cả
                </Button>
              )}
            </div>
            <div className="space-y-1">
              {completedCompetitions.map(competition => {
                const winnerHabit = habits.find(h => h.id === competition.winnerId);
                return (
                  <div 
                    key={competition.id} 
                    className="flex items-center gap-2 text-sm cursor-pointer hover:bg-secondary/50 p-1 rounded transition-colors"
                    onClick={() => setIsHistoryOpen(true)}
                  >
                    <Crown className="w-3 h-3 text-amber-500" />
                    <span className="text-muted-foreground truncate">{competition.name}:</span>
                    <span className="font-medium truncate">{winnerHabit?.name || 'Không xác định'}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* History Dialog */}
        <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Lịch sử cuộc đua
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-hidden flex flex-col space-y-4">
              {/* Overall Stats */}
              {allCompletedCompetitions.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-3 rounded-lg bg-secondary">
                    <p className="text-2xl font-bold">{allCompletedCompetitions.length}</p>
                    <p className="text-xs text-muted-foreground">Cuộc đua</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-secondary">
                    <p className="text-2xl font-bold text-amber-500">
                      {new Set(allCompletedCompetitions.map(c => c.winnerId)).size}
                    </p>
                    <p className="text-xs text-muted-foreground">Habit thắng</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-secondary">
                    <p className="text-2xl font-bold text-success">
                      {Math.round(allCompletedCompetitions.reduce((sum, c) => sum + c.targetRate, 0) / allCompletedCompetitions.length) || 0}%
                    </p>
                    <p className="text-xs text-muted-foreground">TB mục tiêu</p>
                  </div>
                </div>
              )}

              {/* Winner Leaderboard */}
              {allCompletedCompetitions.length > 0 && (() => {
                const winCounts: Record<string, number> = {};
                allCompletedCompetitions.forEach(c => {
                  if (c.winnerId) {
                    winCounts[c.winnerId] = (winCounts[c.winnerId] || 0) + 1;
                  }
                });
                const leaderboard = Object.entries(winCounts)
                  .map(([habitId, wins]) => ({
                    habit: habits.find(h => h.id === habitId),
                    wins
                  }))
                  .filter(item => item.habit)
                  .sort((a, b) => b.wins - a.wins)
                  .slice(0, 5);

                if (leaderboard.length === 0) return null;

                return (
                  <div className="space-y-2">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Award className="w-4 h-4 text-warning" />
                      Bảng vàng
                    </p>
                    <div className="space-y-1">
                      {leaderboard.map((item, idx) => (
                        <div 
                          key={item.habit!.id}
                          className={cn(
                            'flex items-center gap-3 p-2 rounded-lg',
                            idx === 0 ? 'bg-amber-500/10' : 'bg-secondary/50'
                          )}
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
                          <span className="flex-1 font-medium truncate">{item.habit!.name}</span>
                          <div className="flex items-center gap-1 text-amber-500">
                            <Trophy className="w-4 h-4" />
                            <span className="font-bold">{item.wins}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Competition History List */}
              <div className="flex-1 min-h-0">
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Chi tiết các cuộc đua
                </p>
                <ScrollArea className="h-[300px]">
                  {allCompletedCompetitions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Flag className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Chưa có cuộc đua nào hoàn thành</p>
                    </div>
                  ) : (
                    <div className="space-y-3 pr-4">
                      {allCompletedCompetitions.map(competition => {
                        const winnerHabit = habits.find(h => h.id === competition.winnerId);
                        const participantHabits = competition.habitIds
                          .map(id => habits.find(h => h.id === id))
                          .filter(Boolean) as Habit[];
                        const startDate = safeParseISO(competition.startDate);
                        if (!startDate) return null;
                        const endDate = competition.completedAt 
                          ? (safeParseISO(competition.completedAt) || addDays(startDate, competition.durationDays))
                          : addDays(startDate, competition.durationDays);
                        const actualDays = differenceInDays(endDate, startDate);

                        return (
                          <div 
                            key={competition.id}
                            className="p-3 rounded-lg border bg-card space-y-2"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium">{competition.name}</h4>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>
                                    {format(startDate, 'dd/MM/yyyy', { locale: vi })}
                                    {' → '}
                                    {format(endDate, 'dd/MM/yyyy', { locale: vi })}
                                  </span>
                                </div>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                {competition.targetRate}%
                              </Badge>
                            </div>

                            {/* Winner */}
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10">
                              <Crown className="w-4 h-4 text-amber-500" />
                              <span className="font-medium">{winnerHabit?.name || 'Không xác định'}</span>
                              <span className="text-xs text-muted-foreground ml-auto">
                                Thắng sau {actualDays} ngày
                              </span>
                            </div>

                            {/* Participants */}
                            <div className="text-xs text-muted-foreground">
                              <span className="font-medium">{participantHabits.length} người chơi:</span>
                              {' '}
                              {participantHabits.map(h => h.name).join(', ')}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
