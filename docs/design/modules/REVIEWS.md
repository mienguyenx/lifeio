# Module 14 — Hệ thống Review (Tuần / Tháng / Kế hoạch năm / Năm)

Tham chiếu: `docs/design/references/reviews-ref-1.webp`. Code: `frontend/src/features/reviews/`. Trang cũ: `/weekly-review/classic`, `/monthly-review/classic`, `/yearly-planning/classic`, `/yearly-review/classic`.

## Khung chung (`ReviewLayout`)
- `PageHeader` + `ModuleHelpButton` · `ReviewSwitcher` (Tuần | Tháng | Kế hoạch năm | Năm — desktop trong header, mobile thành hàng riêng) · nút chính / `Fab` · `?add` mở form.
- `HeroBanner` (mascot **ori**) chứa `PeriodNav` theo tuần/tháng/năm → 4 `StatTile` → nội dung → cột phải xl (mobile hiện bên dưới).
- Thành phần dùng chung: `ScoreCard` (vòng điểm 1–5 → /10 + chỉ số có thanh), `TextCard`, `BulletCard`, `AreaRatingsCard` (10 lĩnh vực + chênh lệch kỳ trước), `RatingSummary`, `EditDelete`, `ReviewFormModal` (điểm 1–5 bằng emoji, ô nội dung, nút “💡 Gợi ý” chèn câu hỏi, điểm 10 lĩnh vực bằng `ScoreEditor`), `ReviewHistory` (biểu đồ điểm, tìm kiếm, lọc theo điểm, xóa), `ConfirmDialog`. Thống kê kỳ: `usePeriodStats` (cùng công thức các trang cũ).

## Trang
- **Review tuần** — tabs Tổng quan | Thống kê | Gợi ý | Lịch sử. Auto-draft (`useWeeklyAutoDraft`), Focus tuần trước, Câu hỏi suy ngẫm, biểu đồ ngày (habits/tasks/pomodoro) + InsightCard phân tích tuần, thẻ câu hỏi gợi ý đổi được, xóa tất cả lịch sử. Lưu review tạo điểm Wheel of Life (logic store cũ).
- **Review tháng** — tabs Tổng quan | Lịch sử. Chỉ số so với tháng trước, lưu kèm `stats`, Focus đã đặt tháng trước.
- **Kế hoạch năm** — tabs Tổng quan | Goals | Bucket | Theo quý. Chủ đề/mantra trong hero, tiến độ goals theo lĩnh vực, đổi trạng thái goal (Xong → 100%), tick bucket list, focus quý (quý hiện tại nổi bật), các năm khác.
- **Review năm** — tabs Tổng quan | Lịch sử. Từ khóa của năm, thư gửi tương lai, liên kết kế hoạch năm.

## Dữ liệu
- `weeklyReviews`, `monthlyReviews`, `yearlyPlannings`, `yearlyReviews` qua `useSyncedStore` (trang tháng/năm cũ chỉ ghi store local → nay có đồng bộ). Sửa lỗi `useSyncedStore` đồng bộ nhầm bản cũ nhất khi thêm review/kế hoạch (store thêm vào đầu mảng).
- Khóa tuần `weekStart` giữ công thức cũ để khớp dữ liệu đã lưu; ngày hiển thị luôn là thứ Hai thực.

## Không làm
Tóm tắt AI (“Powered by AI Coach”) — thay bằng InsightCard theo quy tắc; so sánh radar Life Wheel nhiều kỳ trong review; liên kết goal năm với Goals (chỉ hiển thị nhãn nếu có); review cuối quý; nhắc nhở viết review.
