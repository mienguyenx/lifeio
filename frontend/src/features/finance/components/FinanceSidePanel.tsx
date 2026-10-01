import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Empty, InsightCard, MascotCard, ProgressBar, SectionTitle, Surface } from '@/components/lio';
import type { FinanceApi } from '../hooks/useFinance';
import { FINANCE_TIPS, QUICK_EXPENSE_PRESETS, financeInsights } from '../utils/finance.utils';

export function FinanceSidePanel({ api, month, prev }: { api: FinanceApi; month: string; prev: string }) {
  const nav = useNavigate();
  const today = format(new Date(), 'yyyy-MM-dd');
  return (
    <div className="space-y-4">
      <MascotCard mascot="lumi" pose="happy" title="Chi tiêu thông minh" quote="Mỗi đồng tiết kiệm hôm nay là một bước gần hơn tới tự do tài chính 💜" />
      <Surface className="p-4">
        <SectionTitle title="Chi nhanh" hint="Ghi chi tiêu hôm nay" />
        <div className="grid grid-cols-2 gap-2">
          {QUICK_EXPENSE_PRESETS.map((p) => (
            <button key={p.label} onClick={() => api.add({ date: today, type: 'expense', category: p.category, amount: p.amount, description: p.description }, p.label)} className="h-10 rounded-2xl bg-secondary/70 hover:bg-lavender text-[12.5px] font-semibold">{p.label}</button>
          ))}
        </div>
      </Surface>
      <InsightCard subtitle="Gợi ý từ dữ liệu tháng này" items={financeInsights(api.txs, month, prev)} onChat={() => nav('/ai-chat')} empty="Thêm giao dịch để nhận gợi ý chi tiêu." />
      <Surface className="p-4">
        <SectionTitle title="Mục tiêu tài chính" action={<button onClick={() => nav('/goals')} className="text-[12px] font-semibold text-primary">Xem tất cả</button>} />
        {api.financeGoals.length === 0 ? <Empty>Chưa có mục tiêu tài chính.</Empty> : (
          <ul className="space-y-3">
            {api.financeGoals.slice(0, 4).map((g) => (
              <li key={g.id}>
                <div className="flex justify-between text-[12.5px] mb-1"><span className="font-semibold truncate pr-2">{g.title}</span><span className="text-muted-foreground tabular-nums">{g.progress ?? 0}%</span></div>
                <ProgressBar value={g.progress ?? 0} />
              </li>
            ))}
          </ul>
        )}
      </Surface>
      <Surface className="p-4">
        <SectionTitle title="Mẹo tài chính" />
        <ul className="space-y-2">{FINANCE_TIPS.map((t) => <li key={t.text} className="flex gap-2 text-[12.5px]"><span>{t.icon}</span><span className="text-muted-foreground">{t.text}</span></li>)}</ul>
      </Surface>
    </div>
  );
}
