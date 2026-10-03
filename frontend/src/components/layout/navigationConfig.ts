/**
 * Module 18 — Cấu hình điều hướng dùng chung cho Sidebar (desktop), Menu toàn màn hình (mobile),
 * Bảng lệnh (Ctrl+K) và Thêm nhanh. Chỉ chứa các route/hành động đã có trong ứng dụng.
 */
import type { LifeIconName } from '@/components/icons/LifeIcon';
import type { Tint } from '@/components/lio';

export type BadgeKey = 'habits' | 'tasks' | 'goals' | null;
export interface NavItem { path: string; label: string; icon: LifeIconName; badgeKey?: BadgeKey; keywords?: string }
export interface NavGroup { id: string; label: string; desc: string; collapsible?: boolean; items: NavItem[] }

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'daily', label: 'Hàng ngày', desc: 'Hôm nay, Công việc, Lịch, Thói quen',
    items: [
      { path: '/', label: 'Hôm nay', icon: 'module/today', keywords: 'home today' },
      { path: '/tasks', label: 'Công việc', icon: 'module/tasks', badgeKey: 'tasks', keywords: 'tasks todo' },
      { path: '/calendar', label: 'Lịch', icon: 'module/calendar', keywords: 'calendar' },
      { path: '/habits', label: 'Thói quen', icon: 'module/habits', badgeKey: 'habits', keywords: 'habits' },
    ],
  },
  {
    id: 'growth', label: 'Phát triển bản thân', desc: 'Mục tiêu, Nhật ký, AI Coach, Tổng quan',
    items: [
      { path: '/goals', label: 'Mục tiêu', icon: 'module/goals', badgeKey: 'goals', keywords: 'goals okr' },
      { path: '/journal', label: 'Nhật ký', icon: 'module/journal', keywords: 'journal' },
      { path: '/ai-chat', label: 'AI Coach', icon: 'module/ai-coach', keywords: 'ai coach chat' },
      { path: '/dashboard', label: 'Tổng quan', icon: 'module/insights', keywords: 'insights dashboard' },
      { path: '/journey', label: 'Hành trình', icon: 'module/reviews', keywords: 'journey achievements' },
    ],
  },
  {
    id: 'areas', label: 'Lĩnh vực cuộc sống', desc: 'Sức khỏe, Tài chính, Học tập, Quan hệ',
    items: [
      { path: '/life-wheel', label: 'Bánh xe', icon: 'module/life-areas', keywords: 'life wheel' },
      { path: '/area-dashboard', label: '10 lĩnh vực', icon: 'module/life-areas', keywords: 'areas' },
      { path: '/health', label: 'Sức khỏe', icon: 'module/health', keywords: 'health' },
      { path: '/finance', label: 'Tài chính', icon: 'module/finance', keywords: 'finance money' },
      { path: '/learning', label: 'Học tập', icon: 'module/learning', keywords: 'learning' },
      { path: '/relationships', label: 'Quan hệ', icon: 'module/relationships', keywords: 'relationships' },
    ],
  },
  {
    id: 'reviews', label: 'Review & Kế hoạch', desc: 'Review tuần, tháng, năm, Kế hoạch năm',
    items: [
      { path: '/weekly-review', label: 'Review tuần', icon: 'module/reviews', keywords: 'weekly review' },
      { path: '/monthly-review', label: 'Review tháng', icon: 'module/reviews', keywords: 'monthly review' },
      { path: '/yearly-planning', label: 'Kế hoạch năm', icon: 'module/goals', keywords: 'yearly planning' },
      { path: '/yearly-review', label: 'Review năm', icon: 'module/reviews', keywords: 'yearly review' },
    ],
  },
  {
    id: 'more', label: 'Thêm', desc: 'Ghi chú, Quyết định, Bộ nhớ AI, Cá nhân hóa', collapsible: true,
    items: [
      { path: '/notes', label: 'Ghi chú', icon: 'module/notes', keywords: 'notes' },
      { path: '/decisions', label: 'Nhật ký quyết định', icon: 'module/journal', keywords: 'decisions' },
      { path: '/ai-memory', label: 'Bộ nhớ AI', icon: 'module/ai-coach', keywords: 'ai memory' },
      { path: '/personalization', label: 'Cá nhân hóa', icon: 'module/settings', keywords: 'personalization' },
      { path: '/activity', label: 'Lịch sử hoạt động', icon: 'module/archive', keywords: 'activity log history lich su hoat dong' },
      { path: '/trash', label: 'Thùng rác', icon: 'module/trash', keywords: 'trash' },
    ],
  },
];

export const ACCOUNT_ITEMS: NavItem[] = [
  { path: '/me', label: 'Tài khoản', icon: 'module/profile', keywords: 'profile me ho so tai khoan account' },
  { path: '/modules', label: 'Tính năng', icon: 'module/settings', keywords: 'modules features tinh nang bat tat' },
  { path: '/notifications', label: 'Thông báo', icon: 'module/notifications', keywords: 'notifications thong bao push nhac nho' },
  { path: '/settings', label: 'Cài đặt', icon: 'module/settings', keywords: 'settings' },
];

export const ALL_NAV_ITEMS: NavItem[] = [...NAV_GROUPS.flatMap((g) => g.items), ...ACCOUNT_ITEMS];

/** Thêm nhanh — mỗi mục mở form tạo mới sẵn có của trang qua tham số `?add`. */
export interface QuickAction { id: string; label: string; icon: LifeIconName; tint: Tint; path?: string; pomodoro?: boolean }
export const QUICK_ACTIONS: QuickAction[] = [
  { id: 'task', label: 'Nhiệm vụ', icon: 'module/tasks', tint: 'violet', path: '/tasks?add' },
  { id: 'habit', label: 'Thói quen', icon: 'module/habits', tint: 'mint', path: '/habits?add' },
  { id: 'note', label: 'Ghi chú', icon: 'module/notes', tint: 'amber', path: '/notes?add' },
  { id: 'event', label: 'Sự kiện', icon: 'module/calendar', tint: 'sky', path: '/calendar?add' },
  { id: 'goal', label: 'Mục tiêu', icon: 'module/goals', tint: 'rose', path: '/goals?add' },
  { id: 'journal', label: 'Nhật ký', icon: 'module/journal', tint: 'violet', path: '/journal?add' },
  { id: 'finance', label: 'Giao dịch', icon: 'module/finance', tint: 'mint', path: '/finance?add' },
  { id: 'health', label: 'Sức khỏe', icon: 'module/health', tint: 'orange', path: '/health?add' },
  { id: 'pomodoro', label: 'Pomodoro', icon: 'module/focus', tint: 'rose', pomodoro: true },
];

export const isActivePath = (pathname: string, path: string) => (path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(`${path}/`));
