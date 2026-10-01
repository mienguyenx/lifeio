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

---

# Module 23–28 — AI, Thư viện mẫu, Phân tích, Bản địa hóa, Prompt, API key

Cùng khung trang với Module 20–22: `PageHeader` (SearchToggle + nút chính) → `SegmentedTabs` → lưới `xl:[1fr_340px]` gồm HeroBanner + 4 StatTile + `Surface` bảng `GridHead/GridRow` (danh sách trên mobile) + `Pager` → cột phải: panel chi tiết khi chọn hàng (≥1280px, nhỏ hơn thì `AdaptiveModal`), nếu không là thẻ tổng quan + MascotCard → `Fab` trên mobile. Xóa luôn qua `ConfirmDialog`.

| Route | File mới | Bản cũ | Tabs | Mascot |
|---|---|---|---|---|
| `/admin/ai/providers` | `features/admin/ai/AdminAIProvidersPage.tsx` | `/admin/ai/providers/classic` | Tất cả · Đang bật · Đang tắt · Tùy chỉnh | Ori (idea) |
| `/admin/ai/models` | `features/admin/ai/AdminAIModelsPage.tsx` | `/admin/ai/models/classic` | Tất cả · Đang bật · Đang tắt · Thử model | Ori (learn) |
| `/admin/templates/:loại` | `features/admin/templates/AdminTemplatesPage.tsx` | `/admin/templates/<loại>/classic` | Mục tiêu · Thói quen · Công việc · Nhật ký · Review | Mochi (focus) |
| `/admin/analytics` | `features/admin/analytics/AdminAnalyticsPage.tsx` | `/admin/analytics/classic` | Tổng quan · Nội dung · Tương tác | Taro (go) |
| `/admin/languages`, `/admin/translations` | `features/admin/localization/AdminLocalizationPage.tsx` | `/admin/languages/classic`, `/admin/translations/classic` | Ngôn ngữ · Bản dịch · Dịch AI | Ori (explore) |
| `/admin/ai/prompts` | `features/admin/ai/AdminAIPromptsPage.tsx` | `/admin/ai/prompts/classic` | Tất cả + từng danh mục | Lumi (love) |
| `/admin/api-keys` | `features/admin/apikeys/AdminAPIKeysPage.tsx` | `/admin/api-keys/classic` | Tất cả + từng provider | Taro (care) |

Bổ sung `features/admin/shared.tsx`: `useIsXl`, `RowMenu` (menu “…” cuối hàng), `ConfirmDialog`, `CountBars` (thanh tỉ lệ cho thẻ tổng quan), `ToggleRow`, `MiniStat`, `PALETTE`, `fmtDate`.
Mới `hooks/useAdminApiKeys.ts`: truy vấn/mutation bảng `api_keys` dùng chung cho trang Provider và API key (trước đây viết lặp trong 2 file).

