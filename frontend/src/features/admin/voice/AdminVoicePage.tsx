// Admin → Giọng nói AI: xoay vòng nhiều API key ElevenLabs & Fish Audio (LIO kit)
// Key thêm/sửa ở Admin → API Keys; trang này xem sức khỏe kho key, hạn mức, thứ tự xoay vòng,
// cấu hình giọng đọc và nghe thử.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, AudioLines, CheckCircle2, Gauge, KeyRound, Loader2, Pause, Play, Plus, RefreshCw, RotateCcw, Save, ShieldCheck, Star, TimerReset } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/brand/EmptyState';
import { Fab, HeroBanner, MascotCard, Page, PageHeader, ProgressBar, SectionTitle, SegmentedTabs, StatTile, Surface } from '@/components/lio';
import { Field, fieldCls } from '@/components/lio/form';
import { apiFetch, functionUrl, getAccessToken } from '@/integrations/api/httpClient';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { InfoRow, Pill, RowMenu, ToggleRow, fmtDate } from '../shared';

type Provider = 'elevenlabs' | 'fish_audio';
type Rotation = 'round_robin' | 'primary_first' | 'least_used';
interface VoiceSettings {
  tts_provider: 'auto' | Provider | 'browser';
  stt_provider: 'auto' | Provider | 'gemini';
  rotation: Rotation;
  fallback_other: boolean;
  elevenlabs: { voice_id: string; model_id: string; stability: number; similarity_boost: number; speed: number };
  fish_audio: { reference_id: string; model: string; speed: number };
  rate_limit_cooldown_min: number;
}
interface PoolKey {
  id: string; provider: Provider; name: string; is_active: boolean; is_primary: boolean;
  usage_count: number; today: number; month: number; limit_per_day: number | null; limit_per_month: number | null;
  last_used_at: string | null; last_error: string | null; error_count: number; masked: string; status: string;
  cooldown_until: string | null; voice_id: string | null; model: string | null;
  quota: { used: number | null; limit: number | null; credit: number | null; unit: string | null; plan: string | null; reset_at: string | null; checked_at: string | null; message: string | null };
}
interface Pool { settings: VoiceSettings; next: Record<Provider, string | null>; keys: PoolKey[] }

const PROV: Record<Provider, { label: string; color: string; site: string }> = {
  elevenlabs: { label: 'ElevenLabs', color: '#7C5CFC', site: 'elevenlabs.io' },
  fish_audio: { label: 'Fish Audio', color: '#2F7BF6', site: 'fish.audio' },
};
const ROTATIONS: { id: Rotation; label: string; hint: string }[] = [
  { id: 'round_robin', label: 'Xoay vòng đều', hint: 'Lần lượt từng key (key lâu chưa dùng nhất đi trước) — chia đều hạn mức.' },
  { id: 'primary_first', label: 'Ưu tiên key chính', hint: 'Luôn dùng key chính; chỉ chuyển sang key phụ khi key chính lỗi/hết hạn mức.' },
  { id: 'least_used', label: 'Ít dùng nhất', hint: 'Chọn key có ít lượt gọi nhất trong ngày/tháng.' },
];
const EL_MODELS = [
  { v: 'eleven_flash_v2_5', l: 'Flash v2.5 — nhanh, rẻ, có tiếng Việt' },
  { v: 'eleven_turbo_v2_5', l: 'Turbo v2.5 — cân bằng' },
  { v: 'eleven_multilingual_v2', l: 'Multilingual v2 — tự nhiên nhất' },
  { v: 'eleven_v3', l: 'Eleven v3 — biểu cảm (alpha)' },
];
const FISH_MODELS = [{ v: 's1', l: 'S1 — mới nhất' }, { v: 'speech-1.6', l: 'Speech 1.6' }, { v: 'speech-1.5', l: 'Speech 1.5' }];
const SAMPLE = 'Xin chào! Mình là Lio, trợ lý của bạn. Hôm nay bạn còn ba việc cần làm và hai thói quen chưa check-in nhé.';

