# Module 11 — Học tập (Learning)

Tham chiếu: `docs/design/references/learning-ref-1.webp`. Code: `frontend/src/features/learning/`. Trang cũ: `/learning/classic` (`pages/LearningPageLegacy.tsx`).

## Cấu trúc
- `PageHeader` “Học tập” + `ModuleHelpButton` · `SearchToggle` · “Thêm mới” (desktop) / `Fab` (mobile) · `?add`.
- `SegmentedTabs`: **Tổng quan | Thư viện | Thống kê | Liên kết**.
- Tổng quan: `HeroBanner` (mascot **ori/learn**) → 4 `StatTile` (Đang học, Đang đọc, Đã hoàn thành, Giờ học ước tính) → “Danh sách học tập” (`FilterChips` Tất cả/Khóa học/Sách + lọc trạng thái + sắp xếp, `LearningRow` với −1/+1 bài, +10 trang, Hoàn thành, menu Sửa/Xóa). Cột phải: `LearningSidePanel` (tiến độ tổng thể, MascotCard, mục tiêu học tập từ Goals `area=learning`, đang đọc, mẹo).
- Thư viện: `LibraryGrid` (thẻ khóa học/sách theo màu danh mục).
- Thống kê: `LearningStats` — `Donut` theo danh mục, `GroupedBars` theo trạng thái, `StatStrip`, `InsightCard`, gợi ý sách.
- Liên kết: `AreaDashboardSection area="learning"`.
- Form: `LearningItemModal` (Khóa học | Sách khi tạo mới; dùng `form.tsx`).

## Dữ liệu
- `learningCourses`, `learningBooks` + `useLearningSync` — giữ nguyên CRUD, cập nhật tiến độ, toast như trang cũ. Giờ học = bài đã học × 0,5h (công thức cũ).

## Không làm
Nhật ký thời gian học theo ngày, streak học tập, loại tài liệu khác (bài viết/video/ghi chú), ảnh bìa, chấm sao sách (chỉ hiển thị nếu có), xuất dữ liệu, mục tiêu học tập riêng (dùng Goals), nhắc nhở.
