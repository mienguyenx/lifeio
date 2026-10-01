import { useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Composer({ onSend, disabled, chips, className }: { onSend: (t: string) => void; disabled?: boolean; chips?: string[]; className?: string }) {
  const [v, setV] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);
  const submit = () => { if (!v.trim() || disabled) return; onSend(v); setV(''); if (ref.current) ref.current.style.height = 'auto'; };
  return (
    <div className={cn('space-y-2', className)}>
      {!!chips?.length && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar">{chips.map((c) => (
          <button key={c} onClick={() => onSend(c)} disabled={disabled} className="h-8 px-3 rounded-full bg-lavender dark:bg-primary/15 text-primary text-[12px] font-semibold whitespace-nowrap shrink-0 disabled:opacity-50">{c}</button>
        ))}</div>
      )}
      <div className="flex items-end gap-2 rounded-[24px] bg-card border border-border shadow-soft p-1.5 pl-4 focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/10">
        <textarea ref={ref} rows={1} value={v} placeholder="Hỏi bất cứ điều gì..." onChange={(e) => { setV(e.target.value); e.target.style.height = 'auto'; e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`; }}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
          className="flex-1 resize-none bg-transparent py-2.5 text-[14px] focus:outline-none max-h-32" />
        <button onClick={submit} disabled={!v.trim() || disabled} aria-label="Gửi" className="h-10 w-10 rounded-full bg-primary text-primary-foreground grid place-items-center shrink-0 shadow-soft disabled:opacity-40"><Send className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
