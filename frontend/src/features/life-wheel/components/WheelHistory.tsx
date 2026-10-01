import { format, parseISO } from 'date-fns';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { AreaChip, SectionTitle, Surface } from '@/components/lio';
import { EmptyState } from '@/components/brand/EmptyState';
import type { LifeWheelScore } from '@/types/lifeos';
import { avgOf, ranked } from '../utils/wheel.utils';

export function WheelHistory({ history, onView, onDelete, onClear, onNew }: { history: LifeWheelScore[]; onView: (s: LifeWheelScore) => void; onDelete: (s: LifeWheelScore) => void; onClear: () => void; onNew: () => void }) {
  if (!history.length) return <EmptyState mascot="taro" pose="relax" title="Chưa có lần đánh giá nào" description="Đánh giá 10 lĩnh vực để bắt đầu theo dõi sự cân bằng." action={<Button className="rounded-full" onClick={onNew}>Đánh giá ngay</Button>} />;
  return (
    <Surface className="p-3 sm:p-4">
      <div className="px-1"><SectionTitle title="Lịch sử đánh giá" hint={`${history.length} lần`} action={history.length > 1 && <button onClick={onClear} className="text-[12px] font-semibold text-destructive">Xóa lịch sử cũ</button>} /></div>
      <div className="hidden md:grid grid-cols-[110px_80px_1fr_1fr_40px] gap-3 px-3 py-2 text-[11.5px] font-semibold text-muted-foreground">
        <span>Ngày</span><span>Điểm TB</span><span>Cao nhất</span><span>Thấp nhất</span><span />
      </div>
      <ul>
        {history.map((h, i) => { const r = ranked(h.scores); const hi = r[0], lo = r[r.length - 1]; return (
          <li key={h.id} onClick={() => onView(h)} className="grid grid-cols-[1fr_auto_40px] md:grid-cols-[110px_80px_1fr_1fr_40px] items-center gap-3 rounded-[16px] px-3 py-2.5 cursor-pointer hover:bg-secondary/50">
            <span className="text-[13px] font-semibold">{format(parseISO(h.date), 'dd/MM/yyyy')}{i === 0 && <span className="ml-1.5 text-[10.5px] text-primary">Mới nhất</span>}</span>
            <span className="text-[14px] font-extrabold text-primary tabular-nums">{avgOf(h.scores).toFixed(1)}</span>
            <span className="hidden md:block"><AreaChip area={hi.id} label={`${hi.name} · ${hi.score}`} /></span>
            <span className="hidden md:block"><AreaChip area={lo.id} label={`${lo.name} · ${lo.score}`} /></span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}><button className="h-8 w-8 grid place-items-center rounded-full hover:bg-secondary" aria-label="Tùy chọn"><MoreHorizontal className="h-4 w-4" /></button></DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => onView(h)}>Xem trên bánh xe</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={() => onDelete(h)}><Trash2 className="h-4 w-4 mr-2" />Xóa</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </li>); })}
      </ul>
    </Surface>
  );
}
