// Admin: Model AI cho từng tính năng (Coach, Trợ lý, Ghi chú giọng nói…)
// Dữ liệu: GET/PUT /functions/ai-config/features (admin_settings `ai_feature_models`),
// model gợi ý từ AI Models + lấy trực tiếp từ provider (/functions/ai-providers/models).
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bot, CheckCircle2, FileText, Layers, Loader2, Play, RefreshCw, Save, Sparkles, Wand2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/brand/EmptyState';
import { HeroBanner, MascotCard, Page, PageHeader, SectionTitle, StatTile, Surface } from '@/components/lio';
import { fieldCls } from '@/components/lio/form';
import { apiFetch } from '@/integrations/api/httpClient';
import { useAIModels } from '@/hooks/useAdminData';
import { cn } from '@/lib/utils';
import { Pill } from '../shared';

interface Feature { key: string; label: string; description: string; promptKey: string; needs?: string[] }
interface Conf { provider?: string; model?: string; temperature?: number | null }
interface Effective { provider: string; model: string; source: string }
interface FeaturesResp {
  features: Feature[];
  config: Record<string, Conf>;
  providers: { slug: string; name: string; defaultModel: string; keys: number }[];
  effective: Record<string, Effective | null>;
}
interface TestResp { ok: boolean; reply?: string; error?: string; ms: number; provider?: string; model?: string }

const INHERIT = '__inherit__';
const SOURCE: Record<string, string> = { feature: 'Đã cấu hình', env: 'Biến môi trường', 'default-model': 'Model mặc định', 'any-key': 'Tự chọn theo key' };
const NEEDS: Record<string, string> = { tools: 'Cần function calling', audio: 'Cần nhận audio', json: 'Trả JSON' };
const DEFAULT_FEATURE: Feature = { key: '_default', label: 'Mặc định cho mọi tính năng', description: 'Dùng khi tính năng chưa được gán model riêng', promptKey: '' };

