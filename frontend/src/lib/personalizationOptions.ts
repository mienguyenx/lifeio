import type { AITone, PlanningStyle, UserArchetype } from '@/types/lifeos';

export const AI_TONES: { value: AITone; label: string; desc: string }[] = [
  { value: 'gentle', label: 'Nhẹ nhàng', desc: 'Động viên, khuyến khích' },
  { value: 'direct', label: 'Thẳng thắn', desc: 'Nói thẳng, không vòng vo' },
  { value: 'strategic', label: 'Chiến lược', desc: 'Phân tích logic, kế hoạch' },
  { value: 'concise', label: 'Ngắn gọn', desc: 'Ít chữ, đi vào trọng tâm' },
  { value: 'detailed', label: 'Chi tiết', desc: 'Giải thích kỹ, nhiều ví dụ' },
];

export const PLANNING_STYLES: { value: PlanningStyle; label: string; desc: string }[] = [
  { value: 'deep_work', label: 'Deep Work', desc: 'Tập trung sâu, ít task' },
  { value: 'sprint', label: 'Sprint', desc: 'Pomodoro, làm nhanh nghỉ ngắn' },
  { value: 'checklist', label: 'Checklist', desc: 'Danh sách to-do rõ ràng' },
  { value: 'calendar', label: 'Calendar', desc: 'Time-blocking theo giờ' },
  { value: 'flexible', label: 'Linh hoạt', desc: 'Tùy ngày, không cứng nhắc' },
];

export const ARCHETYPES: { value: UserArchetype; label: string; desc: string; emoji: string }[] = [
  { value: 'beginner', label: 'Người mới', desc: 'Mới bắt đầu tổ chức cuộc sống', emoji: '🌱' },
  { value: 'busy_professional', label: 'Dân công sở', desc: 'Nhiều việc, cần tối ưu thời gian', emoji: '💼' },
  { value: 'builder', label: 'Người xây dựng', desc: 'Có mục tiêu lớn, cần hệ thống', emoji: '🏗️' },
  { value: 'student', label: 'Sinh viên', desc: 'Học tập & phát triển bản thân', emoji: '📚' },
  { value: 'health_focused', label: 'Sức khỏe', desc: 'Ưu tiên sức khỏe & thể chất', emoji: '💪' },
  { value: 'recovery', label: 'Phục hồi', desc: 'Đang lấy lại nhịp sống', emoji: '🌿' },
  { value: 'reflective', label: 'Chiêm nghiệm', desc: 'Journal, review, tự vấn', emoji: '🔮' },
];