## Dữ liệu & tính năng (giữ nguyên từ code hiện có)
- **Nhà cung cấp AI**: bảng provider (màu, tên, mô tả/base URL, loại, số model, số key, bật/tắt; provider có sẵn `builtin-*` chặn bật/tắt như bản cũ), thêm provider tùy chỉnh (tên, slug tự sinh, loại, xác thực, base URL, models endpoint, auth header/tiền tố, mô tả), xóa provider tùy chỉnh. Chi tiết: Model (Lấy model qua `fetchModelsFromProvider`, kiểm tra kết nối `testProviderConnection`, import từng cái/tất cả, xóa model), API key (thêm — key đầu tiên tự là key chính, bật/tắt, đặt key chính, hiện/ẩn, xóa, lượt dùng/lỗi), Cấu hình (chỉ đọc: loại, URL, endpoint, cách lấy, xác thực, streaming/tools, extra headers, link tài liệu/bảng giá). Tổng quan: donut model theo provider, đếm theo loại kết nối.
- **Model AI**: bảng model (tên, model ID, provider, max tokens, temperature, năng lực, bật/tắt), lọc provider, tìm kiếm, đặt mặc định, cấu hình (tên, max tokens, temperature, mô tả, năng lực), thêm, xóa. “Lấy model từ provider” dùng danh sách provider + `fetchModelsFromProvider` (ghi đè base URL tùy chọn) thay cho khối `if/else` trùng lặp của bản cũ. Tab “Thử model” gọi `functions.invoke('ai-coach')` như bản cũ.
- **Thư viện mẫu**: 5 loại trong một trang (tab đổi URL nên menu trái vẫn đúng), bảng (tên/mô tả, các trường nội dung, lượt dùng, cập nhật, bật/tắt), lọc trạng thái, xem nội dung dạng danh sách hoặc JSON, sao chép JSON, sửa/tạo (JSON + “Chèn khung trường” từ danh sách trường gợi ý có sẵn của từng loại + “Định dạng”), xóa, “Tạo bằng AI” (`ai-template-generate`: danh mục, hướng dẫn, thêm từng mẫu/tất cả). Tổng quan: số mẫu theo loại, top lượt dùng.
- **Phân tích & Báo cáo**: từ `useExtendedAdminStats` + `useDashboardStats` + `profiles` — người dùng (tổng, mới 7/30 ngày), % hoàn thành mục tiêu/công việc, biểu đồ người dùng mới 6/12 tháng, số bản ghi 6 loại nội dung, bảng tỉ trọng + trung bình/người, Pomodoro/nhật ký/review, sức khỏe nền tảng (plugin, feature flag, ngôn ngữ đang bật).
- **Ngôn ngữ & Bản dịch**: gộp 2 trang cũ. Ngôn ngữ: bảng (cờ, tên, tên bản địa, mã, tiến độ, số bản dịch, bật/tắt), thêm/sửa (mã, cờ gợi ý, tên, tên bản địa, tiến độ + nút tính tiến độ theo số bản dịch so với key tiếng Anh), xóa; chi tiết → “Bản dịch” lọc sẵn theo ngôn ngữ. Bản dịch: lọc namespace/ngôn ngữ, tìm key/nội dung, phân trang 10–100, thêm/sửa/xóa, sao chép. Dịch AI (`ai-translate`): dịch + gợi ý cách dịch (ngữ cảnh, độ trang trọng), dịch hàng loạt theo namespace từ chuỗi tiếng Anh (dữ liệu mẫu nếu DB trống), sao chép JSON.
- **Thư viện prompt**: tab theo danh mục, bảng (tên/key, danh mục, model, số biến, bật/tắt), chi tiết (system prompt, mẫu user prompt, sao chép, model, độ dài), thêm/sửa (tên, key, danh mục, model hoặc mặc định, mô tả, system prompt, mẫu user prompt), xóa. Biến `{{ten}}` được nhận diện và lưu vào trường `variables` có sẵn.
- **API key & bí mật**: tab theo provider + lọc Bật/Tắt/Lỗi, bảng (tên, key rút gọn/hiện, provider, lượt dùng + hạn mức ngày, lỗi, dùng gần nhất, bật/tắt), chi tiết (hạn mức ngày/tháng, lỗi gần nhất, base URL/model, thời gian), thêm/sửa (provider gồm danh sách cũ + provider trong Nhà cung cấp AI, tên, key, base URL & model mặc định cho OpenAI/Anthropic compatible, giới hạn ngày/tháng, bật, key chính), sao chép, xóa. Thẻ “Cần chú ý”: provider chưa có key chính đang bật, key ≥80% hạn mức, key có lỗi — đều tính từ cột có sẵn.

## Sửa lỗi kèm theo (23–28)
- Model AI: “Set Default” không bỏ cờ model mặc định cũ → có thể nhiều model mặc định. Bản mới chỉ giữ một.
- API key: tạo/sửa key với “Key chính” không bỏ cờ key chính khác cùng provider (chỉ nút “Đặt làm chính” mới làm). Sửa key và xóa trống giới hạn ngày/tháng không bỏ được giới hạn. Đã sửa trong `useAdminApiKeys`.
- Thư viện mẫu: ô JSON parse ngay khi gõ nên không gõ được JSON dở dang (giá trị bị đặt lại). Bản mới giữ chuỗi thô, kiểm tra khi lưu.
- Bản dịch: sửa key/namespace rồi lưu (upsert) tạo bản ghi mới và để lại bản ghi cũ. Bản mới khóa ngôn ngữ/namespace/key khi sửa.
- Thư viện prompt: trường `variables` luôn lưu rỗng — nay tự nhận diện từ `{{biến}}`.

## Không làm (23–28, không có trong code hiện tại)
- Số liệu sử dụng/độ trễ/chi phí theo model hay provider, tình trạng “health”/uptime, quy tắc định tuyến (routing/fallback) cấu hình được, playground nhiều lượt/so sánh model.
- Mẫu: đánh giá/sao, marketplace, phiên bản mẫu, xem trước như giao diện người dùng, phân quyền theo gói.
- Phân tích: so sánh kỳ trước (%), DAU/MAU/retention/cohort, bộ chọn khoảng ngày tùy ý, xuất PDF/Excel/CSV, lịch gửi báo cáo.
- Bản địa hóa: import/export tệp ngôn ngữ, phát hiện key thiếu tự động theo mã nguồn, lịch sử chỉnh sửa, quy trình duyệt bản dịch.
- Prompt: phiên bản/lịch sử, A/B test, chạy thử prompt với biến.
- API key: mã hóa/che ở phía máy chủ, xoay vòng theo lịch, phạm vi quyền (scopes), IP allowlist, nhật ký truy cập.