const statusPill = (k: PoolKey, isNext: boolean) => {
  if (k.status === 'ok') return <Pill tone={isNext ? 'violet' : 'green'} icon={isNext ? <Play className="h-3 w-3 fill-current" /> : <CheckCircle2 className="h-3 w-3" />}>{isNext ? 'Dùng kế tiếp' : 'Sẵn sàng'}</Pill>;
  if (!k.is_active) return <Pill tone="gray">Đang tắt</Pill>;
  if (k.cooldown_until) return <Pill tone="amber" icon={<TimerReset className="h-3 w-3" />}>{k.status} · đến {fmtDate(k.cooldown_until, 'HH:mm dd/MM')}</Pill>;
  return <Pill tone="red">{k.status}</Pill>;
};

function quotaView(k: PoolKey) {
  const q = k.quota;
  if (q.limit && q.used != null) {
    const pct = Math.min(100, Math.round((Number(q.used) / Number(q.limit)) * 100));
    return { pct, text: `${Number(q.used).toLocaleString('vi-VN')} / ${Number(q.limit).toLocaleString('vi-VN')} ký tự`, sub: q.reset_at ? `Làm mới ${fmtDate(q.reset_at)}` : q.plan || '' };
  }
  if (q.credit != null) return { pct: null, text: `${Number(q.credit).toLocaleString('vi-VN', { maximumFractionDigits: 3 })} USD tín dụng`, sub: '' };
  return { pct: null, text: q.message || 'Chưa kiểm tra hạn mức', sub: '' };
}

