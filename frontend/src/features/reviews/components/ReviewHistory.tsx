import { useMemo, useState, type ReactNode } from 'react';
import { MoreHorizontal, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/brand/EmptyState';
import { FilterChips, SectionTitle, Surface } from '@/components/lio';
import { GroupedBars } from '@/components/lio/charts';
import { cn } from '@/lib/utils';
import { RATING_OPTIONS, ratingMeta } from '../utils/reviews.utils';

export type HistoryItem = { id: string; key: string; short: string; title: string; subtitle?: string; rating: number; meta?: string; search: string; active?: boolean };

/** Lịch sử review: tìm kiếm + lọc điểm + biểu đồ điểm + danh sách. Dùng chung cho tuần/tháng/năm. */
export function ReviewHistory({ items, unit, onOpen, onDelete, onClearAll, empty }: { items: HistoryItem[]; unit: string; onOpen: (i: HistoryItem) => void; onDelete: (i: HistoryItem) => void; onClearAll?: () => void; empty: ReactNode }) {
  const [q, setQ] = useState('');
  const [rating, setRating] = useState('all');
  const list = useMemo(() => items.filter((i) => (rating === 'all' || String(i.rating) === rating) && (!q || i.search.toLowerCase().includes(q.toLowerCase()))), [items, q, rating]);
  const chart = [...items].slice(0, 12).reverse().map((i) => ({ label: i.short, v: i.rating * 2 }));
  if (!items.length) return <>{empty}</>;
  return (
    <div className="space-y-4">
      {items.length >= 2 && (
        <Surface className="p-4 md:p-5">
          <SectionTitle title={`Điểm qua các ${unit}`} hint="Thang 10" />
          <GroupedBars data={chart} series={[{ key: 'v', name: 'Điểm /10', color: '#7C6CF2' }]} height={180} />
        </Surface>
      )}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <label className="relative flex-1 min-w-0"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm trong nội dung review..." className="h-10 w-full rounded-full border border-border bg-card pl-10 pr-4 text-[13.5px] focus:outline-none focus:ring-4 focus:ring-primary/10" /></label>
        {onClearAll && <Button variant="outline" className="h-10 rounded-full bg-card text-destructive" onClick={onClearAll}>Xóa tất cả</Button>}
      </div>
      <FilterChips items={[{ id: 'all', label: 'Tất cả', count: items.length }, ...RATING_OPTIONS.map((r) => ({ id: String(r.value), label: `${r.emoji} ${r.label}`, count: items.filter((i) => i.rating === r.value).length }))]} value={rating} onChange={setRating} />
      {list.length === 0 ? <EmptyState mascot="ori" compact title="Không tìm thấy review" description="Thử đổi bộ lọc hoặc từ khóa nhé." /> : (
        <Surface className="p-2">
          {list.map((i) => { const m = ratingMeta(i.rating); return (
            <div key={i.id} onClick={() => onOpen(i)} className={cn('flex items-center gap-3 rounded-[18px] px-3 py-2.5 cursor-pointer hover:bg-secondary/50', i.active && 'bg-lavender/60 dark:bg-primary/10')}>
              <span className="h-10 w-10 rounded-2xl grid place-items-center text-[20px] bg-secondary/70 shrink-0">{m.emoji}</span>
              <span className="min-w-0 flex-1"><span className="block text-[13.5px] font-semibold truncate">{i.title}</span><span className="block text-[11.5px] text-muted-foreground truncate">{i.subtitle}</span></span>
              {i.meta && <span className="hidden md:inline text-[11.5px] text-muted-foreground">{i.meta}</span>}
              <span className="text-[13px] font-bold tabular-nums shrink-0" style={{ color: m.color }}>{i.rating * 2}/10</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><button onClick={(e) => e.stopPropagation()} className="h-8 w-8 grid place-items-center rounded-full hover:bg-secondary shrink-0" aria-label="Tùy chọn"><MoreHorizontal className="h-4 w-4" /></button></DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem onClick={() => onOpen(i)}>Xem</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => onDelete(i)}>Xóa</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ); })}
        </Surface>
      )}
    </div>
  );
}
