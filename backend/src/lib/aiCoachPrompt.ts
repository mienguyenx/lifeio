// Builds the AI Life Coach system prompt from the user context the frontend
// sends. Ported from the legacy `ai-coach` Supabase Edge Function so the coaching
// behaviour stays identical.

interface NamedItem {
  name?: string;
  title?: string;
  description?: string;
  type?: string;
  area?: string;
  progress?: number;
}

interface WeeklyReview {
  wins?: string[];
  challenges?: string[];
  lessonsLearned?: string[];
  nextWeekFocus?: string[];
  overallRating?: number;
}

interface DailyStats {
  habitsCompleted?: number;
  habitsTotal?: number;
  tasksCompleted?: number;
  tasksPending?: number;
  overdueTasks?: number;
  activeGoals?: number;
  avgGoalProgress?: number;
  energy?: number;
  mood?: number;
}

export interface CoachUserContext {
  currentModule?: string;
  moduleContextPrompt?: string;
  lifeWheelScores?: Record<string, number>;
  weeklyReview?: WeeklyReview;
  dailyStats?: DailyStats;
  lifePurpose?: string;
  visions?: NamedItem[];
  personalValues?: NamedItem[];
  lifeRoles?: NamedItem[];
  traits?: NamedItem[];
  goals?: NamedItem[];
}

const BASE_PROMPT = `Bạn là một AI Life Coach thông minh, thân thiện và hữu ích. Bạn giúp người dùng với việc xây dựng thói quen, đặt mục tiêu, quản lý thời gian và phát triển bản thân. Trả lời bằng tiếng Việt, ngắn gọn và thiết thực.

QUAN TRỌNG: Luôn đưa ra gợi ý CỤ THỂ và CÓ THỂ HÀNH ĐỘNG NGAY. Mỗi gợi ý nên bao gồm:
- Hành động cụ thể
- Thời gian thực hiện (nếu có)
- Lợi ích của hành động đó`;

export function buildCoachSystemPrompt(userContext?: CoachUserContext): string {
  let systemPrompt = BASE_PROMPT;
  if (!userContext) return systemPrompt;

  if (userContext.currentModule && userContext.moduleContextPrompt) {
    systemPrompt += `\n\n🎯 NGỮ CẢNH HIỆN TẠI: ${userContext.moduleContextPrompt}
Hãy tập trung câu trả lời vào module ${userContext.currentModule} mà người dùng đang sử dụng.`;
  }

  systemPrompt += `\n\n--- THÔNG TIN CÁ NHÂN CỦA NGƯỜI DÙNG ---`;

  if (userContext.lifeWheelScores && Object.keys(userContext.lifeWheelScores).length > 0) {
    const scores = userContext.lifeWheelScores;
    const entries = Object.entries(scores);
    const avgScore = entries.reduce((a, [, b]) => a + Number(b), 0) / entries.length;
    const sortedAreas = [...entries].sort((a, b) => Number(a[1]) - Number(b[1]));
    const lowestAreas = sortedAreas.slice(0, 3);
    const highestAreas = sortedAreas.slice(-3).reverse();

    systemPrompt += `\n\n🎯 ĐIỂM LIFE WHEEL (Bánh Xe Cuộc Đời):`;
    systemPrompt += `\nĐiểm trung bình: ${avgScore.toFixed(1)}/10`;
    systemPrompt += `\n\nCác mảng CẦN CẢI THIỆN (điểm thấp nhất):`;
    lowestAreas.forEach(([area, score]) => {
      systemPrompt += `\n- ${area}: ${score}/10`;
    });
    systemPrompt += `\n\nCác mảng ĐANG TỐT (điểm cao nhất):`;
    highestAreas.forEach(([area, score]) => {
      systemPrompt += `\n- ${area}: ${score}/10`;
    });
  }

  if (userContext.weeklyReview) {
    const review = userContext.weeklyReview;
    systemPrompt += `\n\n📊 WEEKLY REVIEW GẦN NHẤT:`;
    if (review.wins?.length) systemPrompt += `\nThắng lợi: ${review.wins.join(', ')}`;
    if (review.challenges?.length) systemPrompt += `\nThách thức: ${review.challenges.join(', ')}`;
    if (review.lessonsLearned?.length) systemPrompt += `\nBài học: ${review.lessonsLearned.join(', ')}`;
    if (review.nextWeekFocus?.length) systemPrompt += `\nTrọng tâm tuần tới: ${review.nextWeekFocus.join(', ')}`;
    if (review.overallRating) systemPrompt += `\nĐánh giá tổng: ${review.overallRating}/5`;
  }

  if (userContext.dailyStats) {
    const stats = userContext.dailyStats;
    systemPrompt += `\n\n📈 THỐNG KÊ HÔM NAY:`;
    systemPrompt += `\n- Thói quen: ${stats.habitsCompleted}/${stats.habitsTotal} hoàn thành`;
    systemPrompt += `\n- Tasks: ${stats.tasksCompleted} hoàn thành, ${stats.tasksPending} đang chờ`;
    if (stats.overdueTasks && stats.overdueTasks > 0) systemPrompt += ` (⚠️ ${stats.overdueTasks} quá hạn)`;
    systemPrompt += `\n- Goals: ${stats.activeGoals} đang thực hiện (${stats.avgGoalProgress}% tiến độ TB)`;
    systemPrompt += `\n- Năng lượng: ${stats.energy}/5, Tâm trạng: ${stats.mood}/5`;
  }

  if (userContext.lifePurpose) systemPrompt += `\n\n🎯 Mục đích sống: ${userContext.lifePurpose}`;

  if (userContext.visions?.length) {
    systemPrompt += `\n\n🔮 Tầm nhìn cuộc sống:\n${userContext.visions
      .map((v) => `- ${v.title}: ${v.description}`)
      .join('\n')}`;
  }
  if (userContext.personalValues?.length) {
    systemPrompt += `\n\n💎 Giá trị cốt lõi:\n${userContext.personalValues
      .map((v) => `- ${v.name}: ${v.description}`)
      .join('\n')}`;
  }
  if (userContext.lifeRoles?.length) {
    systemPrompt += `\n\n👤 Vai trò trong cuộc sống:\n${userContext.lifeRoles
      .map((r) => `- ${r.name}: ${r.description}`)
      .join('\n')}`;
  }
  if (userContext.traits?.length) {
    systemPrompt += `\n\n✨ Đặc điểm cá nhân:\n${userContext.traits
      .map((t) => `- ${t.name} (${t.type}): ${t.description}`)
      .join('\n')}`;
  }
  if (userContext.goals?.length) {
    systemPrompt += `\n\n🎯 Mục tiêu hiện tại:\n${userContext.goals
      .map((g) => `- ${g.title} (${g.progress}%) - ${g.area}`)
      .join('\n')}`;
  }

  systemPrompt += `\n\n--- HƯỚNG DẪN TƯ VẤN ---
Dựa trên dữ liệu trên, hãy:
1. ƯU TIÊN các mảng cuộc sống có điểm THẤP NHẤT
2. Đề xuất hành động cụ thể để cải thiện các mảng yếu
3. Tận dụng các mảng mạnh để hỗ trợ các mảng yếu
4. Liên kết với mục tiêu và giá trị cốt lõi của người dùng
5. Nếu có tasks quá hạn, nhắc nhở ưu tiên xử lý`;

  return systemPrompt;
}
