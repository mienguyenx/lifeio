# Module 06 — Journal / Reflection (UI v3)

Theo `references/journal-ref-1.webp`, dùng LIO UI Kit. Trang cũ: `/journal/classic`.

## Cấu trúc
```
src/features/journal/
  JournalPage.tsx               # Header (tìm, lịch sử, quản lý thẻ, Viết) · Hero Ori · Nhật ký|Lịch|Thống kê
  hooks/useJournal.ts           # entries, tags, stats, create/edit/remove (useSyncedStore), tag CRUD
  utils/journal.utils.ts        # MOODS/ENERGIES, tiêu đề = dòng đầu, stats (chuỗi ngày, TB tâm trạng, % 30 ngày)
  components/JournalCard.tsx    # Thẻ lưới (desktop) / hàng (mobile): ảnh bìa (ảnh đầu hoặc gradient tâm trạng), thẻ, ngày
  components/JournalEditor.tsx  # Ngày, Mẫu, Tiêu đề, nội dung, tâm trạng, năng lượng, biết ơn, thẻ, lĩnh vực, ảnh (tải lên/URL)
  components/JournalReader.tsx  # Chi tiết + Sửa/Xóa
  components/JournalCalendar.tsx# Lịch tháng có chấm màu tâm trạng + bài viết trong ngày
  components/JournalInsights.tsx# Tâm trạng/năng lượng theo thời gian, phân bổ cảm xúc, chủ đề (thẻ), lĩnh vực + biểu đồ & streak cũ
  components/JournalMoodPicker.tsx
```

## Ánh xạ dữ liệu
- Nhật ký **không có trường tiêu đề**: ô “Tiêu đề” được lưu là dòng đầu của `content` (tương thích dữ liệu cũ).
- Lọc: tâm trạng (chip), năng lượng, lĩnh vực, thẻ, tìm theo nội dung/biết ơn — như trang cũ.
- Dùng lại: `JournalTemplatesModal`, `JournalTagsManager`, `JournalHistoryModal`, `JournalAnalyticsChart`, `JournalStreakCard`.

## Không làm
- Ghi âm giọng nói, đính kèm file, lưu nháp tự động, yêu thích bài viết, xuất PDF/Markdown, rich-text toolbar — repo chưa có.
