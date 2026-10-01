# Module 19–29 — Hôm nay, Ghi chú, Thùng rác, Hồ sơ, Cài đặt, Cá nhân hóa, AI Memory, Nhật ký quyết định, 10 lĩnh vực, Hành trình, 404 (UI v3)

Tham chiếu: `../references/app-screens-ref.webp` (màn Today, Profile) + bộ LIO kit dùng chung (`components/lio`). Mọi trang theo **cùng một khung**:
`PageHeader` → `SegmentedTabs` → lưới `main + aside 320px` (HeroBanner + 4 StatTile + nội dung; cột phải: thẻ phụ + MascotCard) → `Fab` trên mobile.
Form trong `AdaptiveModal` (Dialog desktop / Drawer mobile) dùng `Field`, `fieldCls`, `areaCls`, `FormActions`; xóa luôn xác nhận bằng `AlertDialog`.

| Route | File mới | Trang cũ (giữ nguyên) | Tabs | Mascot |
|---|---|---|---|---|
| `/` | `features/today/TodayPage.tsx` | `/today/classic` | — | Lumi |
| `/notes` | `features/notes/NotesPage.tsx` (tinh chỉnh thêm ở `ADMIN.md`) | `/notes/classic` | Tất cả · Đã ghim · Yêu thích · Lưu trữ | Ori |
| `/trash` | `features/trash/TrashPage.tsx` | `/trash/classic` | Tất cả · Ghi chú · Công việc · Mục tiêu · Thói quen | Mochi |
| `/me` | `features/me/MePage.tsx` | `/me/classic` | Tổng quan · Tầm nhìn & giá trị | Lumi |
| `/settings` | `features/settings/SettingsPage.tsx` | `/settings/classic` | Chung · Dữ liệu · Tiện ích · Tài khoản | Mochi |
| `/personalization` | `features/personalization/PersonalizationPage.tsx` | `/personalization/classic` | Phong cách · AI Coach · Lịch trình · Ưu tiên · Hiển thị | Lumi |
| `/ai-memory` | `features/ai-memory/AIMemoryPage.tsx` | `/ai-memory/classic` | Tất cả · Chờ duyệt · Đã nhớ · Đã từ chối | Lumi |
| `/decisions` | `features/decisions/DecisionLogPage.tsx` | `/decisions/classic` | Tất cả · Cần review · Đang chờ · Đã review | Ori |
| `/area-dashboard` | `features/area-dashboard/AreaDashboardPage.tsx` | `/area-dashboard/classic` | Tất cả · Ưu tiên · Cần chú ý | Taro |
| `/journey` | `features/journey/JourneyPage.tsx` (+ `journey.data.ts`) | `/journey/classic` | Tất cả · Chặng 1–4 | Ori |
| `*` (trong app) | `features/not-found/NotFoundPage.tsx` | — | — | Ori |

## Dữ liệu & tính năng (giữ nguyên từ code hiện có)
- **Hôm nay**: tiến độ ngày, intention, AIDailyBriefing, MorningCheckin/EveningReview, TodayFocusCard, thói quen + công việc hôm nay/quá hạn, nước (+1 ly qua `useHealth`), giấc ngủ, vận động, Pomodoro, HabitRescue, gợi ý AI, đề xuất, lĩnh vực, OnboardingWizard.
- **Ghi chú**: CRUD qua `useSyncedStore` (ghim, yêu thích, lưu trữ/khôi phục, xóa vào thùng rác), Markdown editor/preview, thẻ (tạo/xóa, màu), lọc thẻ · thời gian · lĩnh vực, sắp xếp, tìm kiếm, `?add`.
- **Thùng rác**: khôi phục / xóa vĩnh viễn / dọn sạch (sync Supabase), tự động dọn theo `trashSettings`.
- **Hồ sơ**: ảnh đại diện (≤2MB), sửa thông tin, % hoàn thành hồ sơ, thống kê thói quen · chuỗi · Pomodoro · việc xong, `VisionValuesManager`, menu tiện ích, đăng xuất.
- **Cài đặt**: giao diện sáng/tối/hệ thống, Pomodoro, âm thanh + push, Xuất/Nhập dữ liệu, dữ liệu mẫu, xóa Module Area, reset toàn bộ (gõ `XOA TAT CA`), tải tiện ích trình duyệt + hướng dẫn, đăng xuất.
- **Cá nhân hóa**: archetype, giọng AI, trọng tâm coaching, giờ thức/ngủ/giờ vàng, phong cách lập kế hoạch, ưu tiên lĩnh vực (có thứ tự), check-in sáng/review tối, thẻ trọng tâm, gợi ý AI, huy hiệu chuỗi, ngày review tuần; lưu bằng nút “Lưu thay đổi” (chỉ bật khi có thay đổi).
- **AI Memory**: thêm thủ công, chấp nhận/từ chối đề xuất, sửa (→ `edited`), xóa; lọc theo trạng thái + danh mục; tìm kiếm.
- **Nhật ký quyết định**: thêm/sửa/xóa (soft delete), bối cảnh, lựa chọn, kết quả kỳ vọng, ngày review, ghi nhận kết quả thực tế; nhắc review khi đến hạn.
- **10 lĩnh vực**: điểm Bánh xe + xu hướng, tỉ lệ thói quen 7 ngày, công việc/quá hạn, mục tiêu; chi tiết lĩnh vực kèm `AreaDashboardSection`.
- **Hành trình**: 4 chặng / 12 nhiệm vụ / XP, mở khóa tuần tự, gợi ý nhiệm vụ tiếp theo.

## Sửa lỗi kèm theo
- Route không tồn tại trong app trước đây hiển thị **trang trắng** → thêm `<Route path="*">` với 404 mới (giữ sidebar).
- `useSyncedStore` khai báo `emptyTrash` nhưng **không export** → nút “Dọn sạch” thùng rác luôn báo lỗi. Đã export.
- Cài đặt cũ dùng `RefreshCwIcon` chưa import khi xóa Module Area (crash lúc đang xóa) và `window.confirm` → thay bằng `Loader2` + `AlertDialog`.
- Hồ sơ: nút “Đăng xuất” chuyển về `/auth` như Cài đặt.

## Không làm (không có trong code hiện tại)
- Trang Thông báo riêng, đổi mật khẩu / xóa tài khoản, chọn ngôn ngữ trong Cài đặt người dùng.
- Đồng bộ Decision Log / AI Memory lên Supabase (store hiện chỉ lưu local).
- Thống kê nâng cao cho Ghi chú (biểu đồ), chia sẻ ghi chú.
