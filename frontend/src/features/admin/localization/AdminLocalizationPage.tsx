// Module 26 — Admin: Ngôn ngữ, Bản dịch & Bản địa hóa (LIO kit)
// Gộp pages/admin/AdminLanguages.tsx + AdminTranslations.tsx (bản cũ: /admin/languages/classic, /admin/translations/classic)
import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRightLeft, CheckCircle2, Copy, FileText, Globe, Layers, Lightbulb, Loader2, Pencil, Percent, Plus, Sparkles, Trash2, Wand2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { EmptyState } from '@/components/brand/EmptyState';
import { Fab, HeroBanner, IconButton, MascotCard, Page, PageHeader, ProgressBar, SearchToggle, SectionTitle, SegmentedTabs, StatTile, Surface } from '@/components/lio';
import { Donut } from '@/components/lio/charts';
import { Field, fieldCls, areaCls } from '@/components/lio/form';
import { useAdminLanguages, useUpdateLanguage, useCreateLanguage, useDeleteLanguage, useAITranslate, useTranslations, useTranslationNamespaces, useUpdateTranslation, useCreateTranslation, useDeleteTranslation, type AdminLanguage, type Translation } from '@/hooks/useAdminData';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { ConfirmDialog, CountBars, GridHead, GridRow, InfoRow, MiniStat, PALETTE, Pager, Pill, RowMenu, useIsXl } from '../shared';

// Giữ nguyên dữ liệu gợi ý của bản cũ
const COMMON_FLAGS: Record<string, string> = { en: '🇺🇸', vi: '🇻🇳', ja: '🇯🇵', ko: '🇰🇷', zh: '🇨🇳', fr: '🇫🇷', de: '🇩🇪', es: '🇪🇸', it: '🇮🇹', pt: '🇵🇹', ru: '🇷🇺', ar: '🇸🇦', hi: '🇮🇳', th: '🇹🇭', id: '🇮🇩' };
const AI_LANGS = [['English', '🇺🇸'], ['Vietnamese', '🇻🇳'], ['Japanese', '🇯🇵'], ['Korean', '🇰🇷'], ['Chinese', '🇨🇳'], ['French', '🇫🇷'], ['German', '🇩🇪'], ['Spanish', '🇪🇸']] as const;
const SAMPLE_TRANSLATIONS: Record<string, string> = { 'common.save': 'Save', 'common.cancel': 'Cancel', 'common.delete': 'Delete', 'common.edit': 'Edit', 'common.search': 'Search' };
const LANG_COLS = 'minmax(0,1.5fr) 72px minmax(0,1.3fr) 84px 64px 40px';
const TR_COLS = 'minmax(0,1.3fr) 64px minmax(0,1.8fr) 40px';
type View = 'languages' | 'translations' | 'ai';
type Suggestion = { translation: string; context: string; formality: string };
const trKey = (t: Translation) => `${t.language_code}|${t.namespace}|${t.key}`;

