/** Gợi ý không gian cá nhân cho người dùng mới: gọi AI, lỗi thì dùng gợi ý theo từ khoá. */
import { apiFetch } from '@/integrations/api/httpClient';
import type { LifeArea } from '@/types/lifeos';
import type { ModuleId } from '@/lib/modules';

export type When = 'today' | 'tomorrow' | 'week' | 'none';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'anytime';
export interface PlanTask { title: string; when: When; priority: 'high' | 'medium' | 'low'; area: LifeArea }
export interface PlanHabit { name: string; icon: string; area: LifeArea; timeOfDay: TimeOfDay; target: number; unit: string }
export interface OnboardingPlan { summary: string; focus: string; modules: { id: ModuleId; reason: string }[]; tasks: PlanTask[]; habits: PlanHabit[]; offline?: boolean }

export interface Analysis {
  summary: string;
  painPoints: { icon: string; title: string; detail: string }[];
  goals: string[];
  approach: string[];
  questions: { id: string; question: string; options: string[] }[];
  offline?: boolean;
}
export type Answers = Record<string, string>;

export async function fetchAnalysis(text: string): Promise<Analysis> {
  try {
    const a = await apiFetch<Analysis>('/functions/ai-onboarding-analyze', { method: 'POST', body: { text } });
    if (a && (a.painPoints?.length || a.summary)) return a;
  } catch (e) {
    console.warn('[onboarding] AI analyze failed, using fallback', e);
  }
  return fallbackAnalysis(text);
}

export async function fetchOnboardingPlan(text: string, analysis?: Analysis | null, answers: Answers = {}): Promise<OnboardingPlan> {
  const qa = (analysis?.questions ?? []).filter((q) => answers[q.id]).map((q) => ({ question: q.question, answer: answers[q.id] }));
  const summary = analysis ? [analysis.summary, ...analysis.goals.map((g) => `Mục tiêu: ${g}`)].filter(Boolean).join(' ') : undefined;
  try {
    const p = await apiFetch<OnboardingPlan>('/functions/ai-onboarding-plan', { method: 'POST', body: { text, analysis: summary, answers: qa } });
    if (p && (p.tasks?.length || p.habits?.length || p.modules?.length)) return p;
  } catch (e) {
    console.warn('[onboarding] AI plan failed, using fallback', e);
  }
  return fallbackPlan(text);
}

type Rule = { re: RegExp; module?: ModuleId; reason: string; pain?: [string, string, string]; tasks: PlanTask[]; habits: PlanHabit[]; focus: string };
const T = (title: string, area: LifeArea, when: When = 'today', priority: PlanTask['priority'] = 'medium'): PlanTask => ({ title, area, when, priority });
const H = (name: string, icon: string, area: LifeArea, timeOfDay: TimeOfDay, target = 1, unit = 'lần'): PlanHabit => ({ name, icon, area, timeOfDay, target, unit });

