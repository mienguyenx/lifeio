import { useRef, useState } from 'react';
import { AudioLines, Mic, Send, Square } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useVoiceInput, voiceSupport } from '../voice/speech';

export function Composer({ onSend, onVoiceChat, disabled, chips, className }: {
  onSend: (t: string, opts?: { voice?: boolean }) => void;
  onVoiceChat?: () => void;
  disabled?: boolean; chips?: string[]; className?: string;
}) {
  const [v, setV] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);
  const base = useRef('');
  const submit = () => { if (!v.trim() || disabled) return; onSend(v); setV(''); if (ref.current) ref.current.style.height = 'auto'; };
  const voice = useVoiceInput({
    onFinal: (t) => {
      const text = `${base.current} ${t}`.trim();
      if (t && text) { onSend(text, { voice: true }); setV(''); } else setV(base.current);
    },
    onError: (m) => toast.error(m),
  });
  const canVoice = voiceSupport().native || voiceSupport().recorder;
  const toggleMic = () => {
    if (voice.state === 'listening') return voice.stop();
    base.current = v.trim();
    void voice.start();
  };
  const shown = voice.state === 'listening' ? `${base.current} ${voice.interim}`.trim() : v;

  return (
    <div className={cn('space-y-2', className)}>
      {!!chips?.length && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar">{chips.map((c) => (
          <button key={c} onClick={() => onSend(c)} disabled={disabled} className="h-8 px-3 rounded-full bg-lavender dark:bg-primary/15 text-primary text-[12px] font-semibold whitespace-nowrap shrink-0 disabled:opacity-50">{c}</button>
        ))}</div>
      )}
      <div className={cn('flex items-end gap-1.5 rounded-[24px] bg-card border border-border shadow-soft p-1.5 pl-4 focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/10', voice.listening && 'border-primary/50 ring-4 ring-primary/10')}>
        <textarea ref={ref} rows={1} value={shown} readOnly={voice.listening}
          placeholder={voice.listening ? 'Đang nghe… nói đi bạn' : voice.state === 'transcribing' ? 'Đang chép lời…' : 'Hỏi hoặc ra lệnh: “Nhắc tôi gọi mẹ lúc 6h tối”…'}
          onChange={(e) => { setV(e.target.value); e.target.style.height = 'auto'; e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`; }}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
          className="flex-1 min-w-0 resize-none bg-transparent py-2.5 text-[14px] focus:outline-none max-h-32" />
        {canVoice && (
          <button onClick={toggleMic} disabled={disabled || voice.state === 'transcribing'} aria-label={voice.listening ? 'Dừng ghi âm' : 'Nói để nhập'} title={voice.listening ? 'Dừng' : 'Nói để nhập (giọng nói)'}
            className={cn('relative h-10 w-10 rounded-full grid place-items-center shrink-0 transition-colors disabled:opacity-40', voice.listening ? 'bg-[#F2557A] text-white' : 'text-muted-foreground hover:bg-secondary hover:text-foreground')}>
            {voice.listening && <span className="absolute inset-0 rounded-full bg-[#F2557A]/40 animate-ping" />}
            {voice.listening ? <Square className="h-3.5 w-3.5 relative fill-current" /> : <Mic className="h-[18px] w-[18px]" />}
          </button>
        )}
        {onVoiceChat && !v.trim() && !voice.listening ? (
          <button onClick={onVoiceChat} disabled={disabled} aria-label="Voice Chat" title="Trò chuyện bằng giọng nói" className="h-10 w-10 rounded-full bg-primary text-primary-foreground grid place-items-center shrink-0 shadow-soft disabled:opacity-40"><AudioLines className="h-[18px] w-[18px]" /></button>
        ) : (
          <button onClick={submit} disabled={!v.trim() || disabled || voice.listening} aria-label="Gửi" className="h-10 w-10 rounded-full bg-primary text-primary-foreground grid place-items-center shrink-0 shadow-soft disabled:opacity-40"><Send className="h-4 w-4" /></button>
        )}
      </div>
    </div>
  );
}
