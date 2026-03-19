import { useState, useRef } from 'react';
import { Download, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export function DataExportImport() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  // Get all data from store
  const user = useLifeOSStore((s) => s.user);
  const habits = useLifeOSStore((s) => s.habits);
  const tasks = useLifeOSStore((s) => s.tasks);
  const goals = useLifeOSStore((s) => s.goals);
  const journalEntries = useLifeOSStore((s) => s.journalEntries);
  const lifeWheelScores = useLifeOSStore((s) => s.lifeWheelScores);
  const weeklyReviews = useLifeOSStore((s) => s.weeklyReviews);
  const chatMessages = useLifeOSStore((s) => s.chatMessages);
  const pomodoroSessions = useLifeOSStore((s) => s.pomodoroSessions);
  const pomodoroSettings = useLifeOSStore((s) => s.pomodoroSettings);

  // Import functions
  const setUser = useLifeOSStore((s) => s.setUser);

  const handleExport = () => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      user,
      habits,
      tasks,
      goals,
      journalEntries,
      lifeWheelScores,
      weeklyReviews,
      chatMessages,
      pomodoroSessions,
      pomodoroSettings,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifeos-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Đã xuất dữ liệu thành công!', {
      description: 'File backup đã được tải xuống.',
    });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        // Validate data structure
        if (!data.version || !data.exportedAt) {
          throw new Error('Invalid backup file format');
        }

        // Import data using localStorage directly (zustand persist)
        const storeData = {
          state: {
            user: data.user || { name: 'User' },
            habits: data.habits || [],
            tasks: data.tasks || [],
            goals: data.goals || [],
            journalEntries: data.journalEntries || [],
            lifeWheelScores: data.lifeWheelScores || [],
            weeklyReviews: data.weeklyReviews || [],
            chatMessages: data.chatMessages || [],
            pomodoroSessions: data.pomodoroSessions || [],
            pomodoroSettings: data.pomodoroSettings || {
              workDuration: 25,
              breakDuration: 5,
              longBreakDuration: 15,
              sessionsBeforeLongBreak: 4,
            },
            aiSettings: {},
          },
          version: 0,
        };

        localStorage.setItem('lifeos-storage', JSON.stringify(storeData));

        toast.success('Đã nhập dữ liệu thành công!', {
          description: 'Trang sẽ được tải lại để áp dụng dữ liệu mới.',
        });

        // Reload to apply imported data
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (error) {
        console.error('Import error:', error);
        toast.error('Lỗi khi nhập dữ liệu', {
          description: 'File backup không hợp lệ hoặc bị lỗi.',
        });
      } finally {
        setImporting(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.readAsText(file);
  };

  const stats = {
    habits: habits.length,
    tasks: tasks.length,
    goals: goals.length,
    journals: journalEntries.length,
    reviews: weeklyReviews.length,
    pomodoros: pomodoroSessions.filter(s => s.phase === 'work').length,
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Download className="w-5 h-5" /> Sao lưu & Khôi phục
        </CardTitle>
        <CardDescription>
          Xuất hoặc nhập dữ liệu LifeOS của bạn
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current data stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-secondary rounded-lg p-2">
            <p className="text-lg font-bold">{stats.habits}</p>
            <p className="text-xs text-muted-foreground">Habits</p>
          </div>
          <div className="bg-secondary rounded-lg p-2">
            <p className="text-lg font-bold">{stats.tasks}</p>
            <p className="text-xs text-muted-foreground">Tasks</p>
          </div>
          <div className="bg-secondary rounded-lg p-2">
            <p className="text-lg font-bold">{stats.goals}</p>
            <p className="text-xs text-muted-foreground">Goals</p>
          </div>
          <div className="bg-secondary rounded-lg p-2">
            <p className="text-lg font-bold">{stats.journals}</p>
            <p className="text-xs text-muted-foreground">Journals</p>
          </div>
          <div className="bg-secondary rounded-lg p-2">
            <p className="text-lg font-bold">{stats.reviews}</p>
            <p className="text-xs text-muted-foreground">Reviews</p>
          </div>
          <div className="bg-secondary rounded-lg p-2">
            <p className="text-lg font-bold">🍅 {stats.pomodoros}</p>
            <p className="text-xs text-muted-foreground">Pomodoros</p>
          </div>
        </div>

        {/* Export button */}
        <Button className="w-full" onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" /> Xuất dữ liệu (JSON)
        </Button>

        {/* Import button with confirmation */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <Upload className="w-4 h-4 mr-2" /> Nhập dữ liệu
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-warning" />
                Xác nhận nhập dữ liệu
              </AlertDialogTitle>
              <AlertDialogDescription>
                Việc này sẽ <strong>thay thế toàn bộ</strong> dữ liệu hiện tại của bạn bằng dữ liệu từ file backup.
                <br /><br />
                Hãy chắc chắn bạn đã xuất bản backup trước khi tiếp tục.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction onClick={() => fileInputRef.current?.click()}>
                Tiếp tục nhập
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />

        <p className="text-xs text-muted-foreground text-center">
          Dữ liệu được lưu dưới dạng JSON, có thể mở bằng text editor.
        </p>
      </CardContent>
    </Card>
  );
}
