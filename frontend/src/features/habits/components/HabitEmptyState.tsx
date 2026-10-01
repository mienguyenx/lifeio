import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/brand/EmptyState';

export function HabitEmptyState({ filtered, onAdd }: { filtered?: boolean; onAdd: () => void }) {
  return filtered ? (
    <EmptyState mascot="taro" pose="relax" compact title="Không có thói quen phù hợp" description="Thử đổi bộ lọc hoặc từ khóa tìm kiếm nhé." />
  ) : (
    <EmptyState
      mascot="taro"
      pose="go"
      title="Bắt đầu thói quen đầu tiên"
      description="Thói quen nhỏ mỗi ngày tạo nên thay đổi lớn. Taro sẽ đồng hành cùng bạn!"
      action={<Button onClick={onAdd} className="rounded-full"><Plus className="h-4 w-4 mr-1.5" />Thêm thói quen</Button>}
    />
  );
}
