import type { Habit, Task, PomodoroSession, LifeArea } from '@/types/lifeos';

// Generate dates for the last N days
const getDateStr = (daysAgo: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
};

const today = getDateStr(0);

// Sample Habits - 66 habits for testing
const baseHabits: Partial<Habit>[] = [
  { name: 'Thiền 10 phút', area: 'spirituality', frequency: 'daily' },
  { name: 'Tập gym', area: 'health', frequency: 'daily' },
  { name: 'Đọc sách 30 phút', area: 'learning', frequency: 'daily' },
  { name: 'Uống 2L nước', area: 'health', frequency: 'daily' },
  { name: 'Gọi điện cho gia đình', area: 'relationships', frequency: 'weekly' },
  { name: 'Review chi tiêu', area: 'finance', frequency: 'daily' },
  { name: 'Viết nhật ký', area: 'personal', frequency: 'daily' },
  { name: 'Học tiếng Anh', area: 'learning', frequency: 'daily' },
  { name: 'Chạy bộ buổi sáng', area: 'health', frequency: 'daily' },
  { name: 'Stretching', area: 'health', frequency: 'daily' },
  { name: 'Ăn sáng healthy', area: 'health', frequency: 'daily' },
  { name: 'Ngủ trước 11h', area: 'health', frequency: 'daily' },
  { name: 'Không xem điện thoại trước khi ngủ', area: 'personal', frequency: 'daily' },
  { name: 'Dọn dẹp bàn làm việc', area: 'environment', frequency: 'daily' },
  { name: 'Thực hành gratitude', area: 'spirituality', frequency: 'daily' },
  { name: 'Review mục tiêu', area: 'career', frequency: 'weekly' },
];

export const sampleHabits: Habit[] = Array.from({ length: 66 }, (_, i) => {
  const base = baseHabits[i % baseHabits.length];
  const areas: LifeArea[] = ['health', 'learning', 'career', 'finance', 'relationships', 'fun', 'spirituality', 'environment', 'personal', 'contribution'];
  const streak = Math.floor(Math.random() * 15);
  const completedDates = Array.from({ length: streak }, (_, j) => getDateStr(j));
  
  // Add some random past completed dates
  for (let j = streak + 1; j < streak + 10; j++) {
    if (Math.random() > 0.5) {
      completedDates.push(getDateStr(j));
    }
  }
  
  return {
    id: `habit-${i + 1}`,
    name: i < baseHabits.length ? base.name! : `${base.name} #${Math.floor(i / baseHabits.length) + 1}`,
    area: base.area || areas[i % areas.length],
    frequency: base.frequency || 'daily',
    streak,
    bestStreak: streak + Math.floor(Math.random() * 5),
    completedDates,
    completions: completedDates.map(date => ({ date, count: 1, time: new Date().toISOString() })),
    createdAt: getDateStr(30 + i),
  };
});

// Sample Tasks - 108 tasks for testing
const taskTitles = [
  'Hoàn thành báo cáo Q4',
  'Học React hooks nâng cao',
  'Mua quà sinh nhật mẹ',
  'Dọn dẹp phòng làm việc',
  'Lên kế hoạch du lịch Tết',
  'Review và update CV',
  'Thanh toán hóa đơn điện nước',
  'Đăng ký khóa học tiếng Anh',
  'Họp team weekly',
  'Chuẩn bị presentation',
  'Viết documentation',
  'Code review',
  'Fix bugs production',
  'Deploy new features',
  'Meeting với khách hàng',
  'Brainstorm ý tưởng mới',
  'Refactor codebase',
  'Setup CI/CD',
  'Tối ưu database',
  'Viết unit tests',
];

const statuses: ('todo' | 'in_progress' | 'deferred' | 'done')[] = ['todo', 'in_progress', 'deferred', 'done'];
const priorities: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];

export const sampleTasks: Task[] = Array.from({ length: 108 }, (_, i) => {
  const areas: LifeArea[] = ['health', 'learning', 'career', 'finance', 'relationships', 'fun', 'spirituality', 'environment', 'personal', 'contribution'];
  const status = statuses[i % statuses.length];
  const title = taskTitles[i % taskTitles.length];
  
  return {
    id: `task-${i + 1}`,
    title: i < taskTitles.length ? title : `${title} #${Math.floor(i / taskTitles.length) + 1}`,
    description: i % 3 === 0 ? `Mô tả chi tiết cho task ${title}` : undefined,
    area: areas[i % areas.length],
    priority: priorities[i % priorities.length],
    status,
    estimatedPomodoros: Math.floor(Math.random() * 6) + 1,
    completedPomodoros: status === 'done' ? Math.floor(Math.random() * 4) + 1 : Math.floor(Math.random() * 2),
    dueDate: i % 4 === 0 ? getDateStr(-Math.floor(Math.random() * 14)) : undefined,
    createdAt: getDateStr(Math.floor(Math.random() * 30)),
    completedAt: status === 'done' ? getDateStr(Math.floor(Math.random() * 7)) : undefined,
  };
});

// Sample Pomodoro Sessions - 100 sessions for testing
export const samplePomodoroSessions: PomodoroSession[] = Array.from({ length: 100 }, (_, i) => {
  const phases: ('work' | 'break' | 'long_break')[] = ['work', 'work', 'work', 'break', 'work', 'work', 'work', 'long_break'];
  const daysAgo = Math.floor(i / 8); // ~8 pomodoros per day
  const hoursOffset = (i % 8) * 30 * 60 * 1000; // 30 min apart
  
  return {
    id: `pomo-${i + 1}`,
    taskId: i % 3 === 0 ? undefined : `task-${(i % 20) + 1}`,
    phase: phases[i % phases.length],
    duration: phases[i % phases.length] === 'work' ? 25 : phases[i % phases.length] === 'break' ? 5 : 15,
    completedAt: new Date(Date.now() - (daysAgo * 86400000) - hoursOffset).toISOString(),
  };
});

export const sampleUser = {
  name: 'Minh Anh',
};
