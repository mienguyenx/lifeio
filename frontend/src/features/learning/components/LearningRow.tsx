import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ProgressBar, TINTS } from '@/components/lio';
import { StarRating } from '@/components/lio/form';
import { cn } from '@/lib/utils';
import { BOOK_COLOR, STATUS_META, categoryOf, type LearningItem } from '../utils/learning.utils';

const chipCls = 'h-7 px-2.5 rounded-full bg-secondary/80 hover:bg-lavender text-[11.5px] font-semibold disabled:opacity-40 disabled:hover:bg-secondary/80';

/** Hàng khóa học / sách: icon · tên + loại · tiến độ · nút cập nhật nhanh · menu. */
export function LearningRow({ item, onStep, onEdit, onDelete, compact }: { item: LearningItem; onStep: (i: LearningItem, n: number) => void; onEdit: (i: LearningItem) => void; onDelete: (i: LearningItem) => void; compact?: boolean }) {
  const st = STATUS_META[item.status];
  const color = item.kind === 'book' ? BOOK_COLOR : categoryOf(item.category).color;
  const steps = item.kind === 'course' ? [{ l: '−1', n: item.done - 1, dis: item.done === 0 }, { l: '+1 bài', n: item.done + 1, dis: item.done >= item.total }]
    : [{ l: '+10 trang', n: Math.min(item.total, item.done + 10), dis: item.done >= item.total }, { l: 'Hoàn thành', n: item.total, dis: item.done >= item.total }];
  return (
    <div className="flex items-center gap-3 rounded-[18px] px-3 py-3 hover:bg-secondary/40 transition-colors">
      <span className="h-11 w-11 rounded-[14px] grid place-items-center shrink-0 text-[20px]" style={{ background: `${color}22` }}>{item.icon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={() => onEdit(item)} className="text-[13.5px] font-semibold truncate text-left hover:text-primary">{item.title}</button>
          {item.rating ? <StarRating value={item.rating} size={11} /> : null}
        </div>
        <div className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground min-w-0">
          <span className={cn('rounded-full px-2 py-px font-semibold shrink-0', TINTS[item.kind === 'course' ? 'violet' : 'orange'].bg)} style={{ color }}>{item.kind === 'course' ? 'Khóa học' : 'Sách'}</span>
          <span className="truncate">{item.sub}</span>
          <span className="shrink-0">·</span><span className="shrink-0" style={{ color: st.color }}>{st[item.kind]}</span>
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <ProgressBar value={item.pct} color={color} className="flex-1" />
          <span className="text-[11.5px] font-bold tabular-nums w-9 text-right">{item.pct}%</span>
          {!compact && <span className="text-[11px] text-muted-foreground tabular-nums w-[84px] text-right hidden sm:inline">{item.done}/{item.total} {item.unit}</span>}
        </div>
      </div>
      <div className={cn('flex gap-1.5 shrink-0', compact ? 'hidden' : 'hidden md:flex')}>
        {steps.map((s) => <button key={s.l} className={chipCls} disabled={s.dis} onClick={() => onStep(item, s.n)}>{s.l}</button>)}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild><button className="h-8 w-8 grid place-items-center rounded-full hover:bg-secondary shrink-0" aria-label="Tùy chọn"><MoreHorizontal className="h-4 w-4" /></button></DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {steps.map((s) => <DropdownMenuItem key={s.l} disabled={s.dis} onClick={() => onStep(item, s.n)} className="md:hidden">{s.l}</DropdownMenuItem>)}
          <DropdownMenuItem onClick={() => onEdit(item)}><Pencil className="h-4 w-4 mr-2" />Chỉnh sửa</DropdownMenuItem>
          <DropdownMenuItem className="text-destructive" onClick={() => onDelete(item)}><Trash2 className="h-4 w-4 mr-2" />Xóa</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
