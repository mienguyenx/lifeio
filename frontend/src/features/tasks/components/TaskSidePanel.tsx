import { useNavigate } from 'react-router-dom';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { Mascot } from '@/components/brand/Mascot';
import { LifeIcon, type LifeIconName } from '@/components/icons/LifeIcon';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePomodoroStore } from '@/stores/usePomodoroStore';
import type { Task, TaskCounts } from '../types/task.types';

function MotivationCard({ counts }: { counts: TaskCounts }) {
  const msg = counts.today === 0 ? 'Hôm nay đã xong hết rồi!' : counts.today <= 3 ? 'Bạn làm được mà!' : 'Từng việc một nhé!';
  return (
    <div className="relative overflow-hidden rounded-[24px] p-4 pt-3 bg-gradient-to-br from-lavender via-[#F6F0FF] to-[#FFEFF6] dark:from-primary/20 dark:via-primary/10 dark:to-pink/10 border border-primary/10 text-center">
      <Mascot name="mochi" pose="focus" size={104} float className="mx-auto" />
      <p className="text-[15px] font-bold text-primary mt-1">{msg}</p>
      <p className="text-[12.5px] text-muted-foreground">Tập trung vào một việc mỗi lúc.</p>
    </div>
  );
}

function FocusCard({ tasks }: { tasks: Task[] }) {
  const { isRunning, timeRemaining, currentTaskId, start, pause, resume, reset, setTask } = usePomodoroStore();
  const mm = String(Math.floor(timeRemaining / 60)).padStart(2, '0');
  const ss = String(timeRemaining % 60).padStart(2, '0');
  const open = tasks.filter((t) => t.status !== 'done');
  const started = isRunning || currentTaskId !== undefined;
  return (
    <div className="rounded-[24px] bg-card border border-border/70 shadow-soft p-4">
      <div className="flex items-center gap-2.5">
        <span className="h-10 w-10 rounded-[14px] bg-[#FFF3E2] dark:bg-[#FF9F43]/15 grid place-items-center"><LifeIcon name="module/focus" size={22} variant="duotone" /></span>
        <div>
          <p className="text-[14px] font-bold">Chế độ Focus</p>
          <p className="text-[12px] text-muted-foreground">Pomodoro · tập trung sâu</p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-4">
        <span className="text-[34px] font-bold tabular-nums tracking-tight">{mm}:{ss}</span>
        <div className="flex items-center gap-2">
          {started && (
            <button onClick={reset} className="h-10 w-10 grid place-items-center rounded-full border border-border text-muted-foreground hover:bg-secondary" aria-label="Đặt lại"><RotateCcw className="h-4 w-4" /></button>
          )}
          <button
            onClick={() => (isRunning ? pause() : started ? resume() : start(currentTaskId))}
            className="h-12 w-12 grid place-items-center rounded-full bg-primary text-primary-foreground shadow-fab hover:brightness-105 active:scale-95 transition"
            aria-label={isRunning ? 'Tạm dừng' : 'Bắt đầu'}
          >
            {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </button>
        </div>
      </div>
      <Select value={currentTaskId ?? 'none'} onValueChange={(v) => setTask(v === 'none' ? undefined : v)}>
        <SelectTrigger className="mt-3 h-10 rounded-full bg-secondary/60 border-transparent text-[13px]"><SelectValue placeholder="Chọn công việc…" /></SelectTrigger>
        <SelectContent className="rounded-2xl max-w-[280px]">
          <SelectItem value="none">Chọn công việc…</SelectItem>
          {open.map((t) => <SelectItem key={t.id} value={t.id}><span className="truncate">{t.title}</span></SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

const QUICK: { label: string; icon: LifeIconName; tint: string; to?: string; action?: 'task' }[] = [
  { label: 'Công việc mới', icon: 'module/tasks', tint: 'bg-[#FFF1E8] dark:bg-[#FF9B63]/15', action: 'task' },
  { label: 'Mục tiêu mới', icon: 'module/goals', tint: 'bg-[#FFEFF6] dark:bg-[#F472B6]/15', to: '/goals' },
  { label: 'Thói quen mới', icon: 'module/habits', tint: 'bg-[#E6F8F1] dark:bg-[#57D3AE]/15', to: '/habits' },
  { label: 'Ghi chú mới', icon: 'module/notes', tint: 'bg-lavender dark:bg-primary/15', to: '/notes' },
];

export function TaskSidePanel({ tasks, counts, onAdd }: { tasks: Task[]; counts: TaskCounts; onAdd: () => void }) {
  const navigate = useNavigate();
  return (
    <aside className="space-y-4">
      <MotivationCard counts={counts} />
      <FocusCard tasks={tasks} />
      <div className="rounded-[24px] bg-card border border-border/70 shadow-soft p-4">
        <p className="text-[14px] font-bold mb-3">Thêm nhanh</p>
        <div className="space-y-2">
          {QUICK.map((q) => (
            <button
              key={q.label}
              onClick={() => (q.action === 'task' ? onAdd() : navigate(q.to!))}
              className={`w-full h-11 rounded-2xl px-3 flex items-center gap-2.5 text-[13.5px] font-semibold hover:brightness-[0.98] hover:translate-x-0.5 transition-all ${q.tint}`}
            >
              <LifeIcon name={q.icon} size={20} variant="duotone" />{q.label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
