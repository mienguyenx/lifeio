# Module 20–22 & 34–35 — Admin (Người dùng, Workspace, Gói dịch vụ) + tinh chỉnh Ghi chú, Thùng rác (UI v3)

Mục tiêu: khu quản trị dùng **cùng khung và cùng LIO kit** với app người dùng — không còn kiểu Card/Table shadcn riêng.
Khung trang: `PageHeader` → `SegmentedTabs` → lưới `main + aside 320–340px` (HeroBanner + 4 StatTile + Surface bảng; cột phải: panel chi tiết **hoặc** thẻ tổng quan + MascotCard) → `Fab` mobile.
Trên desktop rộng (≥1280px) chọn một dòng sẽ mở **panel chi tiết ở cột phải**; màn nhỏ hơn mở `AdaptiveModal`.

| Route | File mới | Bản cũ | Tabs | Mascot |
|---|---|---|---|---|
| `/admin/users` | `features/admin/users/AdminUsersPage.tsx` | `/admin/users/classic` | Tất cả · Admin · Moderator · User | Lumi |
| `/admin/workspaces` | `features/admin/workspaces/AdminWorkspacesPage.tsx` | `/admin/workspaces/classic` | Tất cả · Hoạt động · Tạm dừng | Taro |
| `/admin/plans` | `features/admin/plans/AdminPlansPage.tsx` | `/admin/plans/classic` | Tất cả · Công khai · Ẩn | Mochi |
| `/notes` | `features/notes/NotesPage.tsx` (tinh chỉnh) | `/notes/classic` | Tất cả · Đã ghim · Yêu thích · Lưu trữ | Ori |
| `/trash` | `features/trash/TrashPage.tsx` (tinh chỉnh) | `/trash/classic` | Tất cả · 4 loại | Mochi |

Thành phần dùng chung admin: `features/admin/shared.tsx` — `Pill` (tông màu mềm), `RolePill`, `UserAvatar`, `CheckBox`, `GridHead/GridRow` (bảng dạng lưới bo góc), `Pager`, `InfoRow`, `monthlyCounts`, kiểu `AdminProfile`.
Mutation người dùng tách ra `hooks/useAdminUserActions.ts` (bản mới và bản cũ dùng chung).

## App shell admin
- Sidebar: logo/tên từ `useBranding` + nhãn “Admin”, nhóm menu giữ nguyên `adminNavItems`, item cùng kiểu app (`h-10 rounded-[14px]`, active `bg-primary/10 text-primary`), thẻ mascot “Chế độ quản trị” + “Quay lại ứng dụng”, `DatabaseIndicator`.
- Mục con (vd `/admin/users/classic`) vẫn sáng mục cha. Giữ thu gọn `Ctrl+B`, Sheet trên mobile, Command palette `Ctrl+K`, ErrorBoundary.
- Topbar: breadcrumb + ô tìm kiếm dạng pill (mở palette), ThemeToggle, quay lại app, avatar + “Quản trị viên”.

