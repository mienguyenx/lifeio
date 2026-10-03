/**
 * LIO UI Kit — khối giao diện dùng chung cho mọi module (Tasks, Habits, Calendar, Goals, Journal, AI Coach, Insights).
 * Quy tắc: mọi trang dùng <Page> + <PageHeader>; điều hướng mục chính dùng <SegmentedTabs>;
 * lọc nhanh dùng <FilterChips>; thẻ dùng <Surface>; số liệu dùng <StatTile>; nút thêm trên mobile dùng <Fab>.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { usePageAction } from '@/stores/usePageAction';
import { ChevronLeft, ChevronRight, MessageCircle, Plus, Search, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { LifeIcon, type LifeIconName } from '@/components/icons/LifeIcon';
import { Mascot, type MascotName } from '@/components/brand/Mascot';

/* ───────── Layout ───────── */
export function Page({ children, className }: { children: ReactNode; className?: string }) {
  const isMobile = useIsMobile();
  return <div className={cn('mx-auto w-full', isMobile ? 'px-4 pt-3 pb-28' : 'px-6 lg:px-8 py-6 max-w-[1440px]', className)}>{children}</div>;
}

export function PageHeader({ title, subtitle, actions, className }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; className?: string }) {
  const isMobile = useIsMobile();
  return (
    <header className={cn('flex items-start justify-between gap-3 mb-5', className)}>
      <div className="min-w-0">
        <h1 className={cn('font-extrabold tracking-tight leading-tight', isMobile ? 'text-[24px]' : 'text-[28px]')}>{title}</h1>
        {subtitle && <p className={cn('text-muted-foreground mt-0.5', isMobile ? 'text-[12.5px]' : 'text-[13.5px]')}>{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
}

/* ───────── Surfaces ───────── */
export function Surface({ children, className, as: Tag = 'div', ...rest }: { children: ReactNode; className?: string; as?: 'div' | 'section' | 'aside' } & React.HTMLAttributes<HTMLElement>) {
  return <Tag className={cn('rounded-[22px] bg-card border border-border/60 shadow-soft', className)} {...rest}>{children}</Tag>;
}

export function SectionTitle({ title, hint, action, className }: { title: ReactNode; hint?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-baseline justify-between gap-2 mb-3', className)}>
      <h2 className="text-[15px] font-bold">{title}{hint && <span className="ml-1.5 text-[12px] font-medium text-muted-foreground">{hint}</span>}</h2>
      {action}
    </div>
  );
}

/* ───────── Navigation ───────── */
export interface TabItem<T extends string> { id: T; label: ReactNode; count?: number }

/** Tab mục chính của module (nền xám, tab đang chọn nổi trắng). */
export function SegmentedTabs<T extends string>({ items, value, onChange, full, size = 'md', className }: {
  items: TabItem<NoInfer<T>>[]; value: T; onChange: (v: NoInfer<T>) => void; full?: boolean; size?: 'sm' | 'md'; className?: string;
}) {
  return (
    <div role="tablist" className={cn('inline-flex p-1 rounded-full bg-secondary/70 border border-border/40', full && 'w-full', className)}>
      {items.map((t) => (
        <button key={t.id} role="tab" aria-selected={value === t.id} onClick={() => onChange(t.id)} className={cn(
          'rounded-full font-semibold transition-all whitespace-nowrap',
          size === 'sm' ? 'h-8 px-3.5 text-[12.5px]' : 'h-9 px-5 text-[13.5px]',
          full && 'flex-1 px-2',
          value === t.id ? 'bg-card text-primary shadow-soft' : 'text-muted-foreground hover:text-foreground',
        )}>
          {t.label}{t.count !== undefined && <span className="ml-1 opacity-60 tabular-nums">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

/** Chip lọc nhanh (chip đang chọn tô màu primary). */
export function FilterChips<T extends string>({ items, value, onChange, className }: {
  items: TabItem<NoInfer<T>>[]; value: T; onChange: (v: NoInfer<T>) => void; className?: string;
}) {
  return (
    <div className={cn('flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-0.5', className)}>
      {items.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)} className={cn(
          'h-9 px-4 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all border shrink-0',
          value === t.id ? 'bg-primary text-primary-foreground border-primary shadow-soft' : 'bg-card border-border/70 text-muted-foreground hover:text-foreground',
        )}>
          {t.label}{t.count !== undefined && <span className="ml-1.5 opacity-70 tabular-nums">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

/* ───────── Controls ───────── */
export function SearchToggle({ value, onChange, placeholder = 'Tìm kiếm...', alwaysOpen, className }: {
  value: string; onChange: (v: string) => void; placeholder?: string; alwaysOpen?: boolean; className?: string;
}) {
  const [open, setOpen] = useState(false);
  if (!alwaysOpen && !open && !value) {
    return (
      <button onClick={() => setOpen(true)} title="Tìm kiếm" aria-label="Tìm kiếm" className="h-10 w-10 grid place-items-center rounded-full bg-card border border-border shadow-soft text-foreground hover:bg-secondary transition-colors">
        <Search className="h-4 w-4" />
      </button>
    );
  }
  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input autoFocus={!alwaysOpen} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="h-10 w-full sm:w-[230px] rounded-full bg-card border border-border pl-9 pr-8 text-[13px] focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10" />
      {(value || !alwaysOpen) && (
        <button className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => { onChange(''); setOpen(false); }} aria-label="Xóa tìm kiếm"><X className="h-4 w-4" /></button>
      )}
    </div>
  );
}

export function IconButton({ children, label, onClick, active, className }: { children: ReactNode; label: string; onClick?: () => void; active?: boolean; className?: string }) {
  return (
    <button onClick={onClick} title={label} aria-label={label} className={cn(
      'h-10 w-10 grid place-items-center rounded-full border shadow-soft transition-colors shrink-0',
      active ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-foreground hover:bg-secondary', className,
    )}>{children}</button>
  );
}

/**
 * Nút thêm của trang trên mobile. Không vẽ nút nổi riêng nữa (tránh 2 dấu ＋ cạnh nút ＋ giữa thanh điều hướng):
 * đăng ký hành động cho trang, nút ＋ giữa sẽ hiện nó lên đầu sheet "Thêm nhanh".
 */
export function Fab({ onClick, label }: { onClick: () => void; label: string }) {
  const ref = useRef(onClick);
  ref.current = onClick;
  useEffect(() => {
    const set = usePageAction.getState().set;
    set({ label, onClick: () => ref.current() });
    return () => set(null);
  }, [label]);
  return null;
}

/* ───────── Data display ───────── */
export const TINTS = {
  violet: { bg: 'bg-lavender dark:bg-primary/15', fg: '#6C5CE7' },
  orange: { bg: 'bg-[#FFF1E8] dark:bg-[#FF9B63]/15', fg: '#FF7A45' },
  rose: { bg: 'bg-[#FFECEE] dark:bg-[#FF6B78]/15', fg: '#F2557A' },
  amber: { bg: 'bg-[#FFF6D9] dark:bg-[#FFC63D]/15', fg: '#E8961C' },
  mint: { bg: 'bg-[#E6F8F1] dark:bg-[#57D3AE]/15', fg: '#22B07D' },
  sky: { bg: 'bg-[#E8F1FF] dark:bg-[#4D9DFF]/15', fg: '#3D8BFD' },
} as const;
export type Tint = keyof typeof TINTS;

export function StatTile({ icon, value, label, hint, tint = 'violet', onClick, active, className }: {
  icon: LifeIconName | React.ReactElement; value: ReactNode; label: ReactNode; hint?: ReactNode; tint?: Tint; onClick?: () => void; active?: boolean; className?: string;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag type={onClick ? 'button' : undefined} onClick={onClick} className={cn(
      'flex items-center gap-3 rounded-[20px] bg-card border border-border/70 px-4 py-3.5 text-left shadow-soft min-w-0',
      onClick && 'transition-all hover:-translate-y-0.5 hover:shadow-card', active && 'ring-2 ring-primary/30', className,
    )}>
      <span className={cn('h-11 w-11 rounded-[14px] grid place-items-center shrink-0', TINTS[tint].bg)}>
        {typeof icon === 'string' ? <LifeIcon name={icon as LifeIconName} size={24} variant="duotone" /> : icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[22px] leading-none font-bold text-foreground tabular-nums truncate">{value}</span>
        <span className="block text-[12px] text-muted-foreground mt-1 truncate">{label}</span>
        {hint && <span className="block text-[11px] font-semibold mt-0.5 truncate">{hint}</span>}
      </span>
    </Tag>
  );
}

export function ProgressBar({ value, color, className, height = 6 }: { value: number; color?: string; className?: string; height?: number }) {
  return (
    <div className={cn('rounded-full bg-[#EEF0F5] dark:bg-white/10 overflow-hidden', className)} style={{ height }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color || 'linear-gradient(90deg, #7C6CF2, #4D9DFF)' }} />
    </div>
  );
}

export function ProgressRing({ value, size = 72, stroke = 8, label, className }: { value: number; size?: number; stroke?: number; label?: ReactNode; className?: string }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, id = `pr-${size}-${stroke}`;
  return (
    <div className={cn('relative shrink-0', className)} style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="-rotate-90" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-secondary" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round" stroke={`url(#${id})`} strokeDasharray={c} strokeDashoffset={c * (1 - Math.max(0, Math.min(100, value)) / 100)} className="transition-all duration-700" />
        <defs><linearGradient id={id}><stop offset="0" stopColor="#7C6CF2" /><stop offset="1" stopColor="#4D9DFF" /></linearGradient></defs>
      </svg>
      <span className="absolute inset-0 grid place-items-center font-bold" style={{ fontSize: size * 0.22 }}>{label ?? `${Math.round(value)}%`}</span>
    </div>
  );
}

/** Ô icon pastel theo lĩnh vực (dùng chung cho mục tiêu, nhật ký, thói quen…). */
export function AreaTile({ area, size = 44, emoji }: { area?: string; size?: number; emoji?: string }) {
  return (
    <span className="rounded-[14px] grid place-items-center shrink-0" style={{ width: size, height: size, background: area ? `hsl(var(--area-${area}) / 0.14)` : 'hsl(var(--secondary))' }}>
      {emoji ? <span style={{ fontSize: size * 0.45 }}>{emoji}</span> : area ? <LifeIcon name={`area/${area}` as LifeIconName} size={size * 0.55} variant="duotone" /> : null}
    </span>
  );
}

export function AreaChip({ area, label, className }: { area: string; label: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold', className)} style={{ background: `hsl(var(--area-${area}) / 0.14)`, color: `hsl(var(--area-${area}))` }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: `hsl(var(--area-${area}))` }} />{label}
    </span>
  );
}

/** Thẻ mascot + câu trích (cột phải / banner). */
export function MascotCard({ mascot, pose, title, quote, action, className, size = 96 }: {
  mascot: MascotName; pose?: string; title?: ReactNode; quote: ReactNode; action?: ReactNode; className?: string; size?: number;
}) {
  return (
    <div className={cn('relative overflow-hidden rounded-[22px] bg-gradient-to-br from-lavender to-[#FFEFF4] dark:from-primary/15 dark:to-[#F2557A]/10 p-4 min-h-[112px]', className)} style={{ paddingRight: size + 8 }}>
      {title && <p className="text-[15px] font-bold mb-1">{title}</p>}
      <p className="text-[13px] italic font-medium text-primary leading-snug">{quote}</p>
      {action && <div className="mt-3">{action}</div>}
      <Mascot name={mascot} pose={pose} size={size} className="absolute right-1 bottom-0" />
    </div>
  );
}

/** Banner chào (đầu trang) — gradient + mascot lớn. */
export function HeroBanner({ mascot, pose, title, subtitle, action, aside, className }: {
  mascot: MascotName; pose?: string; title: ReactNode; subtitle?: ReactNode; action?: ReactNode; aside?: ReactNode; className?: string;
}) {
  return (
    <div className={cn('relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#EFEBFF] via-[#F6F1FF] to-[#FFEFF6] dark:from-primary/20 dark:via-primary/10 dark:to-[#F2557A]/10 border border-border/40 p-5 sm:p-6 min-h-[150px]', className)}>
      <div className="relative z-10 max-w-[62%] sm:max-w-[60%]">
        <h2 className="text-[20px] sm:text-[24px] font-extrabold tracking-tight leading-tight">{title}</h2>
        {subtitle && <p className="text-[13px] sm:text-[14px] text-muted-foreground mt-1.5 leading-snug">{subtitle}</p>}
        {action && <div className="mt-4">{action}</div>}
      </div>
      {aside}
      <Mascot name={mascot} pose={pose} size={140} float className="absolute right-3 sm:right-6 -bottom-2" />
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="text-[12.5px] text-muted-foreground py-2">{children}</p>;
}

/* ───────── Kit mở rộng (Module 09+) ───────── */
/** Điều hướng kỳ: ‹ nhãn › (+ Hôm nay). Dùng cho ngày (Health), tháng (Finance)… */
export function PeriodNav({ label, onPrev, onNext, onReset, resetLabel = 'Hôm nay', nextDisabled, className }: {
  label: ReactNode; onPrev: () => void; onNext: () => void; onReset?: () => void; resetLabel?: string; nextDisabled?: boolean; className?: string;
}) {
  const btn = 'h-9 w-9 grid place-items-center rounded-full bg-card border border-border/70 shadow-soft hover:bg-secondary disabled:opacity-40 shrink-0';
  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <button className={btn} onClick={onPrev} aria-label="Trước"><ChevronLeft className="h-4 w-4" /></button>
      <span className="min-w-[120px] text-center text-[13.5px] font-bold px-1 truncate">{label}</span>
      <button className={btn} onClick={onNext} disabled={nextDisabled} aria-label="Sau"><ChevronRight className="h-4 w-4" /></button>
      {onReset && <button onClick={onReset} className="h-9 px-3 rounded-full text-[12.5px] font-semibold text-primary hover:bg-lavender">{resetLabel}</button>}
    </div>
  );
}

/** Hàng mục chung (giao dịch, ghi nhận, mục tiêu…): icon pastel · tiêu đề + meta · giá trị · hành động. */
export function ItemRow({ icon, tint = 'violet', iconBg, title, meta, value, valueClassName, trailing, onClick, className }: {
  icon: ReactNode; tint?: Tint; iconBg?: string; title: ReactNode; meta?: ReactNode; value?: ReactNode; valueClassName?: string; trailing?: ReactNode; onClick?: () => void; className?: string;
}) {
  return (
    <div role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined} onClick={onClick} onKeyDown={(e) => onClick && e.key === 'Enter' && onClick()}
      className={cn('flex items-center gap-3 rounded-[18px] px-3 py-2.5 transition-colors', onClick && 'cursor-pointer hover:bg-secondary/60', className)}>
      <span className={cn('h-10 w-10 rounded-[13px] grid place-items-center shrink-0 text-[18px]', !iconBg && TINTS[tint].bg)} style={iconBg ? { background: iconBg } : undefined}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-semibold truncate">{title}</span>
        {meta && <span className="block text-[11.5px] text-muted-foreground truncate">{meta}</span>}
      </span>
      {value !== undefined && <span className={cn('text-[13.5px] font-bold tabular-nums shrink-0', valueClassName)}>{value}</span>}
      {trailing}
    </div>
  );
}

/** Thẻ “AI Insights” — gợi ý tạo từ dữ liệu thật + nút mở AI Coach. */
export function InsightCard({ title = 'LifeOS AI Coach', subtitle, items, onChat, empty = 'Ghi nhận thêm dữ liệu để nhận gợi ý.', className }: {
  title?: ReactNode; subtitle?: ReactNode; items: { icon: ReactNode; tint?: Tint; title: ReactNode; desc: ReactNode }[]; onChat?: () => void; empty?: ReactNode; className?: string;
}) {
  return (
    <Surface className={cn('p-4', className)}>
      <div className="flex items-center gap-2.5 mb-3">
        <span className="h-9 w-9 rounded-[12px] grid place-items-center bg-lavender dark:bg-primary/15"><Sparkles className="h-[18px] w-[18px] text-primary" /></span>
        <span className="min-w-0"><span className="block text-[14px] font-bold">{title}</span>{subtitle && <span className="block text-[11.5px] text-muted-foreground">{subtitle}</span>}</span>
      </div>
      {items.length === 0 ? <Empty>{empty}</Empty> : (
        <ul className="space-y-1">
          {items.map((it, i) => (
            <li key={i} className="flex gap-3 rounded-2xl px-2 py-2">
              <span className={cn('h-9 w-9 rounded-[12px] grid place-items-center shrink-0 text-[17px]', TINTS[it.tint ?? 'violet'].bg)}>{it.icon}</span>
              <span className="min-w-0"><span className="block text-[13px] font-semibold">{it.title}</span><span className="block text-[12px] text-muted-foreground leading-snug">{it.desc}</span></span>
            </li>
          ))}
        </ul>
      )}
      {onChat && (
        <button onClick={onChat} className="mt-3 w-full h-11 rounded-full bg-primary text-primary-foreground text-[13.5px] font-semibold inline-flex items-center justify-center gap-2 shadow-soft">
          <MessageCircle className="h-4 w-4" />Chat với AI Coach
        </button>
      )}
    </Surface>
  );
}
