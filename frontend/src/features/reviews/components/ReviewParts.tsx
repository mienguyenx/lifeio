import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Empty, ProgressBar, ProgressRing, SectionTitle, SegmentedTabs, Surface, TINTS, type Tint } from '@/components/lio';
import { cn } from '@/lib/utils';
import { LIFE_AREAS, type LifeArea } from '@/types/lifeos';
import { ratingMeta } from '../utils/reviews.utils';

export const REVIEW_ROUTES = [
  { id: '/weekly-review', label: 'Tuần' },
  { id: '/monthly-review', label: 'Tháng' },
  { id: '/yearly-planning', label: 'Kế hoạch năm' },
  { id: '/yearly-review', label: 'Năm' },
] as const;
type RouteId = (typeof REVIEW_ROUTES)[number]['id'];

/** Chuyển nhanh giữa 4 trang trong hệ thống Review — giống nhau ở mọi trang. */
export function ReviewSwitcher({ full, className }: { full?: boolean; className?: string }) {
  const nav = useNavigate(); const { pathname } = useLocation();
  const value = (REVIEW_ROUTES.find((r) => pathname.startsWith(r.id))?.id ?? '/weekly-review') as RouteId;
  return <SegmentedTabs items={REVIEW_ROUTES.map((r) => ({ id: r.id, label: r.label }))} value={value} onChange={(v) => nav(v)} full={full} size="sm" className={className} />;
}

/** Thẻ “Đánh giá kỳ”: vòng điểm (1–5 → /10) + các dòng chỉ số có thanh tiến độ. */
export function ScoreCard({ title, rating, rows, note, action }: { title: string; rating?: number; rows: { icon: string; label: string; value: ReactNode; pct?: number; color?: string }[]; note?: ReactNode; action?: ReactNode }) {
  const m = rating ? ratingMeta(rating) : null;
  return (
    <Surface className="p-4 md:p-5">
      <SectionTitle title={title} action={action} />
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex sm:flex-col items-center gap-3 sm:w-[120px] shrink-0">
          <ProgressRing value={m ? m.value * 20 : 0} size={104} stroke={11} label={<span className="text-center leading-tight"><span className="block text-[22px] font-extrabold">{m ? `${m.value * 2}/10` : '–'}</span></span>} />
          <p className="text-[12px] text-muted-foreground sm:text-center">{m ? <><span className="text-[16px]">{m.emoji}</span> <b style={{ color: m.color }}>{m.label}</b></> : 'Chưa đánh giá'}{note && <span className="block">{note}</span>}</p>
        </div>
        <ul className="flex-1 min-w-0 space-y-3">
          {rows.map((r) => (
            <li key={r.label}>
              <div className="flex items-center justify-between gap-2 text-[12.5px] mb-1"><span className="truncate"><span className="mr-1.5">{r.icon}</span>{r.label}</span><span className="font-semibold tabular-nums shrink-0">{r.value}</span></div>
              {r.pct !== undefined && <ProgressBar value={r.pct} color={r.color} height={6} />}
            </li>
          ))}
        </ul>
      </div>
    </Surface>
  );
}

const MARK: Record<string, string> = { wins: '✓', challenges: '•', lessons: '💡', focus: '🎯', gratitude: '❤️' };
/** Danh sách gạch đầu dòng (chiến thắng, thách thức, bài học…). */
export function BulletCard({ title, icon, tint = 'violet', items, kind = 'wins', empty = 'Chưa có nội dung.', className }: { title: string; icon: string; tint?: Tint; items?: string[]; kind?: keyof typeof MARK; empty?: string; className?: string }) {
  const t = TINTS[tint];
  return (
    <Surface className={cn('p-4', className)}>
      <div className="flex items-center gap-2.5 mb-3">
        <span className={cn('h-8 w-8 rounded-xl grid place-items-center text-[15px]', t.bg)}>{icon}</span>
        <p className="text-[14px] font-bold flex-1">{title}</p>
        {!!items?.length && <span className="text-[11.5px] text-muted-foreground tabular-nums">{items.length}</span>}
      </div>
      {!items?.length ? <Empty>{empty}</Empty> : (
        <ul className="space-y-2">{items.map((x, i) => (
          <li key={i} className="flex items-start gap-2 text-[13px] leading-snug">
            {kind === 'wins' ? <span className={cn('h-5 w-5 rounded-full grid place-items-center text-[10.5px] font-bold shrink-0', t.bg)} style={{ color: t.fg }}>{i + 1}</span> : <span className="w-5 text-center shrink-0" style={{ color: t.fg }}>{MARK[kind]}</span>}
            <span className="min-w-0 break-words">{x}</span>
          </li>
        ))}</ul>
      )}
    </Surface>
  );
}

