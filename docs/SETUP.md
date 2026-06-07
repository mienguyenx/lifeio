# Hướng dẫn cài đặt & chạy local

Tài liệu này hướng dẫn dựng toàn bộ LifeOS trên máy local: **PostgreSQL + Backend (Fastify) + Frontend (Vite)**. Sau khi xong bạn có thể đăng nhập, tạo task/habit/goal/journal/note và dùng AI Coach mà **không cần Supabase**.

## 1. Yêu cầu

| Thành phần | Phiên bản | Ghi chú |
|------------|-----------|---------|
| Node.js | ≥ 20 (khuyến nghị 22) | dùng cho cả backend & frontend |
| npm | ≥ 10 | đi kèm Node |
| Docker | bất kỳ bản mới | để chạy PostgreSQL nhanh |
| PostgreSQL | 16 | có thể cài trực tiếp thay vì Docker |
| (tùy chọn) Gemini API key | — | để test các tính năng AI; lấy tại https://aistudio.google.com/apikey |

## 2. Clone repo

```bash
git clone https://github.com/mienguyenx/lifeio.git
cd lifeio
```

Cấu trúc thư mục chính:

```
frontend/   # Web app (Vite + React + TypeScript)
backend/    # API (Fastify + Drizzle + PostgreSQL)
extension/  # Chrome extension (MV3)
db/         # schema gốc, seed, fixes, backups (nguồn migrate)
deploy/     # cấu hình Coolify (docker-compose)
scripts/    # script tiện ích (migrate dump, v.v.)
```

## 3. Khởi động PostgreSQL

Dùng Docker (nhanh nhất):

```bash
docker run -d --name lifeos-pg \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=lifeos \
  -p 5432:5432 \
  postgres:16

# kiểm tra
docker exec lifeos-pg pg_isready -U postgres
```

> Nếu đã có sẵn PostgreSQL, chỉ cần tạo database `lifeos` và chỉnh `DATABASE_URL` ở bước sau.

## 4. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Mở `.env` và chỉnh tối thiểu các giá trị sau:

```ini
DATABASE_URL=postgres://postgres:postgres@localhost:5432/lifeos
JWT_ACCESS_SECRET=<chuỗi ngẫu nhiên ≥ 16 ký tự>     # openssl rand -base64 48
JWT_REFRESH_SECRET=<chuỗi ngẫu nhiên ≥ 16 ký tự>

# (tùy chọn) bật AI:
GEMINI_API_KEY=<gemini api key của bạn>
```

Chạy migration để tạo bảng, rồi khởi động dev server:

```bash
npm run db:migrate     # tạo toàn bộ bảng trong DB
npm run dev            # API chạy ở http://localhost:4000
```

Kiểm tra backend sống:

```bash
curl http://localhost:4000/api/v1/health     # -> {"status":"ok",...}
```

Swagger/OpenAPI: mở http://localhost:4000/documentation

## 5. Frontend

Mở terminal mới:

```bash
cd frontend
npm install
```

Cấu hình URL API (frontend đọc `VITE_API_URL` lúc build/dev):

```bash
echo "VITE_API_URL=http://localhost:4000/api/v1" > .env
```

Chạy dev server:

```bash
npm run dev -- --host --port 3222     # mở http://localhost:3222
```

## 6. Tạo tài khoản demo (tùy chọn)

Có thể đăng ký trực tiếp trên UI (tab **Đăng ký**), hoặc tạo nhanh qua API:

```bash
curl -X POST http://localhost:4000/api/v1/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@lifeos.app","password":"DemoPass123!","name":"Demo User"}'
```

Sau đó đăng nhập tại http://localhost:3222 với email/mật khẩu vừa tạo.

## 7. Nạp dữ liệu cũ từ Supabase (tùy chọn)

Nếu muốn giữ dữ liệu cũ, dùng script migrate dump (đọc header script để biết chi tiết):

```bash
scripts/migrate-supabase-dump.sh db/backups/<file-dump>.sql
```

Script idempotent (chạy lại nhiều lần không nhân đôi dữ liệu). **Lưu ý:** mật khẩu cũ dạng `bcrypt`, backend mới verify `argon2` → người dùng migrate qua cần **đặt lại mật khẩu**.

## 8. Lint / build / kiểm tra

```bash
# backend
cd backend && npm run lint && npm run build

# frontend
cd frontend && npm run lint && npm run build
```

## 9. Lỗi thường gặp

| Triệu chứng | Nguyên nhân & cách xử lý |
|-------------|--------------------------|
| `ECONNREFUSED 127.0.0.1:5432` | PostgreSQL chưa chạy — kiểm tra `docker ps`, khởi động lại container |
| Frontend gọi API lỗi CORS | `CORS_ORIGINS` trong backend `.env` chưa chứa origin frontend (local để `*`) |
| `relation "..." does not exist` | Chưa chạy `npm run db:migrate` |
| AI Coach báo lỗi / không trả lời | Thiếu `GEMINI_API_KEY` (hoặc key hết hạn) trong backend `.env` |
| 401 khi gọi API | Access token hết hạn — frontend tự refresh; nếu vẫn lỗi, đăng nhập lại |

Tiếp theo: xem [USAGE.md](./USAGE.md) để biết cách dùng app, hoặc [ARCHITECTURE.md](./ARCHITECTURE.md) để hiểu kiến trúc.
