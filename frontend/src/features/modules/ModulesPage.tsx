import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Page, PageHeader, Surface, SectionTitle, HeroBanner, TINTS } from '@/components/lio';
import { LifeIcon } from '@/components/icons/LifeIcon';
import { cn } from '@/lib/utils';
import { useEnabledModules } from '@/hooks/useEnabledModules';
import { usePreferencesSync } from '@/hooks/sync/usePreferencesSync';
import { MODULES, MODULE_IDS, type ModuleDef } from '@/lib/modules';

const CORE = [
  { label: 'Hôm nay', icon: 'module/today' }, { label: 'Công việc', icon: 'module/tasks' },
  { label: 'Thói quen', icon: 'module/habits' }, { label: 'AI Coach', icon: 'module/ai-coach' },
] as const;

/** Bật/tắt tính năng — menu, thanh bên và Thêm nhanh chỉ hiện những gì đang bật. */
export default function ModulesPage() {
  const navigate = useNavigate();
  const { enabled, isOn } = useEnabledModules();
  const { saveEnabledModules } = usePreferencesSync();
  const current = enabled ?? MODULE_IDS;
  const onCount = MODULES.filter((m) => isOn(m.id)).length;

  const toggle = (m: ModuleDef) => {
    const on = isOn(m.id);
    void saveEnabledModules(on ? current.filter((x) => x !== m.id) : [...current, m.id]);
    toast.success(on ? `Đã ẩn ${m.label}` : `Đã bật ${m.label}`, on || !m.paths[0] ? undefined : { action: { label: 'Mở', onClick: () => navigate(m.paths[0]) } });
  };

  const row = (m: ModuleDef) => {
    const on = isOn(m.id);
    return (
      <button key={m.id} onClick={() => toggle(m)} className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-secondary/50 text-left transition-colors">
        <span className={cn('h-10 w-10 rounded-[13px] grid place-items-center shrink-0', TINTS[m.tint].bg)}><LifeIcon name={m.icon} size={22} color={TINTS[m.tint].fg} /></span>
        <span className="flex-1 min-w-0"><span className="block text-[14px] font-semibold">{m.label}</span><span className="block text-[12px] text-muted-foreground leading-snug">{m.desc}</span></span>
        <span role="switch" aria-checked={on} className={cn('h-6 w-11 rounded-full p-0.5 transition-colors shrink-0', on ? 'bg-primary' : 'bg-border')}><span className={cn('block h-5 w-5 rounded-full bg-white shadow transition-transform', on && 'translate-x-5')} /></span>
      </button>
    );
  };

  const onList = MODULES.filter((m) => isOn(m.id));
  const offList = MODULES.filter((m) => !isOn(m.id));

  return (
    <Page>
      <PageHeader title="Tính năng" subtitle={`${onCount + CORE.length}/${MODULES.length + CORE.length} đang bật`} />
      <div className="space-y-4 max-w-[720px]">
        <HeroBanner mascot="ori" pose="explore" title="Chỉ hiện những gì bạn cần" subtitle="Bật thêm khi cần, tắt bớt cho gọn. Dữ liệu không bị xoá khi tắt." />
        <Surface className="p-4">
          <SectionTitle title="Luôn có sẵn" />
          <div className="grid grid-cols-4 gap-2 pt-1">
            {CORE.map((c) => (
              <div key={c.label} className="flex flex-col items-center gap-1.5 py-1">
                <span className="h-11 w-11 rounded-[14px] bg-secondary/70 grid place-items-center"><LifeIcon name={c.icon} size={24} /></span>
                <span className="text-[11.5px] font-medium text-center leading-tight">{c.label}</span>
              </div>
            ))}
          </div>
        </Surface>
        {onList.length > 0 && <Surface className="p-4"><SectionTitle title="Đang bật" hint={`${onList.length}`} /><div className="-mx-1">{onList.map(row)}</div></Surface>}
        {offList.length > 0 && <Surface className="p-4"><SectionTitle title="Mở thêm" hint={`${offList.length}`} /><div className="-mx-1">{offList.map(row)}</div></Surface>}
      </div>
    </Page>
  );
}