/** Đoạn văn (highlight, thư gửi tương lai, suy ngẫm…). */
export function TextCard({ title, icon, tint = 'violet', text, quote, className }: { title: string; icon: string; tint?: Tint; text?: string; quote?: boolean; className?: string }) {
  const t = TINTS[tint];
  return (
    <Surface className={cn('p-4', className)}>
      <div className="flex items-center gap-2.5 mb-2"><span className={cn('h-8 w-8 rounded-xl grid place-items-center text-[15px]', t.bg)}>{icon}</span><p className="text-[14px] font-bold">{title}</p></div>
      {text ? <p className={cn('text-[13px] whitespace-pre-wrap break-words', quote ? cn('italic rounded-2xl px-3.5 py-3', t.bg) : 'text-muted-foreground')}>{quote ? `“${text}”` : text}</p> : <Empty>Chưa có nội dung.</Empty>}
    </Surface>
  );
}

/** Điểm 10 lĩnh vực + chênh lệch so với kỳ trước. */
export function AreaRatingsCard({ ratings, prev, title = 'Tiến độ theo lĩnh vực', action }: { ratings?: Record<LifeArea, number>; prev?: Record<LifeArea, number>; title?: string; action?: ReactNode }) {
  return (
    <Surface className="p-4 md:p-5">
      <SectionTitle title={title} hint={prev ? 'So với kỳ trước' : undefined} action={action} />
      {!ratings ? <Empty>Chưa chấm điểm lĩnh vực.</Empty> : (
        <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
          {LIFE_AREAS.map((a) => {
            const v = ratings[a.id] ?? 0; const d = prev ? v - (prev[a.id] ?? 0) : 0;
            return (
              <li key={a.id} className="grid grid-cols-[22px_92px_1fr_28px_30px] items-center gap-2 text-[12.5px]">
                <span>{a.icon}</span><span className="truncate">{a.name}</span>
                <ProgressBar value={v * 10} color={`hsl(var(--area-${a.id}))`} height={6} />
                <span className="font-bold tabular-nums text-right">{v}</span>
                <span className={cn('text-[11px] font-semibold tabular-nums text-right', d > 0 ? 'text-emerald-600' : d < 0 ? 'text-rose-500' : 'text-muted-foreground/60')}>{prev ? (d > 0 ? `+${d}` : d === 0 ? '0' : d) : ''}</span>
              </li>
            );
          })}
        </ul>
      )}
    </Surface>
  );
}

/** Tóm tắt lịch sử đánh giá (số lần, điểm TB, tốt nhất). */
export function RatingSummary({ title = 'Thống kê review', items }: { title?: string; items: { overallRating: number }[] }) {
  const avg = items.length ? items.reduce((n, r) => n + r.overallRating, 0) / items.length : 0;
  const best = items.reduce((b, r) => Math.max(b, r.overallRating), 0);
  return (
    <Surface className="p-4">
      <SectionTitle title={title} />
      <div className="grid grid-cols-3 gap-2 text-center">
        {[{ v: items.length, l: 'Tổng review' }, { v: items.length ? avg.toFixed(1) : '–', l: 'Điểm TB /5' }, { v: best ? ratingMeta(best).emoji : '–', l: 'Tốt nhất' }].map((x) => (
          <div key={x.l} className="rounded-2xl bg-secondary/50 py-2.5"><p className="text-[18px] font-extrabold tabular-nums">{x.v}</p><p className="text-[10.5px] text-muted-foreground">{x.l}</p></div>
        ))}
      </div>
    </Surface>
  );
}

/** Nút nhỏ Sửa / Xóa đặt ở góc thẻ. */
export function EditDelete({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <span className="inline-flex gap-1">
      <button onClick={onEdit} className="h-8 px-3 rounded-full bg-lavender dark:bg-primary/15 text-primary text-[12px] font-semibold">Sửa</button>
      <button onClick={onDelete} className="h-8 px-3 rounded-full bg-secondary text-destructive text-[12px] font-semibold">Xóa</button>
    </span>
  );
}
