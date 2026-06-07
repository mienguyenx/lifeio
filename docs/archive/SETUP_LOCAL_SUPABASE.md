# Hướng dẫn Setup Supabase Local

## Bước 1: Cài đặt Supabase CLI

### Windows (PowerShell):
```powershell
# Cài đặt qua Scoop (khuyến nghị)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Hoặc cài đặt qua npm
npm install -g supabase
```

### Kiểm tra cài đặt:
```bash
supabase --version
```

## Bước 2: Cài đặt Docker Desktop

Supabase local chạy trên Docker, cần cài đặt Docker Desktop:
- Download: https://www.docker.com/products/docker-desktop
- Khởi động Docker Desktop và đảm bảo nó đang chạy

## Bước 3: Khởi tạo Supabase Local

```bash
# Khởi động Supabase local
supabase start

# Lần đầu chạy sẽ mất vài phút để download images
```

Sau khi chạy thành công, bạn sẽ thấy thông tin kết nối:
- API URL: `http://localhost:54321`
- GraphQL URL: `http://localhost:54321/graphql/v1`
- DB URL: `postgresql://postgres:postgres@localhost:54322/postgres`
- Studio URL: `http://localhost:54323`
- Inbucket URL: `http://localhost:54324`
- JWT secret: (sẽ hiển thị)
- anon key: (sẽ hiển thị)
- service_role key: (sẽ hiển thị)

## Bước 4: Chạy Migrations

Migrations đã có sẵn trong thư mục `supabase/migrations/`:
```bash
# Migrations sẽ tự động chạy khi start
# Hoặc chạy thủ công:
supabase db reset
```

## Bước 5: Cập nhật cấu hình ứng dụng

Cập nhật file `src/integrations/supabase/externalClient.ts` hoặc tạo file `.env.local`:

```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key-từ-supabase-start>
```

## Bước 6: Truy cập Supabase Studio

Mở browser và truy cập: `http://localhost:54323`

Tại đây bạn có thể:
- Xem và quản lý database
- Chạy SQL queries
- Quản lý authentication
- Xem logs

## Các lệnh hữu ích:

```bash
# Khởi động Supabase
supabase start

# Dừng Supabase
supabase stop

# Xem status
supabase status

# Reset database (xóa tất cả data và chạy lại migrations)
supabase db reset

# Xem logs
supabase logs

# Tạo migration mới
supabase migration new <migration_name>

# Xem thông tin kết nối
supabase status
```

## Troubleshooting:

### Port đã được sử dụng:
```bash
# Dừng Supabase
supabase stop

# Hoặc thay đổi ports trong config.toml
```

### Docker không chạy:
- Đảm bảo Docker Desktop đang chạy
- Kiểm tra: `docker ps`

### Reset hoàn toàn:
```bash
supabase stop
supabase db reset
supabase start
```

