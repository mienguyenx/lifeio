# Hướng dẫn Deploy AI Coach Edge Function lên Supabase

## Vấn đề
AI Coach báo lỗi: "AI Coach chưa được cấu hình. Vui lòng liên hệ quản trị viên."
Điều này có nghĩa là Edge Function `ai-coach` chưa được deploy lên Supabase.

## Giải pháp

### Cách 1: Deploy qua Supabase CLI (Khuyến nghị)

#### Bước 1: Cài đặt Supabase CLI (nếu chưa có)
```powershell
npm install -g supabase
```

#### Bước 2: Đăng nhập vào Supabase
```powershell
supabase login
```
Sau đó mở trình duyệt và đăng nhập với tài khoản Supabase của bạn.

#### Bước 3: Link project với Supabase
```powershell
# Từ thư mục gốc của project
supabase link --project-ref pxgdmyszzwamwygvifvj
```

#### Bước 4: Deploy Edge Function
```powershell
# Deploy function ai-coach
supabase functions deploy ai-coach

# Hoặc deploy tất cả functions
supabase functions deploy
```

#### Bước 5: Cấu hình Environment Variables
Cần set các API keys trong Supabase Dashboard:

1. Vào [Supabase Dashboard](https://supabase.com/dashboard)
2. Chọn project của bạn
3. Vào **Settings** > **Edge Functions** > **Secrets**
4. Thêm các secrets sau:
   - `GEMINI_API_KEY` (nếu có) - API key từ Google AI Studio
   - `PERPLEXITY_API_KEY` (nếu có) - API key từ Perplexity
   - `LOVABLE_API_KEY` (nếu có) - API key từ Lovable AI

**Lưu ý:** Bạn chỉ cần một trong ba API keys trên. Ưu tiên:
1. `GEMINI_API_KEY` (nếu có)
2. `PERPLEXITY_API_KEY` (nếu có)
3. `LOVABLE_API_KEY` (nếu có)

#### Bước 6: Kiểm tra
Sau khi deploy, kiểm tra:
```powershell
# Xem danh sách functions đã deploy
supabase functions list
```

### Cách 2: Deploy qua Supabase Dashboard

1. Vào [Supabase Dashboard](https://supabase.com/dashboard)
2. Chọn project của bạn
3. Vào **Edge Functions** > **Create a new function**
4. Tên function: `ai-coach`
5. Copy nội dung từ file `supabase/functions/ai-coach/index.ts`
6. Paste vào editor
7. Click **Deploy**

**Lưu ý:** Cách này không khuyến nghị vì khó quản lý và update sau này.

### Cách 3: Deploy qua Supabase CLI với environment variables

```powershell
# Set secrets trước khi deploy
supabase secrets set GEMINI_API_KEY=your-gemini-api-key
supabase secrets set PERPLEXITY_API_KEY=your-perplexity-api-key
supabase secrets set LOVABLE_API_KEY=your-lovable-api-key

# Deploy function
supabase functions deploy ai-coach
```

## Lấy API Keys

### Gemini API Key
1. Vào [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Tạo API key mới
3. Copy và lưu vào Supabase Secrets

### Perplexity API Key
1. Vào [Perplexity API](https://www.perplexity.ai/settings/api)
2. Tạo API key mới
3. Copy và lưu vào Supabase Secrets

### Lovable API Key
1. Vào [Lovable AI Dashboard](https://lovable.dev)
2. Vào Settings > API Keys
3. Copy và lưu vào Supabase Secrets

## Kiểm tra sau khi deploy

1. Mở ứng dụng tại https://life.hoanong.com
2. Mở AI Coach
3. Gửi một tin nhắn test
4. Nếu thành công, bạn sẽ thấy phản hồi từ AI

## Troubleshooting

### Lỗi: "Function not found"
- Kiểm tra function đã được deploy: `supabase functions list`
- Đảm bảo tên function đúng: `ai-coach` (không có khoảng trắng)

### Lỗi: "No API key configured"
- Kiểm tra secrets đã được set trong Supabase Dashboard
- Đảm bảo tên secret đúng: `GEMINI_API_KEY`, `PERPLEXITY_API_KEY`, hoặc `LOVABLE_API_KEY`

### Lỗi: "Rate limits exceeded"
- API key có thể đã hết quota
- Kiểm tra quota trong dashboard của provider (Google AI Studio, Perplexity, Lovable)

### Lỗi: "Payment required"
- Tài khoản Lovable AI có thể cần nạp tiền
- Hoặc chuyển sang dùng Gemini/Perplexity API

## Cập nhật Edge Function

Khi có thay đổi trong code, chỉ cần deploy lại:
```powershell
supabase functions deploy ai-coach
```

## Xem logs

Để debug, xem logs của Edge Function:
```powershell
supabase functions logs ai-coach
```

Hoặc trong Supabase Dashboard:
1. Vào **Edge Functions** > **ai-coach**
2. Click tab **Logs**

