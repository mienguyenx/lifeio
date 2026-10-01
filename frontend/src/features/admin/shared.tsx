// Thành phần dùng chung cho các trang quản trị mới (LIO kit) — giữ cùng kiểu với app
import { useEffect, useState, type ReactNode } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Check, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ProgressBar } from '@/components/lio';
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

/** Bảng màu dùng chung cho biểu đồ admin */
export const PALETTE = ['#7C5CFC', '#22B07D', '#F5A524', '#2F7BF6', '#F0587A', '#14B8A6', '#9AA3B2', '#FF7A45'];
export const fmtDate = (d?: string | null, f = 'dd/MM/yyyy') => (d ? format(new Date(d), f, { locale: vi }) : '—');

/** true khi màn hình ≥ 1280px (hiện panel chi tiết bên phải thay vì modal) */
export function useIsXl() {
  const [xl, setXl] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 1280px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1280px)');
    const on = () => setXl(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return xl;
}

export interface MenuItem { label: string; icon?: ReactNode; onClick: () => void; danger?: boolean; hidden?: boolean; separator?: boolean }
/** Menu “…” cuối hàng — dùng chung cho mọi bảng admin */
export function RowMenu({ items, label = 'Tùy chọn' }: { items: MenuItem[]; label?: string }) {
  const shown = items.filter((i) => !i.hidden);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" aria-label={label}><MoreHorizontal className="h-4 w-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52" onClick={(e) => e.stopPropagation()}>
        {shown.map((i, k) => (
          <div key={k}>
            {i.separator && <DropdownMenuSeparator />}
            <DropdownMenuItem onClick={i.onClick} className={i.danger ? 'text-destructive focus:text-destructive' : undefined}>
              {i.icon && <span className="mr-2 inline-flex [&>svg]:h-4 [&>svg]:w-4">{i.icon}</span>}{i.label}
            </DropdownMenuItem>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Hộp xác nhận xóa/hành động nguy hiểm */
export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = 'Xóa', onConfirm }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: ReactNode; confirmLabel?: string; onConfirm: () => void }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-[24px]">
        <AlertDialogHeader><AlertDialogTitle>{title}</AlertDialogTitle>{description && <AlertDialogDescription>{description}</AlertDialogDescription>}</AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-full">Hủy</AlertDialogCancel>
          <AlertDialogAction className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={onConfirm}>{confirmLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Danh sách thanh ngang (nhãn – số – thanh tỉ lệ) cho các thẻ tổng quan */
export function CountBars({ items, empty = 'Chưa có dữ liệu.' }: { items: { label: ReactNode; value: number; color?: string; hint?: ReactNode }[]; empty?: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (!items.length) return <p className="text-[12.5px] text-muted-foreground">{empty}</p>;
  return (
    <div className="space-y-2.5">
      {items.map((i, k) => (
        <div key={k}>
          <div className="flex items-center justify-between text-[12.5px] mb-1 gap-2"><span className="font-semibold truncate">{i.label}</span><span className="text-muted-foreground tabular-nums shrink-0">{i.hint ?? i.value.toLocaleString()}</span></div>
          <ProgressBar value={(i.value / max) * 100} color={i.color ?? PALETTE[k % PALETTE.length]} />
        </div>
      ))}
    </div>
  );
}

/** Hàng bật/tắt có nhãn + mô tả (form & panel) */
export function ToggleRow({ title, hint, children }: { title: ReactNode; hint?: ReactNode; children: ReactNode }) {
  return <div className="flex items-center justify-between gap-3 rounded-2xl bg-secondary/50 px-3 py-2.5"><div className="min-w-0"><p className="text-[13px] font-semibold">{title}</p>{hint && <p className="text-[11.5px] text-muted-foreground">{hint}</p>}</div>{children}</div>;
}

/** Ô thống kê nhỏ trong panel chi tiết */
export function MiniStat({ label, value, hint }: { label: ReactNode; value: ReactNode; hint?: ReactNode }) {
  return <div className="rounded-2xl bg-secondary/50 p-3 min-w-0"><p className="text-[18px] font-bold leading-none truncate">{value}</p><p className="text-[11.5px] font-semibold mt-1 truncate">{label}</p>{hint && <p className="text-[10.5px] text-muted-foreground truncate">{hint}</p>}</div>;
}
