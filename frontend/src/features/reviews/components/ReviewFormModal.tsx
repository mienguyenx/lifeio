import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Lightbulb } from 'lucide-react';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { Field, FormActions, areaCls, fieldCls } from '@/components/lio/form';
import { cn } from '@/lib/utils';
import type { LifeArea } from '@/types/lifeos';
import { ScoreEditor } from '@/features/life-wheel/components/ScoreEditor';
import { RATING_OPTIONS, type Rating } from '../utils/reviews.utils';

export type ReviewDraft = { overallRating: Rating; areaRatings: Record<LifeArea, number>; text: Record<string, string> };
export type ReviewField = { key: string; label: string; placeholder?: string; rows?: number; input?: boolean; half?: boolean; prompts?: string[]; hint?: string };

const MODAL = 'sm:max-w-[560px] rounded-[28px] max-h-[92vh] overflow-y-auto';

/** Modal review dùng chung cho tuần / tháng / năm: điểm tổng quan 1–5, các ô nội dung, điểm 10 lĩnh vực. */
export function ReviewFormModal({ open, onOpenChange, title, ratingLabel, initial, fields, areasLabel = 'Đánh giá theo lĩnh vực (1–10)', areasNote, prevAreas, top, submitLabel = 'Lưu review', onSubmit }: {
  open: boolean; onOpenChange: (o: boolean) => void; title: string; ratingLabel: string; initial: ReviewDraft; fields: ReviewField[];
  areasLabel?: string; areasNote?: ReactNode; prevAreas?: Record<LifeArea, number>; top?: ReactNode; submitLabel?: string; onSubmit: (d: ReviewDraft) => void;
}) {
  const [d, setD] = useState(initial);
  const [areasOpen, setAreasOpen] = useState(false);
  const [pi, setPi] = useState<Record<string, number>>({});
  useEffect(() => { if (open) { setD(initial); setAreasOpen(false); } }, [open, initial]);
  const setText = (k: string, v: string) => setD((x) => ({ ...x, text: { ...x.text, [k]: v } }));
  const insertPrompt = (f: ReviewField) => {
    const i = pi[f.key] ?? 0; const p = f.prompts![i % f.prompts!.length];
    const cur = d.text[f.key] ?? '';
    setText(f.key, cur ? `${cur}\n${p}: ` : `${p}: `); setPi({ ...pi, [f.key]: i + 1 });
  };
  return (
    <AdaptiveModal open={open} onOpenChange={onOpenChange} title={title} className={MODAL}>
      <form className="space-y-4 min-w-0" onSubmit={(e) => { e.preventDefault(); onSubmit(d); onOpenChange(false); }}>
        {top}
        <Field label={ratingLabel}>
          <div className="grid grid-cols-5 gap-2">
            {RATING_OPTIONS.map((r) => (
              <button key={r.value} type="button" onClick={() => setD({ ...d, overallRating: r.value })}
                className={cn('h-16 min-w-0 rounded-2xl border flex flex-col items-center justify-center gap-0.5 transition-all', d.overallRating === r.value ? 'border-primary ring-4 ring-primary/10' : 'border-border/70')}>
                <span className="text-[22px] leading-none">{r.emoji}</span>
                <span className={cn('text-[10.5px] font-semibold truncate max-w-full px-1', d.overallRating === r.value ? 'text-primary' : 'text-muted-foreground')}>{r.label}</span>
              </button>
            ))}
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          {fields.map((f) => (
            <Field key={f.key} label={f.label} className={f.half ? 'col-span-2 sm:col-span-1' : 'col-span-2'}
              hint={f.prompts ? <button type="button" onClick={() => insertPrompt(f)} className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-primary"><Lightbulb className="h-3.5 w-3.5" />Gợi ý</button> : f.hint ? <span className="text-[11px] text-muted-foreground">{f.hint}</span> : undefined}>
              {f.input ? <input value={d.text[f.key] ?? ''} onChange={(e) => setText(f.key, e.target.value)} placeholder={f.placeholder} className={fieldCls} />
                : <textarea rows={f.rows ?? 3} value={d.text[f.key] ?? ''} onChange={(e) => setText(f.key, e.target.value)} placeholder={f.placeholder} className={areaCls} />}
            </Field>
          ))}
        </div>
        <div className="rounded-[22px] border border-border/70">
          <button type="button" onClick={() => setAreasOpen((o) => !o)} className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left">
            <span className="min-w-0"><span className="block text-[13px] font-semibold">🧭 {areasLabel}</span>{areasNote && <span className="block text-[11.5px] text-muted-foreground">{areasNote}</span>}</span>
            <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform shrink-0', areasOpen && 'rotate-180')} />
          </button>
          {areasOpen && <div className="px-3 pb-3"><ScoreEditor value={d.areaRatings} onChange={(v) => setD({ ...d, areaRatings: v })} prev={prevAreas} /><Link to="/life-wheel" className="block text-right text-[11.5px] font-semibold text-primary mt-1 pr-1">Xem bánh xe cuộc sống →</Link></div>}
        </div>
        <FormActions onCancel={() => onOpenChange(false)} submitLabel={submitLabel} />
      </form>
    </AdaptiveModal>
  );
}
