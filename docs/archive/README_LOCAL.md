# Hướng dẫn chạy ứng dụng với Supabase Local

## Yêu cầu

1. **Docker Desktop** - Download và cài đặt từ: https://www.docker.com/products/docker-desktop
2. **Supabase CLI** - Cài đặt qua một trong các cách sau:

### Cài đặt Supabase CLI

**Cách 1: Qua npm (Khuyến nghị)**
```bash
npm install -g supabase
```

**Cách 2: Qua Scoop (Windows)**
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Kiểm tra cài đặt:**
```bash
supabase --version
```

## Quick Start

### 1. Khởi động Supabase Local

```powershell
# Sử dụng script (khuyến nghị)
.\scripts\supabase-local.ps1 start

# Hoặc chạy trực tiếp
supabase start
```

Lần đầu chạy sẽ mất vài phút để download Docker images.

### 2. Thiết lập Environment Variables

```powershell
# Script tự động lấy thông tin và tạo .env.local
.\scripts\setup-local-env.ps1

# Hoặc thủ công: Lấy thông tin từ supabase status và tạo file .env.local
supabase status
```

Tạo file `.env.local` với nội dung:
```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key-từ-supabase-status>
```

### 3. Khởi động ứng dụng

```bash
npm run dev
```

Ứng dụng sẽ chạy tại: http://localhost:3222

## Các lệnh hữu ích

### Quản lý Supabase Local

```powershell
# Khởi động
.\scripts\supabase-local.ps1 start

# Dừng
.\scripts\supabase-local.ps1 stop

# Xem status
.\scripts\supabase-local.ps1 status

# Reset database (xóa tất cả data)
.\scripts\supabase-local.ps1 reset

# Xem logs
.\scripts\supabase-local.ps1 logs

# Mở Supabase Studio
.\scripts\supabase-local.ps1 studio
```

### Hoặc dùng lệnh trực tiếp:

```bash
supabase start          # Khởi động
supabase stop           # Dừng
supabase status         # Xem thông tin kết nối
supabase db reset       # Reset database
supabase logs           # Xem logs
```

## Truy cập Supabase Studio

Sau khi khởi động Supabase local, truy cập:
- **Studio URL**: http://localhost:54323
- **API URL**: http://localhost:54321
- **Inbucket (Email testing)**: http://localhost:54324

## Database Migrations

Migrations đã có sẵn trong `supabase/migrations/` và sẽ tự động chạy khi start.

Để tạo migration mới:
```bash
supabase migration new <migration_name>
```

Để reset và chạy lại migrations:
```bash
supabase db reset
```

## Cấu trúc Database

Database schema đã được định nghĩa trong:
- `supabase/migrations/20251222014646_remix_migration_from_pg_dump.sql`
- `docs/external-supabase-setup.sql`

## Troubleshooting

### Port đã được sử dụng
```bash
# Dừng Supabase
supabase stop

# Hoặc kiểm tra process đang dùng port
netstat -ano | findstr :54321
```

### Docker không chạy
- Đảm bảo Docker Desktop đang chạy
- Kiểm tra: `docker ps`

### Reset hoàn toàn
```bash
supabase stop
supabase db reset
supabase start
```

### Lỗi kết nối
1. Kiểm tra Supabase đang chạy: `supabase status`
2. Kiểm tra file `.env.local` có đúng thông tin không
3. Khởi động lại dev server: `npm run dev`

## Lưu ý

- **Data persistence**: Data trong Supabase local được lưu trong Docker volumes
- **Reset data**: Chạy `supabase db reset` sẽ xóa tất cả data
- **Environment variables**: File `.env.local` không được commit vào git (đã có trong .gitignore)

## Chuyển đổi giữa Local và Cloud

### Sử dụng Local:
- Có file `.env.local` với `VITE_SUPABASE_URL=http://localhost:54321`

### Sử dụng Cloud:
- Xóa hoặc comment file `.env.local`
- Ứng dụng sẽ tự động dùng external Supabase cloud (hardcoded trong externalClient.ts)

