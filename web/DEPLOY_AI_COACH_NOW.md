# 🚀 Hướng Dẫn Deploy AI Coach Edge Function

## ✅ Đã hoàn thành

1. ✅ **Fix UI text thông báo**: Đã loại bỏ dấu ngoặc kép thừa trong thông báo
2. ✅ **Cải thiện sync**: AI Coach giờ đây lưu trữ messages trong localStorage và sync tự động giữa các tab/thiết bị
3. ✅ **Script deploy**: Đã tạo script `scripts/deploy-ai-coach-simple.ps1` để deploy dễ dàng

## 📋 Các bước deploy AI Coach Edge Function

### Bước 1: Cài đặt Supabase CLI (nếu chưa có)

```powershell
# Cách 1: Dùng npm
npm install -g supabase

# Cách 2: Dùng scoop (Windows)
scoop install supabase
```

### Bước 2: Đăng nhập Supabase

```powershell
supabase login
```

### Bước 3: Link project (nếu chưa link)

```powershell
cd remix-of-remix-of-lifeos-mobile-v3.copy
supabase link --project-ref gmukddvkcijqnddebybh
```

**Lưu ý**: Project ref có thể khác, kiểm tra trong `supabase/config.toml`

### Bước 4: Deploy Edge Function

**Cách 1: Dùng script tự động**
```powershell
.\scripts\deploy-ai-coach-simple.ps1
```

**Cách 2: Deploy thủ công**
```powershell
supabase functions deploy ai-coach --no-verify-jwt
```

### Bước 5: Kiểm tra API Keys

Đảm bảo bạn đã cấu hình ít nhất một trong các API keys sau trong **Admin Panel > API Keys**:

- ✅ **GEMINI_API_KEY** (khuyến nghị) - Từ [Google AI Studio](https://makersuite.google.com/app/apikey)
- ✅ **PERPLEXITY_API_KEY** - Từ [Perplexity](https://www.perplexity.ai/settings/api)
- ✅ **LOVABLE_API_KEY** - Từ [Lovable AI](https://lovable.dev)

**Lưu ý**: Bạn đã nói rằng đã cấu hình API keys trong admin panel rồi, vậy chỉ cần deploy Edge Function là xong!

## 🧪 Kiểm tra sau khi deploy

1. Mở ứng dụng tại `https://life.hoanong.com` (hoặc localhost nếu đang dev)
2. Mở AI Coach và thử gửi một tin nhắn
3. Nếu có lỗi, kiểm tra logs:
   ```powershell
   supabase functions logs ai-coach
   ```

## 🔄 Tính năng Sync

AI Coach giờ đây có tính năng sync tự động:

- ✅ **Sync giữa các tab**: Messages được lưu trong localStorage và sync tự động
- ✅ **Persistence**: Messages được giữ lại khi refresh trang
- ✅ **Cross-tab sync**: Sử dụng Storage API để sync giữa các tab cùng domain

## 📝 Thay đổi đã thực hiện

### 1. Fix Notification UI Text
- **File**: `src/services/notificationService.ts`
- **Thay đổi**: Loại bỏ dấu ngoặc kép `"` trong message của notifications
- **Trước**: `"${task.title}" đã quá hạn`
- **Sau**: `${task.title} đã quá hạn`

### 2. Cải thiện AI Coach Sync
- **File**: `src/hooks/useAICoachState.ts`
- **Thay đổi**: 
  - Thêm localStorage persistence cho messages
  - Thêm Storage API listener để sync giữa các tab
  - Messages giờ đây được lưu và sync tự động

### 3. Script Deploy
- **File**: `scripts/deploy-ai-coach-simple.ps1`
- **Mô tả**: Script PowerShell đơn giản để deploy Edge Function

## 🐛 Troubleshooting

### Lỗi: "Supabase CLI not found"
- Cài đặt Supabase CLI: `npm install -g supabase`
- Hoặc thêm Supabase CLI vào PATH

### Lỗi: "Function not found" hoặc 404
- Kiểm tra đã link project chưa: `supabase link --project-ref <your-ref>`
- Kiểm tra tên function đúng: `ai-coach` (không có khoảng trắng)

### Lỗi: "No available AI provider/API key"
- Đảm bảo đã cấu hình API keys trong Admin Panel
- Kiểm tra API keys còn hiệu lực
- Xem logs: `supabase functions logs ai-coach`

### AI Coach vẫn dùng Fallback Response
- Kiểm tra Edge Function đã được deploy: `supabase functions list`
- Kiểm tra URL trong code có đúng không
- Kiểm tra network tab trong browser console

## ✨ Kết quả

Sau khi deploy thành công:
- ✅ AI Coach sẽ hoạt động với AI thật (Gemini/Perplexity/Lovable)
- ✅ Thông báo hiển thị text sạch sẽ, không có dấu ngoặc kép thừa
- ✅ Messages được sync tự động giữa mobile và desktop
- ✅ Messages được lưu lại khi refresh trang