export default function AdminAIFeaturesPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({ queryKey: ['admin-ai-features'], queryFn: () => apiFetch<FeaturesResp>('/functions/ai-config/features') });
  const { data: models } = useAIModels();
  const [draft, setDraft] = useState<Record<string, Conf>>({});
  const [fetched, setFetched] = useState<Record<string, string[]>>({});
  const [fetching, setFetching] = useState<string | null>(null);
  const [tests, setTests] = useState<Record<string, TestResp | 'loading'>>({});

  useEffect(() => { if (data) setDraft(data.config ?? {}); }, [data]);
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(data?.config ?? {}), [draft, data]);

  const save = useMutation({
    mutationFn: () => apiFetch('/functions/ai-config/features', { method: 'PUT', body: { config: draft } }),
    onSuccess: () => { toast.success('Đã lưu cấu hình model'); qc.invalidateQueries({ queryKey: ['admin-ai-features'] }); },
    onError: (e: Error) => toast.error(`Không lưu được: ${e.message}`),
  });

  const providers = data?.providers ?? [];
  const usable = providers.filter((p) => p.keys > 0);
  const modelsFor = (slug?: string) => {
    if (!slug) return [];
    const ids = new Set<string>((models ?? []).filter((m) => m.provider === slug && m.is_active).map((m) => m.model_id));
    (fetched[slug] ?? []).forEach((id) => ids.add(id));
    const def = providers.find((p) => p.slug === slug)?.defaultModel;
    if (def) ids.add(def);
    return [...ids].sort();
  };
  const fetchModels = async (slug: string) => {
    setFetching(slug);
    try {
      const r = await apiFetch<{ models: { id: string }[] }>('/functions/ai-providers/models', { method: 'POST', body: { slug } });
      setFetched((f) => ({ ...f, [slug]: r.models.map((m) => m.id) }));
      toast.success(`Lấy được ${r.models.length} model`);
    } catch (e) { toast.error((e as Error).message); } finally { setFetching(null); }
  };
  const runTest = async (key: string) => {
    if (dirty) { toast.info('Lưu cấu hình trước khi kiểm tra'); return; }
    setTests((t) => ({ ...t, [key]: 'loading' }));
    try {
      const r = await apiFetch<TestResp>('/functions/ai-config/test', { method: 'POST', body: { feature: key } });
      setTests((t) => ({ ...t, [key]: r }));
    } catch (e) { setTests((t) => ({ ...t, [key]: { ok: false, error: (e as Error).message, ms: 0 } })); }
  };
  const setConf = (key: string, patch: Partial<Conf> | null) => setDraft((d) => {
    const next = { ...d };
    if (patch === null) delete next[key]; else next[key] = { ...next[key], ...patch };
    return next;
  });

  const features = data?.features ?? [];
  const custom = features.filter((f) => draft[f.key]?.provider).length;
  const ready = features.filter((f) => data?.effective[f.key]).length;

  const row = (f: Feature) => {
    const conf = draft[f.key];
    const eff = data?.effective[f.key];
    const t = tests[f.key];
    const list = modelsFor(conf?.provider);
    const isDefault = f.key === '_default';
    return (
      <Surface key={f.key} className={cn('p-4', isDefault && 'ring-1 ring-primary/25')}>
        <div className="flex items-start gap-3">
          <span className={cn('h-10 w-10 rounded-2xl grid place-items-center shrink-0', isDefault ? 'bg-primary/15 text-primary' : 'bg-secondary text-foreground')}>{isDefault ? <Layers className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-[14.5px] font-bold">{f.label}</p>
              {(f.needs ?? []).map((n) => <Pill key={n} tone="gray">{NEEDS[n] ?? n}</Pill>)}
            </div>
            <p className="text-[12.5px] text-muted-foreground">{f.description}</p>
            <p className="text-[11.5px] mt-1 flex items-center gap-1.5 flex-wrap">
              {eff ? <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /><span className="font-mono">{eff.provider} · {eff.model}</span><Pill tone={eff.source === 'feature' ? 'violet' : 'blue'}>{SOURCE[eff.source] ?? eff.source}</Pill></>
                : <><XCircle className="h-3.5 w-3.5 text-destructive" /><span className="text-destructive">Chưa có provider/key khả dụng</span></>}
            </p>
          </div>
          {f.promptKey && <Button asChild variant="ghost" size="sm" className="rounded-full shrink-0 hidden sm:inline-flex"><Link to={`/admin/ai/prompts?q=${encodeURIComponent(f.promptKey)}`}><FileText className="h-3.5 w-3.5 mr-1" />Prompt</Link></Button>}
        </div>

        <div className="grid gap-2.5 mt-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_96px_auto] items-end">
          <label className="block"><span className="text-[11.5px] font-semibold text-muted-foreground">Provider</span>
            <Select value={conf?.provider ?? INHERIT} onValueChange={(v) => setConf(f.key, v === INHERIT ? null : { provider: v, model: providers.find((p) => p.slug === v)?.defaultModel || modelsFor(v)[0] || '' })}>
              <SelectTrigger className="h-10 rounded-2xl bg-card mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={INHERIT}>{isDefault ? 'Tự động (theo key)' : 'Dùng mặc định'}</SelectItem>
                {providers.map((p) => <SelectItem key={p.slug} value={p.slug} disabled={!p.keys}>{p.name}{p.keys ? '' : ' — chưa có key'}</SelectItem>)}
              </SelectContent>
            </Select>
          </label>
          <label className="block"><span className="text-[11.5px] font-semibold text-muted-foreground flex items-center justify-between">Model
            {conf?.provider && <button type="button" className="text-primary hover:underline inline-flex items-center gap-1" onClick={() => fetchModels(conf.provider!)} disabled={fetching === conf.provider}>{fetching === conf.provider ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}Lấy model</button>}</span>
            <input className={cn(fieldCls, 'h-10 mt-1 font-mono text-[12.5px]')} list={`models-${f.key}`} disabled={!conf?.provider} placeholder={conf?.provider ? 'VD: gpt-4o-mini' : 'Theo mặc định'} value={conf?.model ?? ''} onChange={(e) => setConf(f.key, { model: e.target.value })} />
            <datalist id={`models-${f.key}`}>{list.map((id) => <option key={id} value={id} />)}</datalist>
          </label>
          <label className="block"><span className="text-[11.5px] font-semibold text-muted-foreground">Nhiệt độ</span>
            <input type="number" step={0.1} min={0} max={2} className={cn(fieldCls, 'h-10 mt-1')} disabled={!conf?.provider} placeholder="auto" value={conf?.temperature ?? ''} onChange={(e) => setConf(f.key, { temperature: e.target.value === '' ? null : Number(e.target.value) })} />
          </label>
          <Button variant="outline" className="h-10 rounded-full" onClick={() => runTest(f.key)} disabled={t === 'loading'}>{t === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}<span className="ml-1.5">Thử</span></Button>
        </div>
        {t && t !== 'loading' && (
          <p className={cn('mt-2 rounded-xl px-3 py-2 text-[12px]', t.ok ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-destructive/10 text-destructive')}>
            {t.ok ? `✓ ${t.provider} · ${t.model} trả lời sau ${t.ms}ms: “${t.reply}”` : `✗ ${t.error}`}
          </p>
        )}
      </Surface>
    );
  };

  return (
    <Page>
      <PageHeader title="Model theo tính năng" subtitle="Chọn provider & model riêng cho AI Coach, trợ lý giọng nói, ghi chú…"
        actions={<Button className="h-10 rounded-full px-5 shadow-soft" onClick={() => save.mutate()} disabled={!dirty || save.isPending}>{save.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}Lưu</Button>} />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] items-start">
        <div className="space-y-4 min-w-0">
          <HeroBanner mascot="ori" pose="idea" title="Mỗi tính năng một model"
            subtitle={usable.length ? `${usable.length} provider có key · ${custom}/${features.length} tính năng đã gán model riêng.` : 'Chưa có provider nào có API key — thêm key ở AI Providers trước.'}
            action={<Button asChild variant="outline" className="h-10 rounded-full px-5"><Link to="/admin/ai/providers"><Wand2 className="h-4 w-4 mr-1.5" />AI Providers</Link></Button>} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile icon={<Sparkles className="h-5 w-5" />} tint="violet" value={features.length} label="Tính năng AI" />
            <StatTile icon={<CheckCircle2 className="h-5 w-5" />} tint="mint" value={ready} label="Sẵn sàng" hint="có model gọi được" />
            <StatTile icon={<Layers className="h-5 w-5" />} tint="sky" value={custom} label="Gán riêng" />
            <StatTile icon={<Bot className="h-5 w-5" />} tint="amber" value={usable.length} label="Provider có key" />
          </div>
          {isLoading ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-3xl" />)
            : isError ? <EmptyState mascot="taro" compact title="Không tải được cấu hình" description={(error as Error).message} />
            : <>
              <SectionTitle title="Mặc định" />
              {row(DEFAULT_FEATURE)}
              <SectionTitle title="Từng tính năng" hint="Để “Dùng mặc định” nếu không cần model riêng" />
              {features.map(row)}
            </>}
          {dirty && (
            <div className="sticky bottom-4 z-10 flex justify-end">
              <Button className="h-11 rounded-full px-6 shadow-soft" onClick={() => save.mutate()} disabled={save.isPending}><Save className="h-4 w-4 mr-1.5" />Lưu thay đổi</Button>
            </div>
          )}
        </div>
        <aside className="space-y-4 xl:sticky xl:top-4">
          <Surface className="p-4">
            <SectionTitle title="Thứ tự chọn model" />
            <ol className="space-y-1.5 text-[12.5px] text-muted-foreground list-decimal pl-4">
              <li>Model gán riêng cho tính năng</li>
              <li>Model “Mặc định cho mọi tính năng”</li>
              <li>Biến môi trường AI_GATEWAY_* của máy chủ</li>
              <li>Model đánh dấu mặc định ở AI Models</li>
              <li>Key đang bật đầu tiên của provider bất kỳ</li>
            </ol>
          </Surface>
          <MascotCard mascot="ori" pose="idea" title="Mẹo" quote="Trợ lý ra lệnh cần model hỗ trợ function calling (VD gpt-4o-mini, gemini-2.5-flash). Chép lời cần model nhận audio." />
          <Surface className="p-4">
            <SectionTitle title="Prompt hệ thống" />
            <p className="text-[12.5px] text-muted-foreground mb-3">Mỗi tính năng có một prompt hệ thống (nhóm “system”) — sửa để bổ sung hướng dẫn cho AI.</p>
            <Button asChild variant="outline" className="w-full h-10 rounded-full"><Link to="/admin/ai/prompts"><FileText className="h-4 w-4 mr-1.5" />Thư viện prompt</Link></Button>
          </Surface>
        </aside>
      </div>
    </Page>
  );
}
