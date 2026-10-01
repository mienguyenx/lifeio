import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/brand/EmptyState';
import type { TaskTab } from '../types/task.types';

const COPY: Record<TaskTab | 'search', { title: string; desc: string; pose: string }> = {
  all: { title: 'Chưa có công việc nào', desc: 'Thêm việc đầu tiên — mỗi nhiệm vụ nhỏ đều tạo nên cuộc sống lớn.', pose: 'default' },
  today: { title: 'Hôm nay trống lịch', desc: 'Chọn 1–3 việc quan trọng nhất để bắt đầu ngày mới.', pose: 'focus' },
  upcoming: { title: 'Không có việc sắp tới', desc: 'Lên kế hoạch cho những ngày tới để luôn chủ động.', pose: 'default' },
  overdue: { title: 'Không có việc quá hạn', desc: 'Tuyệt vời! Bạn đang đi đúng tiến độ.', pose: 'celebrate' },
  completed: { title: 'Chưa hoàn thành việc nào', desc: 'Hoàn thành một việc nhỏ để lấy đà nhé.', pose: 'rest' },
  search: { title: 'Không tìm thấy công việc', desc: 'Thử từ khoá khác hoặc bỏ bớt bộ lọc.', pose: 'rest' },
};

export function TaskEmptyState({ tab, searching, onAdd, compact }: { tab: TaskTab; searching?: boolean; onAdd?: () => void; compact?: boolean }) {
  const c = COPY[searching ? 'search' : tab];
  return (
    <EmptyState
      mascot="mochi"
      pose={c.pose}
      title={c.title}
      description={c.desc}
      compact={compact}
      action={onAdd && !searching && tab !== 'overdue' && tab !== 'completed' ? (
        <Button onClick={onAdd} className="rounded-full"><Plus className="h-4 w-4 mr-1.5" />Thêm công việc</Button>
      ) : undefined}
    />
  );
}
