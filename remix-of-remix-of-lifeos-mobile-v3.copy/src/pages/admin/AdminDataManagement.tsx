import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Database, Upload, Trash2, AlertTriangle, CheckCircle, 
  Loader2, RefreshCw, FileJson, Clock, Zap, Target,
  BookOpen, CheckSquare, Timer, Notebook, Calendar, Star
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { PageTransition } from '@/components/admin/AdminAnimations';
import { activeSupabase as supabase } from '@/integrations/supabase/externalClient';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { sampleHabits, sampleTasks, samplePomodoroSessions } from '@/data/sampleData';
import { sampleGoals, sampleJournalEntries, sampleLifeWheelScores, sampleWeeklyReviews, sampleNotes, sampleDailyIntentions } from '@/data/sampleDataExtended';

interface DataTable {
  name: string;
  displayName: string;
  icon: React.ElementType;
  count: number;
  sampleCount: number;
}

export default function AdminDataManagement() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentAction, setCurrentAction] = useState('');
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [dataCounts, setDataCounts] = useState<Record<string, number>>({});
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const dataTables: DataTable[] = [
    { name: 'goals', displayName: 'Goals', icon: Target, count: dataCounts.goals || 0, sampleCount: sampleGoals.length },
    { name: 'habits', displayName: 'Habits', icon: BookOpen, count: dataCounts.habits || 0, sampleCount: sampleHabits.length },
    { name: 'tasks', displayName: 'Tasks', icon: CheckSquare, count: dataCounts.tasks || 0, sampleCount: sampleTasks.length },
    { name: 'journal_entries', displayName: 'Journal Entries', icon: Notebook, count: dataCounts.journal_entries || 0, sampleCount: sampleJournalEntries.length },
    { name: 'notes', displayName: 'Notes', icon: FileJson, count: dataCounts.notes || 0, sampleCount: sampleNotes.length },
    { name: 'pomodoro_sessions', displayName: 'Pomodoro Sessions', icon: Timer, count: dataCounts.pomodoro_sessions || 0, sampleCount: samplePomodoroSessions.length },
    { name: 'life_wheel_scores', displayName: 'Life Wheel Scores', icon: Star, count: dataCounts.life_wheel_scores || 0, sampleCount: sampleLifeWheelScores.length },
    { name: 'weekly_reviews', displayName: 'Weekly Reviews', icon: Calendar, count: dataCounts.weekly_reviews || 0, sampleCount: sampleWeeklyReviews.length },
    { name: 'daily_intentions', displayName: 'Daily Intentions', icon: Zap, count: dataCounts.daily_intentions || 0, sampleCount: sampleDailyIntentions.length },
  ];

  const refreshDataCounts = async () => {
    setLoading(true);
    setCurrentAction('Đang đếm dữ liệu...');
    
    try {
      const counts: Record<string, number> = {};
      
      const tableNames = ['goals', 'habits', 'tasks', 'journal_entries', 'notes', 'pomodoro_sessions', 'life_wheel_scores', 'weekly_reviews', 'daily_intentions'] as const;
      
      for (const tableName of tableNames) {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          counts[tableName] = count || 0;
        }
      }
      
      setDataCounts(counts);
      setLastRefresh(new Date());
      toast.success('Đã làm mới số liệu');
    } catch (error) {
      console.error('Error refreshing counts:', error);
      toast.error('Lỗi khi đếm dữ liệu');
    } finally {
      setLoading(false);
      setCurrentAction('');
    }
  };

  const importDemoData = async () => {
    if (!user) {
      toast.error('Bạn cần đăng nhập để import dữ liệu');
      return;
    }

    const tablesToImport = selectedTables.length > 0 ? selectedTables : dataTables.map(t => t.name);
    
    setLoading(true);
    setProgress(0);
    
    const totalSteps = tablesToImport.length;
    let completedSteps = 0;
    let totalImported = 0;

    try {
      // Import Goals
      if (tablesToImport.includes('goals')) {
        setCurrentAction('Importing Goals...');
        const goalsToInsert = sampleGoals.map(goal => ({
          user_id: user.id,
          title: goal.title,
          description: goal.description,
          area: goal.area,
          target_date: goal.targetDate,
          progress: goal.progress,
          status: 'active' as const,
          created_at: goal.createdAt,
        }));
        
        const { data, error } = await supabase.from('goals').insert(goalsToInsert).select();
        if (error) throw error;
        totalImported += data?.length || 0;
        completedSteps++;
        setProgress((completedSteps / totalSteps) * 100);
      }

      // Import Habits
      if (tablesToImport.includes('habits')) {
        setCurrentAction('Importing Habits...');
        const habitsToInsert = sampleHabits.map(habit => ({
          user_id: user.id,
          name: habit.name,
          description: habit.description,
          area: habit.area,
          frequency: habit.frequency,
          streak: habit.streak || 0,
          best_streak: habit.bestStreak || 0,
          completed_dates: habit.completedDates || [],
          created_at: habit.createdAt,
        }));
        
        const { data, error } = await supabase.from('habits').insert(habitsToInsert).select();
        if (error) throw error;
        totalImported += data?.length || 0;
        completedSteps++;
        setProgress((completedSteps / totalSteps) * 100);
      }

      // Import Tasks
      if (tablesToImport.includes('tasks')) {
        setCurrentAction('Importing Tasks...');
        const tasksToInsert = sampleTasks.map(task => ({
          user_id: user.id,
          title: task.title,
          description: task.description,
          area: task.area,
          priority: task.priority,
          status: task.status,
          estimated_pomodoros: task.estimatedPomodoros,
          completed_pomodoros: task.completedPomodoros || 0,
          due_date: task.dueDate,
          created_at: task.createdAt,
          completed_at: task.completedAt,
        }));
        
        const { data, error } = await supabase.from('tasks').insert(tasksToInsert).select();
        if (error) throw error;
        totalImported += data?.length || 0;
        completedSteps++;
        setProgress((completedSteps / totalSteps) * 100);
      }

      // Import Journal Entries
      if (tablesToImport.includes('journal_entries')) {
        setCurrentAction('Importing Journal Entries...');
        const journalToInsert = sampleJournalEntries.map(entry => ({
          user_id: user.id,
          date: entry.date,
          content: entry.content,
          mood: entry.mood,
          energy: entry.energy,
          areas: entry.areas,
          gratitude: entry.gratitude,
          created_at: entry.createdAt,
        }));
        
        const { data, error } = await supabase.from('journal_entries').insert(journalToInsert).select();
        if (error) throw error;
        totalImported += data?.length || 0;
        completedSteps++;
        setProgress((completedSteps / totalSteps) * 100);
      }

      // Import Notes
      if (tablesToImport.includes('notes')) {
        setCurrentAction('Importing Notes...');
        const notesToInsert = sampleNotes.map(note => ({
          user_id: user.id,
          title: note.title,
          content: note.content,
          area: note.area,
          is_pinned: note.isPinned,
          is_favorite: note.isFavorite,
          created_at: note.createdAt,
          updated_at: note.updatedAt,
        }));
        
        const { data, error } = await supabase.from('notes').insert(notesToInsert).select();
        if (error) throw error;
        totalImported += data?.length || 0;
        completedSteps++;
        setProgress((completedSteps / totalSteps) * 100);
      }

      // Import Pomodoro Sessions
      if (tablesToImport.includes('pomodoro_sessions')) {
        setCurrentAction('Importing Pomodoro Sessions...');
        const pomodoroToInsert = samplePomodoroSessions.map(session => ({
          user_id: user.id,
          phase: session.phase,
          duration: session.duration,
          completed_at: session.completedAt,
        }));
        
        const { data, error } = await supabase.from('pomodoro_sessions').insert(pomodoroToInsert).select();
        if (error) throw error;
        totalImported += data?.length || 0;
        completedSteps++;
        setProgress((completedSteps / totalSteps) * 100);
      }

      // Import Life Wheel Scores
      if (tablesToImport.includes('life_wheel_scores')) {
        setCurrentAction('Importing Life Wheel Scores...');
        const wheelToInsert = sampleLifeWheelScores.map(score => ({
          user_id: user.id,
          date: score.date,
          scores: score.scores,
          created_at: score.createdAt,
        }));
        
        const { data, error } = await supabase.from('life_wheel_scores').insert(wheelToInsert).select();
        if (error) throw error;
        totalImported += data?.length || 0;
        completedSteps++;
        setProgress((completedSteps / totalSteps) * 100);
      }

      // Import Weekly Reviews
      if (tablesToImport.includes('weekly_reviews')) {
        setCurrentAction('Importing Weekly Reviews...');
        const reviewsToInsert = sampleWeeklyReviews.map(review => ({
          user_id: user.id,
          week_start: review.weekStart,
          wins: review.wins,
          challenges: review.challenges,
          lessons_learned: review.lessonsLearned,
          next_week_focus: review.nextWeekFocus,
          overall_rating: review.overallRating,
          created_at: review.createdAt,
        }));
        
        const { data, error } = await supabase.from('weekly_reviews').insert(reviewsToInsert).select();
        if (error) throw error;
        totalImported += data?.length || 0;
        completedSteps++;
        setProgress((completedSteps / totalSteps) * 100);
      }

      // Import Daily Intentions
      if (tablesToImport.includes('daily_intentions')) {
        setCurrentAction('Importing Daily Intentions...');
        const intentionsToInsert = sampleDailyIntentions.map(intention => ({
          user_id: user.id,
          date: intention.date,
          intention: intention.intention,
          completed: intention.completed,
          reflection: intention.reflection,
          created_at: intention.createdAt,
        }));
        
        const { data, error } = await supabase.from('daily_intentions').insert(intentionsToInsert).select();
        if (error) throw error;
        totalImported += data?.length || 0;
        completedSteps++;
        setProgress((completedSteps / totalSteps) * 100);
      }

      toast.success(`Đã import ${totalImported} records thành công!`);
      await refreshDataCounts();
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(`Lỗi import: ${error.message}`);
    } finally {
      setLoading(false);
      setProgress(0);
      setCurrentAction('');
    }
  };

  const clearAllData = async () => {
    if (!user) {
      toast.error('Bạn cần đăng nhập để xóa dữ liệu');
      return;
    }

    const tablesToClear = selectedTables.length > 0 ? selectedTables : dataTables.map(t => t.name);
    
    setLoading(true);
    setProgress(0);
    
    const totalSteps = tablesToClear.length;
    let completedSteps = 0;
    let totalDeleted = 0;

    try {
      // Order matters - delete child tables first
      const deleteOrder = [
        'pomodoro_sessions',
        'daily_intentions',
        'weekly_reviews',
        'life_wheel_scores',
        'journal_entries',
        'notes',
        'tasks',
        'habits',
        'goals',
      ] as const;

      for (const tableName of deleteOrder) {
        if (!tablesToClear.includes(tableName)) continue;
        
        setCurrentAction(`Deleting ${tableName}...`);
        
        const { error, count } = await supabase
          .from(tableName)
          .delete()
          .eq('user_id', user.id);
        
        if (error) {
          console.error(`Error deleting ${tableName}:`, error);
        } else {
          totalDeleted += count || 0;
        }
        
        completedSteps++;
        setProgress((completedSteps / totalSteps) * 100);
      }

      toast.success(`Đã xóa dữ liệu thành công!`);
      await refreshDataCounts();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(`Lỗi xóa: ${error.message}`);
    } finally {
      setLoading(false);
      setProgress(0);
      setCurrentAction('');
    }
  };

  const toggleTable = (tableName: string) => {
    setSelectedTables(prev => 
      prev.includes(tableName)
        ? prev.filter(t => t !== tableName)
        : [...prev, tableName]
    );
  };

  const selectAll = () => {
    setSelectedTables(dataTables.map(t => t.name));
  };

  const selectNone = () => {
    setSelectedTables([]);
  };

  const totalSampleRecords = dataTables.reduce((sum, t) => sum + t.sampleCount, 0);
  const totalCurrentRecords = dataTables.reduce((sum, t) => sum + t.count, 0);

  return (
    <PageTransition className="p-6 space-y-6">
      <AdminPageHeader
        title="Quản lý Dữ liệu Demo"
        description="Import dữ liệu mẫu hoặc xóa dữ liệu để test hiệu năng"
        icon={Database}
        actions={
          <Button onClick={refreshDataCounts} disabled={loading} variant="outline" size="sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Database className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalCurrentRecords.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Records hiện tại</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <FileJson className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalSampleRecords.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Sample records sẵn có</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <div className="text-sm font-medium">
                  {lastRefresh ? lastRefresh.toLocaleTimeString('vi-VN') : 'Chưa refresh'}
                </div>
                <div className="text-sm text-muted-foreground">Cập nhật lần cuối</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      {loading && currentAction && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{currentAction}</span>
                <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tables Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Chọn Tables</CardTitle>
              <CardDescription>
                Chọn các bảng dữ liệu cần thao tác (để trống = tất cả)
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                Chọn tất cả
              </Button>
              <Button variant="outline" size="sm" onClick={selectNone}>
                Bỏ chọn
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {dataTables.map((table) => (
                <div
                  key={table.name}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedTables.includes(table.name) 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => toggleTable(table.name)}
                >
                  <Checkbox 
                    checked={selectedTables.includes(table.name)}
                    onCheckedChange={() => toggleTable(table.name)}
                  />
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    <table.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{table.displayName}</div>
                    <div className="text-xs text-muted-foreground">
                      {table.count} / {table.sampleCount} records
                    </div>
                  </div>
                  {table.count > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {table.count}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Import Demo Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-green-500" />
              Import Demo Data
            </CardTitle>
            <CardDescription>
              Import dữ liệu mẫu từ local vào database để test
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Sẽ import {selectedTables.length > 0 
                ? dataTables.filter(t => selectedTables.includes(t.name)).reduce((sum, t) => sum + t.sampleCount, 0)
                : totalSampleRecords
              } records vào {selectedTables.length > 0 ? selectedTables.length : dataTables.length} tables.
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="w-full" disabled={loading}>
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Import Demo Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xác nhận Import</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bạn sắp import dữ liệu demo vào database. Điều này sẽ tạo thêm records mới.
                    Tiếp tục?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction onClick={importDemoData}>
                    Import
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        {/* Clear Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              Xóa Dữ liệu
            </CardTitle>
            <CardDescription>
              Xóa dữ liệu trong các bảng đã chọn (của user hiện tại)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              Hành động này không thể hoàn tác!
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full" disabled={loading}>
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Xóa Dữ liệu
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="w-5 h-5" />
                    Xác nhận Xóa
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Bạn sắp xóa tất cả dữ liệu trong các bảng đã chọn. 
                    Hành động này KHÔNG THỂ HOÀN TÁC. Bạn có chắc chắn muốn tiếp tục?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={clearAllData}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Xóa tất cả
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tips sử dụng</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-green-500" />
              <span>Sử dụng nút Refresh để cập nhật số lượng records hiện tại trong database</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-green-500" />
              <span>Chọn các tables cụ thể để import/xóa một phần dữ liệu</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-green-500" />
              <span>Import nhiều lần sẽ tạo thêm records (không ghi đè)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-green-500" />
              <span>Xóa dữ liệu chỉ xóa của user hiện tại (theo RLS policy)</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </PageTransition>
  );
}