export default function AdminVoicePage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: pool, isLoading, isError } = useQuery({ queryKey: ['admin-voice-pool'], queryFn: () => apiFetch<Pool>('/functions/voice/pool'), refetchInterval: 30_000 });
  const setPool = (p: Pool) => { qc.setQueryData(['admin-voice-pool'], p); qc.invalidateQueries({ queryKey: ['admin-api-keys'] }); };

  const [tab, setTab] = useState<'all' | Provider>('all');
  const [draft, setDraft] = useState<VoiceSettings | null>(null);
  useEffect(() => { if (pool && !draft) setDraft(pool.settings); }, [pool, draft]);
  const dirty = !!pool && !!draft && JSON.stringify(pool.settings) !== JSON.stringify(draft);

  const save = useMutation({
    mutationFn: (s: VoiceSettings) => apiFetch<Pool>('/functions/voice/settings', { method: 'PUT', body: s }),
    onSuccess: (p) => { setPool(p); setDraft(p.settings); toast.success('Đã lưu cấu hình giọng nói'); },
    onError: (e: Error) => toast.error(e.message || 'Không lưu được'),
  });
  const check = useMutation({
    mutationFn: (id?: string) => apiFetch<{ results: { id: string; ok: boolean; message: string }[]; pool: Pool }>('/functions/voice/check', { method: 'POST', body: id ? { id } : {} }),
    onSuccess: (r) => {
      setPool(r.pool);
      const bad = r.results.filter((x) => !x.ok).length;
      if (r.results.length === 1) toast[r.results[0].ok ? 'success' : 'error'](r.results[0].message);
      else toast[bad ? 'warning' : 'success'](bad ? `${r.results.length - bad}/${r.results.length} key ổn · ${bad} key có vấn đề` : `Cả ${r.results.length} key đều ổn`);
    },
    onError: (e: Error) => toast.error(e.message || 'Không kiểm tra được'),
  });
  const reset = useMutation({
    mutationFn: (id: string) => apiFetch<Pool>('/functions/voice/reset', { method: 'POST', body: { id } }),
    onSuccess: (p) => { setPool(p); toast.success('Đã gỡ tạm nghỉ & xóa lỗi'); },
  });

  // Nghe thử
  const [sample, setSample] = useState(SAMPLE);
  const [testing, setTesting] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [lastTest, setLastTest] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopAudio = () => { audioRef.current?.pause(); setPlaying(false); };
  useEffect(() => () => audioRef.current?.pause(), []);
  const test = async (opts: { provider?: Provider; key_id?: string; tag: string }) => {
    stopAudio(); setTesting(opts.tag);
    try {
      const token = await getAccessToken();
      const r = await fetch(functionUrl('tts'), { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ text: sample.trim() || SAMPLE, provider: opts.provider, key_id: opts.key_id }) });
      if (!r.ok) { const j = await r.json().catch(() => null); throw new Error(j?.error || j?.message || `Lỗi ${r.status}`); }
      const blob = await r.blob();
      const prov = r.headers.get('X-Voice-Provider') as Provider | null;
      const keyName = decodeURIComponent(r.headers.get('X-Voice-Key') || '');
      const tried = Number(r.headers.get('X-Voice-Tried') || 1);
      setLastTest(`${prov ? PROV[prov]?.label : 'Máy chủ'} · key “${keyName}”${tried > 1 ? ` (đã thử ${tried} key)` : ''}`);
      const a = audioRef.current ?? new Audio(); audioRef.current = a;
      a.src = URL.createObjectURL(blob); a.onended = () => setPlaying(false);
      await a.play(); setPlaying(true);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setTesting(null);
      qc.invalidateQueries({ queryKey: ['admin-voice-pool'] });
    }
  };

  const keys = useMemo(() => pool?.keys ?? [], [pool]);
  const shown = keys.filter((k) => tab === 'all' || k.provider === tab);
  const healthy = keys.filter((k) => k.status === 'ok');
  const cooling = keys.filter((k) => k.cooldown_until);
  const today = keys.reduce((a, k) => a + (k.today || 0), 0);
  const d = draft;
  const upd = (patch: Partial<VoiceSettings>) => d && setDraft({ ...d, ...patch });

  const settingsCard = d && (
    <Surface className="p-4">
      <SectionTitle title="Cấu hình" hint={dirty ? 'chưa lưu' : undefined} />
      <div className="space-y-3.5">
        <Field label="Giọng đọc (TTS)">
          <Select value={d.tts_provider} onValueChange={(v) => upd({ tts_provider: v as VoiceSettings['tts_provider'] })}>
            <SelectTrigger className="h-11 rounded-2xl bg-card"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Tự động: ElevenLabs → Fish Audio</SelectItem>
              <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
              <SelectItem value="fish_audio">Fish Audio</SelectItem>
              <SelectItem value="browser">Giọng trình duyệt (miễn phí)</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Chép lời (STT)">
          <Select value={d.stt_provider} onValueChange={(v) => upd({ stt_provider: v as VoiceSettings['stt_provider'] })}>
            <SelectTrigger className="h-11 rounded-2xl bg-card"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Tự động: ElevenLabs → Fish → Gemini</SelectItem>
              <SelectItem value="elevenlabs">ElevenLabs Scribe</SelectItem>
              <SelectItem value="fish_audio">Fish Audio ASR</SelectItem>
              <SelectItem value="gemini">Chỉ Gemini</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <div>
          <p className="text-[12.5px] font-semibold mb-1.5">Chiến lược xoay vòng key</p>
          <SegmentedTabs size="sm" full items={ROTATIONS.map((r) => ({ id: r.id, label: r.label }))} value={d.rotation} onChange={(v) => upd({ rotation: v })} />
          <p className="text-[11.5px] text-muted-foreground mt-1.5">{ROTATIONS.find((r) => r.id === d.rotation)?.hint}</p>
        </div>
        <ToggleRow title="Chuyển provider khi hết key" hint="Hết key khỏe ở provider đã chọn thì thử provider còn lại"><Switch checked={d.fallback_other} onCheckedChange={(v) => upd({ fallback_other: v })} aria-label="Chuyển provider" /></ToggleRow>
        <Field label="Tạm nghỉ khi bị giới hạn tốc độ (phút)"><input type="number" min={0} max={1440} className={fieldCls} value={d.rate_limit_cooldown_min} onChange={(e) => upd({ rate_limit_cooldown_min: Number(e.target.value) })} /></Field>

        <div className="rounded-2xl bg-secondary/40 p-3 space-y-3">
          <p className="text-[12.5px] font-bold flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: PROV.elevenlabs.color }} />ElevenLabs</p>
          <Field label="Voice ID mặc định"><input className={cn(fieldCls, 'font-mono text-[13px]')} value={d.elevenlabs.voice_id} onChange={(e) => upd({ elevenlabs: { ...d.elevenlabs, voice_id: e.target.value } })} placeholder="JBFqnCBsd6RMkjVDRZzb" /></Field>
          <Field label="Model">
            <Select value={d.elevenlabs.model_id} onValueChange={(v) => upd({ elevenlabs: { ...d.elevenlabs, model_id: v } })}>
              <SelectTrigger className="h-11 rounded-2xl bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>{[...EL_MODELS, ...(EL_MODELS.some((m) => m.v === d.elevenlabs.model_id) ? [] : [{ v: d.elevenlabs.model_id, l: d.elevenlabs.model_id }])].map((m) => <SelectItem key={m.v} value={m.v}>{m.l}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Ổn định"><input type="number" step={0.05} min={0} max={1} className={fieldCls} value={d.elevenlabs.stability} onChange={(e) => upd({ elevenlabs: { ...d.elevenlabs, stability: Number(e.target.value) } })} /></Field>
            <Field label="Giống giọng"><input type="number" step={0.05} min={0} max={1} className={fieldCls} value={d.elevenlabs.similarity_boost} onChange={(e) => upd({ elevenlabs: { ...d.elevenlabs, similarity_boost: Number(e.target.value) } })} /></Field>
            <Field label="Tốc độ"><input type="number" step={0.05} min={0.7} max={1.2} className={fieldCls} value={d.elevenlabs.speed} onChange={(e) => upd({ elevenlabs: { ...d.elevenlabs, speed: Number(e.target.value) } })} /></Field>
          </div>
        </div>
        <div className="rounded-2xl bg-secondary/40 p-3 space-y-3">
          <p className="text-[12.5px] font-bold flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: PROV.fish_audio.color }} />Fish Audio</p>
          <Field label="Reference ID giọng (từ fish.audio)"><input className={cn(fieldCls, 'font-mono text-[13px]')} value={d.fish_audio.reference_id} onChange={(e) => upd({ fish_audio: { ...d.fish_audio, reference_id: e.target.value } })} placeholder="Để trống = giọng mặc định" /></Field>
          <div className="grid grid-cols-[1fr_96px] gap-2">
            <Field label="Model">
              <Select value={d.fish_audio.model} onValueChange={(v) => upd({ fish_audio: { ...d.fish_audio, model: v } })}>
                <SelectTrigger className="h-11 rounded-2xl bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>{[...FISH_MODELS, ...(FISH_MODELS.some((m) => m.v === d.fish_audio.model) ? [] : [{ v: d.fish_audio.model, l: d.fish_audio.model }])].map((m) => <SelectItem key={m.v} value={m.v}>{m.l}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Tốc độ"><input type="number" step={0.1} min={0.5} max={2} className={fieldCls} value={d.fish_audio.speed} onChange={(e) => upd({ fish_audio: { ...d.fish_audio, speed: Number(e.target.value) } })} /></Field>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="h-10 rounded-full" disabled={!dirty} onClick={() => pool && setDraft(pool.settings)}>Hoàn tác</Button>
          <Button className="h-10 rounded-full shadow-soft" disabled={!dirty || save.isPending} onClick={() => d && save.mutate(d)}>{save.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}Lưu</Button>
        </div>
      </div>
    </Surface>
  );

  const testCard = (
    <Surface className="p-4">
      <SectionTitle title="Nghe thử" hint="dùng đúng luồng xoay vòng" />
      <textarea className={cn(fieldCls, 'min-h-[84px] py-2.5 resize-none')} value={sample} onChange={(e) => setSample(e.target.value)} maxLength={500} aria-label="Văn bản nghe thử" />
      <div className="grid grid-cols-3 gap-2 mt-2.5">
        <Button className="h-10 rounded-full shadow-soft col-span-3" disabled={!!testing} onClick={() => (playing ? stopAudio() : test({ tag: 'auto' }))}>
          {testing === 'auto' ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : playing ? <Pause className="h-4 w-4 mr-1.5" /> : <Play className="h-4 w-4 mr-1.5" />}{playing ? 'Dừng' : 'Nghe thử (tự xoay vòng)'}
        </Button>
        {(['elevenlabs', 'fish_audio'] as Provider[]).map((p) => (
          <Button key={p} variant="outline" className="h-9 rounded-full text-[12.5px] col-span-3 sm:col-span-1 xl:col-span-3 2xl:col-span-1 first-of-type:2xl:col-span-2" disabled={!!testing || !keys.some((k) => k.provider === p && k.is_active)} onClick={() => test({ provider: p, tag: p })}>
            {testing === p ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <AudioLines className="h-4 w-4 mr-1.5" />}{PROV[p].label}
          </Button>
        ))}
      </div>
      {lastTest && <p className="text-[11.5px] text-muted-foreground mt-2">Vừa phát: {lastTest}</p>}
    </Surface>
  );

  return (
    <Page>
      <PageHeader title="Giọng nói AI" subtitle="ElevenLabs & Fish Audio · tự xoay vòng nhiều API key khi lỗi hoặc hết hạn mức"
        actions={<>
          <Button variant="outline" className="h-10 rounded-full px-4" disabled={check.isPending || !keys.length} onClick={() => check.mutate(undefined)}>{check.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Gauge className="h-4 w-4 mr-1.5" />}{isMobile ? 'Hạn mức' : 'Kiểm tra hạn mức'}</Button>
          {!isMobile && <Button asChild className="h-10 rounded-full px-5 shadow-soft"><Link to="/admin/api-keys?new=elevenlabs"><Plus className="h-4 w-4 mr-1.5" />Thêm key</Link></Button>}
        </>} />
      <div className="mb-5 overflow-x-auto -mx-1 px-1">
        <SegmentedTabs items={[{ id: 'all', label: 'Tất cả', count: keys.length }, { id: 'elevenlabs', label: 'ElevenLabs', count: keys.filter((k) => k.provider === 'elevenlabs').length }, { id: 'fish_audio', label: 'Fish Audio', count: keys.filter((k) => k.provider === 'fish_audio').length }]} value={tab} onChange={(v) => setTab(v as typeof tab)} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] items-start">
        <div className="space-y-4 min-w-0">
          <HeroBanner mascot="ori" pose="idea" title="Kho giọng nói" subtitle={keys.length ? `${healthy.length}/${keys.length} key sẵn sàng · ${ROTATIONS.find((r) => r.id === pool?.settings.rotation)?.label.toLowerCase()} · ${today.toLocaleString('vi-VN')} lượt đọc hôm nay.` : 'Thêm API key ElevenLabs hoặc Fish Audio để AI đọc bằng giọng tự nhiên.'}
            action={<Button asChild className="h-10 rounded-full px-5 shadow-soft"><Link to="/admin/api-keys?new=fish_audio"><Plus className="h-4 w-4 mr-1.5" />Key Fish Audio</Link></Button>} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile icon={<KeyRound className="h-5 w-5" />} tint="violet" value={keys.length} label="Key giọng nói" hint={`${keys.filter((k) => k.is_active).length} đang bật`} />
            <StatTile icon={<CheckCircle2 className="h-5 w-5" />} tint="mint" value={healthy.length} label="Sẵn sàng" hint="đang xoay" />
            <StatTile icon={<TimerReset className="h-5 w-5" />} tint="amber" value={cooling.length} label="Tạm nghỉ" hint="tự quay lại" />
            <StatTile icon={<AudioLines className="h-5 w-5" />} tint="sky" value={today} label="Lượt hôm nay" hint={`${keys.reduce((a, k) => a + (k.usage_count || 0), 0).toLocaleString('vi-VN')} tổng`} />
          </div>

          <Surface className="p-3 sm:p-4">
            <SectionTitle title="Thứ tự xoay vòng" hint={isMobile ? undefined : 'key kế tiếp được đánh dấu'} className="px-1" action={<Button variant="ghost" size="sm" className="rounded-full" onClick={() => qc.invalidateQueries({ queryKey: ['admin-voice-pool'] })}><RefreshCw className="h-4 w-4 mr-1" />Làm mới</Button>} />
            {isLoading ? <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}</div>
              : isError ? <EmptyState mascot="taro" pose="care" compact title="Không tải được kho key" description="Kiểm tra kết nối máy chủ rồi thử lại." />
              : !shown.length ? <EmptyState mascot="ori" pose="idea" compact title="Chưa có key giọng nói" description="Thêm nhiều key cùng provider — hệ thống sẽ tự chia lượt và đổi key khi một key lỗi hoặc hết hạn mức." />
              : (
                <div className="space-y-2.5">
                  {(['elevenlabs', 'fish_audio'] as Provider[]).filter((p) => shown.some((k) => k.provider === p)).map((p) => (
                    <div key={p}>
                      <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide px-1 mb-1.5 flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: PROV[p].color }} />{PROV[p].label}</p>
                      <div className="space-y-2">
                        {shown.filter((k) => k.provider === p).map((k) => {
                          const q = quotaView(k);
                          const isNext = pool?.next[p] === k.id;
                          return (
                            <div key={k.id} className={cn('rounded-2xl border p-3 transition-colors', isNext ? 'border-primary/50 bg-primary/[0.04]' : 'border-border/60', k.status !== 'ok' && 'bg-secondary/30')}>
                              <div className="flex items-start gap-3">
                                <span className="h-10 w-10 rounded-xl grid place-items-center shrink-0 text-white" style={{ background: PROV[p].color }}><AudioLines className="h-5 w-5" /></span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[14px] font-semibold flex items-center gap-1.5 min-w-0"><span className="truncate">{k.name}</span>{k.is_primary && <Star className="h-3.5 w-3.5 text-[#F5A524] fill-current shrink-0" aria-label="Key chính" />}</p>
                                  <p className="text-[11.5px] text-muted-foreground font-mono truncate">{k.masked}{k.voice_id ? ` · giọng ${k.voice_id}` : ''}{k.model ? ` · ${k.model}` : ''}</p>
                                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">{statusPill(k, isNext)}<Pill tone="blue">{k.today} hôm nay{k.limit_per_day ? `/${k.limit_per_day}` : ''}</Pill>{k.error_count > 0 && <Pill tone="red">{k.error_count} lỗi</Pill>}</div>
                                </div>
                                <RowMenu items={[
                                  { label: 'Nghe thử bằng key này', icon: <Play />, onClick: () => test({ key_id: k.id, provider: k.provider, tag: k.id }), hidden: !k.is_active },
                                  { label: 'Kiểm tra hạn mức', icon: <Gauge />, onClick: () => check.mutate(k.id) },
                                  { label: 'Gỡ tạm nghỉ & xóa lỗi', icon: <RotateCcw />, onClick: () => reset.mutate(k.id), hidden: !k.cooldown_until && !k.error_count },
                                ]} />
                              </div>
                              <div className="mt-2.5 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                                <div className="min-w-0">
                                  <div className="flex items-center justify-between text-[11.5px] mb-1 gap-2"><span className="font-semibold truncate">{q.text}</span>{q.sub && <span className="text-muted-foreground shrink-0">{q.sub}</span>}</div>
                                  {q.pct != null && <ProgressBar value={q.pct} height={6} color={q.pct >= 90 ? '#F0587A' : q.pct >= 75 ? '#F5A524' : PROV[p].color} />}
                                </div>
                                <span className="text-[11px] text-muted-foreground sm:text-right">{testing === k.id ? 'Đang đọc thử…' : k.last_used_at ? `Dùng ${fmtDate(k.last_used_at, 'HH:mm dd/MM')}` : 'Chưa dùng'}</span>
                              </div>
                              {k.last_error && k.status !== 'ok' && <p className="mt-2 text-[11.5px] text-[#E0445E] break-words line-clamp-2" title={k.last_error}>{k.last_error}</p>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </Surface>

          <Surface className="p-4">
            <SectionTitle title="Cách xoay vòng hoạt động" />
            <div className="rounded-2xl bg-secondary/40 px-3 py-1.5">
              <InfoRow icon={<RefreshCw className="h-4 w-4" />} label="Mỗi lượt đọc/chép lời" value="chọn 1 key sẵn sàng theo chiến lược" />
              <InfoRow icon={<AlertTriangle className="h-4 w-4" />} label="Key sai / bị từ chối" value="nghỉ 24 giờ, thử key kế tiếp" />
              <InfoRow icon={<Gauge className="h-4 w-4" />} label="Hết hạn mức / tín dụng" value="nghỉ 6 giờ, thử key kế tiếp" />
              <InfoRow icon={<TimerReset className="h-4 w-4" />} label="Giới hạn tốc độ (429)" value={`nghỉ ${pool?.settings.rate_limit_cooldown_min ?? 2} phút`} />
              <InfoRow icon={<ShieldCheck className="h-4 w-4" />} label="Hết key khỏe" value="đổi provider, cuối cùng dùng giọng trình duyệt" />
            </div>
          </Surface>
          {isMobile && <>{testCard}{settingsCard}</>}
        </div>
        {!isMobile && <aside className="space-y-4 xl:sticky xl:top-4">{testCard}{settingsCard}<MascotCard mascot="taro" pose="care" title="Mẹo tiết kiệm" quote="Thêm vài key miễn phí của ElevenLabs và Fish Audio rồi chọn “Xoay vòng đều” — hạn mức sẽ được chia đều, hết key này tự sang key khác." /></aside>}
      </div>
      {isMobile && <Fab onClick={() => navigate('/admin/api-keys?new=elevenlabs')} label="Thêm key giọng nói" />}
    </Page>
  );
}
