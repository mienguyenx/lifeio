// Thành phần dùng chung cho các trang quản trị mới (LIO kit) — giữ cùng kiểu với app
import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

/** Hồ sơ người dùng (bảng profiles) — client Supabase ngoài chưa có kiểu sinh sẵn nên khai báo tại đây */
export interface AdminProfile {
  id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  birthday: string | null;
  timezone: string | null;
  life_purpose: string | null;
  created_at: string | null;
  updated_at: string | null;
}
export const asProfiles = (data: unknown) => (Array.isArray(data) ? data : []) as AdminProfile[];

export type Tone = 'green' | 'amber' | 'red' | 'blue' | 'violet' | 'gray';
export const TONE: Record<Tone, string> = {
  green: 'bg-[#E3F8EE] text-[#1F9D63] dark:bg-emerald-500/15 dark:text-emerald-300',
  amber: 'bg-[#FFF4DB] text-[#B7791F] dark:bg-amber-500/15 dark:text-amber-300',
  red: 'bg-[#FFE4EA] text-[#E0445E] dark:bg-rose-500/15 dark:text-rose-300',
  blue: 'bg-[#E6F1FF] text-[#2F7BF6] dark:bg-sky-500/15 dark:text-sky-300',
  violet: 'bg-primary/10 text-primary',
  gray: 'bg-secondary text-foreground/70',
};

export function Pill({ tone = 'gray', icon, children, className }: { tone?: Tone; icon?: ReactNode; children: ReactNode; className?: string }) {
  return <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap', TONE[tone], className)}>{icon}{children}</span>;
}

export const ROLE_META: Record<string, { label: string; tone: Tone; color: string }> = {
  admin: { label: 'Admin', tone: 'red', color: '#F0587A' },
  moderator: { label: 'Moderator', tone: 'violet', color: '#7C5CFC' },
  user: { label: 'User', tone: 'gray', color: '#9AA3B2' },
  owner: { label: 'Chủ sở hữu', tone: 'amber', color: '#F5A524' },
  member: { label: 'Thành viên', tone: 'blue', color: '#2F7BF6' },
  viewer: { label: 'Người xem', tone: 'gray', color: '#9AA3B2' },
};
export function RolePill({ role }: { role: string }) {
  const m = ROLE_META[role] ?? ROLE_META.user;
  return <Pill tone={m.tone}>{m.label}</Pill>;
}

export function UserAvatar({ name, email, src, size = 36, className }: { name?: string | null; email?: string | null; src?: string | null; size?: number; className?: string }) {
  const ch = (name || email || 'U').charAt(0).toUpperCase();
  return (
    <Avatar className={cn('shrink-0', className)} style={{ width: size, height: size }}>
      <AvatarImage src={src || undefined} />
      <AvatarFallback className="bg-primary/10 text-primary font-bold" style={{ fontSize: Math.round(size * 0.4) }}>{ch}</AvatarFallback>
    </Avatar>
  );
}

/** Ô chọn dạng LIO (checkbox bo tròn) */
export function CheckBox({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button type="button" role="checkbox" aria-checked={on} aria-label={label} onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className={cn('h-[18px] w-[18px] rounded-md border-2 grid place-items-center shrink-0 transition-colors', on ? 'bg-primary border-primary text-primary-foreground' : 'border-border bg-card hover:border-primary/60')}>
      {on && <Check className="h-3 w-3" strokeWidth={3} />}
    </button>
  );
}

/** Bảng dạng lưới: header + hàng dùng chung template cột */
export function GridHead({ cols, children }: { cols: string; children: ReactNode }) {
  return <div className="grid items-center gap-3 px-3 h-10 bg-secondary/50 text-[11.5px] font-semibold text-muted-foreground" style={{ gridTemplateColumns: cols }}>{children}</div>;
}
export function GridRow({ cols, children, onClick, active, className }: { cols: string; children: ReactNode; onClick?: () => void; active?: boolean; className?: string }) {
  return (
    <div role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined} onClick={onClick} onKeyDown={(e) => { if (onClick && e.key === 'Enter') onClick(); }}
      className={cn('grid items-center gap-3 px-3 py-2.5 border-t border-border/50 transition-colors', onClick && 'cursor-pointer hover:bg-secondary/40', active && 'bg-primary/5', className)} style={{ gridTemplateColumns: cols }}>
      {children}
    </div>
  );
}

export function Pager({ page, pages, total, pageSize, onPage, onPageSize }: { page: number; pages: number; total: number; pageSize: number; onPage: (p: number) => void; onPageSize: (n: number) => void }) {
  const from = total ? page * pageSize + 1 : 0;
  const to = Math.min((page + 1) * pageSize, total);
  return (
    <div className="flex items-center justify-between gap-2 flex-wrap pt-3 px-1">
      <span className="text-[12px] text-muted-foreground">Hiển thị {from}–{to} / {total}</span>
      <div className="flex items-center gap-1.5">
        <Select value={String(pageSize)} onValueChange={(v) => onPageSize(Number(v))}>
          <SelectTrigger className="h-8 w-[108px] rounded-full bg-card text-[12px]"><SelectValue /></SelectTrigger>
          <SelectContent>{[10, 20, 50, 100].map((n) => <SelectItem key={n} value={String(n)}>{n} / trang</SelectItem>)}</SelectContent>
        </Select>
        <button aria-label="Trang trước" disabled={page === 0} onClick={() => onPage(page - 1)} className="h-8 w-8 grid place-items-center rounded-full border border-border/70 bg-card disabled:opacity-40 hover:bg-secondary"><ChevronLeft className="h-4 w-4" /></button>
        <span className="text-[12px] font-semibold tabular-nums px-1">{page + 1} / {pages}</span>
        <button aria-label="Trang sau" disabled={page >= pages - 1} onClick={() => onPage(page + 1)} className="h-8 w-8 grid place-items-center rounded-full border border-border/70 bg-card disabled:opacity-40 hover:bg-secondary"><ChevronRight className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

/** Dòng thông tin key–value trong panel chi tiết */
export function InfoRow({ icon, label, value }: { icon?: ReactNode; label: ReactNode; value: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 py-1.5 text-[12.5px]">
      {icon && <span className="text-muted-foreground shrink-0">{icon}</span>}
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-auto font-semibold text-right truncate max-w-[60%]">{value}</span>
    </div>
  );
}

/** Đếm theo tháng (6 tháng gần nhất) từ danh sách ngày ISO — `d` dạng yyyy-MM cho TrendArea */
export function monthlyCounts(dates: (string | null | undefined)[], months = 6) {
  const now = new Date();
  const buckets = Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    return { key: `${d.getFullYear()}-${d.getMonth()}`, d: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, v: 0 };
  });
  dates.forEach((iso) => {
    if (!iso) return;
    const d = new Date(iso);
    const b = buckets.find((x) => x.key === `${d.getFullYear()}-${d.getMonth()}`);
    if (b) b.v += 1;
  });
  return buckets.map(({ d, v }) => ({ d, v }));
}
