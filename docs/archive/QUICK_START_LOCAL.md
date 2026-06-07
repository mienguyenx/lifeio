# 🚀 Quick Start - Supabase Local

## Bước 1: Cài đặt Supabase CLI

```powershell
npm install -g supabase
```

## Bước 2: Đảm bảo Docker Desktop đang chạy

Mở Docker Desktop và đảm bảo nó đang chạy.

## Bước 3: Khởi động Supabase Local

```powershell
supabase start
```

Chờ vài phút lần đầu để download images.

## Bước 4: Lấy thông tin kết nối và tạo .env.local

```powershell
# Chạy script tự động
.\scripts\setup-local-env.ps1

# Hoặc thủ công: Lấy thông tin
supabase status
```

Sau đó tạo file `.env.local`:
```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key-từ-supabase-status>
```

## Bước 5: Khởi động ứng dụng

```bash
npm run dev
```

Truy cập: http://localhost:3222

## 📚 Tài liệu đầy đủ

Xem `README_LOCAL.md` để biết thêm chi tiết.

## 🛠️ Scripts tiện ích

```powershell
.\scripts\supabase-local.ps1 start    # Khởi động
.\scripts\supabase-local.ps1 stop     # Dừng
.\scripts\supabase-local.ps1 status   # Xem status
.\scripts\supabase-local.ps1 studio   # Mở Studio
```

