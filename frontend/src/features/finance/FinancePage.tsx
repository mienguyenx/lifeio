import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { addMonths, format, parseISO } from 'date-fns';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ModuleHelpButton } from '@/components/ui/ModuleHelpButton';
import { AreaDashboardSection } from '@/components/area/AreaDashboardSection';
import { Fab, HeroBanner, Page, PageHeader, PeriodNav, SearchToggle, SectionTitle, SegmentedTabs, StatTile, Surface, Empty } from '@/components/lio';
import { useIsMobile } from '@/hooks/use-mobile';
import type { FinanceTransaction } from '@/hooks/sync/useFinanceSync';
import { useFinance, type TxDraft } from './hooks/useFinance';
import { SAVING_TARGET, compactVND, formatVND, inMonth, monthKey, monthLabel, monthStats, pctDelta } from './utils/finance.utils';
import { TransactionModal } from './components/TransactionModal';
import { TransactionList, TxRow } from './components/TransactionList';
import { CashflowChart, CategoryBreakdown, FinanceTrends } from './components/FinanceCharts';
import { FinanceSidePanel } from './components/FinanceSidePanel';

type View = 'overview' | 'transactions' | 'trends' | 'linked';
const shift = (m: string, n: number) => monthKey(addMonths(parseISO(`${m}-01`), n));
const deltaHint = (d: number | null, goodUp: boolean, prev: string) => (d === null ? `Chưa có dữ liệu T${Number(prev.slice(5))}` : <span className={(d >= 0) === goodUp ? 'text-[#22B07D]' : 'text-[#F2557A]'}>{d >= 0 ? '↑' : '↓'} {Math.abs(d)}% so với T{Number(prev.slice(5))}</span>);

