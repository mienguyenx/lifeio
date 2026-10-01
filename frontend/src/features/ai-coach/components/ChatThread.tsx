import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { Bookmark, BookmarkCheck, Copy, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Mascot } from '@/components/brand/Mascot';
import type { ChatMessage } from '@/types/lifeos';

const md = 'text-[13.5px] leading-relaxed [&_p]:my-1.5 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_li]:my-0.5 [&_strong]:font-semibold [&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-semibold [&_h1]:text-[15px] [&_h2]:text-[14.5px] [&_h3]:text-[14px] [&_code]:bg-secondary [&_code]:px-1 [&_code]:rounded';

export function ChatThread({ messages, loading, initials, onFavorite, onNote }: { messages: ChatMessage[]; loading: boolean; initials: string; onFavorite: (id: string) => void; onNote: (c: string) => void }) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [messages, loading]);
  const last = messages[messages.length - 1];
  return (
    <div className="space-y-5 py-2">
      {messages.map((m, i) => {
        const showDate = i === 0 || m.createdAt?.slice(0, 10) !== messages[i - 1].createdAt?.slice(0, 10);
        const mine = m.role === 'user';
        return (
          <div key={m.id}>
            {showDate && m.createdAt && <p className="text-center text-[11px] font-medium text-muted-foreground mb-3">{format(new Date(m.createdAt), 'dd/MM/yyyy HH:mm')}</p>}
            <div className={cn('flex gap-2.5 group', mine ? 'justify-end' : 'justify-start')}>
              {!mine && <span className="h-9 w-9 rounded-full bg-lavender dark:bg-primary/15 grid place-items-center shrink-0 overflow-hidden"><Mascot name="ori" size={30} /></span>}
              <div className={cn('max-w-[82%] min-w-0', mine && 'items-end flex flex-col')}>
                <div className={cn('rounded-[20px] px-4 py-2.5', mine ? 'bg-primary text-primary-foreground rounded-br-md text-[13.5px] whitespace-pre-wrap' : 'bg-card border border-border/60 shadow-soft rounded-bl-md')}>
                  {mine ? m.content : m.content ? <div className={md}><ReactMarkdown>{m.content}</ReactMarkdown></div> : <Dots />}
                </div>
                <div className={cn('flex items-center gap-1 mt-1 text-[10.5px] text-muted-foreground', mine && 'justify-end')}>
                  {m.createdAt && <span>{format(new Date(m.createdAt), 'HH:mm')}</span>}
                  {!mine && m.content && !(loading && m === last) && (
                    <span className={cn('flex items-center gap-0.5 transition-opacity', m.isFavorite ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 max-sm:opacity-100')}>
                      <Act label={m.isFavorite ? 'Bỏ yêu thích' : 'Yêu thích'} onClick={() => onFavorite(m.id)}>{m.isFavorite ? <BookmarkCheck className="h-3.5 w-3.5 text-primary" /> : <Bookmark className="h-3.5 w-3.5" />}</Act>
                      <Act label="Tạo ghi chú" onClick={() => onNote(m.content)}><FileText className="h-3.5 w-3.5" /></Act>
                      <Act label="Sao chép" onClick={() => { navigator.clipboard?.writeText(m.content); toast.success('Đã sao chép'); }}><Copy className="h-3.5 w-3.5" /></Act>
                    </span>
                  )}
                </div>
              </div>
              {mine && <span className="h-9 w-9 rounded-full bg-primary/90 text-primary-foreground grid place-items-center text-[12px] font-bold shrink-0">{initials}</span>}
            </div>
          </div>
        );
      })}
      {loading && last?.role !== 'assistant' && (
        <div className="flex gap-2.5"><span className="h-9 w-9 rounded-full bg-lavender grid place-items-center shrink-0 overflow-hidden"><Mascot name="ori" size={30} /></span><div className="rounded-[20px] rounded-bl-md bg-card border border-border/60 px-4 py-3"><Dots /></div></div>
      )}
      <div ref={end} />
    </div>
  );
}
const Act = ({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) => (
  <button onClick={onClick} title={label} aria-label={label} className="h-6 w-6 grid place-items-center rounded-full hover:bg-secondary hover:text-foreground">{children}</button>
);
const Dots = () => (
  <span className="flex gap-1 py-1">{[0, 150, 300].map((d) => <span key={d} className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: `${d}ms` }} />)}</span>
);
