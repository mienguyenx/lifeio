import { Plus } from 'lucide-react';
import { ProgressBar, Surface } from '@/components/lio';
import { BOOK_COLOR, STATUS_META, categoryOf, type LearningItem } from '../utils/learning.utils';

/** Thư viện dạng lưới “bìa” — bìa tạo từ màu danh mục + icon (app chưa lưu ảnh bìa). */
export function LibraryGrid({ items, onOpen, onAdd }: { items: LearningItem[]; onOpen: (i: LearningItem) => void; onAdd: () => void }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {items.map((i) => {
        const color = i.kind === 'book' ? BOOK_COLOR : categoryOf(i.category).color;
        const st = STATUS_META[i.status];
        return (
          <Surface key={`${i.kind}-${i.id}`} className="p-2.5 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-card min-w-0" onClick={() => onOpen(i)}>
            <div className="aspect-[4/3] rounded-[16px] grid place-items-center relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${color}33, ${color}12)` }}>
              <span className="text-[38px]">{i.icon}</span>
              <span className="absolute top-2 left-2 rounded-full bg-card/90 px-2 py-0.5 text-[10.5px] font-bold" style={{ color }}>{i.kind === 'course' ? 'Khóa học' : 'Sách'}</span>
            </div>
            <p className="text-[13px] font-semibold truncate mt-2 px-0.5">{i.title}</p>
            <p className="text-[11.5px] text-muted-foreground truncate px-0.5">{i.sub}</p>
            <div className="flex items-center gap-2 mt-2 px-0.5">
              <span className="text-[10.5px] font-semibold rounded-full px-2 py-px" style={{ background: `${st.color}1f`, color: st.color }}>{st[i.kind]}</span>
              <ProgressBar value={i.pct} color={color} className="flex-1" height={5} />
              <span className="text-[11px] font-bold tabular-nums">{i.pct}%</span>
            </div>
          </Surface>
        );
      })}
      <button onClick={onAdd} className="rounded-[22px] border-2 border-dashed border-border min-h-[190px] grid place-items-center text-primary hover:bg-lavender/60 transition-colors">
        <span className="flex flex-col items-center gap-1.5 text-[13px] font-semibold"><Plus className="h-6 w-6" />Thêm tài liệu</span>
      </button>
    </div>
  );
}
