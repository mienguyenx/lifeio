# 🚀 Hướng Dẫn Kích Hoạt AI Coach

## 📋 Tổng Quan

AI Coach cần Edge Function `ai-coach` được deploy lên Supabase. Với **local Supabase**, có 2 cách:

1. **Deploy Edge Function lên Supabase Cloud** (Khuyến nghị - dễ nhất)
2. **Sử dụng Fallback Response** (Đã có sẵn - hoạt động ngay)

---

## ✅ CÁCH 1: Deploy Edge Function lên Supabase Cloud (Khuyến nghị)

### Bước 1: Cài đặt Supabase CLI

```powershell
npm install -g supabase
```

Kiểm tra:
```powershell
supabase --version
```

### Bước 2: Đăng nhập Supabase

```powershell
supabase login
```

Mở trình duyệt và đăng nhập với tài khoản Supabase của bạn.

### Bước 3: Link Project

```powershell
cd "d:\LifeOSS\remix-of-remix-of-lifeos-mobile-v3.copy"
supabase link --project-ref pxgdmyszzwamwygvifvj
```

**Lưu ý**: Nếu bạn chưa có project trên Supabase Cloud, tạo mới tại https://supabase.com/dashboard

### Bước 4: Lấy API Key (Chọn một trong ba)

#### Option A: Gemini API (Khuyến nghị - Free tier tốt)

1. Vào [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Tạo API key mới
3. Copy API key

#### Option B: Perplexity API

1. Vào [Perplexity API](https://www.perplexity.ai/settings/api)
2. Tạo API key mới
3. Copy API key

#### Option C: Lovable API

1. Vào [Lovable AI Dashboard](https://lovable.dev)
2. Vào Settings > API Keys
3. Copy API key

### Bước 5: Set API Key trong Supabase

```powershell
# Chọn một trong ba (ưu tiên Gemini)
supabase secrets set GEMINI_API_KEY=your-gemini-api-key-here
# Hoặc
supabase secrets set PERPLEXITY_API_KEY=your-perplexity-api-key-here
# Hoặc
supabase secrets set LOVABLE_API_KEY=your-lovable-api-key-here
```

### Bước 6: Deploy Edge Function

```powershell
cd "d:\LifeOSS\remix-of-remix-of-lifeos-mobile-v3.copy"
supabase functions deploy ai-coach
```

### Bước 7: Kiểm tra

1. Mở ứng dụng: https://life.hoanong.com
2. Mở AI Coach
3. Gửi tin nhắn test
4. Nếu thành công, bạn sẽ thấy phản hồi từ AI

---

## ✅ CÁCH 2: Sử dụng Script Tự Động

Chạy script PowerShell có sẵn:

```powershell
cd "d:\LifeOSS\remix-of-remix-of-lifeos-mobile-v3.copy"
.\scripts\deploy-ai-coach.ps1
```

Script sẽ hướng dẫn bạn từng bước.

---

## ✅ CÁCH 3: Sử dụng Fallback Response (Đã có sẵn)

**Hiện tại ứng dụng đã có Fallback Response**, nên AI Coach vẫn hoạt động với các tính năng cơ bản:

- ✅ Trả lời các câu hỏi về hướng dẫn
- ✅ Phân tích dữ liệu của bạn
- ✅ Đưa ra gợi ý dựa trên module hiện tại
- ✅ Hiển thị thông tin về dữ liệu (habits, tasks, goals)

**Hạn chế**: Không có AI thực sự, chỉ là rule-based responses.

---

## 🔍 Kiểm Tra Trạng Thái

### Kiểm tra Edge Function đã deploy chưa:

```powershell
supabase functions list
```

### Kiểm tra logs:

```powershell
supabase functions logs ai-coach
```

### Test Edge Function trực tiếp:

```powershell
# Test với curl
curl -X POST "https://pxgdmyszzwamwygvifvj.supabase.co/functions/v1/ai-coach" `
  -H "Authorization: Bearer YOUR_ANON_KEY" `
  -H "Content-Type: application/json" `
  -d '{"messages":[{"role":"user","content":"Hello"}],"userContext":{}}'
```

---

## 🐛 Troubleshooting

### Lỗi: "supabase: command not found"

**Giải pháp**: Cài đặt Supabase CLI
```powershell
npm install -g supabase
```

### Lỗi: "Project not found"

**Giải pháp**: 
1. Tạo project mới tại https://supabase.com/dashboard
2. Lấy project ref từ URL: `https://supabase.com/dashboard/project/xxxxx`
3. Link lại: `supabase link --project-ref xxxxx`

### Lỗi: "No API key configured"

**Giải pháp**: 
1. Set API key: `supabase secrets set GEMINI_API_KEY=your-key`
2. Deploy lại: `supabase functions deploy ai-coach`

### Lỗi: "Function not found" sau khi deploy

**Giải pháp**:
1. Kiểm tra function đã deploy: `supabase functions list`
2. Đảm bảo tên function đúng: `ai-coach` (không có khoảng trắng)
3. Đợi vài phút để Supabase sync

### Lỗi: "Rate limits exceeded"

**Giải pháp**:
- API key có thể đã hết quota
- Kiểm tra quota trong dashboard của provider
- Chuyển sang API key khác hoặc nâng cấp plan

---

## 📝 Lưu Ý Quan Trọng

1. **Local Supabase vs Cloud**: 
   - Local Supabase có Edge Runtime nhưng cần deploy qua Supabase Cloud
   - Hoặc có thể dùng Fallback Response (đã có sẵn)

2. **API Keys**:
   - Chỉ cần **một** trong ba API keys (Gemini, Perplexity, hoặc Lovable)
   - Ưu tiên: Gemini > Perplexity > Lovable

3. **Fallback Response**:
   - Đã được tích hợp sẵn
   - Hoạt động ngay không cần deploy
   - Có thể sử dụng trong khi chờ deploy Edge Function

---

## 🎯 Next Steps

1. **Nếu muốn full AI features**: Deploy Edge Function lên Supabase Cloud (Cách 1)
2. **Nếu chỉ cần tính năng cơ bản**: Sử dụng Fallback Response (Cách 3 - đã có sẵn)
3. **Nếu gặp lỗi**: Xem phần Troubleshooting hoặc chạy script tự động (Cách 2)

---

## 📞 Hỗ Trợ

Nếu vẫn gặp vấn đề, kiểm tra:
- Logs: `supabase functions logs ai-coach`
- Console trong browser khi test AI Coach
- Network tab để xem request/response
















