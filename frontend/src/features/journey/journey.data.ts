import type { LifeIconName } from '@/components/icons/LifeIcon';
import type { useLifeOSStore } from '@/stores/useLifeOSStore';

export interface Quest {
  id: string;
  title: string;
  desc: string;
  icon: LifeIconName;
  path: string;
  check: (store: ReturnType<typeof useLifeOSStore.getState>) => boolean;
  xp: number;
}

export interface Stage {
  id: number;
  title: string;
  subtitle: string;
  emoji: string;
  color: string;
  bgColor: string;
  quests: Quest[];
}

export const STAGES: Stage[] = [
  {
    id: 1,
    title: 'Hiểu bản thân',
    subtitle: 'Biết mình là ai, muốn gì',
    emoji: '🌱',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
    quests: [
      {
        id: 'onboarding',
        title: 'Hoàn thành thiết lập ban đầu',
        desc: 'Trả lời các câu hỏi về phong cách sống và ưu tiên của bạn',
        icon: 'module/profile',
        path: '/personalization',
        check: (s) => s.userPreferences?.onboardingCompleted === true,
        xp: 50,
      },
      {
        id: 'life-wheel',
        title: 'Đánh giá Bánh xe cuộc sống',
        desc: 'Xem mức độ cân bằng của 8 lĩnh vực cuộc sống bạn hiện tại',
        icon: 'module/goals',
        path: '/life-wheel',
        check: (s) => s.lifeWheelScores?.length > 0,
        xp: 80,
      },
      {
        id: 'personalization',
        title: 'Tùy chỉnh cá nhân hóa',
        desc: 'Điều chỉnh giọng AI, phong cách lập kế hoạch theo ý bạn',
        icon: 'module/profile',
        path: '/personalization',
        check: (s) => !!s.userPreferences?.archetype && s.userPreferences.archetype !== 'beginner',
        xp: 30,
      },
    ],
  },
  {
    id: 2,
    title: 'Xây dựng hệ thống',
    subtitle: 'Tạo nền móng cho thay đổi',
    emoji: '🏗️',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
    quests: [
      {
        id: 'first-goal',
        title: 'Đặt mục tiêu đầu tiên',
        desc: 'Xác định 1 điều quan trọng bạn muốn đạt được',
        icon: 'module/goals',
        path: '/goals',
        check: (s) => s.goals?.length > 0,
        xp: 100,
      },
      {
        id: 'first-habit',
        title: 'Tạo thói quen đầu tiên',
        desc: 'Chọn 1 thói quen nhỏ để bắt đầu xây dựng momentum',
        icon: 'module/habits',
        path: '/habits',
        check: (s) => s.habits?.length > 0,
        xp: 100,
      },
      {
        id: 'first-task',
        title: 'Thêm việc cần làm',
        desc: 'Ghi lại 1 việc cụ thể cần hoàn thành hôm nay hoặc tuần này',
        icon: 'module/tasks',
        path: '/tasks',
        check: (s) => s.tasks?.length > 0,
        xp: 50,
      },
    ],
  },
  {
    id: 3,
    title: 'Sống có ý thức',
    subtitle: 'Theo dõi từng ngày một',
    emoji: '⚡',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
    quests: [
      {
        id: 'daily-intention',
        title: 'Đặt ý định hàng ngày',
        desc: 'Mỗi sáng, xác định 3 việc quan trọng nhất hôm nay',
        icon: 'module/today',
        path: '/',
        check: (s) => s.dailyIntentions?.length > 0,
        xp: 60,
      },
      {
        id: 'first-journal',
        title: 'Viết nhật ký đầu tiên',
        desc: 'Ghi lại suy nghĩ, cảm xúc hoặc bài học trong ngày',
        icon: 'module/journal',
        path: '/journal',
        check: (s) => s.journalEntries?.length > 0,
        xp: 80,
      },
      {
        id: 'ai-chat',
        title: 'Trò chuyện với AI Coach',
        desc: 'Hỏi AI về kế hoạch, thói quen hoặc bất kỳ điều gì bạn đang suy nghĩ',
        icon: 'module/ai-coach',
        path: '/ai-chat',
        check: (s) => s.chatMessages?.length > 0,
        xp: 60,
      },
    ],
  },
  {
    id: 4,
    title: 'Phản tư & Cải thiện',
    subtitle: 'Nhìn lại để tiến xa hơn',
    emoji: '🔮',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800',
    quests: [
      {
        id: 'weekly-review',
        title: 'Hoàn thành Weekly Review',
        desc: 'Nhìn lại tuần vừa qua: đã làm được gì, học được gì',
        icon: 'module/reviews',
        path: '/weekly-review',
        check: (s) => s.weeklyReviews?.length > 0,
        xp: 150,
      },
      {
        id: 'monthly-review',
        title: 'Hoàn thành Monthly Review',
        desc: 'Đánh giá tháng và điều chỉnh hướng đi',
        icon: 'module/reviews',
        path: '/monthly-review',
        check: (s) => s.monthlyReviews?.length > 0,
        xp: 200,
      },
      {
        id: 'habit-streak',
        title: 'Duy trì thói quen 7 ngày liên tiếp',
        desc: 'Hoàn thành ít nhất 1 thói quen trong 7 ngày liên tiếp',
        icon: 'module/habits',
        path: '/habits',
        check: (s) => {
          if (!s.habits?.length) return false;
          const habit = s.habits[0];
          if (!habit?.completedDates?.length) return false;
          const sorted = [...habit.completedDates].sort().reverse();
          if (sorted.length < 7) return false;
          const today = new Date();
          let streak = 0;
          for (let i = 0; i < sorted.length; i++) {
            const d = new Date(sorted[i]);
            const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
            if (diff === i) streak++;
            else break;
          }
          return streak >= 7;
        },
        xp: 200,
      },
    ],
  },
];
