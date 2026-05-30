import type { Goal, JournalEntry, LifeWheelScore, WeeklyReview, ChatMessage, LifeArea, Note, DailyIntention } from '@/types/lifeos';

const getDateStr = (daysAgo: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
};

const getWeekStart = (weeksAgo: number): string => {
  const date = new Date();
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1) - (weeksAgo * 7);
  date.setDate(diff);
  return date.toISOString().split('T')[0];
};

// Sample Goals - 50 goals for testing
export const sampleGoals: Goal[] = [
  {
    id: 'goal-1',
    title: 'Giảm 5kg trong 3 tháng',
    description: 'Đạt cân nặng lý tưởng thông qua tập luyện và ăn uống lành mạnh',
    area: 'health',
    targetDate: getDateStr(-90),
    progress: 60,
    milestones: [
      { id: 'm1', title: 'Giảm 1kg đầu tiên', completed: true, completedAt: getDateStr(20) },
      { id: 'm2', title: 'Tập gym đều đặn 2 tuần', completed: true, completedAt: getDateStr(14) },
      { id: 'm3', title: 'Giảm 3kg', completed: true, completedAt: getDateStr(7) },
      { id: 'm4', title: 'Duy trì chế độ ăn healthy 1 tháng', completed: false },
      { id: 'm5', title: 'Đạt mục tiêu 5kg', completed: false },
    ],
    createdAt: getDateStr(60),
  },
  {
    id: 'goal-2',
    title: 'Học tiếng Anh IELTS 7.0',
    description: 'Chuẩn bị cho kỳ thi IELTS với mục tiêu 7.0',
    area: 'learning',
    targetDate: getDateStr(-120),
    progress: 35,
    milestones: [
      { id: 'm1', title: 'Hoàn thành khóa học cơ bản', completed: true, completedAt: getDateStr(30) },
      { id: 'm2', title: 'Đạt 6.0 trong mock test', completed: true, completedAt: getDateStr(15) },
      { id: 'm3', title: 'Học xong vocabulary 3000 từ', completed: false },
      { id: 'm4', title: 'Luyện speaking với native', completed: false },
      { id: 'm5', title: 'Thi thử đạt 7.0', completed: false },
    ],
    createdAt: getDateStr(90),
  },
  {
    id: 'goal-3',
    title: 'Tiết kiệm 50 triệu',
    description: 'Xây dựng quỹ khẩn cấp',
    area: 'finance',
    progress: 80,
    milestones: [
      { id: 'm1', title: 'Tiết kiệm 10 triệu', completed: true },
      { id: 'm2', title: 'Tiết kiệm 25 triệu', completed: true },
      { id: 'm3', title: 'Tiết kiệm 40 triệu', completed: true },
      { id: 'm4', title: 'Đạt mục tiêu 50 triệu', completed: false },
    ],
    createdAt: getDateStr(180),
  },
  // Generate more goals
  ...Array.from({ length: 47 }, (_, i) => {
    const areas: LifeArea[] = ['health', 'learning', 'career', 'finance', 'relationships', 'fun', 'spirituality', 'environment', 'personal', 'contribution'];
    const area = areas[i % areas.length];
    const goalTitles: Record<LifeArea, string[]> = {
      health: ['Chạy marathon 42km', 'Tập yoga mỗi ngày', 'Ngủ đủ 8 tiếng', 'Ăn chay 1 tháng', 'Bỏ đồ uống có đường'],
      learning: ['Học lập trình Python', 'Đọc 24 cuốn sách', 'Lấy chứng chỉ AWS', 'Học tiếng Nhật N3', 'Hoàn thành khóa MBA'],
      career: ['Thăng chức lên Senior', 'Tăng lương 30%', 'Chuyển công ty mới', 'Xây dựng personal brand', 'Mentoring 3 juniors'],
      finance: ['Đầu tư chứng khoán', 'Mua nhà trả góp', 'Tạo passive income', 'Trả hết nợ', 'Có quỹ hưu trí'],
      relationships: ['Gặp gỡ bạn bè thường xuyên', 'Cải thiện quan hệ gia đình', 'Tìm mentor', 'Mở rộng network', 'Dành thời gian cho người thân'],
      fun: ['Du lịch 5 nước', 'Học chơi guitar', 'Hoàn thành 10 game', 'Đi camping mỗi tháng', 'Tham gia câu lạc bộ'],
      spirituality: ['Thiền định hàng ngày', 'Viết nhật ký biết ơn', 'Đọc sách tâm linh', 'Tham gia khóa tu', 'Thực hành mindfulness'],
      environment: ['Dọn dẹp nhà cửa', 'Tối ưu không gian làm việc', 'Sống tối giản', 'Trồng cây xanh', 'Giảm rác thải nhựa'],
      personal: ['Xây dựng thói quen tốt', 'Phát triển bản thân', 'Tìm mục đích sống', 'Cân bằng cuộc sống', 'Nâng cao EQ'],
      contribution: ['Từ thiện mỗi tháng', 'Mentoring miễn phí', 'Viết blog chia sẻ', 'Tham gia volunteer', 'Đóng góp open source'],
    };
    const titles = goalTitles[area];
    return {
      id: `goal-${i + 4}`,
      title: titles[i % titles.length],
      description: `Mô tả chi tiết cho mục tiêu ${titles[i % titles.length]}`,
      area,
      targetDate: getDateStr(-30 - (i * 10)),
      progress: Math.floor(Math.random() * 100),
      milestones: [
        { id: `m${i}-1`, title: 'Milestone 1', completed: Math.random() > 0.3 },
        { id: `m${i}-2`, title: 'Milestone 2', completed: Math.random() > 0.5 },
        { id: `m${i}-3`, title: 'Milestone 3', completed: Math.random() > 0.7 },
      ],
      createdAt: getDateStr(30 + i * 5),
    };
  }),
];

