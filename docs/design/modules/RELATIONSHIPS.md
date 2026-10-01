# Module 12 — Quan hệ (Relationships)

Tham chiếu: `docs/design/references/relationships-ref-1.webp`. Code: `frontend/src/features/relationships/`. Trang cũ: `/relationships/classic`.

## Cấu trúc
- `PageHeader` “Quan hệ” + `ModuleHelpButton` · `SearchToggle` (tên/SĐT/email → tab Liên hệ) · “Ghi tương tác” (outline) · “Thêm liên hệ” / `Fab` · `?add`.
- `SegmentedTabs`: **Tổng quan | Liên hệ | Tương tác | Phân tích | Liên kết**.
- Tổng quan: `HeroBanner` (mascot **lumi/happy**) → 4 `StatTile` (Tổng liên hệ, Cần chú ý, Tương tác tháng này, Sinh nhật 30 ngày) → “Cần liên lạc” (nút **Nhắc nhớ** mở ghi tương tác) + “Tương tác gần đây”. Cột phải: `RelSidePanel` (Điểm quan hệ từ Life Wheel, InsightCard, Sinh nhật sắp tới, Mục tiêu quan hệ từ Goals, Mẹo, MascotCard).
- Liên hệ: `FilterChips` theo mối quan hệ + danh sách `ContactRow`; bấm mở `ContactDetail` (thông tin + lịch sử tương tác).
- Tương tác: `FilterChips` theo loại + `InteractionRow`.
- Phân tích: `RelAnalytics` — tương tác 6 tháng (`GroupedBars`), `Donut` theo mối quan hệ, theo loại tương tác.
- Form: `ContactModal` (thêm trường **Sinh nhật** — model & sync đã có sẵn), `InteractionModal` (chọn ngày).

## Dữ liệu
- `relationshipsContacts`, `relationshipsInteractions` + `useRelationshipsSync`. Quy tắc “cần chú ý” giữ nguyên trang cũ. Ghi tương tác cập nhật `lastContact` của liên hệ **và đồng bộ lên DB** (trang cũ chỉ cập nhật local).

## Không làm
Ảnh đại diện upload, nhắc nhở/thông báo tự động, nhóm tùy chỉnh, mục tiêu quan hệ riêng (dùng Goals), tần suất liên lạc mục tiêu, import danh bạ.