export default function AdminLocalizationPage({ initialView = 'languages' }: { initialView?: View }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isMobile = useIsMobile();
  const isXl = useIsXl();
  const { data: languages, isLoading } = useAdminLanguages();
  const { data: translations, isLoading: trLoading } = useTranslations();
  const { data: namespaces } = useTranslationNamespaces();
  const updateLanguage = useUpdateLanguage();
  const createLanguage = useCreateLanguage();
  const deleteLanguage = useDeleteLanguage();
  const createTr = useCreateTranslation();
  const updateTr = useUpdateTranslation();
  const deleteTr = useDeleteTranslation();

  const [view, setViewState] = useState<View>(initialView);
  // Đồng bộ URL với tab để menu bên trái sáng đúng mục (cùng một instance nên giữ nguyên trạng thái)
  const setView = (v: View) => {
    setViewState(v);
    const onTr = pathname.startsWith('/admin/translations');
    if (v === 'translations' && !onTr) navigate('/admin/translations', { replace: true });
    else if (v !== 'translations' && onTr) navigate('/admin/languages', { replace: true });
  };
  // Bấm menu Ngôn ngữ/Bản dịch khi đang ở trang → đổi tab theo URL
  const [lastInitial, setLastInitial] = useState(initialView);
  if (lastInitial !== initialView) { setLastInitial(initialView); if ((initialView === 'translations') !== (view === 'translations')) setViewState(initialView); }
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [nsFilter, setNsFilter] = useState('all');
  const [langFilter, setLangFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [langDraft, setLangDraft] = useState<(Partial<AdminLanguage> & { code: string; name: string; native_name: string }) | null>(null);
  const [trDraft, setTrDraft] = useState<(Translation & { editing?: boolean }) | null>(null);
  const [confirmLang, setConfirmLang] = useState<AdminLanguage | null>(null);
  const [confirmTr, setConfirmTr] = useState<Translation | null>(null);

  const langs = useMemo(() => languages ?? [], [languages]);
  const trs = useMemo(() => translations ?? [], [translations]);
  const nsList = namespaces ?? [];
  const trLangs = useMemo(() => [...new Set(trs.map((t) => t.language_code))].sort(), [trs]);
  const countByLang = (code: string) => trs.filter((t) => t.language_code === code).length;
  const avgProgress = Math.round(langs.reduce((a, l) => a + (l.translation_progress || 0), 0) / (langs.length || 1));
  const flagOf = (code: string) => langs.find((l) => l.code === code)?.flag || COMMON_FLAGS[code] || '🌐';

  const q = search.toLowerCase();
  const langRows = langs.filter((l) => !q || l.name.toLowerCase().includes(q) || l.native_name.toLowerCase().includes(q) || l.code.toLowerCase().includes(q));
  const trRows = useMemo(() => trs.filter((t) => (nsFilter === 'all' || t.namespace === nsFilter) && (langFilter === 'all' || t.language_code === langFilter)
    && (!q || t.key.toLowerCase().includes(q) || (t.value ?? '').toLowerCase().includes(q) || t.namespace.toLowerCase().includes(q))), [trs, nsFilter, langFilter, q]);
  const rows = view === 'languages' ? langRows : trRows;
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const pagedLangs = langRows.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const pagedTrs = trRows.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const selected = langs.find((l) => l.id === selectedId) ?? null;

  const saveLang = () => {
    if (!langDraft) return;
    if (!langDraft.code || !langDraft.name || !langDraft.native_name) { toast.error('Vui lòng điền đủ các trường bắt buộc'); return; }
    if (langDraft.id) updateLanguage.mutate({ id: langDraft.id, name: langDraft.name, native_name: langDraft.native_name, code: langDraft.code, flag: langDraft.flag || undefined, translation_progress: langDraft.translation_progress }, { onSuccess: () => setLangDraft(null) });
    else createLanguage.mutate({ code: langDraft.code, name: langDraft.name, native_name: langDraft.native_name, flag: langDraft.flag || COMMON_FLAGS[langDraft.code] || '🌐' }, { onSuccess: () => setLangDraft(null) });
  };
  const saveTr = () => {
    if (!trDraft) return;
    const { editing, ...t } = trDraft;
    if (!t.namespace || !t.key || !t.value) { toast.error('Vui lòng điền đủ các trường bắt buộc'); return; }
    (editing ? updateTr : createTr).mutate(t, { onSuccess: () => setTrDraft(null) });
  };
  const openAdd = () => (view === 'translations' ? setTrDraft({ language_code: langFilter !== 'all' ? langFilter : 'en', namespace: nsFilter !== 'all' ? nsFilter : '', key: '', value: '' }) : setLangDraft({ code: '', name: '', native_name: '', flag: '' }));

  const donut = trLangs.map((c, i) => ({ id: c, name: `${flagOf(c)} ${c}`, value: countByLang(c), color: PALETTE[i % PALETTE.length] }));
  const nsCounts = nsList.map((n) => ({ label: n, value: trs.filter((t) => t.namespace === n).length })).sort((a, b) => b.value - a.value).slice(0, 6);
  const overviewSide = (
    <div className="space-y-4">
      <Surface className="p-4">
        <SectionTitle title="Bản dịch theo ngôn ngữ" hint={`${trs.length.toLocaleString()} bản ghi`} />
        {donut.length ? <Donut size={130} data={donut} center={<span><span className="block text-[11px] text-muted-foreground">bản dịch</span><span className="block text-[18px] font-extrabold">{trs.length.toLocaleString()}</span></span>} /> : <p className="text-[12.5px] text-muted-foreground">Chưa có bản dịch.</p>}
      </Surface>
      <Surface className="p-4"><SectionTitle title="Namespace lớn nhất" hint={`${nsList.length} namespace`} /><CountBars items={nsCounts} /></Surface>
      <MascotCard mascot="ori" pose="explore" title="Bản địa hóa" quote="Dùng tab “Dịch AI” để dịch hàng loạt từ tiếng Anh sang ngôn ngữ mới." />
    </div>
  );
  const detail = selected && (
    <LanguageDetail key={selected.id} lang={selected} count={countByLang(selected.code)} enCount={countByLang('en')} inPanel={isXl} onClose={() => setSelectedId(null)}
      onEdit={() => setLangDraft({ ...selected })} onToggle={() => updateLanguage.mutate({ id: selected.id, is_active: !selected.is_active })} onDelete={() => setConfirmLang(selected)}
      onTranslations={() => { setLangFilter(selected.code); setSelectedId(null); setView('translations'); }} />
  );
  const side = isXl && detail && view === 'languages' ? detail : overviewSide;

  return (
    <Page>
      <PageHeader title="Ngôn ngữ & Bản dịch" subtitle="Quản lý ngôn ngữ, chuỗi dịch và dịch bằng AI"
        actions={<>
          {view !== 'ai' && <SearchToggle value={search} onChange={(v) => { setSearch(v); setPage(0); }} placeholder={view === 'languages' ? 'Tìm ngôn ngữ...' : 'Tìm key hoặc nội dung...'} />}
          {!isMobile && view !== 'ai' && <Button className="h-10 rounded-full px-5 shadow-soft" onClick={openAdd}><Plus className="h-4 w-4 mr-1.5" />{view === 'languages' ? 'Thêm ngôn ngữ' : 'Thêm bản dịch'}</Button>}
        </>} />
      <SegmentedTabs items={[{ id: 'languages', label: 'Ngôn ngữ', count: langs.length }, { id: 'translations', label: 'Bản dịch', count: trs.length }, { id: 'ai', label: 'Dịch AI' }]} value={view} onChange={(v) => { setView(v); setPage(0); }} full={isMobile} className="mb-5" />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px] items-start">
        <div className="space-y-4 min-w-0">
          <HeroBanner mascot="ori" pose="explore" title="LifeOS đa ngôn ngữ" subtitle={`${langs.filter((l) => l.is_active).length}/${langs.length} ngôn ngữ đang bật · ${trs.length.toLocaleString()} chuỗi dịch · tiến độ TB ${avgProgress}%.`}
            action={view !== 'ai' ? <Button className="h-10 rounded-full px-5 shadow-soft" onClick={openAdd}><Plus className="h-4 w-4 mr-1.5" />{view === 'languages' ? 'Ngôn ngữ mới' : 'Bản dịch mới'}</Button> : undefined} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile icon={<Globe className="h-5 w-5" />} tint="violet" value={langs.length} label="Ngôn ngữ" hint={`${langs.filter((l) => l.is_active).length} đang bật`} onClick={() => setView('languages')} active={view === 'languages'} />
            <StatTile icon={<FileText className="h-5 w-5" />} tint="sky" value={trs.length.toLocaleString()} label="Bản dịch" hint={`${countByLang('en')} key gốc (en)`} onClick={() => setView('translations')} active={view === 'translations'} />
            <StatTile icon={<Layers className="h-5 w-5" />} tint="amber" value={nsList.length} label="Namespace" />
            <StatTile icon={<Percent className="h-5 w-5" />} tint="mint" value={`${avgProgress}%`} label="Tiến độ TB" hint="theo ngôn ngữ" />
          </div>

          {view === 'ai' ? <AITranslatePanel trs={trs} trLoading={trLoading} nsList={nsList} isMobile={isMobile} /> : (
            <Surface className="p-3 sm:p-4">
              <div className={cn('flex gap-2 px-1 mb-3', isMobile ? 'flex-col' : 'items-center')}>
                <SectionTitle title={view === 'languages' ? 'Danh sách ngôn ngữ' : 'Quản lý bản dịch'} hint={`${rows.length.toLocaleString()} mục`} className="mb-0" />
                {view === 'translations' && (
                  <div className={cn('flex gap-2', !isMobile && 'ml-auto')}>
                    <Select value={nsFilter} onValueChange={(v) => { setNsFilter(v); setPage(0); }}><SelectTrigger className={cn('h-9 rounded-full bg-card', isMobile ? 'flex-1' : 'w-[160px]')}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Mọi namespace</SelectItem>{nsList.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent></Select>
                    <Select value={langFilter} onValueChange={(v) => { setLangFilter(v); setPage(0); }}><SelectTrigger className={cn('h-9 rounded-full bg-card', isMobile ? 'flex-1' : 'w-[140px]')}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Mọi ngôn ngữ</SelectItem>{trLangs.map((c) => <SelectItem key={c} value={c}>{flagOf(c)} {c}</SelectItem>)}</SelectContent></Select>
                    {(nsFilter !== 'all' || langFilter !== 'all' || search) && <IconButton label="Xóa bộ lọc" onClick={() => { setNsFilter('all'); setLangFilter('all'); setSearch(''); setPage(0); }}><X className="h-4 w-4" /></IconButton>}
                  </div>
                )}
              </div>
              {(view === 'languages' ? isLoading : trLoading) ? <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-2xl" />)}</div>
                : rows.length === 0 ? <EmptyState mascot="ori" pose="explore" compact title={view === 'languages' ? 'Chưa có ngôn ngữ phù hợp' : 'Không có bản dịch phù hợp'} description="Thử đổi bộ lọc hoặc thêm mới." />
                : view === 'languages' ? (isMobile ? (
                  <div className="divide-y divide-border/50">
                    {pagedLangs.map((l) => (
                      <div key={l.id} role="button" tabIndex={0} onClick={() => setSelectedId(l.id)} className={cn('flex items-center gap-3 px-1 py-3', !l.is_active && 'opacity-60')}>
                        <span className="h-10 w-10 rounded-xl grid place-items-center bg-secondary text-[22px] shrink-0">{l.flag || '🌐'}</span>
                        <div className="min-w-0 flex-1"><p className="text-[14px] font-semibold truncate">{l.name} <span className="text-muted-foreground font-normal">· {l.native_name}</span></p><div className="flex items-center gap-2 mt-1.5"><ProgressBar value={l.translation_progress} className="flex-1" /><span className="text-[11.5px] tabular-nums">{l.translation_progress}%</span></div></div>
                        <span onClick={(e) => e.stopPropagation()}><Switch checked={l.is_active} onCheckedChange={() => updateLanguage.mutate({ id: l.id, is_active: !l.is_active })} aria-label={`Bật ${l.name}`} /></span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-border/60 overflow-hidden">
                    <GridHead cols={LANG_COLS}><span>Ngôn ngữ</span><span>Mã</span><span>Tiến độ dịch</span><span>Bản dịch</span><span>Bật</span><span /></GridHead>
                    {pagedLangs.map((l) => (
                      <GridRow key={l.id} cols={LANG_COLS} onClick={() => setSelectedId(l.id)} active={selectedId === l.id} className={cn(!l.is_active && 'opacity-70')}>
                        <span className="flex items-center gap-2.5 min-w-0"><span className="h-9 w-9 rounded-xl grid place-items-center bg-secondary text-[20px] shrink-0">{l.flag || '🌐'}</span><span className="min-w-0"><span className="block text-[13.5px] font-semibold truncate">{l.name}</span><span className="block text-[11.5px] text-muted-foreground truncate">{l.native_name}</span></span></span>
                        <span><Pill className="font-mono">{l.code}</Pill></span>
                        <span className="flex items-center gap-2"><ProgressBar value={l.translation_progress} className="flex-1" color={l.translation_progress >= 100 ? '#22B07D' : undefined} /><span className="text-[12px] tabular-nums w-9 text-right">{l.translation_progress}%</span></span>
                        <span className="text-[12.5px] tabular-nums">{countByLang(l.code).toLocaleString()}</span>
                        <span onClick={(e) => e.stopPropagation()}><Switch checked={l.is_active} onCheckedChange={() => updateLanguage.mutate({ id: l.id, is_active: !l.is_active })} aria-label={`Bật ${l.name}`} /></span>
                        <RowMenu items={[
                          { label: 'Chỉnh sửa', icon: <Pencil />, onClick: () => setLangDraft({ ...l }) },
                          { label: 'Xem bản dịch', icon: <FileText />, onClick: () => { setLangFilter(l.code); setView('translations'); } },
                          { label: 'Xóa ngôn ngữ', icon: <Trash2 />, onClick: () => setConfirmLang(l), danger: true, separator: true },
                        ]} />
                      </GridRow>
                    ))}
                  </div>
                )) : isMobile ? (
                  <div className="divide-y divide-border/50">
                    {pagedTrs.map((t) => (
                      <div key={trKey(t)} role="button" tabIndex={0} onClick={() => setTrDraft({ ...t, editing: true })} className="flex items-start gap-3 px-1 py-3">
                        <span className="text-[20px] leading-none mt-0.5">{flagOf(t.language_code)}</span>
                        <div className="min-w-0 flex-1"><p className="text-[12px] font-mono text-muted-foreground truncate">{t.namespace}.{t.key}</p><p className="text-[13.5px] line-clamp-2">{t.value}</p></div>
                        <IconButton label="Xóa bản dịch" onClick={() => setConfirmTr(t)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></IconButton>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-border/60 overflow-hidden">
                    <GridHead cols={TR_COLS}><span>Key</span><span>Ngôn ngữ</span><span>Nội dung</span><span /></GridHead>
                    {pagedTrs.map((t) => (
                      <GridRow key={trKey(t)} cols={TR_COLS} onClick={() => setTrDraft({ ...t, editing: true })}>
                        <span className="min-w-0"><span className="block text-[12.5px] font-mono font-semibold truncate">{t.key}</span><span className="block text-[11px] text-muted-foreground truncate">{t.namespace}</span></span>
                        <span><Pill>{flagOf(t.language_code)} {t.language_code}</Pill></span>
                        <span className="text-[13px] truncate">{t.value}</span>
                        <RowMenu items={[
                          { label: 'Sửa bản dịch', icon: <Pencil />, onClick: () => setTrDraft({ ...t, editing: true }) },
                          { label: 'Sao chép nội dung', icon: <Copy />, onClick: () => { navigator.clipboard.writeText(t.value); toast.success('Đã sao chép'); } },
                          { label: 'Xóa bản dịch', icon: <Trash2 />, onClick: () => setConfirmTr(t), danger: true, separator: true },
                        ]} />
                      </GridRow>
                    ))}
                  </div>
                )}
              {rows.length > 0 && <Pager page={safePage} pages={pages} total={rows.length} pageSize={pageSize} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(0); }} />}
            </Surface>
          )}
          {isMobile && overviewSide}
        </div>
        {!isMobile && <aside className="hidden xl:block sticky top-4">{side}</aside>}
      </div>
      {isMobile && view !== 'ai' && <Fab onClick={openAdd} label={view === 'languages' ? 'Thêm ngôn ngữ' : 'Thêm bản dịch'} />}

      <AdaptiveModal open={!!selected && !isXl && view === 'languages'} onOpenChange={(o) => !o && setSelectedId(null)} title="Chi tiết ngôn ngữ">{!isXl && detail}</AdaptiveModal>

      <AdaptiveModal open={!!langDraft} onOpenChange={(o) => !o && setLangDraft(null)} title={langDraft?.id ? 'Chỉnh sửa ngôn ngữ' : 'Thêm ngôn ngữ'}>
        {langDraft && (
          <form className="space-y-3.5 mt-2" onSubmit={(e) => { e.preventDefault(); saveLang(); }}>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Mã ngôn ngữ *"><input className={cn(fieldCls, 'font-mono')} value={langDraft.code} onChange={(e) => { const code = e.target.value.toLowerCase(); setLangDraft({ ...langDraft, code, flag: langDraft.flag || COMMON_FLAGS[code] || '' }); }} placeholder="vi" autoFocus /></Field>
              <Field label="Cờ (emoji)"><input className={fieldCls} value={langDraft.flag ?? ''} onChange={(e) => setLangDraft({ ...langDraft, flag: e.target.value })} placeholder={COMMON_FLAGS[langDraft.code] || '🌐'} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tên (tiếng Anh) *"><input className={fieldCls} value={langDraft.name} onChange={(e) => setLangDraft({ ...langDraft, name: e.target.value })} placeholder="Vietnamese" /></Field>
              <Field label="Tên bản địa *"><input className={fieldCls} value={langDraft.native_name} onChange={(e) => setLangDraft({ ...langDraft, native_name: e.target.value })} placeholder="Tiếng Việt" /></Field>
            </div>
            {langDraft.id && <Field label={`Tiến độ dịch: ${langDraft.translation_progress ?? 0}%`}><input type="number" min={0} max={100} className={fieldCls} value={langDraft.translation_progress ?? 0} onChange={(e) => setLangDraft({ ...langDraft, translation_progress: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })} /></Field>}
            {langDraft.id && countByLang('en') > 0 && (
              <button type="button" className="text-[12px] font-semibold text-primary hover:underline inline-flex items-center gap-1" onClick={() => setLangDraft({ ...langDraft, translation_progress: Math.min(100, Math.round((countByLang(langDraft.code) / countByLang('en')) * 100)) })}>
                <Wand2 className="h-3.5 w-3.5" />Tính theo số bản dịch ({countByLang(langDraft.code)}/{countByLang('en')} key)
              </button>
            )}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button type="button" variant="outline" className="h-11 rounded-full" onClick={() => setLangDraft(null)}>Hủy</Button>
              <Button type="submit" className="h-11 rounded-full shadow-soft" disabled={!langDraft.code || !langDraft.name || !langDraft.native_name || createLanguage.isPending || updateLanguage.isPending}>{langDraft.id ? 'Lưu thay đổi' : 'Thêm ngôn ngữ'}</Button>
            </div>
          </form>
        )}
      </AdaptiveModal>

      <AdaptiveModal open={!!trDraft} onOpenChange={(o) => !o && setTrDraft(null)} title={trDraft?.editing ? 'Sửa bản dịch' : 'Thêm bản dịch'} description={trDraft?.editing ? `${trDraft.namespace}.${trDraft.key}` : undefined}>
        {trDraft && (
          <form className="space-y-3.5 mt-2" onSubmit={(e) => { e.preventDefault(); saveTr(); }}>
            {/* Khi sửa: khóa ngôn ngữ/namespace/key — bản cũ cho đổi key nhưng upsert tạo bản ghi mới, để lại bản ghi cũ */}
            <div className="grid grid-cols-3 gap-3">
              <Field label="Ngôn ngữ *"><input className={cn(fieldCls, 'font-mono', trDraft.editing && 'opacity-60')} list="admin-tr-langs" disabled={trDraft.editing} value={trDraft.language_code} onChange={(e) => setTrDraft({ ...trDraft, language_code: e.target.value.toLowerCase() })} /></Field>
              <Field label="Namespace *" className="col-span-2"><input className={cn(fieldCls, 'font-mono', trDraft.editing && 'opacity-60')} list="admin-tr-ns" disabled={trDraft.editing} value={trDraft.namespace} onChange={(e) => setTrDraft({ ...trDraft, namespace: e.target.value })} placeholder="common" /></Field>
            </div>
            <datalist id="admin-tr-langs">{[...new Set([...langs.map((l) => l.code), ...trLangs])].map((c) => <option key={c} value={c} />)}</datalist>
            <datalist id="admin-tr-ns">{nsList.map((n) => <option key={n} value={n} />)}</datalist>
            <Field label="Key *"><input className={cn(fieldCls, 'font-mono', trDraft.editing && 'opacity-60')} disabled={trDraft.editing} value={trDraft.key} onChange={(e) => setTrDraft({ ...trDraft, key: e.target.value })} placeholder="save_button" autoFocus={!trDraft.editing} /></Field>
            <Field label="Nội dung *"><textarea className={areaCls} rows={3} value={trDraft.value} onChange={(e) => setTrDraft({ ...trDraft, value: e.target.value })} autoFocus={trDraft.editing} /></Field>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button type="button" variant="outline" className="h-11 rounded-full" onClick={() => setTrDraft(null)}>Hủy</Button>
              <Button type="submit" className="h-11 rounded-full shadow-soft" disabled={!trDraft.namespace || !trDraft.key || !trDraft.value || createTr.isPending || updateTr.isPending}>{trDraft.editing ? 'Lưu' : 'Thêm'}</Button>
            </div>
          </form>
        )}
      </AdaptiveModal>

      <ConfirmDialog open={!!confirmLang} onOpenChange={(o) => !o && setConfirmLang(null)} title={`Xóa ngôn ngữ ${confirmLang?.name ?? ''}?`} description="Các bản dịch của ngôn ngữ này vẫn được giữ trong bảng bản dịch."
        onConfirm={() => { if (confirmLang) deleteLanguage.mutate(confirmLang.id, { onSuccess: () => setSelectedId(null) }); setConfirmLang(null); }} />
      <ConfirmDialog open={!!confirmTr} onOpenChange={(o) => !o && setConfirmTr(null)} title="Xóa bản dịch?" description={confirmTr ? `${confirmTr.namespace}.${confirmTr.key} (${confirmTr.language_code})` : undefined}
        onConfirm={() => { if (confirmTr) deleteTr.mutate({ language_code: confirmTr.language_code, namespace: confirmTr.namespace, key: confirmTr.key }); setConfirmTr(null); }} />
    </Page>
  );
}

function LanguageDetail({ lang, count, enCount, inPanel, onClose, onEdit, onToggle, onDelete, onTranslations }: { lang: AdminLanguage; count: number; enCount: number; inPanel: boolean; onClose: () => void; onEdit: () => void; onToggle: () => void; onDelete: () => void; onTranslations: () => void }) {
  const body = (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="h-[52px] w-[52px] rounded-2xl grid place-items-center bg-secondary text-[28px] shrink-0">{lang.flag || '🌐'}</span>
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-bold truncate">{lang.name}</p>
          <p className="text-[12.5px] text-muted-foreground truncate">{lang.native_name}</p>
          <div className="flex items-center gap-1.5 mt-1.5"><Pill tone={lang.is_active ? 'green' : 'gray'} icon={lang.is_active ? <CheckCircle2 className="h-3 w-3" /> : undefined}>{lang.is_active ? 'Đang bật' : 'Đang tắt'}</Pill><Pill className="font-mono">{lang.code}</Pill></div>
        </div>
        {inPanel && <IconButton label="Đóng" onClick={onClose}><X className="h-4 w-4" /></IconButton>}
      </div>
      <div>
        <div className="flex items-center justify-between text-[12.5px] mb-1"><span className="font-semibold">Tiến độ dịch</span><span className="font-bold tabular-nums">{lang.translation_progress}%</span></div>
        <ProgressBar value={lang.translation_progress} height={8} color={lang.translation_progress >= 100 ? '#22B07D' : undefined} />
      </div>
      <div className="grid grid-cols-2 gap-2"><MiniStat label="Bản dịch" value={count.toLocaleString()} hint="chuỗi đã dịch" /><MiniStat label="So với key gốc" value={enCount ? `${Math.min(100, Math.round((count / enCount) * 100))}%` : '—'} hint={`${enCount} key tiếng Anh`} /></div>
      <div className="rounded-2xl bg-secondary/40 px-3 py-1.5"><InfoRow label="Cập nhật" value={new Date(lang.updated_at).toLocaleDateString('vi-VN')} /><InfoRow label="Tạo lúc" value={new Date(lang.created_at).toLocaleDateString('vi-VN')} /></div>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" className="h-10 rounded-full" onClick={onEdit}><Pencil className="h-4 w-4 mr-1.5" />Chỉnh sửa</Button>
        <Button variant="outline" className="h-10 rounded-full" onClick={onTranslations}><FileText className="h-4 w-4 mr-1.5" />Bản dịch</Button>
        <Button variant="outline" className="h-10 rounded-full" onClick={onToggle}>{lang.is_active ? 'Tắt' : 'Bật'}</Button>
        <Button variant="outline" className="h-10 rounded-full text-destructive hover:text-destructive" onClick={onDelete}><Trash2 className="h-4 w-4 mr-1.5" />Xóa</Button>
      </div>
    </div>
  );
  return inPanel ? <Surface className="p-4">{body}</Surface> : body;
}

function LangSelect({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <Field label={label}>
      <Select value={value} onValueChange={onChange}><SelectTrigger className="h-11 rounded-2xl bg-card"><SelectValue /></SelectTrigger><SelectContent>{AI_LANGS.map(([n, f]) => <SelectItem key={n} value={n}>{f} {n}</SelectItem>)}</SelectContent></Select>
    </Field>
  );
}

function AITranslatePanel({ trs, trLoading, nsList, isMobile }: { trs: Translation[]; trLoading: boolean; nsList: string[]; isMobile: boolean }) {
  const ai = useAITranslate();
  const [mode, setMode] = useState<'translate' | 'batch'>('translate');
  const [source, setSource] = useState('English');
  const [target, setTarget] = useState('Vietnamese');
  const [context, setContext] = useState('');
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [batchTarget, setBatchTarget] = useState('Vietnamese');
  const [ns, setNs] = useState('all');
  const [batchResult, setBatchResult] = useState<Record<string, string>>({});
  const copy = (s: string) => { navigator.clipboard.writeText(s); toast.success('Đã sao chép'); };

  // Nguồn dịch hàng loạt: bản dịch tiếng Anh trong DB, nếu trống dùng mẫu như bản cũ
  const base = useMemo(() => {
    const fromDb = trs.filter((t) => t.language_code === 'en').reduce<Record<string, string>>((a, t) => { a[`${t.namespace}.${t.key}`] = t.value; return a; }, {});
    return Object.keys(fromDb).length ? fromDb : trLoading ? {} : SAMPLE_TRANSLATIONS;
  }, [trs, trLoading]);
  const batchSource = ns === 'all' ? base : Object.fromEntries(Object.entries(base).filter(([k]) => k.startsWith(ns + '.')));

  const translate = async () => { if (!text) return; setResult((await ai.mutateAsync({ type: 'translate', content: text, sourceLanguage: source, targetLanguage: target, context })) as string); };
  const suggest = async () => { if (!text) return; setSuggestions((await ai.mutateAsync({ type: 'suggest-translations', content: text, sourceLanguage: source, targetLanguage: target, context })) as Suggestion[]); };
  const batch = async () => { setBatchResult((await ai.mutateAsync({ type: 'batch-translate', content: batchSource, sourceLanguage: 'English', targetLanguage: batchTarget })) as Record<string, string>); toast.success('Đã dịch hàng loạt xong'); };

  return (
    <Surface className="p-3 sm:p-4">
      <div className={cn('flex gap-2 px-1 mb-3', isMobile ? 'flex-col' : 'items-center')}>
        <SectionTitle title="Dịch bằng AI" hint="qua chức năng ai-translate" className="mb-0" />
        <SegmentedTabs size="sm" className={cn(!isMobile && 'ml-auto')} full={isMobile} items={[{ id: 'translate', label: 'Dịch & gợi ý' }, { id: 'batch', label: 'Dịch hàng loạt' }]} value={mode} onChange={setMode} />
      </div>
      {mode === 'translate' ? (
        <div className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3"><LangSelect label="Ngôn ngữ nguồn" value={source} onChange={setSource} /><LangSelect label="Ngôn ngữ đích" value={target} onChange={setTarget} /></div>
          <Field label="Ngữ cảnh (tùy chọn)"><input className={fieldCls} value={context} onChange={(e) => setContext(e.target.value)} placeholder="VD: nhãn nút, thông báo lỗi, lời chào..." /></Field>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Văn bản gốc"><textarea className={areaCls} rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder="Nhập văn bản cần dịch..." /></Field>
            <Field label="Bản dịch">
              <div className="relative"><textarea className={cn(areaCls, 'bg-secondary/40')} rows={6} readOnly value={result} placeholder="Bản dịch sẽ hiện ở đây..." />{result && <span className="absolute top-2 right-2"><IconButton label="Sao chép" onClick={() => copy(result)}><Copy className="h-3.5 w-3.5" /></IconButton></span>}</div>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button className="h-11 rounded-full shadow-soft" onClick={translate} disabled={ai.isPending || !text}>{ai.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <ArrowRightLeft className="h-4 w-4 mr-1.5" />}Dịch</Button>
            <Button variant="outline" className="h-11 rounded-full" onClick={suggest} disabled={ai.isPending || !text}><Lightbulb className="h-4 w-4 mr-1.5" />Gợi ý cách dịch</Button>
          </div>
          {suggestions.length > 0 && (
            <div className="space-y-2">
              {suggestions.map((s, i) => (
                <div key={i} className="flex items-start gap-2 rounded-2xl border border-border/60 p-3">
                  <div className="min-w-0 flex-1"><p className="text-[13.5px] font-semibold">{s.translation}</p><p className="text-[12px] text-muted-foreground">{s.context}</p><Pill className="mt-1" tone="violet">{s.formality}</Pill></div>
                  <IconButton label="Sao chép" onClick={() => copy(s.translation)}><Copy className="h-3.5 w-3.5" /></IconButton>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <LangSelect label="Dịch sang" value={batchTarget} onChange={setBatchTarget} />
            <Field label="Namespace"><Select value={ns} onValueChange={setNs}><SelectTrigger className="h-11 rounded-2xl bg-card"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả</SelectItem>{nsList.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent></Select></Field>
          </div>
          <p className="text-[12px] text-muted-foreground">{Object.keys(batchSource).length.toLocaleString()} chuỗi tiếng Anh sẽ được dịch.</p>
          <div className="grid grid-cols-2 gap-2">
            <Button className="h-11 rounded-full shadow-soft" onClick={batch} disabled={ai.isPending || !Object.keys(batchSource).length}>{ai.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1.5" />}Dịch hàng loạt</Button>
            <Button variant="outline" className="h-11 rounded-full" disabled={!Object.keys(batchResult).length} onClick={() => copy(JSON.stringify(batchResult, null, 2))}><Copy className="h-4 w-4 mr-1.5" />Sao chép JSON</Button>
          </div>
          <div className="rounded-2xl border border-border/60 overflow-hidden max-h-[420px] overflow-y-auto">
            <GridHead cols="minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)"><span>Key</span><span>English</span><span>{batchTarget}</span></GridHead>
            {Object.entries(batchSource).slice(0, 200).map(([k, v]) => (
              <GridRow key={k} cols="minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)">
                <span className="text-[11.5px] font-mono truncate">{k}</span><span className="text-[12.5px] truncate">{v}</span>
                <span className={cn('text-[12.5px] truncate', !batchResult[k] && 'text-muted-foreground')}>{batchResult[k] || '—'}</span>
              </GridRow>
            ))}
          </div>
        </div>
      )}
    </Surface>
  );
}

