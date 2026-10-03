/**
 * Tính năng (module) có thể bật/tắt theo nhu cầu người dùng. Lõi (Hôm nay, Công việc,
 * Thói quen, AI Coach, tài khoản) luôn bật. `enabledModules` undefined = bật tất cả
 * (người dùng cũ trước khi có onboarding AI).
 */
import type { LifeIconName } from '@/components/icons/LifeIcon';
import type { Tint } from '@/components/lio';

export type ModuleId =
  | 'calendar' | 'goals' | 'journal' | 'notes' | 'health' | 'finance' | 'learning'
  | 'relationships' | 'reviews' | 'life_areas' | 'insights' | 'decisions' | 'focus';

export interface ModuleDef { id: ModuleId; label: string; desc: string; icon: LifeIconName; tint: Tint; paths: string[]; quick?: string[] }

export const MODULES: ModuleDef[] = [
  { id: 'calendar', label: 'Lịch', desc: 'Sự kiện, lịch hẹn, xem tuần', icon: 'module/calendar', tint: 'sky', paths: ['/calendar'], quick: ['event'] },
  { id: 'goals', label: 'Mục tiêu', desc: 'Mục tiêu dài hạn & tiến độ', icon: 'module/goals', tint: 'rose', paths: ['/goals', '/yearly-planning'], quick: ['goal'] },
  { id: 'journal', label: 'Nhật ký', desc: 'Cảm xúc, biết ơn, suy ngẫm', icon: 'module/journal', tint: 'violet', paths: ['/journal'], quick: ['journal'] },
  { id: 'notes', label: 'Ghi chú', desc: 'Ý tưởng, ghi chú nhanh, ghi âm', icon: 'module/notes', tint: 'amber', paths: ['/notes'], quick: ['note'] },
  { id: 'health', label: 'Sức khỏe', desc: 'Ngủ, nước, cân nặng, vận động', icon: 'module/health', tint: 'orange', paths: ['/health'], quick: ['health'] },
  { id: 'finance', label: 'Tài chính', desc: 'Thu chi, ngân sách, tiết kiệm', icon: 'module/finance', tint: 'mint', paths: ['/finance'], quick: ['finance'] },
  { id: 'learning', label: 'Học tập', desc: 'Khoá học, sách, kỹ năng', icon: 'module/learning', tint: 'sky', paths: ['/learning'] },
  { id: 'relationships', label: 'Quan hệ', desc: 'Gia đình, bạn bè, nhắc liên lạc', icon: 'module/relationships', tint: 'rose', paths: ['/relationships'] },
  { id: 'reviews', label: 'Review', desc: 'Tổng kết tuần, tháng, năm', icon: 'module/reviews', tint: 'violet', paths: ['/weekly-review', '/monthly-review', '/yearly-review'] },
  { id: 'life_areas', label: 'Bánh xe cuộc sống', desc: 'Cân bằng 10 lĩnh vực', icon: 'module/life-areas', tint: 'mint', paths: ['/life-wheel', '/area-dashboard'] },
  { id: 'insights', label: 'Tổng quan', desc: 'Thống kê, hành trình, thành tích', icon: 'module/insights', tint: 'amber', paths: ['/dashboard', '/journey'] },
  { id: 'decisions', label: 'Quyết định', desc: 'Cân nhắc các lựa chọn lớn', icon: 'module/journal', tint: 'orange', paths: ['/decisions'] },
  { id: 'focus', label: 'Pomodoro', desc: 'Hẹn giờ tập trung', icon: 'module/focus', tint: 'rose', paths: [], quick: ['pomodoro'] },
];

export const MODULE_IDS = MODULES.map((m) => m.id);
const byPath = new Map(MODULES.flatMap((m) => m.paths.map((p) => [p, m.id] as const)));
const byQuick = new Map(MODULES.flatMap((m) => (m.quick ?? []).map((q) => [q, m.id] as const)));

export const moduleOfPath = (path: string): ModuleId | undefined => byPath.get(path.split('?')[0]);
export const isModuleOn = (enabled: string[] | undefined, id?: ModuleId) => !id || !enabled || enabled.includes(id);
export const isPathOn = (enabled: string[] | undefined, path: string) => isModuleOn(enabled, moduleOfPath(path));
export const isQuickOn = (enabled: string[] | undefined, quickId: string) => isModuleOn(enabled, byQuick.get(quickId));
