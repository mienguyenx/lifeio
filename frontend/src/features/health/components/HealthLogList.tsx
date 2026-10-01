import { useMemo, useState } from 'react';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/brand/EmptyState';
import { FilterChips, ItemRow, Surface } from '@/components/lio';
import type { HealthLog } from '@/hooks/sync/useHealthSync';
import { METRICS, dateLabel, fmt, metricOf, type MetricId } from '../utils/health.utils';

/** Nhật ký: lọc theo chỉ số, nhóm theo ngày, sửa/xóa từng ghi nhận (giữ tính năng tab “Lịch sử” cũ). */
export function HealthLogList({ logs, onEdit, onDelete }: { logs: HealthLog[]; onEdit: (l: HealthLog) => void; onDelete: (l: HealthLog) => void }) {
  const [type, setType] = useState<MetricId | 'all'>('all');
  const items = [{ id: 'all', label: 'Tất cả', count: logs.length }, ...METRICS.map((m) => ({ id: m.id, label: `${m.emoji} ${m.name}`, count: logs.filter((l) => l.type === m.id).length }))] as { id: MetricId | 'all'; label: string; count: number }[];
  const groups = useMemo(() => {
    const map = new Map<string, HealthLog[]>();
    logs.filter((l) => type === 'all' || l.type === type).forEach((l) => map.set(l.date, [...(map.get(l.date) ?? []), l]));
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [logs, type]);

  return (
    <div className="space-y-4">
      <FilterChips items={items} value={type} onChange={setType} />
      {groups.length === 0 ? <EmptyState mascot="taro" pose="care" compact title="Chưa có ghi nhận" description="Ghi lại chỉ số đầu tiên để theo dõi sức khỏe nhé." /> : groups.map(([d, list]) => (
        <Surface key={d} className="p-2">
          <p className="px-3 pt-2 pb-1 text-[12px] font-bold text-muted-foreground">{dateLabel(d)}</p>
          {list.map((l) => {
            const m = metricOf(l.type);
            return (
              <ItemRow key={l.id} icon={m.emoji} tint={m.tint} title={m.name} meta={l.notes || undefined} value={`${fmt(m, l.value)} ${m.id === 'mood' ? '' : m.unit}`} onClick={() => onEdit(l)}
                trailing={
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <button className="h-8 w-8 grid place-items-center rounded-full hover:bg-secondary" aria-label="Tùy chọn"><MoreHorizontal className="h-4 w-4" /></button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem onClick={() => onEdit(l)}><Pencil className="h-4 w-4 mr-2" />Chỉnh sửa</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => onDelete(l)}><Trash2 className="h-4 w-4 mr-2" />Xóa</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                } />
            );
          })}
        </Surface>
      ))}
    </div>
  );
}
