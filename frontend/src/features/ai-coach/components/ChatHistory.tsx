import { useState } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { MessageSquare, Plus, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Empty } from '@/components/lio';
import type { SavedConversation } from '@/types/lifeos';

const when = (iso: string) => { const d = new Date(iso); return isToday(d) ? format(d, 'HH:mm') : isYesterday(d) ? 'Hôm qua' : format(d, 'dd/MM'); };

/** Lịch sử = các cuộc trò chuyện đã lưu (savedConversations). */
export function ChatHistory({ saved, onNew, onLoad, onDelete, className }: { saved: SavedConversation[]; onNew: () => void; onLoad: (id: string) => void; onDelete: (id: string) => void; className?: string }) {
  const [q, setQ] = useState('');
  const list = saved.filter((c) => !q || c.title.toLowerCase().includes(q.toLowerCase()) || c.messages.some((m) => m.content.toLowerCase().includes(q.toLowerCase())));
  const recent = list.filter((c) => Date.now() - new Date(c.createdAt).getTime() < 7 * 864e5);
  const older = list.filter((c) => !recent.includes(c));
  const Group = ({ title, items }: { title: string; items: SavedConversation[] }) => items.length ? (
    <div className="space-y-1">
      <p className="px-2 text-[11.5px] font-semibold text-muted-foreground uppercase tracking-wide">{title}</p>
      {items.map((c) => (
        <div key={c.id} className="group flex items-center gap-2 rounded-2xl px-2 py-2 hover:bg-secondary/70 cursor-pointer" onClick={() => onLoad(c.id)}>
          <span className="h-8 w-8 rounded-xl bg-lavender dark:bg-primary/15 grid place-items-center shrink-0"><MessageSquare className="h-4 w-4 text-primary" /></span>
          <span className="min-w-0 flex-1"><span className="block text-[13px] font-semibold truncate">{c.title}</span><span className="block text-[11px] text-muted-foreground">{c.messages.length} tin nhắn</span></span>
          <span className="text-[11px] text-muted-foreground group-hover:hidden">{when(c.createdAt)}</span>
          <button onClick={(e) => { e.stopPropagation(); onDelete(c.id); }} className="hidden group-hover:grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:text-destructive" aria-label="Xóa"><X className="h-3.5 w-3.5" /></button>
        </div>
      ))}
    </div>
  ) : null;
  return (
    <div className={cn('flex flex-col min-h-0', className)}>
      <div className="flex gap-2 mb-3">
        <label className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm cuộc trò chuyện..." className="h-10 w-full rounded-full bg-secondary/60 pl-9 pr-3 text-[13px] focus:outline-none focus:ring-4 focus:ring-primary/10" />
        </label>
        <button onClick={onNew} className="h-10 px-3.5 rounded-full bg-primary text-primary-foreground text-[12.5px] font-semibold inline-flex items-center gap-1 shadow-soft shrink-0"><Plus className="h-4 w-4" />Mới</button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-4 -mx-1 px-1">
        {list.length === 0 ? <Empty>{q ? 'Không tìm thấy cuộc trò chuyện.' : 'Chưa có cuộc trò chuyện nào được lưu. Bấm “Lưu” trong khung chat để giữ lại.'}</Empty> : <><Group title="7 ngày qua" items={recent} /><Group title="Trước đó" items={older} /></>}
      </div>
    </div>
  );
}
