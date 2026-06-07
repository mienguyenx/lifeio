# Hướng dẫn sử dụng LifeOS

LifeOS là **"hệ điều hành cuộc sống"** — một web app giúp bạn quản lý mục tiêu, thói quen, công việc, nhật ký và phát triển bản thân, kèm **AI Coach** đồng hành mỗi ngày. Tài liệu này hướng dẫn dùng các tính năng chính.

## 1. Đăng ký & đăng nhập

1. Mở app (mặc định http://localhost:3222).
2. Tab **Đăng ký**: nhập email + mật khẩu để tạo tài khoản mới.
3. Tab **Đăng nhập**: nhập email/mật khẩu đã đăng ký. Tick **Ghi nhớ tài khoản** nếu muốn giữ phiên.
4. Đăng xuất: bấm avatar góc phải trên → **Đăng xuất**.

> Phiên đăng nhập dùng JWT (access token ngắn hạn + refresh token tự động xoay vòng). Khi access token hết hạn, app tự lấy token mới mà bạn không cần đăng nhập lại.

## 2. Onboarding (lần đầu)

Lần đầu vào app sẽ có bước thiết lập nhanh:
- **Tên hiển thị** → dùng cho lời chào ("Chào buổi chiều, …").
- **Nhóm người dùng / phong cách coaching / lịch sinh hoạt**.
- **Lĩnh vực cuộc sống (Life Areas)**: Sức khỏe, Quan hệ, Sự nghiệp, Tài chính, … — chọn các mảng bạn quan tâm.

Hồ sơ này được lưu lên backend (bảng `profiles`/`user_settings`) và dùng làm ngữ cảnh cho AI.

## 3. Màn hình Today (trang chủ)

Trung tâm điều khiển hằng ngày:
- **Lời chào + tiến độ ngày** (số task hoàn thành, pomodoro…).
- **Check-in buổi sáng**: chọn mức năng lượng (Mệt → Tràn). Dữ liệu này AI dùng để gợi ý.
- **Thanh nhập nhanh "Điều quan trọng nhất hôm nay?"**: đặt *intention* cho ngày.
- **Nút nhanh**: tạo **Task**, **Habit**, **Journal**, bật **Focus** (pomodoro).
- **Widget Habits & Tasks hôm nay**, **Tuần này**, **Gợi ý AI**, **Life Areas**.

## 4. Tasks (công việc)

- Mở từ sidebar **Tasks** hoặc nút **Task** ở Today.
- Tạo task: nhập **tên**, chọn **ngày hạn** (Hôm nay / Ngày mai / Tuần sau / tùy chọn), **độ ưu tiên** (Thấp / Trung bình / Cao), **lĩnh vực** (Cá nhân, Sức khỏe…).
- Đánh dấu hoàn thành bằng ô tick. Task hỗ trợ subtasks và tag.

## 5. Habits (thói quen)

- Mở từ sidebar **Habits** hoặc nút **Habit** ở Today.
- Tạo nhanh từ mẫu phổ biến (Uống 2L nước, Đọc sách 15 phút, Thiền 10 phút…) hoặc tạo tùy chỉnh.
- Mỗi ngày bấm **Done** để ghi nhận; app theo dõi **streak** (chuỗi ngày liên tục).
- Habit gắn với một **Life Area** để cân bằng các mảng cuộc sống.

## 6. Goals (mục tiêu)

- Sidebar **Goals**.
- Tạo mục tiêu dài hạn, chia thành các **milestones**, theo dõi trạng thái (đang làm / hoàn thành…).

## 7. Journal & Reflection (nhật ký & phản chiếu)

- **Journal**: viết nhật ký theo ngày, gắn tag, tâm trạng.
- **Weekly / Monthly Review**, **Yearly Planning / Review**: nhìn lại và lập kế hoạch theo chu kỳ. Hỗ trợ **Auto-draft** bằng AI.
- **Decision Log**: ghi lại các quyết định quan trọng.

## 8. Notes (ghi chú)

- Biểu tượng ghi chú trên thanh header.
- Tạo/sửa/xóa note, gắn tag. Note đã xóa nằm trong **Trash** (thùng rác) và có thể khôi phục.

## 9. AI Coach

Trợ lý AI hiểu ngữ cảnh của bạn (task, habit, năng lượng, lĩnh vực…).

1. Bấm biểu tượng **AI Coach** trên header (hoặc khu vực "Gợi ý AI").
2. Chọn một gợi ý có sẵn ("Hôm nay tôi nên ưu tiên làm gì?", "Gợi ý lịch trình hiệu quả"…) hoặc tự nhập câu hỏi.
3. Câu trả lời được **stream theo thời gian thực** (hiện dần từng đoạn).
4. Có thể **Lưu note**, **Lưu hội thoại**, hoặc **Xuất PDF**.

> Toàn bộ lời gọi AI đi qua backend (`/functions/ai-coach`) — API key AI nằm ở server, **không lộ ra trình duyệt**. Ngoài chat, AI còn hỗ trợ: tạo template, dịch (text-selector trong extension), gợi ý tầm nhìn/giá trị, gợi ý theme.

## 10. Browser Extension (tùy chọn)

Extension Chrome (thư mục `extension/`) cho phép:
- **Side panel / New tab / Widget**: xem nhanh LifeOS ngay trong trình duyệt.
- **Text selector**: bôi đen văn bản trên web → lưu thành **note** hoặc **dịch** qua AI.

Cách nạp khi dev: Chrome → `chrome://extensions` → bật **Developer mode** → **Load unpacked** → chọn thư mục `extension/`. Cấu hình `appUrl`/`apiUrl` trong `extension/config.js` (mặc định trỏ production; dev local override qua `chrome.storage.local`).

## 11. Mẹo

- Dùng **Focus / Pomodoro** để làm việc tập trung theo phiên.
- Check-in năng lượng mỗi sáng để AI gợi ý sát hơn.
- Gắn task/habit vào **Life Area** để giữ cân bằng (xem **Life Wheel**).
- Badge **External DB ✓** ở góc dưới sidebar xác nhận app đang kết nối REST API mới (không phải Supabase).

Xem thêm: [SETUP.md](./SETUP.md) (cài đặt), [ARCHITECTURE.md](./ARCHITECTURE.md) (kiến trúc), [DEPLOYMENT.md](./DEPLOYMENT.md) (triển khai).
