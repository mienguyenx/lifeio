# 📊 Hướng dẫn Setup Database - LifeOS

## File đã tạo

**`database-setup-complete.sql`** - File SQL đầy đủ để setup database cho LifeOS

### Nội dung bao gồm:

✅ **50+ Tables:**
- Core: profiles, user_roles, user_settings
- Goals: goals, goal_milestones, goal_activities, goal_collaborators, goal_vision_items, goal_progress_history
- Tasks: tasks, subtasks, task_tags
- Habits: habits, habit_completions, habit_challenges, habit_competitions
- Journal & Notes: journal_entries, journal_tags, notes, note_tags
- Life Management: daily_intentions, life_wheel_scores, weekly_reviews, personal_values, personal_traits, life_visions, life_roles, life_milestones
- Pomodoro & Chat: pomodoro_sessions, saved_conversations, chat_messages
- Admin: subscription_plans, user_subscriptions, workspaces, workspace_members, workspace_invitations
- System: admin_settings, system_logs, email_logs, feature_flags
- AI: admin_ai_models, admin_ai_prompts
- Templates: admin_templates, admin_themes, admin_languages, admin_translations
- Plugins: admin_plugins, plugin_hooks, user_plugin_settings

✅ **12 Enums:**
- app_role, life_area, task_priority, task_status, goal_status
- habit_frequency, challenge_status, challenge_type, collaborator_role
- pomodoro_phase, recurring_frequency, trait_type, vision_timeframe

✅ **Security Functions:**
- `has_role()` - Kiểm tra role của user
- `get_user_role()` - Lấy role của user
- `handle_new_user()` - Tạo profile khi user đăng ký
- `handle_new_user_role()` - Assign role cho user mới
- `update_updated_at_column()` - Auto update timestamp

✅ **Triggers:**
- Tự động tạo profile khi user đăng ký
- Tự động assign role (user đầu tiên = admin, các user sau = user)

✅ **RLS Policies:**
- Row Level Security cho tất cả tables
- Users chỉ có thể CRUD dữ liệu của mình
- Admins có thể quản lý tất cả

✅ **Sample Data:**
- Subscription plans (Free, Pro, Business)
- AI Models (Gemini 2.5 Flash, GPT-5 Mini)
- Languages (Vietnamese, English)
- Default Theme

---

## Cách chạy

### Cách 1: Supabase Studio (Khuyến nghị) ⭐

1. **Mở Supabase Studio:**
   ```
   http://localhost:54323
   ```

2. **Vào SQL Editor:**
   - Click tab **SQL Editor** ở sidebar
   - Hoặc truy cập: http://localhost:54323/project/default/sql

3. **Chạy script:**
   - Click **New Query**
   - Copy toàn bộ nội dung file `database-setup-complete.sql`
   - Paste vào editor
   - Click **Run** (hoặc nhấn `Ctrl + Enter`)

4. **Kiểm tra kết quả:**
   - Xem tab **Results** để kiểm tra có lỗi không
   - Vào tab **Table Editor** để xem các tables đã được tạo

---

### Cách 2: psql Command Line

```powershell
# Chạy script từ file
docker exec -i supabase_db_Supabase psql -U postgres -d postgres < database-setup-complete.sql
```

**Hoặc copy-paste trực tiếp:**

```powershell
# Copy nội dung file và paste vào
Get-Content database-setup-complete.sql | docker exec -i supabase_db_Supabase psql -U postgres -d postgres
```

---

### Cách 3: Từ trong container

```powershell
# Copy file vào container
docker cp database-setup-complete.sql supabase_db_Supabase:/tmp/

# Chạy script
docker exec supabase_db_Supabase psql -U postgres -d postgres -f /tmp/database-setup-complete.sql
```

---

## Kiểm tra sau khi chạy

### 1. Kiểm tra tables đã được tạo

```sql
-- Xem danh sách tables
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Kết quả mong đợi:** ~50+ tables

### 2. Kiểm tra enums đã được tạo

```sql
-- Xem danh sách enums
SELECT typname 
FROM pg_type 
WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') 
  AND typtype = 'e'
ORDER BY typname;
```

**Kết quả mong đợi:** 12 enums

### 3. Kiểm tra functions

```sql
-- Xem danh sách functions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

**Kết quả mong đợi:** has_role, get_user_role, handle_new_user, handle_new_user_role, update_updated_at_column

### 4. Kiểm tra sample data

```sql
-- Kiểm tra subscription plans
SELECT name, slug, price FROM public.subscription_plans;

-- Kiểm tra AI models
SELECT name, model_id, is_default FROM public.admin_ai_models;

-- Kiểm tra languages
SELECT code, name, is_active FROM public.admin_languages;
```

---

## Lưu ý quan trọng

### ⚠️ Script an toàn

- Script sử dụng `IF NOT EXISTS` và `DO $$ BEGIN ... EXCEPTION ... END $$`
- Có thể chạy nhiều lần mà không bị lỗi
- Không xóa dữ liệu hiện có
- Chỉ tạo mới những gì chưa có

### ⚠️ User đầu tiên = Admin

- User đầu tiên đăng ký sẽ tự động được assign role `admin`
- Các user sau sẽ được assign role `user`
- Có thể thay đổi role trong bảng `user_roles`

### ⚠️ RLS Policies

- Tất cả tables đều có Row Level Security enabled
- Users chỉ có thể xem/sửa dữ liệu của mình
- Admins có thể quản lý tất cả

---

## Troubleshooting

### Lỗi: "relation already exists"

**Nguyên nhân:** Table đã tồn tại

**Giải pháp:** 
- Script đã xử lý bằng `IF NOT EXISTS`, nên lỗi này không nên xảy ra
- Nếu vẫn lỗi, có thể table được tạo thủ công trước đó

### Lỗi: "type already exists"

**Nguyên nhân:** Enum đã tồn tại

**Giải pháp:**
- Script đã xử lý bằng `DO $$ BEGIN ... EXCEPTION ... END $$`
- Lỗi này sẽ được bỏ qua tự động

### Lỗi: "permission denied"

**Nguyên nhân:** Không có quyền tạo objects

**Giải pháp:**
- Đảm bảo đang dùng user `postgres` (mặc định)
- Hoặc user có quyền CREATE

### Lỗi: "function already exists"

**Nguyên nhân:** Function đã tồn tại

**Giải pháp:**
- Script sử dụng `CREATE OR REPLACE FUNCTION`, nên sẽ update function cũ
- Không cần lo lắng

---

## Sau khi setup xong

1. **Test ứng dụng:**
   - Truy cập: https://life.hoanong.com
   - Đăng ký tài khoản mới
   - User đầu tiên sẽ có role `admin`

2. **Kiểm tra trong Supabase Studio:**
   - Vào **Table Editor**
   - Xem table `profiles` - sẽ có user mới
   - Xem table `user_roles` - user đầu tiên có role `admin`

3. **Test các tính năng:**
   - Tạo goals, tasks, habits
   - Viết journal entries
   - Sử dụng AI Coach
   - ...

---

## Tài liệu tham khảo

- File gốc: `docs/EXTERNAL_SUPABASE_COMPLETE_SETUP.sql`
- File bổ sung: `docs/external-supabase-missing-tables.sql`
- File admin: `docs/external-supabase-admin-tables.sql`

---

## Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra logs trong Supabase Studio
2. Xem file `ACCESS_DATABASE.md` để biết cách truy cập database
3. Kiểm tra file `LOCAL_SUPABASE_SETUP.md` để biết cấu hình Supabase Local

