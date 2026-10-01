# Module 13 — Bánh xe cuộc sống (Life Wheel / Life Areas)

Tham chiếu: `docs/design/references/life-areas-ref-1.webp`. Code: `frontend/src/features/life-wheel/`. Trang cũ: `/life-wheel/classic`. Trang `/area-dashboard` giữ nguyên.

## Cấu trúc
- `PageHeader` “Bánh xe cuộc sống” + `ModuleHelpButton module="lifewheel"` · “Đánh giá mới” / `Fab` · `?add`.
- `SegmentedTabs`: **Tổng quan | Đánh giá | Xu hướng | Lĩnh vực | Lịch sử**.
- Tổng quan: `HeroBanner` (mascot **taro**, câu theo mức cân bằng) → 4 `StatTile` (Điểm TB, Cao nhất, Thấp nhất, So với lần trước) → `WheelRadar` (lớp nét đứt = lần trước, điểm TB ở giữa) + lưới 10 lĩnh vực có chênh lệch. Cột phải: `WheelSidePanel` (Mức cân bằng, Cần cải thiện, Điểm mạnh, InsightCard, Mẹo, MascotCard).
- Đánh giá: `ScoreEditor` (thanh trượt + nút ‹ ›, mục tiêu mặc định, so với lần trước) + xem trước radar; Lưu → `addLifeWheelScore`.
- Xu hướng: `WheelTrends` (`TrendArea` điểm TB hoặc từng lĩnh vực, 3 tháng / 6 tháng / tất cả).
- Lĩnh vực: `AreaGrid` (điểm, mục tiêu, số goals/habits/tasks/nhật ký liên kết) → chọn lĩnh vực hiện `AreaDashboardSection`.
- Lịch sử: `WheelHistory` — xem trên bánh xe, xóa bản ghi, xóa lịch sử (giữ bản mới nhất).

## Dữ liệu
- `lifeWheelScores` (mới nhất ở **đầu** mảng) — dùng `lib/lifeWheel.ts` (`wheelDesc`, `latestWheel`, `previousWheel`, `wheelAvg`). Đã sửa AI Coach / Insights / Health vốn lấy nhầm phần tử cuối (bản cũ nhất).

## Không làm
Chỉnh mục tiêu điểm từng lĩnh vực (trang cũ chỉ lưu tạm trong phiên → hiển thị mục tiêu mặc định), xuất báo cáo, thêm đánh giá cho ngày trong quá khứ.
