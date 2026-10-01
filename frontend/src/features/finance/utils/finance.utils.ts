import { addMonths, endOfMonth, format, getDate, parseISO, startOfMonth } from 'date-fns';
import type { FinanceTransaction } from '@/hooks/sync/useFinanceSync';
import type { Tint } from '@/components/lio';

export type TxType = FinanceTransaction['type'];
export interface Category { id: string; name: string; icon: string; color: string }

/** Giữ nguyên danh mục, màu và icon của trang cũ. */
export const EXPENSE_CATEGORIES: Category[] = [
  { id: 'food', name: 'Ăn uống', icon: '🍜', color: '#FF6B6B' },
  { id: 'transport', name: 'Di chuyển', icon: '🚗', color: '#4ECDC4' },
  { id: 'entertainment', name: 'Giải trí', icon: '🎮', color: '#45B7D1' },
  { id: 'shopping', name: 'Mua sắm', icon: '🛍️', color: '#96CEB4' },
  { id: 'bills', name: 'Hóa đơn', icon: '📄', color: '#FFEAA7' },
  { id: 'health', name: 'Sức khỏe', icon: '💊', color: '#DDA0DD' },
  { id: 'education', name: 'Học tập', icon: '📚', color: '#98D8C8' },
  { id: 'other', name: 'Khác', icon: '📦', color: '#B8B8B8' },
];
export const INCOME_CATEGORIES: Category[] = [
  { id: 'salary', name: 'Lương', icon: '💰', color: '#2ECC71' },
  { id: 'bonus', name: 'Thưởng', icon: '🎁', color: '#27AE60' },
  { id: 'investment', name: 'Đầu tư', icon: '📈', color: '#1ABC9C' },
  { id: 'freelance', name: 'Freelance', icon: '💻', color: '#16A085' },
  { id: 'other', name: 'Khác', icon: '📦', color: '#95A5A6' },
];
export const categoriesOf = (t: TxType) => (t === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES);
export const categoryOf = (t: TxType, id: string) => categoriesOf(t).find((c) => c.id === id) ?? categoriesOf(t)[categoriesOf(t).length - 1];

export const FINANCE_TIPS = [
  { icon: '💰', text: 'Tiết kiệm ít nhất 20% thu nhập mỗi tháng' },
  { icon: '📊', text: 'Theo dõi chi tiêu hàng ngày để kiểm soát ngân sách' },
  { icon: '🎯', text: 'Đặt mục tiêu tài chính cụ thể và thời hạn rõ ràng' },
  { icon: '💳', text: 'Hạn chế sử dụng thẻ tín dụng nếu chưa cần thiết' },
  { icon: '📈', text: 'Tìm hiểu về đầu tư để tiền sinh lời' },
];
export const QUICK_EXPENSE_PRESETS = [
  { label: 'Ăn sáng 50K', description: 'Ăn sáng', category: 'food', amount: 50000 },
  { label: 'Ăn trưa 80K', description: 'Ăn trưa', category: 'food', amount: 80000 },
  { label: 'Grab 30K', description: 'Grab 30K', category: 'transport', amount: 30000 },
  { label: 'Cafe 45K', description: 'Cafe 45K', category: 'food', amount: 45000 },
];
export const SAVING_TARGET = 20;

export const formatVND = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);
/** Rút gọn: 12,5tr · 450K. */
export const compactVND = (n: number) => {
  const a = Math.abs(n), s = n < 0 ? '-' : '';
  if (a >= 1e9) return `${s}${+(a / 1e9).toFixed(1)}tỷ`;
  if (a >= 1e6) return `${s}${+(a / 1e6).toFixed(1)}tr`.replace('.', ',');
  if (a >= 1e3) return `${s}${Math.round(a / 1e3)}K`;
  return `${s}${a}`;
};

export const monthKey = (d: Date) => format(d, 'yyyy-MM');
export const inMonth = (txs: FinanceTransaction[], m: string) => txs.filter((t) => t.date.startsWith(m));

