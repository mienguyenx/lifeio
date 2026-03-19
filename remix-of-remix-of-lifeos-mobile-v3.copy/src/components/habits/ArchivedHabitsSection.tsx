import { useState } from 'react';
import { Archive, ArchiveRestore, ChevronDown, Flame, Trash2 } from 'lucide-react';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { LIFE_AREAS, type Habit } from '@/types/lifeos';
import { toast } from 'sonner';

interface ArchivedHabitsSectionProps {
  archivedHabits: Habit[];
  onViewDetail: (habit: Habit) => void;
}

export function ArchivedHabitsSection({ archivedHabits, onViewDetail }: ArchivedHabitsSectionProps) {
  const unarchiveHabit = useLifeOSStore((s) => s.unarchiveHabit);
  const deleteHabit = useLifeOSStore((s) => s.deleteHabit);
  const [isOpen, setIsOpen] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDeleteHabit = (habit: Habit) => {
    setHabitToDelete(habit);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (habitToDelete) {
      deleteHabit(habitToDelete.id);
      setHabitToDelete(null);
      setDeleteDialogOpen(false);
      toast.success('Đã chuyển vào thùng rác');
    }
  };

  if (archivedHabits.length === 0) return null;

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between py-6">
            <div className="flex items-center gap-2">
              <Archive className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Habits đã lưu trữ</span>
              <Badge variant="secondary" className="ml-2">{archivedHabits.length}</Badge>
            </div>
            <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-3 mt-2">
            {archivedHabits.map((habit) => {
              const area = LIFE_AREAS.find((a) => a.id === habit.area);
              const archivedDate = habit.archivedAt ? (() => {
                const date = new Date(habit.archivedAt);
                if (isNaN(date.getTime())) return habit.archivedAt;
                return date.toLocaleDateString('vi-VN');
              })() : '';
              
              return (
                <Card 
                  key={habit.id} 
                  className="bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
                  onClick={() => onViewDetail(habit)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 opacity-60"
                        style={{ backgroundColor: `hsl(var(--area-${habit.area}) / 0.2)` }}
                      >
                        {habit.icon || area?.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium truncate text-muted-foreground">{habit.name}</h3>
                          {habit.bestStreak && habit.bestStreak > 0 && (
                            <div className="flex items-center gap-1 text-streak/60 bg-streak/5 px-2 py-0.5 rounded-full">
                              <Flame className="w-3 h-3" />
                              <span className="text-xs">Best: {habit.bestStreak}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{area?.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Lưu trữ: {archivedDate} • {habit.completedDates.length} ngày hoàn thành
                        </p>
                      </div>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            unarchiveHabit(habit.id);
                            toast.success('Đã khôi phục habit');
                          }}
                          title="Khôi phục"
                        >
                          <ArchiveRestore className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteHabit(habit)}
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa habit "{habitToDelete?.name}"? Habit sẽ được chuyển vào thùng rác và có thể khôi phục sau.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
