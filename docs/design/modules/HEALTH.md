# Module 09 — Sức khỏe (Health)

Tham chiếu: `docs/design/references/health-ref-1..3.webp`. Code: `frontend/src/features/health/`. Trang cũ: `/health/classic` (`pages/HealthPageLegacy.tsx`).

## Cấu trúc
- `PageHeader` “Sức khỏe” + `ModuleHelpButton` · nút “Ghi nhận” (desktop) / `Fab` (mobile) · `?add` mở form.
- `SegmentedTabs`: **Tổng quan | Nhật ký | Xu hướng | Liên kết**.
- Tổng quan: `HeroBanner` (mascot **taro**) + `PeriodNav` chọn ngày → 4 `StatTile` (Mục tiêu ngày %, Lượt ghi nhận, Ngày liên tiếp, Cân nặng) → `DailyLog` (6 thẻ chỉ số, nút “+” ghi nhanh) → `HealthTrends` (compact). Cột phải xl: `HealthSidePanel` (Điểm sức khỏe `ProgressRing`, `InsightCard`, Ghi nhanh, Mục tiêu sức khỏe, Thói quen sức khỏe hôm nay, Mẹo, `MascotCard`). Mobile: side panel nằm dưới nội dung.
- Nhật ký: `HealthLogList` — `FilterChips` theo chỉ số, nhóm theo ngày, `ItemRow` + menu Sửa/Xóa (`AlertDialog`).
- Xu hướng: `TrendArea` 7 ngày / 30 ngày / 3 tháng theo từng chỉ số + `StatStrip`.
- Liên kết: `AreaDashboardSection area="health"` (giữ nguyên).
- Form: `HealthLogModal` (AdaptiveModal, chọn chỉ số, giá trị + gợi ý nhanh, ngày, ghi chú, Hủy | Lưu).

## Dữ liệu (chỉ dùng code có sẵn)
- `healthLogs` (store) + `useHealthSync` (save/update/delete) — 6 loại: water, sleep, exercise, steps, weight, mood.
- Mức tham chiếu (8 ly, 8 giờ, 30 phút, 5000 bước) lấy từ “Mẹo sức khỏe”/preset của trang cũ; tổng trong ngày = cộng dồn (nước, vận động, bước) hoặc lần ghi cuối (ngủ, cân nặng, tâm trạng).
- Điểm sức khỏe = điểm `health` của lần Life Wheel gần nhất × 10 (trang cũ đọc sai `lifeWheelScores['health']`).
- AI Insights: quy tắc tại chỗ từ 7 ngày gần nhất (`insights()`), nút “Chat với AI Coach” → `/ai-chat`.
- Mục tiêu / thói quen: `goals`, `habits` có `area === 'health'`.

## Không làm (ref có nhưng app chưa có dữ liệu/tính năng)
Dinh dưỡng / bữa ăn, BMI & chỉ số cơ thể, giờ đi ngủ–thức dậy & chất lượng giấc ngủ, loại bài tập / quãng đường / calo, huyết áp – nhịp tim – SpO2, tự đặt mục tiêu sức khỏe riêng (dùng Goals), nhắc nhở uống nước (toggle), xuất dữ liệu sức khỏe, mascot thỏ (dùng taro theo `MODULE_MASCOT`).
