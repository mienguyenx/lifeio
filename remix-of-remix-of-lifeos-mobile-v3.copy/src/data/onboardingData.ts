import type { Habit, Task, Goal, Note, LifeArea } from '@/types/lifeos';

const getDateStr = (daysAgo: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
};

const today = getDateStr(0);

// Onboarding Habits - Nhẹ nhàng, hướng dẫn sử dụng
export const onboardingHabits: Omit<Habit, 'id' | 'createdAt'>[] = [
  {
    name: 'Uống nước đầy đủ',
    description: 'Uống ít nhất 2L nước mỗi ngày để giữ cơ thể khỏe mạnh',
    area: 'health',
    frequency: 'daily',
    streak: 0,
    bestStreak: 0,
    completedDates: [],
    completions: [],
  },
  {
    name: 'Đọc sách 15 phút',
    description: 'Dành 15 phút mỗi ngày để đọc sách và học hỏi',
    area: 'learning',
    frequency: 'daily',
    streak: 0,
    bestStreak: 0,
    completedDates: [],
    completions: [],
  },
  {
    name: 'Viết nhật ký',
    description: 'Ghi lại những điều biết ơn và suy ngẫm trong ngày',
    area: 'personal',
    frequency: 'daily',
    streak: 0,
    bestStreak: 0,
    completedDates: [],
    completions: [],
  },
];

// Onboarding Tasks - Hướng dẫn sử dụng
export const onboardingTasks: Omit<Task, 'id' | 'createdAt' | 'subtasks'>[] = [
  {
    title: 'Khám phá LifeOS',
    description: 'Dành 10 phút để khám phá các tính năng của LifeOS và tùy chỉnh theo nhu cầu của bạn',
    area: 'personal',
    priority: 'high',
    status: 'todo',
    estimatedPomodoros: 1,
    completedPomodoros: 0,
    dueDate: today,
  },
  {
    title: 'Thiết lập mục tiêu đầu tiên',
    description: 'Tạo mục tiêu đầu tiên của bạn trong phần Goals để bắt đầu hành trình phát triển bản thân',
    area: 'personal',
    priority: 'medium',
    status: 'todo',
    estimatedPomodoros: 1,
    completedPomodoros: 0,
  },
  {
    title: 'Hoàn thành hướng dẫn sử dụng',
    description: 'Xem qua các tính năng chính: Habits, Tasks, Goals, Journal và Notes',
    area: 'learning',
    priority: 'low',
    status: 'todo',
    estimatedPomodoros: 1,
    completedPomodoros: 0,
  },
];

// Onboarding Goals - Hướng dẫn sử dụng
export const onboardingGoals: Omit<Goal, 'id' | 'createdAt' | 'progress' | 'milestones'>[] = [
  {
    title: 'Làm quen với LifeOS trong 1 tuần',
    description: 'Dành thời gian khám phá và sử dụng các tính năng chính của LifeOS để quản lý cuộc sống hiệu quả hơn',
    area: 'personal',
    targetDate: getDateStr(-7),
    milestones: [
      { id: 'm1', title: 'Hoàn thành 3 habits đầu tiên', completed: false },
      { id: 'm2', title: 'Tạo 5 tasks và hoàn thành ít nhất 2', completed: false },
      { id: 'm3', title: 'Viết 3 nhật ký', completed: false },
    ],
  },
];

// Onboarding Notes - Hướng dẫn sử dụng
export const onboardingNotes: Omit<Note, 'id' | 'createdAt' | 'tags'>[] = [
  {
    title: 'Chào mừng đến với LifeOS! 🎉',
    content: `Chào mừng bạn đến với LifeOS - ứng dụng quản lý cuộc sống toàn diện!

## Bắt đầu nhanh:

1. **Habits (Thói quen)**: Tạo và theo dõi các thói quen hàng ngày
2. **Tasks (Công việc)**: Quản lý danh sách công việc và deadline
3. **Goals (Mục tiêu)**: Đặt mục tiêu dài hạn và theo dõi tiến độ
4. **Journal (Nhật ký)**: Ghi lại suy nghĩ và trải nghiệm
5. **Notes (Ghi chú)**: Lưu trữ thông tin quan trọng

## Mẹo sử dụng:

- Sử dụng Pomodoro Timer để tập trung làm việc
- Đánh giá Life Wheel định kỳ để cân bằng cuộc sống
- Thực hiện Weekly Review để nhìn lại tuần qua

Chúc bạn có trải nghiệm tuyệt vời với LifeOS! 💪`,
    area: 'personal',
    tags: [],
    isPinned: true,
  },
];

