import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { CheckCircle2, Target, BookOpen, FileText, Clock, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { cn } from '@/lib/utils';

interface Activity {
  id: string;
  type: 'habit' | 'task' | 'goal' | 'journal' | 'note' | 'pomodoro';
  title: string;
  timestamp: Date;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
  area?: string;
}

const THRESHOLD = 5;

// Color mapping for activity types with proper Tailwind classes
const activityColors = {
  habit: { text: 'text-primary', bg: 'bg-primary/10' },
  task: { text: 'text-success', bg: 'bg-success/10' },
  goal: { text: 'text-warning', bg: 'bg-warning/10' },
  journal: { text: 'text-info', bg: 'bg-info/10' },
  note: { text: 'text-muted-foreground', bg: 'bg-muted' },
  pomodoro: { text: 'text-destructive', bg: 'bg-destructive/10' },
};

function ActivityList({ activities }: { activities: Activity[] }) {
  const typeLabels: Record<string, string> = {
    habit: 'Thói quen',
    task: 'Task',
    goal: 'Mục tiêu',
    journal: 'Nhật ký',
    note: 'Ghi chú',
    pomodoro: 'Focus'
  };

  return (
    <div className="space-y-3 py-2">
      {activities.slice(0, 15).map((activity) => (
        <div key={activity.id} className="flex items-start gap-3">
          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", activity.bgClass)}>
            <activity.icon className={cn("w-4 h-4", activity.colorClass)} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate">{activity.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {typeLabels[activity.type]}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                {format(activity.timestamp, 'HH:mm dd/MM', { locale: vi })}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardRecentActivity() {
  const habits = useLifeOSStore((s) => s.habits);
  const tasks = useLifeOSStore((s) => s.tasks);
  const goals = useLifeOSStore((s) => s.goals);
  const journalEntries = useLifeOSStore((s) => s.journalEntries);
  const notes = useLifeOSStore((s) => s.notes);
  const pomodoroSessions = useLifeOSStore((s) => s.pomodoroSessions);

  const todayStr = new Date().toISOString().split('T')[0];
  
  // Collect recent activities
  const activities: Activity[] = [];

  // Completed habits today
  habits
    .filter((h) => !h.archivedAt && !h.deletedAt && h.completedDates.includes(todayStr))
    .forEach((h) => {
      activities.push({
        id: `habit-${h.id}`,
        type: 'habit',
        title: `Hoàn thành thói quen: ${h.name}`,
        timestamp: new Date(),
        icon: Target,
        colorClass: activityColors.habit.text,
        bgClass: activityColors.habit.bg,
        area: h.area
      });
    });

  // Completed tasks (recent)
  tasks
    .filter((t) => !t.deletedAt && t.completedAt)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
    .slice(0, 5)
    .forEach((t) => {
      activities.push({
        id: `task-${t.id}`,
        type: 'task',
        title: `Hoàn thành task: ${t.title}`,
        timestamp: new Date(t.completedAt!),
        icon: CheckCircle2,
        colorClass: activityColors.task.text,
        bgClass: activityColors.task.bg,
        area: t.area
      });
    });

  // Completed goals (recent)
  goals
    .filter((g) => !g.deletedAt && g.completedAt)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
    .slice(0, 3)
    .forEach((g) => {
      activities.push({
        id: `goal-${g.id}`,
        type: 'goal',
        title: `Đạt mục tiêu: ${g.title}`,
        timestamp: new Date(g.completedAt!),
        icon: Trophy,
        colorClass: activityColors.goal.text,
        bgClass: activityColors.goal.bg,
        area: g.area
      });
    });

  // Recent journal entries
  journalEntries
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3)
    .forEach((j) => {
      activities.push({
        id: `journal-${j.id}`,
        type: 'journal',
        title: `Nhật ký: ${j.content?.slice(0, 30) || 'Ghi chép'}${j.content && j.content.length > 30 ? '...' : ''}`,
        timestamp: new Date(j.date),
        icon: BookOpen,
        colorClass: activityColors.journal.text,
        bgClass: activityColors.journal.bg,
      });
    });

  // Recent notes
  notes
    .filter((n) => !n.deletedAt)
    .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
    .slice(0, 3)
    .forEach((n) => {
      activities.push({
        id: `note-${n.id}`,
        type: 'note',
        title: `Ghi chú: ${n.title}`,
        timestamp: new Date(n.updatedAt || n.createdAt),
        icon: FileText,
        colorClass: activityColors.note.text,
        bgClass: activityColors.note.bg,
        area: n.area
      });
    });

  // Recent pomodoro sessions
  pomodoroSessions
    .slice(-5)
    .reverse()
    .forEach((s) => {
      activities.push({
        id: `pomodoro-${s.id}`,
        type: 'pomodoro',
        title: `Focus: ${s.duration || 25} phút`,
        timestamp: new Date(s.completedAt),
        icon: Clock,
        colorClass: activityColors.pomodoro.text,
        bgClass: activityColors.pomodoro.bg,
      });
    });

  // Sort by timestamp (most recent first)
  activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const needsScroll = activities.length > THRESHOLD;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          Hoạt động gần đây
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 px-4 text-center">
            Chưa có hoạt động nào
          </p>
        ) : needsScroll ? (
          <ScrollArea className="h-[280px] px-4">
            <ActivityList activities={activities} />
          </ScrollArea>
        ) : (
          <div className="px-4 pb-4">
            <ActivityList activities={activities} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}