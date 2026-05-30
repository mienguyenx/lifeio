# 📧 Hướng dẫn cấu hình Email - Đặt lại mật khẩu

## 📋 Tổng quan

Ứng dụng hỗ trợ 2 cách gửi email:
1. **SMTP** (Gmail, Outlook, hoặc SMTP server khác)
2. **Resend** (Email service hiện đại, khuyến nghị)

---

## ✅ Cách 1: Dùng Resend (Khuyến nghị) ⭐

### Bước 1: Tạo tài khoản Resend

1. Vào https://resend.com
2. Đăng ký tài khoản miễn phí
3. Vào **API Keys** > **Create API Key**
4. Copy API key (bắt đầu với `re_...`)

### Bước 2: Thêm API Key vào Supabase

```powershell
# Thêm RESEND_API_KEY vào Supabase environment
docker exec supabase_kong_Supabase sh -c 'echo "RESEND_API_KEY=re_your_api_key_here" >> /etc/environment'
```

Hoặc thêm vào file `.env` của Supabase (nếu có).

### Bước 3: Cấu hình trong Database

```sql
-- Cấu hình email provider
INSERT INTO public.admin_settings (key, value, description)
VALUES 
  ('email_provider', 'resend', 'Email provider: resend, smtp, hoặc gmail')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Cấu hình email gửi đi
INSERT INTO public.admin_settings (key, value, description)
VALUES 
  ('smtp_from_email', 'noreply@yourdomain.com', 'Email gửi đi (phải verify trong Resend)'),
  ('smtp_from_name', 'LifeOS', 'Tên hiển thị khi gửi email')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

**Lưu ý:** Email `smtp_from_email` phải được verify trong Resend Dashboard.

### Bước 4: Verify domain trong Resend (nếu dùng domain riêng)

1. Vào Resend Dashboard > **Domains**
2. Add domain: `yourdomain.com`
3. Thêm DNS records như hướng dẫn
4. Đợi verify (thường vài phút)

---

## ✅ Cách 2: Dùng SMTP (Gmail/Outlook)

### Bước 1: Tạo App Password (Gmail)

1. Vào https://myaccount.google.com/security
2. Bật **2-Step Verification**
3. Vào **App passwords**
4. Tạo app password mới cho "Mail"
5. Copy password (16 ký tự)

### Bước 2: Cấu hình trong Database

```sql
-- Cấu hình email provider
INSERT INTO public.admin_settings (key, value, description)
VALUES 
  ('email_provider', 'gmail', 'Email provider: resend, smtp, hoặc gmail')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Cấu hình SMTP Gmail
INSERT INTO public.admin_settings (key, value, description)
VALUES 
  ('smtp_host', 'smtp.gmail.com', 'SMTP host'),
  ('smtp_port', '465', 'SMTP port (465 cho SSL, 587 cho TLS)'),
  ('smtp_username', 'your-email@gmail.com', 'Email Gmail của bạn'),
  ('smtp_password', 'your-app-password', 'App password (16 ký tự)'),
  ('smtp_from_email', 'your-email@gmail.com', 'Email gửi đi'),
  ('smtp_from_name', 'LifeOS', 'Tên hiển thị'),
  ('smtp_secure', 'true', 'Dùng SSL/TLS')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

### Bước 3: Cấu hình SMTP tùy chỉnh (không phải Gmail)

```sql
INSERT INTO public.admin_settings (key, value, description)
VALUES 
  ('email_provider', 'smtp', 'Email provider'),
  ('smtp_host', 'smtp.yourdomain.com', 'SMTP host'),
  ('smtp_port', '587', 'SMTP port'),
  ('smtp_username', 'your-email@yourdomain.com', 'SMTP username'),
  ('smtp_password', 'your-password', 'SMTP password'),
  ('smtp_from_email', 'your-email@yourdomain.com', 'Email gửi đi'),
  ('smtp_from_name', 'LifeOS', 'Tên hiển thị'),
  ('smtp_secure', 'true', 'Dùng SSL/TLS')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

---

## 🧪 Test cấu hình

### Test qua SQL

```sql
-- Test gửi email reset password cho user
SELECT * FROM supabase.functions.invoke('send-email', '{
  "action": "send-password-reset",
  "userId": "1e878c69-3e31-473b-b5c4-73ca8dab7449"
}');
```

### Test qua Admin Panel

1. Vào https://life.hoanong.com/admin
2. Vào **Settings** > **Email Settings**
3. Test SMTP configuration
4. Gửi test email

### Test qua API

```javascript
// Trong browser console
const response = await fetch('https://supabase.hoanong.com/functions/v1/send-email', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_ANON_KEY'
  },
  body: JSON.stringify({
    action: 'send-password-reset',
    userId: '1e878c69-3e31-473b-b5c4-73ca8dab7449'
  })
});

