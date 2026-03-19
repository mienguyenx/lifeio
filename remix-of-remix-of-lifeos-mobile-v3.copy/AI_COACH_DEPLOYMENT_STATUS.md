# AI Coach Edge Function Deployment Status

## Tình trạng hiện tại

### Đã hoàn thành
1. ✅ API Keys đã được cấu hình trong Admin Panel:
   - Google Gemini: 1 API key (itroot, Active)
   - Perplexity AI: 1 API key (hld, Active)

2. ✅ Edge Function code đã có trong container:
   - Path: `/var/functions/ai-coach/index.ts`
   - File size: 17894 bytes
   - Last updated: Dec 29 13:55

3. ✅ Supabase containers đang chạy:
   - supabase_kong_Supabase: Up (healthy)
   - supabase_edge_runtime_Supabase: Up (healthy)
   - supabase_db_Supabase: Up (healthy)

### Vấn đề hiện tại
1. ❌ Edge Function chưa được đăng ký với Edge Runtime:
   - Logs cho thấy: `Functions config: {}`
   - Endpoint trả về: "Function not found"
   - URL: `http://localhost:54321/functions/v1/ai-coach`

2. ❌ Supabase CLI không thể deploy:
   - `supabase functions deploy` yêu cầu access token
   - `--project-ref local` được hiểu là cloud project
   - Supabase Local đang chạy qua Docker Compose (không phải `supabase start`)

## Nguyên nhân

Với Supabase Local setup hiện tại (qua Docker Compose), Edge Functions không tự động được load từ `/var/functions` directory. Cần deploy qua Supabase CLI, nhưng CLI yêu cầu:
- Access token (với `--project-ref`)
- Link project với Supabase Cloud hoặc Local managed instance

## Giải pháp đề xuất

### Option 1: Deploy lên Supabase Cloud (Khuyến nghị)
- Dễ nhất và ổn định nhất
- Không cần thay đổi setup hiện tại
- Có thể dùng cùng API keys

### Option 2: Sử dụng Fallback Response
- AI Coach vẫn hoạt động với fallback response
- Không có AI thực sự, nhưng có thể test UI

### Option 3: Thử deploy qua CLI với Supabase Cloud
- Cần đăng nhập Supabase CLI
- Link với Supabase Cloud project
- Deploy Edge Function lên Cloud

## Next Steps

1. **Nếu chọn Option 1 (Supabase Cloud):**
   - Đăng nhập Supabase CLI: `npx supabase login`
   - Link project: `npx supabase link --project-ref <project-ref>`
   - Deploy: `npx supabase functions deploy ai-coach`

2. **Nếu chọn Option 2 (Fallback):**
   - Test UI với fallback response
   - Xác nhận input field focus fix hoạt động

3. **Nếu chọn Option 3 (Local với CLI):**
   - Cần setup Supabase Local đúng cách với `supabase start`
   - Hoặc tìm cách deploy trực tiếp vào container

## Files liên quan
- Edge Function code: `supabase/functions/ai-coach/index.ts`
- Deployment script: `scripts/deploy-ai-coach-local.ps1`
- Admin API Keys: `src/pages/admin/AdminAPIKeys.tsx`