export function monthStats(txs: FinanceTransaction[], m: string) {
  const list = inMonth(txs, m);
  const income = list.filter((t) => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const expense = list.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  const balance = income - expense;
  return { income, expense, balance, saving: income > 0 ? Math.round((balance / income) * 100) : null, count: list.length };
}
export const pctDelta = (cur: number, prev: number) => (prev ? Math.round(((cur - prev) / prev) * 100) : null);

/** Dòng tiền theo tuần trong tháng (Tuần 1: ngày 1–7, …). */
export function weeklyCashflow(txs: FinanceTransaction[], m: string) {
  const start = parseISO(`${m}-01`);
  const weeks = Math.ceil(getDate(endOfMonth(start)) / 7);
  const rows = Array.from({ length: weeks }, (_, i) => ({ label: `Tuần ${i + 1}`, income: 0, expense: 0 }));
  inMonth(txs, m).forEach((t) => { const w = Math.min(weeks - 1, Math.floor((getDate(parseISO(t.date)) - 1) / 7)); rows[w][t.type] += t.amount; });
  return rows;
}

export function categoryBreakdown(txs: FinanceTransaction[], m: string, type: TxType = 'expense') {
  const list = inMonth(txs, m).filter((t) => t.type === type);
  const total = list.reduce((a, t) => a + t.amount, 0);
  return categoriesOf(type).map((c) => { const v = list.filter((t) => t.category === c.id).reduce((a, t) => a + t.amount, 0); return { ...c, value: v, pct: total ? Math.round((v / total) * 100) : 0 }; })
    .filter((c) => c.value > 0).sort((a, b) => b.value - a.value);
}

export function monthlyTrend(txs: FinanceTransaction[], months: number, end: string) {
  const e = parseISO(`${end}-01`);
  return Array.from({ length: months }, (_, i) => { const k = monthKey(addMonths(e, i - months + 1)); return { d: k, ...monthStats(txs, k) }; });
}

export const monthLabel = (m: string) => `Tháng ${Number(m.slice(5))}, ${m.slice(0, 4)}`;
export const monthRange = (m: string) => { const s = startOfMonth(parseISO(`${m}-01`)); return `${format(s, 'dd/MM')} – ${format(endOfMonth(s), 'dd/MM/yyyy')}`; };

/** Gợi ý tạo từ dữ liệu tháng đang xem (quy tắc đơn giản, không gọi AI). */
export function financeInsights(txs: FinanceTransaction[], m: string, prev: string) {
  const out: { icon: string; tint: Tint; title: string; desc: string }[] = [];
  const s = monthStats(txs, m), p = monthStats(txs, prev);
  if (s.saving !== null) out.push(s.saving >= SAVING_TARGET
    ? { icon: '🐷', tint: 'mint', title: 'Tiết kiệm đạt mục tiêu', desc: `Bạn tiết kiệm ${s.saving}% thu nhập — vượt mức ${SAVING_TARGET}%.` }
    : { icon: '🐷', tint: 'amber', title: 'Tăng tỷ lệ tiết kiệm', desc: `Hiện ${s.saving}% thu nhập. Cần thêm ${compactVND(Math.ceil((SAVING_TARGET / 100) * s.income - s.balance))} để đạt ${SAVING_TARGET}%.` });
  const top = categoryBreakdown(txs, m)[0];
  if (top) out.push({ icon: top.icon, tint: 'rose', title: `Chi nhiều nhất: ${top.name}`, desc: `${compactVND(top.value)} (${top.pct}% tổng chi tiêu tháng).` });
  const d = pctDelta(s.expense, p.expense);
  if (d !== null && s.expense) out.push(d > 0 ? { icon: '📈', tint: 'orange', title: 'Chi tiêu tăng', desc: `Cao hơn tháng trước ${d}%. Xem lại các khoản không cần thiết.` } : { icon: '📉', tint: 'sky', title: 'Chi tiêu giảm', desc: `Thấp hơn tháng trước ${Math.abs(d)}%. Tuyệt vời!` });
  return out.slice(0, 3);
}
