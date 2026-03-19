# 📦 Hướng dẫn Backup Toàn Bộ Ứng Dụng

## 🎯 Tổng quan

Có 2 cách để backup toàn bộ ứng dụng:

1. **Backup qua Admin Panel (Google Drive)** - Backup dữ liệu dạng JSON
2. **Backup PostgreSQL Database** - Backup toàn bộ database (schema + data)

## 🔄 Cách 1: Backup qua Admin Panel (Google Drive)

### Tính năng

- ✅ Backup tất cả dữ liệu từ Supabase database
- ✅ Hỗ trợ 3 scope:
  - **User**: Backup dữ liệu của 1 user cụ thể
  - **All Users**: Backup dữ liệu của tất cả users
  - **Full Database**: Backup toàn bộ database (bao gồm system tables)
- ✅ Upload lên Google Drive tự động
- ✅ Progress tracking real-time
- ✅ Backup history

### Cách sử dụng

1. **Vào Admin Panel**:
   - URL: `https://life.hoanong.com/admin/backup`

2. **Kết nối Google Drive** (nếu chưa kết nối):
   - Click "Kết nối Google Drive"
   - Chọn tài khoản và cấp quyền

3. **Tạo Backup**:
   - **Backup User**: Chọn user từ dropdown và click "Tạo Backup"
   - **Backup All Users**: Click "Tạo Backup" (admin only)
   - **Backup Full Database**: Click "Tạo Backup" (admin only, tự động nếu không chọn user)

4. **Theo dõi tiến trình**:
   - Xem progress bar và status messages
   - Xem chi tiết trong tab "Lịch sử"

### Dữ liệu được backup

#### User Data:
- ✅ Profiles, User Roles, User Settings
- ✅ Goals (và milestones, activities, collaborators, vision items, progress history)
- ✅ Tasks (và subtasks, tags)
- ✅ Habits (và completions, challenges, competitions)
- ✅ Journal Entries & Tags
- ✅ Notes & Tags
- ✅ Daily Intentions, Life Wheel Scores, Weekly Reviews
- ✅ Personal Values, Traits, Visions, Roles, Milestones
- ✅ Pomodoro Sessions
- ✅ Saved Conversations & Chat Messages
- ✅ Finance Transactions
- ✅ Health Logs
- ✅ Learning Courses & Books
- ✅ Relationships Contacts & Interactions
- ✅ Google Drive Tokens

#### System Data (Full Database only):
- ✅ Subscription Plans & User Subscriptions
- ✅ Workspaces & Members & Invitations
- ✅ Admin Settings, System Logs, Email Logs
- ✅ Feature Flags
- ✅ AI Models & Prompts
- ✅ Templates, Themes, Languages, Translations
- ✅ Plugins & Hooks & User Plugin Settings
- ✅ Backup History & Progress & Settings

### File Format

```json
{
  "version": "1.0",
  "exportedAt": "2025-12-26T16:07:48.923Z",
  "exportedBy": "user-id",
  "scope": "full_database",
  "targetUserId": null,
  "database": {
    "profiles": [...],
    "goals": [...],
    "tasks": [...],
    // ... tất cả tables
  },
  "metadata": {
    "totalUsers": 10,
    "totalRecords": 12345,
    "tableCounts": {
      "profiles": 10,
      "goals": 50,
      "tasks": 117,
      // ...
    }
  }
}
```

## 🗄️ Cách 2: Backup PostgreSQL Database

### Tính năng

- ✅ Backup toàn bộ PostgreSQL database
- ✅ Bao gồm schema, data, indexes, triggers, functions
- ✅ Có thể restore hoàn toàn database
- ✅ Script tự động compress và cleanup

### Cách sử dụng

#### Windows (PowerShell):

```powershell
# Chạy script backup
.\backup-postgresql-database.ps1

# Hoặc với custom config
$env:DB_HOST = "localhost"
$env:DB_PORT = "54322"
$env:DB_NAME = "postgres"
$env:DB_USER = "postgres"
$env:DB_PASSWORD = "postgres"
$env:BACKUP_DIR = "./backups"
.\backup-postgresql-database.ps1
```

#### Linux/Mac (Bash):

```bash
# Chạy script backup
chmod +x backup-postgresql-database.sh
./backup-postgresql-database.sh

# Hoặc với custom config
DB_HOST=localhost \
DB_PORT=54322 \
DB_NAME=postgres \
DB_USER=postgres \
DB_PASSWORD=postgres \
BACKUP_DIR=./backups \
./backup-postgresql-database.sh
```

#### Docker (nếu Supabase chạy trong Docker):

```bash
# Backup từ Docker container
docker exec supabase_db_Supabase pg_dump -U postgres postgres > backup_$(date +%Y%m%d_%H%M%S).sql

# Hoặc với compression
docker exec supabase_db_Supabase pg_dump -U postgres postgres | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Restore Database

```bash
# Restore từ backup file
psql -h localhost -p 54322 -U postgres -d postgres < backup_file.sql

# Hoặc từ compressed file
gunzip < backup_file.sql.gz | psql -h localhost -p 54322 -U postgres -d postgres

# Hoặc từ Docker
docker exec -i supabase_db_Supabase psql -U postgres postgres < backup_file.sql
```

## 📊 So sánh 2 cách

| Tính năng | Admin Panel Backup | PostgreSQL Backup |
|-----------|-------------------|-------------------|
| **Format** | JSON | SQL |
| **Scope** | Flexible (user/all/full) | Full database only |
| **Storage** | Google Drive | Local file |
| **Restore** | Cần code để import | `psql` command |
| **Size** | Smaller (chỉ data) | Larger (schema + data) |
| **Speed** | Slower (API calls) | Faster (direct DB) |
| **Use case** | Data migration, selective backup | Full disaster recovery |

## 🔄 Khuyến nghị

### Backup thường xuyên (Daily/Weekly):
- ✅ Sử dụng **Admin Panel Backup** → Google Drive
- ✅ Tự động hóa với cron job hoặc scheduled task
- ✅ Giữ nhiều versions (retention policy)

### Backup định kỳ (Monthly):
- ✅ Sử dụng **PostgreSQL Backup** → Local storage
- ✅ Lưu ở nhiều nơi (local + cloud)
- ✅ Test restore để đảm bảo backup hoạt động

### Disaster Recovery:
- ✅ Cả 2 cách đều cần thiết
- ✅ Admin Panel Backup: Dễ restore từng phần
- ✅ PostgreSQL Backup: Restore nhanh toàn bộ

## 🔧 Troubleshooting

### Admin Panel Backup không có data

**Nguyên nhân**: 
- User chưa có dữ liệu
- RLS policies chặn query
- Migration chưa chạy

**Giải pháp**:
- Kiểm tra console logs
- Kiểm tra user có data trong database
- Kiểm tra RLS policies

### PostgreSQL Backup failed

**Nguyên nhân**:
- `pg_dump` chưa được cài đặt
- Database không accessible
- Permission denied

**Giải pháp**:
- Cài đặt PostgreSQL client tools
- Kiểm tra connection string
- Kiểm tra user permissions

## 📝 Files liên quan

- `src/utils/backupDataCollector.ts` - Function collect data từ Supabase
- `src/hooks/useAdminGoogleDriveBackup.ts` - Hook quản lý backup
- `backup-postgresql-database.sh` - Script backup PostgreSQL (Linux/Mac)
- `backup-postgresql-database.ps1` - Script backup PostgreSQL (Windows)

