import { useState } from 'react';
import { format, addDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Plus, CalendarIcon } from 'lucide-react';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { LIFE_AREAS, type LifeArea } from '@/types/lifeos';

interface TodayAddTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (task: {
    title: string;
    priority: 'low' | 'medium' | 'high';
    dueDate: string;
    area: LifeArea;
  }) => void;
}

export function TodayAddTaskModal({ open, onOpenChange, onAdd }: TodayAddTaskModalProps) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [area, setArea] = useState<LifeArea>('personal');
  const [dueDate, setDueDate] = useState<Date>(new Date());

  const handleAdd = () => {
    if (!title.trim()) return;
    onAdd({
      title: title.trim(),
      priority,
      dueDate: format(dueDate, 'yyyy-MM-dd'),
      area,
    });
    setTitle('');
    setPriority('medium');
    setArea('personal');
    setDueDate(new Date());
    onOpenChange(false);
  };

  return (
    <AdaptiveModal open={open} onOpenChange={onOpenChange} title="Thêm Task mới">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tên task *</label>
            <Input
              placeholder="Nhập tên task..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Ngày hạn</label>
            <div className="flex gap-2">
              {[
                { label: 'Hôm nay', date: new Date() },
                { label: 'Ngày mai', date: addDays(new Date(), 1) },
                { label: 'Tuần sau', date: addDays(new Date(), 7) },
              ].map((option) => (
                <Button
                  key={option.label}
                  type="button"
                  variant={format(dueDate, 'yyyy-MM-dd') === format(option.date, 'yyyy-MM-dd') ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => setDueDate(option.date)}
                >
                  {option.label}
                </Button>
              ))}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="px-2">
                    <CalendarIcon className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={(date) => date && setDueDate(date)}
                    locale={vi}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <p className="text-xs text-muted-foreground">
              Đã chọn: {format(dueDate, 'EEEE, dd/MM/yyyy', { locale: vi })}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Ưu tiên</label>
              <Select value={priority} onValueChange={(v: 'low' | 'medium' | 'high') => setPriority(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">🔵 Thấp</SelectItem>
                  <SelectItem value="medium">🟡 Trung bình</SelectItem>
                  <SelectItem value="high">🔴 Cao</SelectItem>
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
          <Button onClick={handleAdd} disabled={!title.trim()} className="w-full">
            <Plus className="w-4 h-4 mr-2" /> Thêm Task
          </Button>
        </div>
    </AdaptiveModal>
  );
}