export default function FinancePage() {
  const isMobile = useIsMobile();
  const api = useFinance();
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState<View>('overview');
  const [month, setMonth] = useState(monthKey(new Date()));
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<{ mode: 'create' | 'edit'; id?: string; initial: TxDraft } | null>(null);
  const [toDelete, setToDelete] = useState<FinanceTransaction | null>(null);
  const cur = monthKey(new Date());
  const prev = shift(month, -1);

  const openCreate = () => setForm({ mode: 'create', initial: { type: 'expense', category: 'food', amount: '', description: '', date: format(new Date(), 'yyyy-MM-dd') } });
  useEffect(() => {
    if (params.has('add')) { openCreate(); params.delete('add'); setParams(params, { replace: true }); }
  }, [params, setParams]);
  useEffect(() => { if (search) setView('transactions'); }, [search]);

  const { txs } = api;
  const s = useMemo(() => monthStats(txs, month), [txs, month]);
  const p = useMemo(() => monthStats(txs, prev), [txs, prev]);
  const recent = useMemo(() => [...inMonth(txs, month)].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6), [txs, month]);
  const edit = (t: FinanceTransaction) => setForm({ mode: 'edit', id: t.id, initial: { type: t.type, category: t.category, amount: String(t.amount), description: t.description, date: t.date } });
  const submit = (d: TxDraft) => {
    if (form?.mode === 'edit' && form.id) api.edit(form.id, d);
    else api.add({ type: d.type, category: d.category, amount: parseFloat(d.amount), description: d.description, date: d.date });
    setForm(null);
  };
  const nav = <PeriodNav label={monthLabel(month)} onPrev={() => setMonth(shift(month, -1))} onNext={() => setMonth(shift(month, 1))} nextDisabled={month >= cur} onReset={month !== cur && !isMobile ? () => setMonth(cur) : undefined} resetLabel="Tháng này" />;
  const name = api.user?.name?.split(' ').slice(-1)[0] || 'bạn';

  const tiles = (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatTile icon={<span className="text-[22px]">💰</span>} tint="mint" value={compactVND(s.income)} label="Tổng thu nhập" hint={deltaHint(pctDelta(s.income, p.income), true, prev)} />
      <StatTile icon={<span className="text-[22px]">💸</span>} tint="rose" value={compactVND(s.expense)} label="Tổng chi tiêu" hint={deltaHint(pctDelta(s.expense, p.expense), false, prev)} />
      <StatTile icon="module/finance" tint="violet" value={compactVND(s.balance)} label="Số dư" hint={`${s.count} giao dịch`} />
      <StatTile icon={<span className="text-[22px]">🐷</span>} tint="amber" value={s.saving === null ? '–' : `${s.saving}%`} label="Tỷ lệ tiết kiệm" hint={`Mục tiêu ${SAVING_TARGET}%`} />
    </div>
  );

  const overview = (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] items-start">
      <div className="space-y-4 min-w-0">
        <HeroBanner mascot="lumi" pose="happy" title={`Xin chào, ${name}! 💜`}
          subtitle={s.count ? `${monthLabel(month)}: số dư ${formatVND(s.balance)}.` : 'Ghi lại thu chi để nắm rõ dòng tiền của bạn.'} action={nav} />
        {tiles}
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <CashflowChart txs={txs} month={month} />
          <CategoryBreakdown txs={txs} month={month} />
        </div>
        <Surface className="p-3">
          <div className="px-2 pt-1"><SectionTitle title="Giao dịch gần đây" action={<button onClick={() => setView('transactions')} className="text-[12px] font-semibold text-primary">Xem tất cả</button>} /></div>
          {recent.length === 0 ? <div className="px-2"><Empty>Chưa có giao dịch trong tháng này.</Empty></div> : recent.map((t) => <TxRow key={t.id} t={t} onEdit={edit} onDelete={setToDelete} />)}
        </Surface>
      </div>
      {!isMobile && <aside className="hidden xl:block sticky top-4"><FinanceSidePanel api={api} month={month} prev={prev} /></aside>}
    </div>
  );

  return (
    <Page>
      <PageHeader
        title={<span className="inline-flex items-center gap-2">Tài chính <ModuleHelpButton module="finance" /></span>}
        subtitle="Quản lý thu chi thông minh, tiết kiệm mỗi ngày 💰"
        actions={<>
          <SearchToggle value={search} onChange={setSearch} placeholder="Tìm giao dịch..." />
          {!isMobile && <Button className="h-10 rounded-full px-5 shadow-soft" onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" />Thêm giao dịch</Button>}
        </>}
      />
      <SegmentedTabs items={[{ id: 'overview', label: 'Tổng quan' }, { id: 'transactions', label: 'Giao dịch' }, { id: 'trends', label: 'Xu hướng' }, { id: 'linked', label: 'Liên kết' }]} value={view} onChange={setView} full={isMobile} className="mb-5" />
      {view === 'overview' && overview}
      {view === 'transactions' && <TransactionList txs={api.sorted} search={search} onEdit={edit} onDelete={setToDelete} isMobile={isMobile} />}
      {view === 'trends' && (
        <div className="space-y-4">
          <div className="flex justify-end">{nav}</div>
          <FinanceTrends txs={txs} month={month} />
          <div className="grid gap-4 lg:grid-cols-2"><CategoryBreakdown txs={txs} month={month} bars /><CashflowChart txs={txs} month={month} /></div>
        </div>
      )}
      {view === 'linked' && <AreaDashboardSection area="finance" />}
      {isMobile && view === 'overview' && <div className="mt-5"><FinanceSidePanel api={api} month={month} prev={prev} /></div>}
      {isMobile && <Fab onClick={openCreate} label="Thêm giao dịch" />}

      {form && <TransactionModal open onOpenChange={(o) => !o && setForm(null)} mode={form.mode} initial={form.initial} onSubmit={submit} />}
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa giao dịch “{toDelete?.description}”?</AlertDialogTitle>
            <AlertDialogDescription>{toDelete && `${toDelete.type === 'income' ? '+' : '-'}${formatVND(toDelete.amount)} — ngày ${format(parseISO(toDelete.date), 'dd/MM/yyyy')}. Không thể hoàn tác.`}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { if (toDelete) api.remove(toDelete.id); setToDelete(null); }}>Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  );
}