// Helper function để import onboarding data vào Supabase
export async function importOnboardingData(userId: string, supabase: any) {
  try {
    const results = {
      habits: 0,
      tasks: 0,
      goals: 0,
      notes: 0,
    };

    // Import Habits
    if (onboardingHabits.length > 0) {
      const habitsToInsert = onboardingHabits.map(habit => ({
        user_id: userId,
        name: habit.name,
        description: habit.description,
        area: habit.area,
        frequency: habit.frequency,
        streak: habit.streak || 0,
        best_streak: habit.bestStreak || 0,
        completed_dates: habit.completedDates || [],
        created_at: new Date().toISOString(),
      }));

      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .insert(habitsToInsert)
        .select();

      if (habitsError) {
        console.error('Error importing onboarding habits:', habitsError);
      } else {
        results.habits = habitsData?.length || 0;
      }
    }

    // Import Tasks
    if (onboardingTasks.length > 0) {
      const tasksToInsert = onboardingTasks.map(task => ({
        user_id: userId,
        title: task.title,
        description: task.description,
        area: task.area,
        priority: task.priority,
        status: task.status,
        estimated_pomodoros: task.estimatedPomodoros || 1,
        completed_pomodoros: task.completedPomodoros || 0,
        due_date: task.dueDate || null,
        created_at: new Date().toISOString(),
      }));

      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .insert(tasksToInsert)
        .select();

      if (tasksError) {
        console.error('Error importing onboarding tasks:', tasksError);
      } else {
        results.tasks = tasksData?.length || 0;
      }
    }

    // Import Goals
    if (onboardingGoals.length > 0) {
      const goalsToInsert = onboardingGoals.map(goal => ({
        user_id: userId,
        title: goal.title,
        description: goal.description,
        area: goal.area,
        target_date: goal.targetDate,
        progress: 0,
        status: 'active',
        created_at: new Date().toISOString(),
      }));

      const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .insert(goalsToInsert)
        .select();

      if (goalsError) {
        console.error('Error importing onboarding goals:', goalsError);
      } else {
        results.goals = goalsData?.length || 0;

        // Import milestones for goals
        if (goalsData && goalsData.length > 0) {
          for (let i = 0; i < goalsData.length; i++) {
            const goalData = goalsData[i];
            const goal = onboardingGoals[i];
            if (goal && goal.milestones && goal.milestones.length > 0) {
              const milestonesToInsert = goal.milestones.map(milestone => ({
                goal_id: goalData.id,
                title: milestone.title,
                completed: milestone.completed || false,
                completed_at: milestone.completedAt || null,
                created_at: new Date().toISOString(),
              }));

              const { error: milestonesError } = await supabase
                .from('goal_milestones')
                .insert(milestonesToInsert);
              
              if (milestonesError) {
                console.error('Error importing goal milestones:', milestonesError);
              }
            }
          }
        }
      }
    }

    // Import Notes
    if (onboardingNotes.length > 0) {
      const notesToInsert = onboardingNotes.map(note => ({
        user_id: userId,
        title: note.title,
        content: note.content,
        area: note.area,
        is_pinned: note.isPinned || false,
        created_at: new Date().toISOString(),
      }));

      const { data: notesData, error: notesError } = await supabase
        .from('notes')
        .insert(notesToInsert)
        .select();

      if (notesError) {
        console.error('Error importing onboarding notes:', notesError);
      } else {
        results.notes = notesData?.length || 0;
      }
    }

    console.log('[Onboarding] Imported data for new user:', results);
    return results;
  } catch (error) {
    console.error('[Onboarding] Error importing onboarding data:', error);
    throw error;
  }
}

