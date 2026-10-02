// Thư viện prompt AI Coach — chọn mẫu, điền biến, gửi hoặc chèn vào ô chat.
import { useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, CornerDownLeft, Search, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { EmptyState } from '@/components/brand/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { fieldCls } from '@/components/lio/form';
import { cn } from '@/lib/utils';
import { categoryLabel, fillTemplate, useCoachPrompts, varLabel, varsOf, type CoachPrompt } from './promptLibrary';

export function PromptLibrarySheet({ open, onOpenChange, onSend, onInsert }: {
  open: boolean; onOpenChange: (o: boolean) => void;
  onSend: (text: string) => void; onInsert?: (text: string) => void;
}) {
  const { data, isLoading } = useCoachPrompts(open);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [picked, setPicked] = useState<CoachPrompt | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});

  const prompts = data ?? [];
  const cats = useMemo(() => [...new Set(prompts.map((p) => p.category))], [prompts]);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return prompts.filter((p) => (cat === 'all' || p.category === cat) && (!s || `${p.name} ${p.description ?? ''} ${p.user_prompt_template ?? ''}`.toLowerCase().includes(s)));
  }, [prompts, q, cat]);

  const close = (o: boolean) => { onOpenChange(o); if (!o) { setPicked(null); setValues({}); } };
  const pick = (p: CoachPrompt) => { setPicked(p); setValues({}); };
  const text = picked ? fillTemplate(picked.user_prompt_template ?? '', values) : '';
  const vars = picked ? varsOf(picked) : [];
  const done = (fn: (t: string) => void) => { fn(text); close(false); };

  return (
    <AdaptiveModal open={open} onOpenChange={close} title={picked ? picked.name : 'Thư viện prompt'} description={picked ? picked.description ?? undefined : 'Mẫu câu hỏi giúp AI Coach hiểu đúng điều bạn cần'}>
      {picked ? (
        <div className="space-y-3 mt-1 min-w-0">
          <button onClick={() => setPicked(null)} className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-primary"><ArrowLeft className="h-3.5 w-3.5" />Tất cả prompt</button>
          {vars.map((v, i) => (
            <label key={v} className="block">
              <span className="text-[12px] font-semibold text-muted-foreground">{varLabel(v)}</span>
              <input autoFocus={i === 0} className={cn(fieldCls, 'mt-1')} value={values[v] ?? ''} onChange={(e) => setValues((s) => ({ ...s, [v]: e.target.value }))}
                onKeyDown={(e) => { if (e.key === 'Enter' && i === vars.length - 1) done(onSend); }} />
            </label>
          ))}
          <div className="rounded-2xl bg-secondary/60 px-3.5 py-3 text-[13px] leading-relaxed whitespace-pre-wrap">{text}</div>
          <div className={cn('grid gap-2', onInsert ? 'grid-cols-2' : 'grid-cols-1')}>
            {onInsert && <Button variant="outline" className="h-11 rounded-full" onClick={() => done(onInsert)}><CornerDownLeft className="h-4 w-4 mr-1.5" />Chèn để sửa</Button>}
            <Button className="h-11 rounded-full shadow-soft" onClick={() => done(onSend)}><Send className="h-4 w-4 mr-1.5" />Gửi cho Coach</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 mt-1 min-w-0">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input className={cn(fieldCls, 'pl-10')} placeholder="Tìm prompt…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1">
            {['all', ...cats].map((c) => (
              <button key={c} onClick={() => setCat(c)} className={cn('h-8 px-3 rounded-full text-[12px] font-semibold whitespace-nowrap shrink-0 border', cat === c ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border/70 text-muted-foreground hover:text-foreground')}>
                {c === 'all' ? `Tất cả (${prompts.length})` : categoryLabel(c)}
              </button>
            ))}
          </div>
          {isLoading ? <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
            : !list.length ? <EmptyState mascot="ori" compact title={prompts.length ? 'Không tìm thấy prompt' : 'Chưa có prompt'} description={prompts.length ? 'Thử từ khóa khác.' : 'Admin có thể thêm prompt nhóm “coach:…” trong Thư viện prompt.'} />
            : (
              <div className="grid gap-2 sm:grid-cols-2 max-h-[52vh] overflow-y-auto pr-0.5">
                {list.map((p) => (
                  <button key={p.id} onClick={() => pick(p)} className="text-left rounded-[18px] border border-border/60 bg-card p-3 hover:border-primary/40 hover:shadow-soft transition-all min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="h-8 w-8 rounded-xl bg-primary/15 text-primary grid place-items-center shrink-0"><BookOpen className="h-4 w-4" /></span>
                      <span className="min-w-0"><span className="block text-[13px] font-semibold truncate">{p.name}</span><span className="block text-[11px] text-muted-foreground">{categoryLabel(p.category)}</span></span>
                    </span>
                    {p.description && <span className="block text-[12px] text-muted-foreground mt-1.5 line-clamp-2">{p.description}</span>}
                  </button>
                ))}
              </div>
            )}
        </div>
      )}
    </AdaptiveModal>
  );
}
