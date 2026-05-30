# Hướng dẫn cập nhật AI Models và sửa lỗi encoding tiếng Việt

## 1. Cập nhật danh sách AI Models

File SQL mới: `database-ai-models-update-2025.sql`

Script này cập nhật danh sách models theo tài liệu mới nhất (tháng 12/2025):

### Gemini Models:
- **Gemini 3 Pro** (`gemini-3-pro-preview`) - Mạnh mẽ nhất, context 1M-2M tokens
- **Gemini 3 Flash** (`gemini-3-flash-preview`) - Cân bằng tốc độ và trí thông minh, context 1M tokens
- **Gemini 2.5 Pro** (`gemini-2.5-pro`) - Suy luận sâu, context 2M tokens
- **Gemini 2.5 Flash** (`gemini-2.5-flash`) - Đa năng, giá tốt, context 1M tokens (mặc định)
- **Gemini 2.5 Flash-Lite** (`gemini-2.5-flash-lite`) - Rẻ nhất, nhanh nhất, context 1M tokens
- Cập nhật Gemini 2.0 Flash, 1.5 Flash, 1.5 Pro

### Perplexity Models:
- **Sonar Pro** (`sonar-pro`) - Flagship, context 200k tokens
- **Sonar** (`sonar`) - Base model, context 128k tokens
- **Sonar Small/Medium/Large Online** - Với web search, context 128k tokens
- **Sonar Reasoning/Reasoning Pro** - Chuyên reasoning, context 128k-200k tokens
- **Sonar Deep Research** - Cho nghiên cứu sâu, context 200k tokens
- **Sonar Small/Large Chat** - Không online, context 128k tokens
- **PPLX 7B/70B Online/Chat** - Open-source models

### Cách chạy:

```sql
-- Chạy trong Supabase SQL Editor hoặc psql
\i database-ai-models-update-2025.sql
```

Hoặc copy nội dung file và chạy trực tiếp trong Supabase Dashboard > SQL Editor.

## 2. Sửa lỗi encoding tiếng Việt

### Vấn đề:
Tiếng Việt trong Admin Panel hiển thị sai (ví dụ: "Tinh ch???nh m???c ti??u" thay vì "Tinh chỉnh mục tiêu")

### Nguyên nhân:
1. Database không lưu UTF-8 đúng
2. Nginx không set charset UTF-8 trong response headers

### Giải pháp:

#### Bước 1: Sửa encoding trong database
Chạy file SQL: `fix-vietnamese-prompts-encoding.sql`

```sql
-- Chạy trong Supabase SQL Editor
\i fix-vietnamese-prompts-encoding.sql
```

Script này sẽ cập nhật lại tất cả prompts với tiếng Việt đúng encoding UTF-8.

#### Bước 2: Đảm bảo Nginx set charset UTF-8
File `nginx.conf` đã được cập nhật với:
```nginx
charset utf-8;
charset_types text/html text/css text/plain text/xml text/javascript application/json application/javascript;
```

#### Bước 3: Rebuild Docker container
```bash
docker-compose build lifeos-app
docker-compose up -d --force-recreate lifeos-app
```

#### Bước 4: Kiểm tra database encoding
Đảm bảo database Supabase sử dụng encoding UTF-8:

```sql
-- Kiểm tra encoding của database
SHOW server_encoding;

-- Nếu không phải UTF8, cần set lại (thường Supabase đã set sẵn)
-- ALTER DATABASE your_database_name SET encoding = 'UTF8';
```

#### Bước 5: Kiểm tra Supabase client
Đảm bảo Supabase client set charset đúng khi query. File `src/integrations/supabase/externalClient.ts` nên có:

```typescript
// Supabase client tự động handle UTF-8, nhưng có thể thêm header nếu cần
const supabase = createClient(url, key, {
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  },
});
```

## 3. Kiểm tra kết quả

Sau khi chạy các script:

1. **Kiểm tra AI Models:**
   - Vào Admin Panel > AI Config > AI Models
   - Xem danh sách models đã được cập nhật
   - Kiểm tra models mới như Gemini 3 Pro, Gemini 3 Flash, Sonar Pro, etc.

2. **Kiểm tra encoding tiếng Việt:**
   - Vào Admin Panel > AI Config > Prompts
   - Xem các prompts hiển thị tiếng Việt đúng (không còn ký tự lỗi)
   - Ví dụ: "Tinh chỉnh mục tiêu" thay vì "Tinh ch???nh m???c ti??u"

3. **Test tạo prompt mới:**
   - Tạo prompt mới với tiếng Việt
   - Kiểm tra xem có hiển thị đúng không

## 4. Troubleshooting

### Nếu vẫn còn lỗi encoding:

1. **Kiểm tra browser console:**
   - Mở DevTools > Network
   - Xem response headers có `Content-Type: application/json; charset=utf-8` không

2. **Kiểm tra database:**
   ```sql
   -- Xem encoding của một prompt
   SELECT name, description, system_prompt 
   FROM admin_ai_prompts 
   WHERE prompt_key = 'refine_goal';
   ```

3. **Clear browser cache:**
   - Hard refresh (Ctrl+Shift+R hoặc Cmd+Shift+R)
   - Clear cache và reload

4. **Kiểm tra file SQL encoding:**
   - Đảm bảo file SQL được lưu với encoding UTF-8
   - Khi copy/paste vào Supabase, đảm bảo không bị convert encoding

## 5. Lưu ý

- File SQL cần được chạy với quyền admin
- Backup database trước khi chạy script cập nhật
- Models cũ sẽ được disable tự động nếu có models mới
- Default model được set là `gemini-2.5-flash`