const result = await response.json();
console.log(result);
```

---

## 🔧 Cấu hình tự động qua Script

Tạo file `setup-email.ps1`:

```powershell
# Setup Email Configuration
param(
    [Parameter(Mandatory=$true)]
    [string]$Provider,  # "resend" hoặc "gmail" hoặc "smtp"
    
    [Parameter(Mandatory=$false)]
    [string]$ResendApiKey,
    
    [Parameter(Mandatory=$false)]
    [string]$SmtpHost,
    
    [Parameter(Mandatory=$false)]
    [string]$SmtpPort = "587",
    
    [Parameter(Mandatory=$false)]
    [string]$SmtpUsername,
    
    [Parameter(Mandatory=$false)]
    [string]$SmtpPassword,
    
    [Parameter(Mandatory=$false)]
    [string]$FromEmail = "noreply@hoanong.com",
    
    [Parameter(Mandatory=$false)]
    [string]$FromName = "LifeOS"
)

$sql = @"
-- Email Provider
INSERT INTO public.admin_settings (key, value, description)
VALUES ('email_provider', '$Provider', 'Email provider')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- From Email
INSERT INTO public.admin_settings (key, value, description)
VALUES ('smtp_from_email', '$FromEmail', 'Email gửi đi')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- From Name
INSERT INTO public.admin_settings (key, value, description)
VALUES ('smtp_from_name', '$FromName', 'Tên hiển thị')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
"@

if ($Provider -eq "resend" -and $ResendApiKey) {
    Write-Host "Setting up Resend..." -ForegroundColor Cyan
    # Thêm RESEND_API_KEY vào Supabase
    docker exec supabase_kong_Supabase sh -c "echo 'RESEND_API_KEY=$ResendApiKey' >> /etc/environment"
    Write-Host "✅ Resend API Key đã được thêm" -ForegroundColor Green
}

if ($Provider -eq "gmail" -or $Provider -eq "smtp") {
    $sql += @"

-- SMTP Host
INSERT INTO public.admin_settings (key, value, description)
VALUES ('smtp_host', '$SmtpHost', 'SMTP host')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- SMTP Port
INSERT INTO public.admin_settings (key, value, description)
VALUES ('smtp_port', '$SmtpPort', 'SMTP port')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- SMTP Username
INSERT INTO public.admin_settings (key, value, description)
VALUES ('smtp_username', '$SmtpUsername', 'SMTP username')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- SMTP Password
INSERT INTO public.admin_settings (key, value, description)
VALUES ('smtp_password', '$SmtpPassword', 'SMTP password')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- SMTP Secure
INSERT INTO public.admin_settings (key, value, description)
VALUES ('smtp_secure', 'true', 'Dùng SSL/TLS')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
"@
}

Write-Host "Đang cấu hình email trong database..." -ForegroundColor Cyan
docker exec -i supabase_db_Supabase psql -U postgres -d postgres <<< $sql

Write-Host "✅ Cấu hình email hoàn tất!" -ForegroundColor Green
Write-Host "`nĐể test, chạy:" -ForegroundColor Yellow
Write-Host "  docker exec supabase_db_Supabase psql -U postgres -d postgres -c \"SELECT key, value FROM public.admin_settings WHERE key LIKE '%email%' OR key LIKE '%smtp%';\"" -ForegroundColor Gray
```

**Cách dùng:**

```powershell
# Setup Resend
.\setup-email.ps1 -Provider "resend" -ResendApiKey "re_xxxxx" -FromEmail "noreply@hoanong.com"

