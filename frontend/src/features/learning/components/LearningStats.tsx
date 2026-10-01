import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { InsightCard, SectionTitle, Surface, Empty } from '@/components/lio';
import { Donut, GroupedBars, StatStrip } from '@/components/lio/charts';
import type { LearningApi } from '../hooks/useLearning';
import { BOOK_COLOR, LEARNING_CATEGORIES, STATUS_META, learningInsights } from '../utils/learning.utils';

/** Thống kê từ dữ liệu có sẵn: phân loại, trạng thái, tiến độ (app chưa ghi thời gian học theo ngày). */
export function LearningStats({ api }: { api: LearningApi }) {
  const nav = useNavigate();
  const { items, stats, courses, books } = api;
  const byCat = useMemo(() => [
    ...LEARNING_CATEGORIES.map((c) => ({ id: c.id, name: `${c.icon} ${c.name}`, value: courses.filter((x) => x.category === c.id).length, color: c.color })),
    { id: 'book', name: '📖 Sách', value: books.length, color: BOOK_COLOR },
  ].filter((x) => x.value > 0), [courses, books]);
  const total = byCat.reduce((a, b) => a + b.value, 0);
  const byStatus = (['todo', 'active', 'done'] as const).map((s) => ({ label: STATUS_META[s].course, course: items.filter((i) => i.kind === 'course' && i.status === s).length, book: items.filter((i) => i.kind === 'book' && i.status === s).length }));
  return (
    <div className="grid gap-4 lg:grid-cols-2 items-start">
      <Surface className="p-5 min-w-0">
        <SectionTitle title="Phân loại tài liệu" />
        {total === 0 ? <Empty>Chưa có khóa học hoặc sách.</Empty> : (
          <Donut size={150} data={byCat.map((c) => ({ ...c, hint: `${Math.round((c.value / total) * 100)}%` }))}
            center={<span><span className="block text-[11px] text-muted-foreground">Tổng</span><span className="block text-[18px] font-extrabold">{total}</span></span>} />
        )}
      </Surface>
      <Surface className="p-5 min-w-0">
        <SectionTitle title="Theo trạng thái" />
        <GroupedBars data={byStatus} height={190} series={[{ key: 'course', name: 'Khóa học', color: '#6C5CE7' }, { key: 'book', name: 'Sách', color: BOOK_COLOR }]} />
        <StatStrip items={[
          { label: 'Bài đã học', value: stats.lessons },
          { label: 'Trang đã đọc', value: stats.pages.toLocaleString('vi-VN') },
          { label: 'Giờ học (ước tính)', value: `${stats.hours.toFixed(0)}h` },
          { label: 'Tiến độ TB', value: `${stats.avg}%` },
        ]} />
      </Surface>
      <InsightCard className="lg:col-span-2" subtitle="Gợi ý từ tiến độ học tập" items={learningInsights(items)} onChat={() => nav('/ai-chat')} empty="Thêm khóa học hoặc sách để nhận gợi ý." />
    </div>
  );
}
