import { useEffect, useState } from 'react';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { SegmentedTabs } from '@/components/lio';
import { ChoiceGrid, Field, FormActions, areaCls, fieldCls } from '@/components/lio/form';
import { LEARNING_CATEGORIES, type ItemKind } from '../utils/learning.utils';
import type { BookDraft, CourseDraft } from '../hooks/useLearning';

export interface LearningDraft { kind: ItemKind; course: CourseDraft; book: BookDraft }
export const EMPTY_DRAFT: LearningDraft = { kind: 'course', course: { title: '', description: '', category: 'programming', totalLessons: '' }, book: { title: '', author: '', totalPages: '' } };

export function LearningItemModal({ open, onOpenChange, mode, initial, onSubmit }: { open: boolean; onOpenChange: (o: boolean) => void; mode: 'create' | 'edit'; initial: LearningDraft; onSubmit: (d: LearningDraft) => void }) {
  const [d, setD] = useState(initial);
  useEffect(() => { if (open) setD(initial); }, [open, initial]);
  const c = d.course, b = d.book;
  const setC = (p: Partial<CourseDraft>) => setD((x) => ({ ...x, course: { ...x.course, ...p } }));
  const setB = (p: Partial<BookDraft>) => setD((x) => ({ ...x, book: { ...x.book, ...p } }));
  const valid = d.kind === 'course' ? c.title.trim() && parseInt(c.totalLessons) > 0 : b.title.trim() && b.author.trim() && parseInt(b.totalPages) > 0;
  const noun = d.kind === 'course' ? 'khóa học' : 'sách';
  return (
    <AdaptiveModal open={open} onOpenChange={onOpenChange} title={mode === 'edit' ? `Chỉnh sửa ${noun}` : 'Thêm tài liệu học tập'} className="sm:max-w-[520px] rounded-[28px] max-h-[92vh] overflow-y-auto">
      <form className="space-y-4 min-w-0" onSubmit={(e) => { e.preventDefault(); if (valid) { onSubmit(d); onOpenChange(false); } }}>
        {mode === 'create' && <SegmentedTabs full items={[{ id: 'course', label: '🎓 Khóa học' }, { id: 'book', label: '📖 Sách' }]} value={d.kind} onChange={(k: ItemKind) => setD((x) => ({ ...x, kind: k }))} />}
        {d.kind === 'course' ? (
          <>
            <Field label="Tên khóa học"><input autoFocus value={c.title} onChange={(e) => setC({ title: e.target.value })} placeholder="VD: React Advanced..." className={fieldCls} /></Field>
            <Field label="Danh mục"><ChoiceGrid items={LEARNING_CATEGORIES.map((x) => ({ id: x.id, label: x.name, icon: x.icon, color: x.color }))} value={c.category} onChange={(v) => setC({ category: v })} /></Field>
            <Field label="Tổng số bài học"><input type="number" inputMode="numeric" min="1" value={c.totalLessons} onChange={(e) => setC({ totalLessons: e.target.value })} placeholder="VD: 20" className={fieldCls} /></Field>
            <Field label="Mô tả (tùy chọn)"><textarea rows={3} value={c.description} onChange={(e) => setC({ description: e.target.value })} placeholder="Mô tả khóa học..." className={areaCls} /></Field>
          </>
        ) : (
          <>
            <Field label="Tên sách"><input autoFocus value={b.title} onChange={(e) => setB({ title: e.target.value })} placeholder="VD: Atomic Habits..." className={fieldCls} /></Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Tác giả"><input value={b.author} onChange={(e) => setB({ author: e.target.value })} placeholder="VD: James Clear" className={fieldCls} /></Field>
              <Field label="Tổng số trang"><input type="number" inputMode="numeric" min="1" value={b.totalPages} onChange={(e) => setB({ totalPages: e.target.value })} placeholder="VD: 320" className={fieldCls} /></Field>
            </div>
          </>
        )}
        <FormActions onCancel={() => onOpenChange(false)} submitLabel={mode === 'edit' ? 'Cập nhật' : 'Lưu'} disabled={!valid} />
      </form>
    </AdaptiveModal>
  );
}
