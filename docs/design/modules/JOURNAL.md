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

---
## Cập nhật Module 15 — Reflection Journal (tham chiếu `references/journal-ref-2.webp`)
- **Khung trang thống nhất:** PageHeader → SegmentedTabs `Tổng quan | Nhật ký | Lịch | Thống kê` ngay dưới tiêu đề (trước đây tabs nằm dưới hero — lệch so với các module khác).
- **Tổng quan:** HeroBanner (Ori/learn) + chọn kỳ `7 ngày | 30 ngày | 3 tháng | 1 năm | Tất cả` + 4 StatTile (Bài viết, Ngày liên tiếp, Tâm trạng TB, Chủ đề chính) + Biểu đồ tâm trạng (TrendArea, theo ngày hoặc theo tháng khi ≥1 năm) + Từ khóa nổi bật (thẻ & lĩnh vực; bấm thẻ → tab Nhật ký đã lọc) + Nhật ký gần đây.
- **Side panel (xl):** Tổng quan cảm xúc (ring + Tích cực/Bình thường/Tiêu cực), Chủ đề thường gặp, Gợi ý từ AI Coach (rule-based từ dữ liệu: chưa viết hôm nay, chuỗi ngày, lòng biết ơn, tâm trạng tiêu cực, chủ đề nổi bật) + MascotCard.
- Dữ liệu: `useJournalPeriod(entries, tags, range)` (hooks/useJournalPeriod.ts) — chỉ dùng mood, energy, tags, areas, gratitude đã có.
- **Không làm:** AI Summary (tóm tắt bằng AI), thêm ảnh/“Gợi ý từ AI” trong trình soạn, lưu nháp, định dạng rich-text — repo chưa có.