# Setup Gmail
.\setup-email.ps1 -Provider "gmail" -SmtpHost "smtp.gmail.com" -SmtpPort "465" -SmtpUsername "your-email@gmail.com" -SmtpPassword "your-app-password" -FromEmail "your-email@gmail.com"
```

---

## 📝 Cấu hình thủ công qua SQL

### Resend

```sql
-- 1. Thêm RESEND_API_KEY vào Supabase environment
-- (Chạy trong terminal)
docker exec supabase_kong_Supabase sh -c 'echo "RESEND_API_KEY=re_your_key" >> /etc/environment'

-- 2. Cấu hình trong database
INSERT INTO public.admin_settings (key, value, description)
VALUES 
  ('email_provider', 'resend', 'Email provider'),
  ('smtp_from_email', 'noreply@yourdomain.com', 'Email gửi đi'),
  ('smtp_from_name', 'LifeOS', 'Tên hiển thị')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

### Gmail

```sql
INSERT INTO public.admin_settings (key, value, description)
VALUES 
  ('email_provider', 'gmail', 'Email provider'),
  ('smtp_host', 'smtp.gmail.com', 'SMTP host'),
  ('smtp_port', '465', 'SMTP port'),
  ('smtp_username', 'your-email@gmail.com', 'Gmail address'),
  ('smtp_password', 'your-app-password', 'App password'),
  ('smtp_from_email', 'your-email@gmail.com', 'Email gửi đi'),
  ('smtp_from_name', 'LifeOS', 'Tên hiển thị'),
  ('smtp_secure', 'true', 'Dùng SSL')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

---

## 🔍 Kiểm tra cấu hình

```sql
-- Xem tất cả cấu hình email
SELECT key, value, description 
FROM public.admin_settings 
WHERE key LIKE '%email%' OR key LIKE '%smtp%' OR key LIKE '%resend%'
ORDER BY key;
```

---

## ⚠️ Lưu ý

1. **Resend:**
   - Miễn phí: 3,000 emails/tháng
   - Cần verify domain hoặc dùng `onboarding@resend.dev` (chỉ test)
   - API key bắt đầu với `re_`

2. **Gmail:**
   - Cần bật 2-Step Verification
   - Dùng App Password (không phải password thường)
   - Giới hạn: 500 emails/ngày

3. **SMTP khác:**
   - Kiểm tra port: 465 (SSL) hoặc 587 (TLS)
   - Đảm bảo firewall không chặn

---

## 🎯 Sau khi cấu hình

1. **Test gửi email:**
   - Vào Admin Panel > Settings > Email
   - Test SMTP configuration
   - Gửi test email

2. **Test reset password:**
   - Vào https://life.hoanong.com/auth
   - Click "Quên mật khẩu?"
   - Nhập email
   - Kiểm tra inbox

3. **Xem logs:**
   ```sql
   SELECT * FROM public.email_logs 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

---

## 📞 Troubleshooting

### Email không gửi được

1. **Kiểm tra logs:**
   ```sql
   SELECT * FROM public.email_logs 
   WHERE status = 'failed' 
   ORDER BY created_at DESC;
   ```

2. **Kiểm tra cấu hình:**
   ```sql
   SELECT key, value FROM public.admin_settings 
   WHERE key LIKE '%email%' OR key LIKE '%smtp%';
   ```

3. **Test SMTP:**
   - Vào Admin Panel > Settings > Email
   - Test SMTP configuration

### Resend không hoạt động

- Kiểm tra API key có đúng không
- Kiểm tra email đã verify trong Resend chưa
- Xem logs trong Resend Dashboard

### Gmail không hoạt động

- Đảm bảo đã bật 2-Step Verification
- Dùng App Password (không phải password thường)
- Kiểm tra "Less secure app access" (nếu cần)

---

## ✅ Hoàn tất

Sau khi cấu hình xong, user có thể:
- Click "Quên mật khẩu?" trong form đăng nhập
- Nhận email reset password
- Click link để đặt lại mật khẩu

