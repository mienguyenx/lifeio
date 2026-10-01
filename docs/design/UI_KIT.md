# LIO UI Kit — quy tắc giao diện đồng nhất

Mọi module (Tasks, Habits, Calendar, Goals, Journal, AI Coach, Insights) dùng chung khối trong
`frontend/src/components/lio/index.tsx`. **Không tự viết lại header, tab, chip, nút nổi… trong từng module.**

## Khung trang
| Thành phần | Dùng khi | Ghi chú |
|---|---|---|
| `<Page>` | Bao ngoài mọi trang | Mobile `px-4 pt-3 pb-28`, desktop `px-6 lg:px-8 py-6`, tối đa 1440px |
| `<PageHeader title subtitle actions>` | Đầu trang | Tiêu đề 28px (mobile 24px) extrabold; actions bên phải theo thứ tự: **Tìm kiếm → nút phụ (icon) → nút chính** |
| `<HeroBanner mascot>` | Trang “nhà” của module (Journal, AI Coach, Insights) | Gradient tím-hồng + mascot lớn, CTA chính bên trong |

Thứ tự khối: **Header → (Hero) → SegmentedTabs → Stat tiles → Filters → Nội dung → (cột phải xl)**.

## Điều hướng & lọc
- `<SegmentedTabs>`: chuyển **chế độ xem** của module (Tổng quan/Thống kê, Nhật ký/Lịch/Thống kê, Tháng/Tuần/Ngày…). Mobile: `full`.
- `<FilterChips>`: lọc nhanh theo trạng thái/tâm trạng, chip đang chọn tô `primary`, có `count`.
- Lọc phụ (lĩnh vực, hạn, sắp xếp) dùng `Select` bo tròn `h-10 rounded-full` đặt cạnh chip.
- `<SearchToggle>`: nút kính lúp tròn, bấm để mở ô tìm kiếm.

## Thẻ & số liệu
- `<Surface>`: thẻ trắng `rounded-[22px]` viền nhạt + `shadow-soft` — mọi khối nội dung.
- `<SectionTitle title hint action>`: tiêu đề khối 15px bold.
- `<StatTile icon tint value label hint>`: ô số liệu ngang (icon pastel 44px). Lưới 2 cột (mobile) / 4 cột (desktop).
- `TINTS`: violet · orange · rose · amber · mint · sky — dùng cho nền icon.
- `<ProgressBar>`, `<ProgressRing>`: gradient tím→xanh mặc định; màu lĩnh vực = `hsl(var(--area-<id>))`.
- `<AreaTile>`, `<AreaChip>`: icon/nhãn lĩnh vực cuộc sống (LifeIcon `area/*`).
- `<MascotCard>`: câu trích + mascot ở cột phải. Mascot theo module (VISUAL_SPEC): Goals → Lumi, Tasks/Calendar → Mochi, Habits → Taro, Journal/AI/Insights → Ori.

## Hành động
- Desktop: nút chính `h-10 rounded-full px-5 shadow-soft` trong `PageHeader`.
- Mobile: nút chính chuyển thành `<Fab>` (góc phải, trên thanh điều hướng).
- `<IconButton label>`: nút tròn 40px cho hành động phụ (lịch sử, quản lý thẻ, lưu, xuất PDF…).
- Modal: `AdaptiveModal` (desktop dialog, mobile sheet) `rounded-[28px]`, nội dung bọc `min-w-0`, nút cuối `grid-cols-2` (Hủy | Lưu).
- Xóa luôn hỏi lại bằng `AlertDialog`.

## Trạng thái
- Trống: `EmptyState` (brand) với mascot của module.
- Trống trong khối nhỏ: `<Empty>`.


## Bổ sung Module 09–10
- `PeriodNav {label, onPrev, onNext, onReset?, resetLabel?, nextDisabled?}` — điều hướng ngày/tháng; đặt trong `HeroBanner.action` hoặc góc phải tab. Mobile: bỏ nút reset để không đè mascot.
- `ItemRow {icon, tint|iconBg, title, meta?, value?, valueClassName?, trailing?, onClick?}` — hàng danh sách chung (giao dịch, ghi nhận). Menu “⋯” đặt ở `trailing`.
- `InsightCard {title?, subtitle?, items[{icon,tint,title,desc}], onChat?, empty?}` — “LifeOS AI Coach”, gợi ý tạo bằng quy tắc từ dữ liệu thật; `onChat` → `/ai-chat`.
- `components/lio/charts.tsx`: `TrendArea` (d = yyyy-MM-dd hoặc yyyy-MM), `GroupedBars` (key `label`), `Donut` (+ chú giải), `StatStrip` (4 số liệu dưới biểu đồ), `CHART_TOOLTIP`. Mọi biểu đồ mới dùng các component này để cùng lưới/trục/tooltip.

## Bổ sung Module 11–14
- `components/lio/form.tsx`: `fieldCls`, `areaCls`, `Field {label, hint?}`, `ChoiceGrid {items[{id,label,icon,color}], cols 3|4|5}`, `StarRating`, `FormActions` (Hủy | Lưu). **Mọi modal mới dùng bộ này** (`AdaptiveModal` `sm:max-w-[520px] rounded-[28px] max-h-[92vh] overflow-y-auto`).
- `features/life-wheel/components/ScoreEditor` (chấm 10 lĩnh vực) và `WheelRadar` — dùng lại cho Review.
- Trang có >4 tab: bọc `SegmentedTabs` trong `overflow-x-auto no-scrollbar`; ≤4 tab: `full` trên mobile.
- `lifeWheelScores`: phần tử mới nhất ở đầu — luôn dùng `lib/lifeWheel.ts`.
- Mascot: Learning/Review → Ori, Relationships → Lumi, Life Wheel → Taro.

## Bổ sung Module 15–18
- **Mọi trang module** giờ cùng khung: PageHeader → SegmentedTabs ngay dưới → nội dung (Tổng quan: Hero + 4 StatTile + nội dung + side panel 320px ở xl). Đã áp dụng thêm cho Nhật ký, AI Coach, Tổng quan/Insights.
- `navigationConfig.ts` là nguồn duy nhất cho menu/command palette/quick add — thêm trang mới chỉ cần khai báo một chỗ.
- Biểu đồ recharts trong flex-col đứng riêng: truyền `height` số cho `ResponsiveContainer` (tránh cao 0).
- Lớp phủ toàn màn hình (onboarding) dùng `z-[60]` để nằm trên BottomNav `z-50`.

## Bổ sung Module 19–29 (Hôm nay → 404)
- Hoàn tất chuyển toàn bộ trang người dùng sang LIO kit — xem `modules/ACCOUNT_AND_UTILITIES.md`.
- Mẫu “thẻ hồ sơ”: gradient giống `HeroBanner`, avatar 96px tròn + nút camera, thanh hoàn thành hồ sơ.
- Lựa chọn dạng thẻ (`OptionCard` trong Cá nhân hóa): border + `ring-4 ring-primary/10` khi chọn — cùng ngôn ngữ với `ChoiceGrid`.
- Danh sách cài đặt: hàng `title + desc` bên trái, `Switch`/control bên phải, phân cách `divide-y divide-border/50`.
- 404 nằm trong app shell (không full-screen) để người dùng vẫn thấy điều hướng.
