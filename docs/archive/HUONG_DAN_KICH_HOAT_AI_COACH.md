# 🚀 Hướng Dẫn Kích Hoạt AI Coach

## 📋 Tổng Quan

AI Coach là tính năng AI thông minh giúp bạn:
- ✅ Phân tích dữ liệu cuộc sống (habits, tasks, goals)
- ✅ Đưa ra gợi ý cải thiện dựa trên Life Wheel
- ✅ Hỗ trợ theo ngữ cảnh module hiện tại
- ✅ Trả lời câu hỏi và tư vấn

## ⚡ Trạng Thái Hiện Tại

**AI Coach đã có Fallback Response** - hoạt động ngay không cần deploy Edge Function!

### Tính năng Fallback (Đã hoạt động):
- ✅ Trả lời các câu hỏi về hướng dẫn
- ✅ Phân tích dữ liệu cơ bản
- ✅ Đưa ra gợi ý dựa trên module
- ✅ Hiển thị thông tin về habits, tasks, goals

### Tính năng Full AI (Cần deploy):
- 🚀 AI thông minh với Gemini/Perplexity/Lovable
- 🚀 Phân tích sâu Life Wheel
- 🚀 Tư vấn cá nhân hóa
- 🚀 Streaming response

---

## 🔍 Kiểm Tra Trạng Thái

Chạy script kiểm tra:

```powershell
cd "D:\LifeOSS\remix-of-remix-of-lifeos-mobile-v3.copy"
.\scripts\check-ai-coach.ps1
```

Script sẽ kiểm tra:
- ✅ Biến môi trường (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY)
- ✅ Supabase CLI
- ✅ Edge Function file
- ✅ Trạng thái deploy
- ✅ API Keys

---

## 🚀 Kích Hoạt Full AI Features

### Cách 1: Sử dụng Script Tự Động (Khuyến nghị)

```powershell
cd "D:\LifeOSS\remix-of-remix-of-lifeos-mobile-v3.copy"
.\scripts\activate-ai-coach.ps1
```

Script sẽ hướng dẫn bạn từng bước:
1. Cài đặt Supabase CLI (nếu chưa có)
2. Đăng nhập Supabase
3. Link project
4. Set API key
5. Deploy Edge Function

### Cách 2: Thủ Công

#### Bước 1: Cài đặt Supabase CLI

```powershell
npm install -g supabase
```

Kiểm tra:
```powershell
supabase --version
```

#### Bước 2: Đăng nhập Supabase

```powershell
supabase login
```

Mở trình duyệt và đăng nhập với tài khoản Supabase.

#### Bước 3: Link Project

```powershell
cd "D:\LifeOSS\remix-of-remix-of-lifeos-mobile-v3.copy"
supabase link --project-ref pxgdmyszzwamwygvifvj
```

**Lưu ý**: Nếu bạn chưa có project, tạo mới tại https://supabase.com/dashboard

#### Bước 4: Lấy API Key (Chọn một trong ba)

##### Option A: Gemini API (Khuyến nghị - Free tier tốt)

