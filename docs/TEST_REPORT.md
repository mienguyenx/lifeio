# Báo cáo kiểm thử End-to-End — LifeOS (Kiến trúc mới)

**Ngày:** 2026-05-30  
**Môi trường:** Local (Docker PostgreSQL 16 + Backend Fastify dev + Frontend Vite dev)  
**Mục đích:** Xác nhận toàn bộ hệ thống chạy end-to-end trên kiến trúc mới (không Supabase).

## Tổng kết

| Test | Kết quả |
|------|---------|
| Login qua REST API `/auth/login` | PASSED |
| Tạo habit qua `/db/insert` | PASSED |
| Tạo task qua `/db/insert` | PASSED |
| AI Coach streaming qua `/functions/ai-coach` | PASSED |
| Backend health check `/api/v1/health` | PASSED |
| No Supabase references in frontend `src/` | PASSED |

## Chi tiết

### 1. Đăng nhập (REST API)

Đăng nhập với `demo@lifeos.app` → backend trả access + refresh token, redirect về dashboard. Badge "External DB" xác nhận kết nối REST API.

![Login page](https://app.devin.ai/attachments/11c905c2-cbbd-48ca-97a7-4678f094d53d/screenshot_a7801ebfc4364ac0817b25ffa120d915.png)

![Dashboard sau login](https://app.devin.ai/attachments/d085df2d-29e2-426c-bcd0-b491763bd9f1/screenshot_bdbed1725f12468e870a6c692409fb1c.png)

### 2. Tạo Habit

Bấm nút nhanh "Uống 2L nước" → toast thành công, sidebar Habits badge = 1, habit hiện trong danh sách.

![Habit đã tạo](https://app.devin.ai/attachments/a06f2863-5e0f-4ebe-bbb9-bfc759ebf3ff/screenshot_7a557851ff984d218d5b59d90230ca01.png)

### 3. Tạo Task

Mở dialog "Thêm Task mới" → nhập tên + chọn deadline/ưu tiên/lĩnh vực → toast "Đã thêm task mới", task hiện trong danh sách + Today Focus.

![Task đã tạo](https://app.devin.ai/attachments/45d6b125-3884-4100-b8e2-76639a69499d/screenshot_44bfd147158b4275829061fa9cab734b.png)

### 4. AI Coach (Streaming SSE)

Mở panel AI Coach → chọn gợi ý "Hôm nay tôi nên ưu tiên làm gì?" → AI trả lời stream real-time, có sử dụng ngữ cảnh (năng lượng, habit, task) của user.

![AI Coach streaming](https://app.devin.ai/attachments/cb5d0d90-524d-4e4c-a963-00242f3b16e3/screenshot_977ef8fefcaa43efacbb58d977d56c9c.png)

### 5. Backend logs xác nhận

Logs backend cho thấy tất cả request đi qua REST API:
- `/api/v1/auth/login` — 2 lần
- `/api/v1/auth/refresh` — token xoay vòng
- `/api/v1/db/query` — hàng chục lần (sync dữ liệu)
- `/api/v1/db/insert` — 11 lần (habit, task, profile, settings)
- `/api/v1/functions/ai-coach` — 2 lần (SSE stream)

**Zero** requests đến Supabase.

### 6. Kiểm tra không còn Supabase trong frontend

```bash
$ grep -r "functions/v1\|VITE_SUPABASE\|@supabase" frontend/src/
# (no output — sạch)
```

## Kết luận

Toàn bộ flow chính (auth, CRUD habits/tasks, AI streaming) hoạt động end-to-end trên kiến trúc mới. Không phụ thuộc Supabase. Sẵn sàng deploy production (sau khi merge PRs #3→#8 và cấu hình domain/secrets thật).