// Sample Journal Entries - 55 entries for testing
export const sampleJournalEntries: JournalEntry[] = [
  {
    id: 'journal-1',
    date: getDateStr(0),
    content: 'Hôm nay là một ngày khá productive. Hoàn thành được 2 pomodoros cho báo cáo Q4. Buổi sáng thiền 10 phút giúp tập trung tốt hơn.',
    mood: 4,
    energy: 4,
    areas: ['career', 'spirituality'],
    gratitude: ['Cảm ơn sức khỏe tốt', 'Cảm ơn đồng nghiệp hỗ trợ'],
    createdAt: getDateStr(0),
  },
  {
    id: 'journal-2',
    date: getDateStr(1),
    content: 'Hơi mệt vì thức khuya hôm qua. Cần điều chỉnh lại giờ ngủ. Tuy nhiên vẫn duy trì được habit đọc sách.',
    mood: 3,
    energy: 2,
    areas: ['health', 'learning'],
    gratitude: ['Cảm ơn gia đình luôn ủng hộ'],
    createdAt: getDateStr(1),
  },
  {
    id: 'journal-3',
    date: getDateStr(2),
    content: 'Gọi điện cho mẹ, cảm thấy ấm áp. Hoàn thành xong task review CV. Cần focus hơn vào mục tiêu IELTS tuần tới.',
    mood: 5,
    energy: 4,
    areas: ['relationships', 'career'],
    gratitude: ['Cảm ơn mẹ', 'Cảm ơn cơ hội công việc mới'],
    createdAt: getDateStr(2),
  },
  {
    id: 'journal-4',
    date: getDateStr(5),
    content: 'Weekend nghỉ ngơi tốt. Đi chơi với bạn bè, relax sau tuần làm việc căng thẳng.',
    mood: 5,
    energy: 5,
    areas: ['fun', 'relationships'],
    createdAt: getDateStr(5),
  },
  // Generate more journal entries
  ...Array.from({ length: 51 }, (_, i) => {
    const areas: LifeArea[] = ['health', 'learning', 'career', 'finance', 'relationships', 'fun', 'spirituality', 'environment', 'personal', 'contribution'];
    const moods: (1 | 2 | 3 | 4 | 5)[] = [3, 4, 5, 3, 4, 5, 4, 3, 5, 4];
    const energies: (1 | 2 | 3 | 4 | 5)[] = [2, 3, 4, 3, 4, 5, 3, 2, 4, 3];
    const contents = [
      'Hôm nay hoàn thành được nhiều việc hơn dự kiến. Cảm thấy rất hài lòng.',
      'Một ngày bình thường, không có gì đặc biệt nhưng cũng ổn.',
      'Hơi stress vì deadline nhưng đã cố gắng hết sức.',
      'Đã có thời gian nghỉ ngơi và nạp lại năng lượng.',
      'Học được nhiều điều mới từ buổi họp hôm nay.',
      'Dành thời gian cho gia đình, cảm thấy rất ấm áp.',
      'Tập thể dục xong cảm thấy khỏe khoắn hơn nhiều.',
      'Đọc xong một cuốn sách hay, nhiều insight thú vị.',
      'Ngày hôm nay khá thử thách nhưng đã vượt qua.',
      'Cảm thấy biết ơn vì những điều nhỏ bé trong cuộc sống.',
    ];
    return {
      id: `journal-${i + 5}`,
      date: getDateStr(6 + i),
      content: contents[i % contents.length],
      mood: moods[i % moods.length],
      energy: energies[i % energies.length],
      areas: [areas[i % areas.length], areas[(i + 3) % areas.length]] as LifeArea[],
      gratitude: i % 3 === 0 ? ['Cảm ơn cuộc sống', 'Cảm ơn sức khỏe'] : undefined,
      createdAt: getDateStr(6 + i),
    };
  }),
];