1. Vào [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Tạo API key mới
3. Copy API key

##### Option B: Perplexity API

1. Vào [Perplexity API](https://www.perplexity.ai/settings/api)
2. Tạo API key mới
3. Copy API key

##### Option C: Lovable API

1. Vào [Lovable AI Dashboard](https://lovable.dev)
2. Vào Settings > API Keys
3. Copy API key

#### Bước 5: Set API Key trong Supabase

```powershell
# Chọn một trong ba (ưu tiên Gemini)
supabase secrets set GEMINI_API_KEY=your-gemini-api-key-here
# Hoặc
supabase secrets set PERPLEXITY_API_KEY=your-perplexity-api-key-here
# Hoặc
supabase secrets set LOVABLE_API_KEY=your-lovable-api-key-here
```

**Lưu ý**: Chỉ cần **một** trong ba API keys. Ưu tiên: Gemini > Perplexity > Lovable

#### Bước 6: Deploy Edge Function

```powershell
cd "D:\LifeOSS\remix-of-remix-of-lifeos-mobile-v3.copy"
supabase functions deploy ai-coach
```

#### Bước 7: Kiểm tra

1. Mở ứng dụng: https://life.hoanong.com
2. Mở AI Coach (click button AI Coach)
3. Gửi tin nhắn test
4. Nếu thành công, bạn sẽ thấy phản hồi từ AI

---

## 🐛 Troubleshooting

### Lỗi: "AI Coach chưa được cấu hình"

**Nguyên nhân**: Edge Function chưa được deploy hoặc không có API key

**Giải pháp**:
1. Kiểm tra Edge Function đã deploy: `supabase functions list`
2. Kiểm tra API key đã set: Xem trong Supabase Dashboard > Settings > Edge Functions > Secrets
3. Deploy lại: `supabase functions deploy ai-coach`

**Lưu ý**: Nếu chưa deploy, AI Coach vẫn hoạt động với Fallback Response

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

### Lỗi: "Rate limits exceeded"

**Giải pháp**:
- API key có thể đã hết quota
- Kiểm tra quota trong dashboard của provider
- Chuyển sang API key khác hoặc nâng cấp plan

### Lỗi: "Function not found" sau khi deploy

**Giải pháp**:
1. Kiểm tra function đã deploy: `supabase functions list`
2. Đảm bảo tên function đúng: `ai-coach` (không có khoảng trắng)
3. Đợi vài phút để Supabase sync

---

## 📝 Lưu Ý Quan Trọng

1. **Fallback Response**: 
   - Đã được tích hợp sẵn
   - Hoạt động ngay không cần deploy
   - Có thể sử dụng trong khi chờ deploy Edge Function

2. **API Keys**:
   - Chỉ cần **một** trong ba API keys (Gemini, Perplexity, hoặc Lovable)
   - Ưu tiên: Gemini > Perplexity > Lovable

3. **Local Supabase vs Cloud**:
   - Local Supabase có Edge Runtime nhưng cần deploy qua Supabase Cloud
   - Hoặc có thể dùng Fallback Response (đã có sẵn)

4. **Cập nhật Edge Function**:
   - Khi có thay đổi trong code, chỉ cần deploy lại:
   ```powershell
   supabase functions deploy ai-coach
   ```

---

## 📞 Hỗ Trợ

Nếu vẫn gặp vấn đề:

1. **Kiểm tra logs**:
   ```powershell
   supabase functions logs ai-coach
   ```

2. **Kiểm tra console trong browser** khi test AI Coach

3. **Kiểm tra Network tab** để xem request/response

4. **Xem các file hướng dẫn khác**:
   - `ACTIVATE_AI_COACH.md` - Hướng dẫn chi tiết
   - `DEPLOY_AI_COACH_EDGE_FUNCTION.md` - Hướng dẫn deploy
   - `FIX_AI_COACH_KEYBOARD_AND_FALLBACK.md` - Fix các vấn đề

---

## ✅ Checklist Kích Hoạt

- [ ] Đã cài đặt Supabase CLI
- [ ] Đã đăng nhập Supabase
- [ ] Đã link project
- [ ] Đã lấy API key (Gemini/Perplexity/Lovable)
- [ ] Đã set API key trong Supabase
- [ ] Đã deploy Edge Function
- [ ] Đã test AI Coach trong ứng dụng
- [ ] AI Coach hoạt động bình thường

---

## 🎯 Next Steps

1. **Nếu muốn full AI features**: Deploy Edge Function lên Supabase Cloud
2. **Nếu chỉ cần tính năng cơ bản**: Sử dụng Fallback Response (đã có sẵn)
3. **Nếu gặp lỗi**: Xem phần Troubleshooting hoặc chạy script kiểm tra

---

**Chúc bạn sử dụng AI Coach thành công! 🚀**

