# Hướng dẫn Deploy lên Vercel

## Bước 1: Kiểm tra kết nối Supabase

### Cấu hình hiện tại:
- **External Supabase Client**: Đã được cấu hình trong `src/integrations/supabase/externalClient.ts`
  - URL: `https://pxgdmyszzwamwygvifvj.supabase.co`
  - Key: Đã có sẵn trong code

- **Lovable Cloud Supabase**: Sử dụng biến môi trường
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`

### Kiểm tra kết nối:
1. Mở ứng dụng tại `http://localhost:3222`
2. Mở Developer Console (F12)
3. Kiểm tra log để xem đang sử dụng Supabase nào:
   - "Using external Supabase" - Sử dụng external client
   - "Using Lovable Cloud Supabase" - Sử dụng Lovable Cloud

### Thiết lập Supabase Database:
Nếu chưa có database, chạy script SQL trong file:
- `docs/external-supabase-setup.sql`

## Bước 2: Chuẩn bị cho Vercel

### 1. Đảm bảo code đã được commit và push lên GitHub:
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2. Kiểm tra build command:
```bash
npm run build
```
Đảm bảo build thành công và tạo thư mục `dist/`

## Bước 3: Deploy lên Vercel

### Cách 1: Deploy qua Vercel Dashboard (Khuyến nghị)

1. Truy cập https://vercel.com và đăng nhập
2. Click "Add New Project"
3. Import repository từ GitHub
4. Cấu hình:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (hoặc để trống)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. Thêm Environment Variables:
   - `VITE_SUPABASE_URL`: URL của Supabase project
   - `VITE_SUPABASE_PUBLISHABLE_KEY`: Anon key của Supabase

6. Click "Deploy"

### Cách 2: Deploy qua Vercel CLI

1. Cài đặt Vercel CLI:
```bash
npm i -g vercel
```

2. Đăng nhập:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. Thêm environment variables:
```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_PUBLISHABLE_KEY
```

5. Deploy production:
```bash
vercel --prod
```

## Bước 4: Cấu hình sau khi deploy

### 1. Cập nhật Supabase URL trong Vercel:
- Vào Vercel Dashboard > Project Settings > Environment Variables
- Thêm hoặc cập nhật:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`

### 2. Cấu hình Supabase Auth Redirect URLs:
- Vào Supabase Dashboard > Authentication > URL Configuration
- Thêm Production URL từ Vercel vào:
  - Site URL: `https://your-app.vercel.app`
  - Redirect URLs: `https://your-app.vercel.app/**`

### 3. Redeploy sau khi thay đổi env vars:
- Vercel sẽ tự động redeploy khi thay đổi env vars
- Hoặc vào Deployments > Redeploy

## Lưu ý quan trọng:

1. **Environment Variables**: 
   - Không commit file `.env` vào git
   - Chỉ commit `.env.example`
   - Thêm env vars trong Vercel Dashboard

2. **Build Output**: 
   - Vercel sẽ tự động detect Vite và cấu hình đúng
   - File `vercel.json` đã được tạo để đảm bảo routing đúng

3. **Supabase RLS (Row Level Security)**:
   - Đảm bảo đã chạy script SQL để setup RLS policies
   - Kiểm tra policies trong Supabase Dashboard

4. **Custom Domain**:
   - Có thể thêm custom domain trong Vercel Project Settings
   - Cập nhật Supabase redirect URLs khi thêm domain mới

## Troubleshooting:

### Build fails:
- Kiểm tra `npm run build` chạy thành công local
- Xem build logs trong Vercel Dashboard

### Supabase connection fails:
- Kiểm tra environment variables đã được set đúng
- Kiểm tra Supabase project URL và keys
- Xem network requests trong browser console

### Routing issues:
- File `vercel.json` đã cấu hình rewrite rules
- Đảm bảo tất cả routes redirect về `/index.html`

