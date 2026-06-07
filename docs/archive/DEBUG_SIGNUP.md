# 🔍 Debug Đăng Ký Tài Khoản

## ✅ Đã cải thiện

1. **Error Handling chi tiết hơn**
   - Phân biệt các loại lỗi khác nhau
   - Hiển thị message rõ ràng hơn
   - Logging đầy đủ để debug

2. **Logging**
   - Console log khi bắt đầu sign up
   - Log error details (message, status, name)
   - Log success info (userId, email, emailConfirmed)

3. **Error Messages**
   - "User already registered" → Email đã được đăng ký
   - "Password" → Mật khẩu không hợp lệ
   - "Email invalid" → Email không hợp lệ
   - "Rate limit" → Quá nhiều yêu cầu
   - "Network" → Lỗi kết nối

## 🔍 Các vấn đề có thể xảy ra

### 1. Email đã được đăng ký

**Triệu chứng:**
- Error: "User already registered" hoặc "already registered"

**Giải pháp:**
- Sử dụng email khác
- Hoặc đăng nhập với email đó
- Hoặc reset password nếu quên

**Kiểm tra:**
```sql
-- Kiểm tra trong database
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'your@email.com';
```

---

### 2. Mật khẩu không hợp lệ

**Triệu chứng:**
- Error: "Password" hoặc "weak password"

**Giải pháp:**
- Mật khẩu phải có ít nhất 6 ký tự
- Nên có chữ hoa, chữ thường, số
- Tránh mật khẩu quá đơn giản

**Kiểm tra:**
- Đảm bảo password >= 6 ký tự
- Kiểm tra validation trong form

---

### 3. Email không hợp lệ

**Triệu chứng:**
- Error: "Email invalid" hoặc validation error

**Giải pháp:**
- Kiểm tra format email (có @, domain hợp lệ)
- Không có khoảng trắng
- Không có ký tự đặc biệt không hợp lệ

---

### 4. Lỗi kết nối

**Triệu chứng:**
- Error: "Network" hoặc "fetch failed"

**Giải pháp:**
- Kiểm tra internet connection
- Kiểm tra Supabase URL có đúng không
- Kiểm tra CORS settings
- Kiểm tra firewall/proxy

**Kiểm tra:**
```javascript
// Trong browser console
fetch('https://supabase.hoanong.com/rest/v1/', {
  headers: {'apikey': 'your-anon-key'}
}).then(r => console.log('Status:', r.status));
```

---

### 5. Rate Limit

**Triệu chứng:**
- Error: "Rate limit" hoặc "too many requests"

**Giải pháp:**
- Đợi vài phút rồi thử lại
- Không spam đăng ký

---

### 6. Email Confirmation Required

**Triệu chứng:**
- Sign up thành công nhưng không đăng nhập được
- Error: "Email not confirmed"

**Giải pháp:**
- Kiểm tra email (cả spam folder)
- Click link xác nhận trong email
- Hoặc tắt email confirmation trong Supabase settings

**Kiểm tra Supabase Settings:**
1. Vào Supabase Dashboard
2. Authentication → Settings
3. Tắt "Enable email confirmations" (nếu muốn bỏ qua)

---

### 7. Database Trigger không hoạt động

**Triệu chứng:**
- Sign up thành công nhưng không có profile
- Không có user_role

**Giải pháp:**
- Kiểm tra triggers trong database
- Đảm bảo `handle_new_user()` và `handle_new_user_role()` đã được tạo

**Kiểm tra:**
```sql
-- Kiểm tra triggers
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE '%user%';

-- Kiểm tra functions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN ('handle_new_user', 'handle_new_user_role');
```

**Sửa:**
```sql
-- Chạy lại script database-setup-complete.sql
-- Hoặc tạo lại triggers:
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();
```

---

## 🛠️ Cách Debug

### Bước 1: Mở Browser Console

1. F12 hoặc Right-click → Inspect
2. Vào tab **Console**
3. Thử đăng ký lại
4. Xem logs và errors

### Bước 2: Kiểm tra Network

1. F12 → Tab **Network**
2. Filter: "auth" hoặc "signup"
3. Thử đăng ký
4. Xem request/response

**Kiểm tra:**
- Status code: 200 (success) hoặc 4xx/5xx (error)
- Response body: Xem error message chi tiết
- Request URL: Đúng Supabase endpoint không

### Bước 3: Kiểm tra Supabase

1. Vào Supabase Dashboard
2. Authentication → Users
3. Xem có user mới không
4. Kiểm tra email_confirmed_at

### Bước 4: Kiểm tra Database

```sql
-- Kiểm tra user trong auth.users
SELECT id, email, email_confirmed_at, created_at, raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- Kiểm tra profile
SELECT id, email, name, created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 5;

-- Kiểm tra user_roles
SELECT ur.user_id, ur.role, p.email
FROM public.user_roles ur
JOIN public.profiles p ON ur.user_id = p.id
ORDER BY ur.created_at DESC
LIMIT 5;
```

---

## 📋 Checklist Debug

- [ ] Console không có errors JavaScript
- [ ] Network request thành công (status 200)
- [ ] Supabase URL đúng
- [ ] Supabase anon key đúng
- [ ] Email format hợp lệ
- [ ] Password >= 6 ký tự
- [ ] Captcha đã nhập đúng
- [ ] Không bị rate limit
- [ ] Database triggers đã tạo
- [ ] Email confirmation (nếu cần)

---

## 🔧 Sửa nhanh

### Nếu sign up luôn fail:

1. **Kiểm tra Supabase connection:**
```javascript
// Trong console
const supabase = window.supabase || // get from your app
console.log('Supabase URL:', supabase.supabaseUrl);
```

2. **Test sign up trực tiếp:**
```javascript
// Trong console (chỉ để test)
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'test123456'
});
console.log('Result:', { data, error });
```

3. **Kiểm tra CORS:**
- Đảm bảo domain được allow trong Supabase
- Kiểm tra CORS headers trong Network tab

---

## 📝 Logs mẫu

### Success:
```
Attempting sign up with: { email: "...", hasPassword: true, name: "..." }
Sign up successful: { userId: "...", email: "...", emailConfirmed: "No", session: "Yes" }
```

### Error:
```
Sign up error: { message: "...", status: 400, name: "AuthApiError" }
Error details: { message: "...", status: 400, name: "AuthApiError" }
```

---

## 🚨 Lỗi thường gặp

### "User already registered"
→ Email đã tồn tại, dùng email khác hoặc đăng nhập

### "Invalid email"
→ Format email sai, kiểm tra lại

### "Password should be at least 6 characters"
→ Mật khẩu quá ngắn, tối thiểu 6 ký tự

### "Network request failed"
→ Lỗi kết nối, kiểm tra internet và Supabase URL

### "Email rate limit exceeded"
→ Quá nhiều yêu cầu, đợi vài phút

---

## 💡 Tips

1. **Luôn kiểm tra Console trước** - Errors thường hiển thị ở đây
2. **Kiểm tra Network tab** - Xem request/response chi tiết
3. **Test với email khác** - Loại trừ vấn đề email đã tồn tại
4. **Kiểm tra Supabase Dashboard** - Xem user có được tạo không
5. **Kiểm tra Database** - Xem triggers có chạy không

---

## 📞 Nếu vẫn không được

1. Copy toàn bộ error message từ Console
2. Copy Network request/response
3. Kiểm tra Supabase Dashboard
4. Kiểm tra Database triggers
5. Cung cấp thông tin để debug tiếp

