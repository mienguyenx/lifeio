# Module 18 — Navigation / App Shell

Tham chiếu: `references/app-shell-ref-1.webp`.

## Nguồn điều hướng duy nhất — `components/layout/navigationConfig.ts`
- `NAV_GROUPS`: **Hàng ngày** (Hôm nay, Công việc, Lịch, Thói quen) · **Phát triển bản thân** (Mục tiêu, Nhật ký, AI Coach, Tổng quan, Hành trình) · **Lĩnh vực cuộc sống** (Bánh xe, 10 lĩnh vực, Sức khỏe, Tài chính, Học tập, Quan hệ) · **Review & Kế hoạch** (tuần, tháng, Kế hoạch năm, năm) · **Thêm** (thu gọn: Ghi chú, Nhật ký quyết định, Bộ nhớ AI, Cá nhân hóa, Thùng rác).
- `ACCOUNT_ITEMS`: Hồ sơ, Cài đặt (+ Quản trị nếu `isAdmin`).
- `QUICK_ACTIONS`: Nhiệm vụ, Thói quen, Ghi chú, Sự kiện, Mục tiêu, Nhật ký, Giao dịch, Sức khỏe (mở form qua `?add`) + Pomodoro (`usePomodoroStore.start()`).
- Dùng bởi: AppSidebar (desktop), FullScreenMenu “Khám phá LifeOS” (mobile), CommandPalette (Ctrl/⌘+K), QuickAddSheet, BottomNav (đánh dấu “Thêm”).

## Thành phần
- **Sidebar:** nhóm như trên, mục cao 40px bo 14px, active = nền primary/10 + icon filled; badge tasks/habits/goals giữ nguyên; footer Hồ sơ, Cài đặt, Quản trị (ADMIN).
- **Top bar (desktop, 56px):** nút thu gọn sidebar + ô **Tìm trang, thêm nhanh… (Ctrl K)** → CommandPalette; giữ nguyên Ghi chú, Thùng rác, Phím tắt, Đồng bộ, AI Coach theo ngữ cảnh, Thông báo, Theme, menu người dùng.
- **Bottom nav (mobile):** Hôm nay · Công việc · (+) Thêm nhanh · Thói quen · Thêm.
- **Thêm nhanh:** lưới 3×3 thẻ tint + nút Hủy.

## Sửa lỗi
- QuickAddSheet điều hướng `?action=add` trong khi các trang chỉ đọc `?add` → form không mở. Nay dùng `?add`; Công việc nhận cả `?new=1` và `?add`; Ghi chú thêm hỗ trợ `?add`.
- Pomodoro trong Thêm nhanh trước đây chỉ về `/` — nay bắt đầu phiên ngay.
- Menu mobile thiếu Nhật ký, 10 lĩnh vực, Quyết định, Bộ nhớ AI, Cá nhân hóa → nay đủ mọi trang như desktop.
- Hộp thoại Phím tắt hiển thị sai Alt+7/8/9 (Sức khỏe/Tài chính/Học tập) so với phím thật (Bánh xe/Review tuần/AI Coach) → nay đọc trực tiếp `SHORTCUTS`.
- Lỗi kiểu framer-motion `Variants` trong FullScreenMenu/QuickAddSheet (có từ trước) đã sửa.

## Không làm
- Tìm kiếm nội dung dữ liệu toàn cục (Ctrl+K chỉ tìm trang & hành động), breadcrumb, nhãn “Premium”, menu Admin con trong sidebar.
