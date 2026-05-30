import { useState } from 'react';
import { Plus, Target } from 'lucide-react';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LIFE_AREAS, type LifeArea } from '@/types/lifeos';

const QUICK_HABIT_SUGGESTIONS = [
  { name: 'Uống 2L nước', area: 'health' as const, icon: '💧' },
  { name: 'Đọc sách 15 phút', area: 'learning' as const, icon: '📚' },
  { name: 'Tập thể dục 30 phút', area: 'health' as const, icon: '🏃' },
  { name: 'Thiền 10 phút', area: 'health' as const, icon: '🧘' },
  { name: 'Ghi journal', area: 'personal' as const, icon: '📝' },
  { name: 'Ngủ trước 23h', area: 'health' as const, icon: '😴' },
];

interface TodayAddHabitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (habit: { name: string; area: LifeArea; frequency: 'daily' | 'weekly' }) => void;
}

export function TodayAddHabitModal({ open, onOpenChange, onAdd }: TodayAddHabitModalProps) {
  const [name, setName] = useState('');
  const [area, setArea] = useState<LifeArea>('personal');
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), area, frequency });
    setName('');
    setArea('personal');
    setFrequency('daily');
    onOpenChange(false);
  };

  return (
    <AdaptiveModal open={open} onOpenChange={onOpenChange} title="Thêm Habit mới">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Gợi ý nhanh</label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_HABIT_SUGGESTIONS.map((suggestion, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => {
                    setName(suggestion.name);
                    setArea(suggestion.area);
                  }}
                >
                  <span className="mr-1">{suggestion.icon}</span>
                  {suggestion.name}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Tên habit *</label>
            <Input
              placeholder="Nhập tên habit..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tần suất</label>
              <Select value={frequency} onValueChange={(v: 'daily' | 'weekly') => setFrequency(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">📅 Hàng ngày</SelectItem>
                  <SelectItem value="weekly">📆 Hàng tuần</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Lĩnh vực</label>
              <Select value={area} onValueChange={(v: LifeArea) => setArea(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LIFE_AREAS.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.icon} {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleAdd} disabled={!name.trim()} className="w-full">
            <Plus className="w-4 h-4 mr-2" /> Thêm Habit
          </Button>
        </div>
    </AdaptiveModal>
  );
}
