import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronRight, Lock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LifeIcon } from '@/components/icons/LifeIcon';
import { HeroBanner, MascotCard, Page, PageHeader, ProgressBar, ProgressRing, SectionTitle, SegmentedTabs, StatTile, Surface, TINTS, type Tint } from '@/components/lio';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { STAGES } from './journey.data';

const STAGE_TINT: Tint[] = ['mint', 'sky', 'amber', 'violet'];
const STAGE_COLOR = ['#22C08A', '#3B8BF6', '#F5A524', '#7C5CFF'];
type View = 'all' | '1' | '2' | '3' | '4';

export default function JourneyPage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const habits = useLifeOSStore((s) => s.habits);
  const tasks = useLifeOSStore((s) => s.tasks);
  const goals = useLifeOSStore((s) => s.goals);
  const journalEntries = useLifeOSStore((s) => s.journalEntries);
  const weeklyReviews = useLifeOSStore((s) => s.weeklyReviews);
  const monthlyReviews = useLifeOSStore((s) => s.monthlyReviews);
  const dailyIntentions = useLifeOSStore((s) => s.dailyIntentions);
  const chatMessages = useLifeOSStore((s) => s.chatMessages);
  const lifeWheelScores = useLifeOSStore((s) => s.lifeWheelScores);
  const userPreferences = useLifeOSStore((s) => s.userPreferences);
  const [view, setView] = useState<View>('all');

  const stageResults = useMemo(() => {
    const live = { ...useLifeOSStore.getState(), habits, tasks, goals, journalEntries, weeklyReviews, monthlyReviews, dailyIntentions, chatMessages, lifeWheelScores, userPreferences };
    return STAGES.map((stage) => {
      const questResults = stage.quests.map((q) => ({ ...q, done: q.check(live) }));
      const doneCount = questResults.filter((q) => q.done).length;
      const totalXP = questResults.reduce((a, q) => a + q.xp, 0);
      const earnedXP = questResults.filter((q) => q.done).reduce((a, q) => a + q.xp, 0);
      return { ...stage, questResults, doneCount, totalXP, earnedXP, complete: doneCount === stage.quests.length };
    });
  }, [habits, tasks, goals, journalEntries, weeklyReviews, monthlyReviews, dailyIntentions, chatMessages, lifeWheelScores, userPreferences]);

  const totalXP = stageResults.reduce((a, s) => a + s.totalXP, 0);
  const earnedXP = stageResults.reduce((a, s) => a + s.earnedXP, 0);
  const totalQuests = stageResults.reduce((a, s) => a + s.quests.length, 0);
  const doneQuests = stageResults.reduce((a, s) => a + s.doneCount, 0);
  const overallPct = Math.round((doneQuests / totalQuests) * 100);
  const completeStages = stageResults.filter((s) => s.complete).length;
  // Một chặng được mở khi chặng trước có ít nhất 1 nhiệm vụ hoàn thành
  const isStageUnlocked = (i: number) => i === 0 || stageResults[i - 1].doneCount > 0;
  const nextQuest = stageResults.flatMap((s, i) => (isStageUnlocked(i) ? s.questResults.filter((q) => !q.done).map((q) => ({ ...q, stage: s })) : []))[0];
  const shown = view === 'all' ? stageResults : stageResults.filter((s) => String(s.id) === view);

  const side = (
    <div className="space-y-4">
      {nextQuest && (
        <Surface className="p-4">
          <SectionTitle title="Nhiệm vụ tiếp theo" />
          <div className="flex items-start gap-3">
            <span className={cn('h-10 w-10 rounded-[14px] grid place-items-center shrink-0', TINTS[STAGE_TINT[nextQuest.stage.id - 1]].bg)}><LifeIcon name={nextQuest.icon} size={22} variant="duotone" /></span>
            <div className="min-w-0">
              <p className="text-[13.5px] font-bold">{nextQuest.title}</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">{nextQuest.desc}</p>
            </div>
          </div>
          <Button className="w-full mt-3 rounded-full" onClick={() => navigate(nextQuest.path)}>Bắt đầu · +{nextQuest.xp} XP</Button>
        </Surface>
      )}
      <Surface className="p-4">
        <SectionTitle title="XP theo chặng" hint={`${earnedXP}/${totalXP}`} />
        <div className="space-y-3">
          {stageResults.map((s, i) => (
            <div key={s.id}>
              <div className="flex justify-between text-[12.5px] font-semibold mb-1"><span>{s.emoji} Chặng {s.id}: {s.title}</span><span className="text-muted-foreground">{s.earnedXP}</span></div>
              <ProgressBar value={(s.earnedXP / s.totalXP) * 100} color={STAGE_COLOR[i]} />
            </div>
          ))}
        </div>
      </Surface>
      <MascotCard mascot="ori" pose="explore" title="Từng bước một" quote="Không cần hoàn hảo — chỉ cần hoàn thành nhiệm vụ nhỏ tiếp theo." />
    </div>
  );

  return (
    <Page>
      <PageHeader title="Hành trình của tôi" subtitle="Hoàn thành từng bước để xây dựng cuộc sống bạn muốn 🏆" />
      <div className="overflow-x-auto no-scrollbar -mx-1 px-1 mb-5">
        <SegmentedTabs items={[{ id: 'all', label: 'Tất cả', count: totalQuests }, ...stageResults.map((s) => ({ id: String(s.id) as View, label: `${s.emoji} Chặng ${s.id}`, count: s.quests.length - s.doneCount }))]} value={view} onChange={setView} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] items-start">
        <div className="space-y-4 min-w-0">
          <HeroBanner mascot="ori" pose="explore" title={doneQuests === totalQuests ? 'Chúc mừng! Bạn đã hoàn thành hành trình 🎉' : `Bạn đã đi được ${overallPct}% hành trình`} subtitle={doneQuests === totalQuests ? 'Giờ là lúc sống với hệ thống bạn đã xây dựng!' : `${doneQuests}/${totalQuests} nhiệm vụ · ${earnedXP}/${totalXP} XP. Tiếp tục nào!`}
            action={doneQuests === totalQuests ? <Button className="h-10 rounded-full px-5 shadow-soft" onClick={() => navigate('/')}>Về Hôm nay <ChevronRight className="h-4 w-4 ml-1" /></Button> : nextQuest && <Button className="h-10 rounded-full px-5 shadow-soft" onClick={() => navigate(nextQuest.path)}>Tiếp tục: {nextQuest.title}</Button>}
            aside={<div className="hidden sm:flex absolute z-10 right-[180px] top-1/2 -translate-y-1/2"><ProgressRing value={overallPct} size={84} label={<span className="text-[16px] font-extrabold">{overallPct}%</span>} /></div>} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile icon={<span className="text-[22px]">🏁</span>} tint="violet" value={`${overallPct}%`} label="Tiến độ" hint="toàn hành trình" />
            <StatTile icon="status/success" tint="mint" value={`${doneQuests}/${totalQuests}`} label="Nhiệm vụ" hint="đã hoàn thành" />
            <StatTile icon={<span className="text-[22px]">⭐</span>} tint="amber" value={earnedXP} label="XP" hint={`trên ${totalXP} XP`} />
            <StatTile icon={<span className="text-[22px]">🏆</span>} tint="orange" value={`${completeStages}/${stageResults.length}`} label="Chặng" hint="đã hoàn thành" />
          </div>

          {shown.map((stage) => {
            const i = stage.id - 1;
            const unlocked = isStageUnlocked(i);
            return (
              <Surface key={stage.id} className={cn('p-4 sm:p-5', !unlocked && 'opacity-60')}>
                <div className="flex items-center gap-3 mb-3">
                  <span className={cn('h-12 w-12 rounded-[16px] grid place-items-center text-[24px] shrink-0', TINTS[STAGE_TINT[i]].bg)}>{stage.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[15px] font-extrabold">Chặng {stage.id}: {stage.title}</p>
                      {stage.complete && <span className="rounded-full bg-[#E3F8EE] text-[#1F9D63] px-2 py-0.5 text-[11px] font-semibold">Hoàn thành ✓</span>}
                      {!unlocked && <span className="rounded-full bg-secondary text-muted-foreground px-2 py-0.5 text-[11px] font-semibold inline-flex items-center gap-1"><Lock className="h-3 w-3" />Khóa</span>}
                    </div>
                    <p className="text-[12px] text-muted-foreground">{stage.subtitle}</p>
                  </div>
                  <span className="text-[14px] font-extrabold shrink-0" style={{ color: STAGE_COLOR[i] }}>{stage.doneCount}/{stage.quests.length}</span>
                </div>
                <ProgressBar value={(stage.doneCount / stage.quests.length) * 100} color={STAGE_COLOR[i]} className="mb-2" />
                <div className="divide-y divide-border/50">
                  {stage.questResults.map((q) => (
                    <div key={q.id} className="flex items-center gap-3 py-3">
                      <span className={cn('h-10 w-10 rounded-[14px] grid place-items-center shrink-0', q.done ? 'bg-primary text-primary-foreground' : 'bg-secondary')}>
                        {q.done ? <CheckCircle2 className="h-5 w-5" /> : !unlocked ? <Lock className="h-4 w-4 text-muted-foreground" /> : <LifeIcon name={q.icon} size={22} variant="duotone" />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className={cn('text-[13.5px] font-semibold', q.done && 'line-through text-muted-foreground')}>{q.title}</p>
                          <span className="rounded-full bg-[#FFF4DB] text-[#B7791F] dark:bg-amber-500/15 px-1.5 py-0.5 text-[10.5px] font-bold">+{q.xp} XP</span>
                        </div>
                        <p className="text-[12px] text-muted-foreground mt-0.5">{q.desc}</p>
                      </div>
                      {!q.done && unlocked && (
                        <Button asChild size="sm" variant="ghost" className="rounded-full text-primary shrink-0"><Link to={q.path}>{isMobile ? <ChevronRight className="h-4 w-4" /> : <>Bắt đầu <ChevronRight className="h-3.5 w-3.5 ml-0.5" /></>}</Link></Button>
                      )}
                    </div>
                  ))}
                </div>
                {stage.complete && (
                  <div className="flex items-center gap-2 mt-2 rounded-2xl bg-primary/10 px-3 py-2">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    <p className="text-[12px] font-semibold text-primary">Xuất sắc! Bạn đã hoàn thành chặng này và nhận được {stage.earnedXP} XP.</p>
                  </div>
                )}
              </Surface>
            );
          })}
          {isMobile && side}
        </div>
        {!isMobile && <aside className="hidden xl:block sticky top-4">{side}</aside>}
      </div>
    </Page>
  );
}
