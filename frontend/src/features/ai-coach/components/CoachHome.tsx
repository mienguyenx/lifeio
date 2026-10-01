import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LifeIcon } from '@/components/icons/LifeIcon';
import { HeroBanner, SectionTitle, TINTS } from '@/components/lio';
import { QUICK_ACTIONS, QUICK_PROMPTS } from '../utils/coach.utils';

export function CoachHome({ name, hasProfile, onPrompt, compact, hero = true }: { name?: string; hasProfile: boolean; onPrompt: (p: string) => void; compact?: boolean; hero?: boolean }) {
  return (
    <div className="space-y-5 py-1">
      {hero && <HeroBanner mascot="ori" pose="idea" title={<>Xin chào{name ? `, ${name}` : ''}! 👋</>}
        subtitle={hasProfile ? 'Mình là Ori — AI Coach của bạn. Mình đã hiểu Vision & Values của bạn, hãy hỏi mình bất cứ điều gì!' : 'Mình là Ori — AI Coach của bạn. Thiết lập Vision & Values trong trang “Me” để nhận tư vấn cá nhân hóa hơn.'} />}
      {(hero || compact) && <div>
        <SectionTitle title="Mình có thể giúp gì cho bạn hôm nay?" />
        <div className={cn('grid gap-2.5', compact ? 'grid-cols-2' : 'grid-cols-2 2xl:grid-cols-3')}>
          {QUICK_ACTIONS.map((a) => (
            <button key={a.title} onClick={() => onPrompt(a.prompt)} className="flex items-center gap-3 rounded-[20px] bg-card border border-border/60 shadow-soft p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-card min-w-0">
              <span className={cn('h-10 w-10 rounded-[13px] grid place-items-center shrink-0', TINTS[a.tint].bg)}><LifeIcon name={a.icon} size={22} variant="duotone" /></span>
              <span className="min-w-0 flex-1"><span className="block text-[13px] font-semibold truncate">{a.title}</span><span className="block text-[11.5px] text-muted-foreground truncate">{a.desc}</span></span>
              
            </button>
          ))}
        </div>
      </div>}
      {!hero && !compact && (
        <div className="flex gap-3 max-w-[560px]">
          <span className="h-9 w-9 rounded-full bg-lavender dark:bg-primary/15 grid place-items-center shrink-0"><Sparkles className="h-4 w-4 text-primary" /></span>
          <div className="rounded-[20px] rounded-tl-md bg-secondary/60 px-4 py-3 text-[13px] leading-relaxed">
            Chào {name || 'bạn'}! Mình là Ori — AI Coach của bạn 👋<br />Mình có thể giúp bạn lập kế hoạch, phân tích tiến độ và gợi ý cá nhân hóa. Hôm nay bạn muốn tập trung vào điều gì?
          </div>
        </div>
      )}
      <div>
        <SectionTitle title="Câu hỏi gợi ý" />
        <div className="flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((p) => (
            <button key={p.text} onClick={() => onPrompt(p.text)} className="min-h-9 py-1.5 px-3.5 rounded-full bg-card border border-border/70 hover:border-primary/40 hover:text-primary text-[12.5px] font-medium text-left">{p.icon} {p.text}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
