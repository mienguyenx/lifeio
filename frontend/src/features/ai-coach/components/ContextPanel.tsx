import { Link } from 'react-router-dom';
import { LifeIcon, type LifeIconName } from '@/components/icons/LifeIcon';
import { SectionTitle, Surface, TINTS, type Tint } from '@/components/lio';
import { cn } from '@/lib/utils';
import type { CoachApi } from '../hooks/useCoach';
import { MOODS } from '@/features/journal/utils/journal.utils';

function Row({ icon, tint, title, desc }: { icon: LifeIconName; tint: Tint; title: string; desc: string }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className={cn('h-9 w-9 rounded-[12px] grid place-items-center shrink-0', TINTS[tint].bg)}><LifeIcon name={icon} size={20} variant="duotone" /></span>
      <span className="min-w-0"><span className="block text-[13px] font-semibold truncate">{title}</span><span className="block text-[11.5px] text-muted-foreground truncate">{desc}</span></span>
    </div>
  );
}

/** Bối cảnh mà AI Coach nhận kèm mỗi câu hỏi (userContext + dailyStats) và gợi ý hôm nay. */
export function ContextPanel({ api, onPrompt, suggestions: showSuggestions = true }: { api: CoachApi; onPrompt: (p: string) => void; suggestions?: boolean }) {
  const { today, user, suggestions } = api;
  const mood = today.avgMood ? MOODS[Math.round(today.avgMood) - 1] : undefined;
  return (
    <div className="space-y-4">
      <Surface className="p-4">
        <SectionTitle title="Thông tin của bạn" action={<Link to="/me" className="text-[12px] font-semibold text-primary">Cập nhật</Link>} />
        <Row icon="module/goals" tint="violet" title="Mục tiêu hiện tại" desc={`${today.activeGoals.length} mục tiêu · TB ${today.avgGoal}%`} />
        <Row icon="module/habits" tint="mint" title="Thói quen" desc={`${today.habitsDone}/${today.habitsTotal} hôm nay`} />
        <Row icon="module/tasks" tint="orange" title="Công việc" desc={`${today.tasksPending} chưa xong${today.overdue ? ` · ${today.overdue} quá hạn` : ''}`} />
        <Row icon="mood/happy" tint="amber" title="Tâm trạng 7 ngày" desc={mood ? `${mood.emoji} ${mood.label} (${today.avgMood.toFixed(1)})` : 'Chưa có nhật ký'} />
        <Row icon="module/life-areas" tint="sky" title="Vision & Values" desc={user.lifePurpose ? user.lifePurpose : `${user.visions?.length || 0} tầm nhìn · ${user.personalValues?.length || 0} giá trị`} />
      </Surface>
      {showSuggestions && <Surface className="p-4">
        <SectionTitle title="Gợi ý hôm nay" />
        {suggestions.length === 0 ? <p className="text-[12.5px] text-muted-foreground">Bạn đã hoàn thành mọi thứ hôm nay 🎉</p> : (
          <div className="space-y-2">
            {suggestions.map((s) => (
              <button key={s.title} onClick={() => onPrompt(s.prompt)} className="w-full flex items-center gap-3 rounded-2xl bg-secondary/50 hover:bg-secondary px-3 py-2.5 text-left">
                <span className="text-[18px]">{s.emoji}</span>
                <span className="min-w-0"><span className="block text-[12.5px] font-semibold truncate">{s.title}</span><span className="block text-[11px] text-muted-foreground truncate">{s.desc}</span></span>
              </button>
            ))}
          </div>
        )}
      </Surface>}
    </div>
  );
}