## Dữ liệu & tính năng (giữ nguyên từ code hiện có)
- **Người dùng**: tìm theo tên/email, lọc vai trò, sắp xếp tên/ngày tham gia, phân trang 10/20/50/100, đổi vai trò, gửi email, gửi reset mật khẩu, reset onboarding, xóa (xác nhận). Chi tiết: sửa tên (inline thay cho `prompt()`), vai trò, hồ sơ (email, ngày tham gia, cập nhật, múi giờ, giới thiệu, mục đích sống), Hoạt động (mục tiêu/thói quen/công việc/nhật ký), Phân tích (hoạt động 30 ngày, % hoàn thành thói quen, streak, mục tiêu theo lĩnh vực), Gói (gói hiện tại + cập nhật gói). Thêm cột “Gói” và thẻ “Có gói dịch vụ” từ `user_subscriptions` sẵn có; biểu đồ người dùng mới theo tháng + donut vai trò tính từ `profiles`/`user_roles`.
- **Workspace**: tìm (tên/slug/chủ sở hữu), lọc trạng thái, tạo (tên, slug tự sinh, mô tả, chủ sở hữu, giới hạn), bật/tắt, xóa. Chi tiết: Tổng quan (sửa tên/mô tả/giới hạn, kích hoạt, chuyển quyền sở hữu có xác nhận), Thành viên (thêm, đổi vai trò, gỡ; chặn thêm khi đủ giới hạn), Lời mời (gửi, thu hồi, đánh dấu hết hạn), Phân tích (hoạt động thành viên, vai trò, đóng góp nhiều nhất).
- **Gói dịch vụ**: thẻ bảng giá (giá/chu kỳ, mô tả, số người dùng, số giới hạn, 4 tính năng đầu), bật/tắt, đặt mặc định, sửa/tạo trong một form 4 tab (Chung · Tính năng · Giới hạn · Hiển thị & người dùng được phép). Bảng “Đăng ký của người dùng” (lọc theo gói, tìm theo người dùng, phân trang) + donut người đăng ký theo gói + đếm theo trạng thái — đều từ `user_subscriptions`.
- **Ghi chú**: 5 StatTile (thêm “Thẻ”), thư viện dạng bảng trên desktop (checkbox, tiêu đề + trích đoạn, thẻ · lĩnh vực, cập nhật, ghim/sao bấm nhanh, menu) và thẻ trên mobile, chọn nhiều → Ghim / Lưu trữ (hoặc Khôi phục) / Xóa, bộ lọc thẻ + lĩnh vực + sắp xếp + chip thời gian 7/30/90/Tất cả. Cột phải: xem trước ghi chú (Markdown, ghim/yêu thích/lưu trữ/sửa/xóa), Quản lý thẻ (đếm, lọc, xóa có xác nhận, tạo nhanh với màu), Trạng thái ghi chú (→ Thùng rác).
- **Thùng rác**: 5 StatTile (Tổng + 4 loại), bảng desktop (checkbox, tiêu đề, loại, thời gian xóa, còn lại, Khôi phục / Xóa), chọn nhiều → khôi phục / xóa vĩnh viễn, cột phải: tự dọn (bật/tắt + chip 7/14/30/60/90 ngày), thao tác nhanh, tổng quan % theo loại, “Chính sách & quyền riêng tư” suy ra từ cài đặt thật + liên kết `/settings?tab=data` (Cài đặt nay nhận tham số `tab`).

## Sửa lỗi kèm theo
- `pages/admin/AdminUsers.tsx` dùng `useEffect` và icon `Edit2` nhưng không import → mở “Chi tiết người dùng” ở bản cũ bị crash. Đã bổ sung import.
- Bản cũ Gói dịch vụ: sửa gói không lưu `billing_period`/`sort_order` dù cho chỉnh; “Set Default” không bỏ cờ gói mặc định cũ (có thể nhiều gói mặc định). Bản mới lưu đủ trường và chỉ giữ một gói mặc định.
- Cập nhật gói của người dùng giờ làm mới cả danh sách `user-subscriptions` (cột “Gói” cập nhật ngay).
- Ghi chú: tiêu đề “Thẻ” ở cột phải bị lỗi mã hóa ký tự (hiện “Th���”).
- Bật tự dọn thùng rác khi số ngày đang là 0 sẽ đặt mặc định 30 ngày (trước đó bật nhưng không có tác dụng).

## Không làm (không có trong code hiện tại)
- Số liệu so sánh kiểu “+12% so với tháng trước”, doanh thu/MRR, tỷ lệ chuyển đổi, thanh toán/hóa đơn, coupon — không có nguồn dữ liệu.
- Trạng thái “online/hoạt động gần nhất” của người dùng, khóa/tạm ngưng tài khoản, nhật ký hoạt động (audit log) theo người dùng/workspace.
- Thùng rác: “Hoạt động gần đây” (không có log) và quy tắc tự dọn theo từng loại (`TrashSettings` chỉ có `enabled` + `autoCleanupDays`).
- Ghi chú: thư mục/sổ tay, chia sẻ, đính kèm tệp.