// Sample Life Wheel Scores - 10 scores for testing
export const sampleLifeWheelScores: LifeWheelScore[] = Array.from({ length: 10 }, (_, i) => ({
  id: `wheel-${i + 1}`,
  date: getDateStr(i * 7),
  scores: {
    health: Math.floor(Math.random() * 4) + 5,
    relationships: Math.floor(Math.random() * 4) + 5,
    career: Math.floor(Math.random() * 4) + 4,
    finance: Math.floor(Math.random() * 4) + 4,
    personal: Math.floor(Math.random() * 4) + 4,
    fun: Math.floor(Math.random() * 4) + 5,
    environment: Math.floor(Math.random() * 4) + 5,
    spirituality: Math.floor(Math.random() * 4) + 3,
    learning: Math.floor(Math.random() * 4) + 5,
    contribution: Math.floor(Math.random() * 4) + 3,
  },
  createdAt: getDateStr(i * 7),
}));

// Sample Weekly Reviews - 10 reviews for testing
export const sampleWeeklyReviews: WeeklyReview[] = Array.from({ length: 10 }, (_, i) => {
  const ratings: (1 | 2 | 3 | 4 | 5)[] = [3, 4, 4, 5, 3, 4, 5, 4, 3, 4];
  return {
    id: `review-${i + 1}`,
    weekStart: getWeekStart(i),
    wins: [
    `Hoàn thành ${Math.floor(Math.random() * 3) + 3}/6 habits hàng ngày`,
    `Đạt được ${Math.floor(Math.random() * 30) + 70}% mục tiêu tuần`,
    'Duy trì được thói quen tập thể dục',
  ],
  challenges: [
    'Chưa duy trì được giờ ngủ đều đặn',
    'Procrastinate một số task quan trọng',
  ],
  lessonsLearned: [
    'Cần block time cố định cho việc quan trọng',
    'Giảm thời gian scroll mạng xã hội',
  ],
    nextWeekFocus: [
      'Hoàn thành task ưu tiên cao',
      'Duy trì streak habits',
      'Dành thời gian cho gia đình',
    ],
    overallRating: ratings[i % ratings.length],
    createdAt: getWeekStart(i),
  };
});

// Sample Chat Messages
export const sampleChatMessages: ChatMessage[] = [
  {
    id: 'chat-1',
    role: 'user',
    content: 'Làm sao để duy trì habit tốt hơn?',
    createdAt: getDateStr(1),
  },
  {
    id: 'chat-2',
    role: 'assistant',
    content: 'Để duy trì habit hiệu quả, bạn có thể áp dụng các nguyên tắc sau:\n\n1. **Habit Stacking**: Gắn habit mới với habit cũ đã có\n2. **2-Minute Rule**: Bắt đầu với phiên bản 2 phút của habit\n3. **Environment Design**: Thiết kế môi trường thuận lợi\n4. **Track Progress**: Theo dõi streak để tạo động lực\n5. **Reward Yourself**: Tự thưởng khi đạt milestone\n\nBạn đang gặp khó khăn với habit nào cụ thể?',
    createdAt: getDateStr(1),
  },
];

// Sample Notes - 30 notes for testing
export const sampleNotes: Note[] = Array.from({ length: 30 }, (_, i) => {
  const areas: LifeArea[] = ['health', 'learning', 'career', 'finance', 'relationships', 'fun', 'spirituality', 'environment', 'personal', 'contribution'];
  const titles = [
    'Ý tưởng dự án mới', 'Công thức nấu ăn healthy', 'Sách hay cần đọc', 'Kế hoạch du lịch',
    'Meeting notes', 'Brainstorm ideas', 'Daily reflection', 'Learning notes',
    'Finance tracker', 'Workout plan', 'Recipe collection', 'Book summary',
    'Project roadmap', 'Personal goals', 'Weekly planning', 'Monthly review',
  ];
  return {
    id: `note-${i + 1}`,
    title: titles[i % titles.length] + ` #${i + 1}`,
    content: `Nội dung chi tiết cho ghi chú ${titles[i % titles.length]}. Đây là một ghi chú mẫu để test hiệu năng của ứng dụng.\n\n## Phần 1\nMột số nội dung quan trọng cần ghi nhớ.\n\n## Phần 2\nCác action items cần thực hiện.`,
    area: areas[i % areas.length],
    isPinned: i < 3,
    isFavorite: i % 5 === 0,
    createdAt: getDateStr(i * 2),
    updatedAt: getDateStr(i),
  };
});

// Sample Daily Intentions - 30 intentions for testing
export const sampleDailyIntentions: DailyIntention[] = Array.from({ length: 30 }, (_, i) => ({
  id: `intention-${i + 1}`,
  date: getDateStr(i),
  intention: [
    'Hoàn thành task quan trọng nhất trong ngày',
    'Tập trung 100% vào công việc, không bị distract',
    'Dành thời gian cho sức khỏe và gia đình',
    'Học một điều mới và ghi chép lại',
    'Thực hành mindfulness và biết ơn',
    'Hoàn thành deadline trước 5PM',
    'Gọi điện cho người thân',
    'Đọc sách ít nhất 30 phút',
    'Tập thể dục buổi sáng',
    'Review và lên kế hoạch cho ngày mai',
  ][i % 10],
  completed: i > 0,
  reflection: i > 0 ? 'Đã hoàn thành tốt intention của ngày.' : undefined,
  createdAt: getDateStr(i),
}));