const RULES: Rule[] = [
  { re: /chi tiêu|tiền|tiết kiệm|lương|nợ|ngân sách|tài chính/i, pain: ['💸', 'Tiền ra mà không rõ đi đâu', 'Chưa ghi chép nên khó biết khoản nào nên cắt'], module: 'finance', reason: 'Theo dõi thu chi & tiết kiệm', focus: 'Kiểm soát chi tiêu',
    tasks: [T('Ghi lại các khoản đã chi hôm nay', 'finance', 'today', 'high'), T('Đặt ngân sách chi tiêu cho tháng này', 'finance', 'week')], habits: [H('Ghi chi tiêu mỗi tối', '💰', 'finance', 'evening')] },
  { re: /ngủ|thể dục|tập|gym|chạy|nước|cân nặng|sức khỏe|sức khoẻ|ăn uống|giảm cân/i, pain: ['😴', 'Sức khoẻ chưa có nhịp đều', 'Ngủ, ăn, vận động thất thường làm cơ thể mệt'], module: 'health', reason: 'Theo dõi giấc ngủ, nước, vận động', focus: 'Khoẻ hơn mỗi ngày',
    tasks: [T('Chọn giờ đi ngủ cố định', 'health', 'today'), T('Lên lịch 3 buổi vận động tuần này', 'health', 'week')], habits: [H('Uống nước', '💧', 'health', 'anytime', 8, 'cốc'), H('Đi bộ 15 phút', '🚶', 'health', 'afternoon')] },
  { re: /học|ielts|toeic|thi|đọc sách|khoá|khóa|kỹ năng|ngoại ngữ|tiếng anh/i, pain: ['📚', 'Học chưa đều đặn', 'Thiếu lịch cố định nên dễ bỏ dở giữa chừng'], module: 'learning', reason: 'Quản lý việc học & tiến độ', focus: 'Học đều mỗi ngày',
    tasks: [T('Lên lịch học cho tuần này', 'learning', 'today', 'high'), T('Chọn tài liệu học chính', 'learning', 'tomorrow')], habits: [H('Học 20 phút', '📚', 'learning', 'evening', 20, 'phút')] },
  { re: /công việc|quên|deadline|dự án|sếp|họp|lịch|sắp xếp|bận/i, pain: ['🧠', 'Quá nhiều việc trong đầu', 'Việc không được ghi ra nên dễ quên và bị dồn'], module: 'calendar', reason: 'Xem việc & lịch hẹn theo ngày', focus: 'Không bỏ sót việc quan trọng',
    tasks: [T('Ghi ra 3 việc quan trọng nhất hôm nay', 'career', 'today', 'high'), T('Đặt nhắc cho deadline gần nhất', 'career', 'today')], habits: [H('Lên kế hoạch 5 phút', '📝', 'career', 'morning')] },
  { re: /căng thẳng|stress|cảm xúc|buồn|lo âu|biết ơn|bình yên|nhật ký|tinh thần/i, pain: ['🌧️', 'Tâm trí đang nặng', 'Cảm xúc chưa được gọi tên nên cứ quẩn quanh'], module: 'journal', reason: 'Viết ra cảm xúc, nhẹ đầu hơn', focus: 'Tâm trí nhẹ nhàng',
    tasks: [T('Viết vài dòng về hôm nay', 'personal', 'today')], habits: [H('Viết 3 điều biết ơn', '🙏', 'personal', 'evening')] },
  { re: /mục tiêu|kế hoạch năm|ước mơ|thay đổi|phát triển/i, pain: ['🧭', 'Muốn thay đổi nhưng chưa rõ đích', 'Mục tiêu mơ hồ khó biến thành hành động hằng ngày'], module: 'goals', reason: 'Đặt mục tiêu & theo dõi tiến độ', focus: 'Tiến gần mục tiêu',
    tasks: [T('Viết ra 1 mục tiêu cho 3 tháng tới', 'personal', 'today', 'high')], habits: [] },
  { re: /gia đình|bạn bè|người yêu|vợ|chồng|con cái|bố mẹ|ba mẹ/i, pain: ['💞', 'Ít thời gian cho người thân', 'Bận rộn khiến các mối quan hệ dễ bị lãng quên'], module: 'relationships', reason: 'Nhắc quan tâm người thân', focus: 'Gắn kết người thân',
    tasks: [T('Gọi điện hỏi thăm người thân', 'relationships', 'week')], habits: [] },
  { re: /ý tưởng|ghi chú|ghi nhớ|note/i, module: 'notes', reason: 'Ghi nhanh ý tưởng, không quên', focus: 'Không quên ý tưởng',
    tasks: [], habits: [] },
  { re: /tập trung|xao nhãng|trì hoãn|lười|năng suất/i, pain: ['📱', 'Khó tập trung, hay trì hoãn', 'Xao nhãng liên tục làm việc quan trọng bị đẩy lùi'], module: 'focus', reason: 'Hẹn giờ 25 phút để tập trung', focus: 'Tập trung sâu',
    tasks: [T('Làm 1 phiên tập trung 25 phút', 'career', 'today', 'high')], habits: [H('1 phiên Pomodoro', '🍅', 'career', 'morning')] },
];

export function fallbackPlan(text: string): OnboardingPlan {
  const hit = RULES.filter((r) => r.re.test(text));
  const rules = hit.length ? hit : RULES.filter((r) => r.module === 'calendar' || r.module === 'notes');
  const uniq = <X,>(arr: X[], key: (x: X) => string) => arr.filter((x, i) => arr.findIndex((y) => key(y) === key(x)) === i);
  return {
    summary: hit.length ? 'LIO gợi ý một không gian gọn, đúng điều bạn cần.' : 'Bắt đầu nhẹ nhàng với việc và thói quen hằng ngày.',
    focus: rules[0].focus,
    modules: uniq(rules.filter((r) => r.module).map((r) => ({ id: r.module!, reason: r.reason })), (m) => m.id).slice(0, 4),
    tasks: uniq(rules.flatMap((r) => r.tasks), (t) => t.title).slice(0, 5),
    habits: uniq(rules.flatMap((r) => r.habits), (h) => h.name).slice(0, 3),
    offline: true,
  };
}

export function fallbackAnalysis(text: string): Analysis {
  const hit = RULES.filter((r) => r.re.test(text));
  const rules = hit.length ? hit : RULES.filter((r) => r.module === 'calendar');
  return {
    summary: hit.length ? 'Mình nghe thấy bạn đang muốn sắp xếp lại vài mảng quan trọng. Cùng bắt đầu từ những bước nhỏ nhé.' : 'Mình hiểu bạn muốn cuộc sống gọn gàng và chủ động hơn. Cùng bắt đầu từ việc nhỏ mỗi ngày nhé.',
    painPoints: rules.filter((r) => r.pain).slice(0, 3).map((r) => ({ icon: r.pain![0], title: r.pain![1], detail: r.pain![2] })),
    goals: [...new Set(rules.map((r) => r.focus))].slice(0, 3),
    approach: ['Ghi ra những việc cần làm ngay hôm nay', 'Tạo 1–2 thói quen nhỏ, dễ giữ mỗi ngày', 'Nhìn lại cuối tuần để điều chỉnh cho vừa sức'],
    questions: [
      { id: 'time', question: 'Bạn thường rảnh nhất lúc nào?', options: ['Sáng sớm', 'Giờ nghỉ trưa', 'Buổi tối', 'Cuối tuần'] },
      { id: 'pace', question: 'Bạn muốn bắt đầu thế nào?', options: ['Thật nhẹ nhàng', 'Vừa sức', 'Thử thách bản thân'] },
    ],
    offline: true,
  };
}
