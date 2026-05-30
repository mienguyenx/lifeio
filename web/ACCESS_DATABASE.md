# 🔍 Cách truy cập Database Local Supabase

## 1. Supabase Studio (Web UI) - Khuyến nghị ⭐

### Truy cập
```
http://localhost:54323
```

### Tính năng
- ✅ Xem và chỉnh sửa dữ liệu trong tables
- ✅ Chạy SQL queries
- ✅ Xem schema (tables, columns, relationships)
- ✅ Quản lý authentication users
- ✅ Xem logs
- ✅ Quản lý storage

### Cách sử dụng

1. **Mở Studio:**
   ```powershell
   # Cách 1: Truy cập trực tiếp
   Start-Process "http://localhost:54323"
   
   # Cách 2: Dùng script
   .\scripts\supabase-local.ps1 studio
   ```

2. **Xem Tables:**
   - Vào tab **Table Editor**
   - Chọn database: `postgres`
   - Xem danh sách tables

3. **Chạy SQL:**
   - Vào tab **SQL Editor**
   - Viết query và chạy
   - Xem kết quả

4. **Xem Schema:**
   - Vào tab **Database**
   - Xem tables, columns, relationships

---

## 2. psql (Command Line)

### Kết nối thông tin

- **Host**: `localhost`
- **Port**: `54322` (mapped từ container port 5432)
- **Database**: `postgres`
- **User**: `postgres`
- **Password**: `postgres` (mặc định)

### Cách 1: Dùng Docker exec (Khuyến nghị)

```powershell
# Kết nối vào database
docker exec -it supabase_db_Supabase psql -U postgres -d postgres

# Hoặc chạy query trực tiếp
docker exec supabase_db_Supabase psql -U postgres -d postgres -c "SELECT * FROM profiles LIMIT 5;"
```

### Cách 2: Dùng psql từ máy local

**Nếu đã cài PostgreSQL trên máy:**

```powershell
# Kết nối
psql -h localhost -p 54322 -U postgres -d postgres

# Password: postgres
```

**Nếu chưa cài, dùng Docker:**

```powershell
# Chạy psql client trong container
docker run -it --rm --network container:supabase_db_Supabase postgres:15 psql -h localhost -U postgres -d postgres
```

### Các lệnh psql hữu ích

```sql
-- Xem danh sách databases
\l

-- Kết nối vào database
\c postgres

-- Xem danh sách tables
\dt

-- Xem schema của table
\d profiles

-- Xem tất cả tables trong schema public
\dt public.*

-- Chạy query
SELECT * FROM profiles LIMIT 10;

-- Xem users trong auth
SELECT * FROM auth.users LIMIT 10;

-- Thoát
\q
```

---

## 3. pgAdmin (Desktop GUI)

### Cài đặt

1. Tải pgAdmin: https://www.pgadmin.org/download/
2. Cài đặt và mở pgAdmin

### Kết nối

1. Right-click **Servers** → **Register** → **Server**
2. Tab **General**:
   - **Name**: `Supabase Local`
3. Tab **Connection**:
   - **Host**: `localhost`
   - **Port**: `54322`
   - **Database**: `postgres`
   - **Username**: `postgres`
   - **Password**: `postgres`
4. Click **Save**

### Tính năng
- ✅ GUI đầy đủ tính năng
- ✅ Query builder
- ✅ Schema visualization
- ✅ Data export/import

---

## 4. DBeaver (Universal Database Tool)

### Cài đặt

1. Tải DBeaver: https://dbeaver.io/download/
2. Cài đặt và mở DBeaver

### Kết nối

1. Click **New Database Connection**
2. Chọn **PostgreSQL**
3. Nhập thông tin:
   - **Host**: `localhost`
   - **Port**: `54322`
   - **Database**: `postgres`
   - **Username**: `postgres`
   - **Password**: `postgres`
4. Click **Test Connection** → **Finish**

### Tính năng
- ✅ Hỗ trợ nhiều loại database
- ✅ ER diagrams
- ✅ Data export/import
- ✅ SQL editor mạnh mẽ

---

## 5. VS Code Extensions

### PostgreSQL Extension

1. Cài extension: **PostgreSQL** (by Chris Kolkman)
2. Click icon PostgreSQL ở sidebar
3. Click **+** để thêm connection:
   - **Host**: `localhost`
   - **Port**: `54322`
   - **Database**: `postgres`
   - **Username**: `postgres`
   - **Password**: `postgres`

### Tính năng
- ✅ Query trong VS Code
- ✅ Xem tables và data
- ✅ Auto-complete SQL

---

## 6. Quick Access Scripts

### Xem danh sách tables

```powershell
docker exec supabase_db_Supabase psql -U postgres -d postgres -c "\dt public.*"
```

### Xem dữ liệu trong table

```powershell
# Xem profiles
docker exec supabase_db_Supabase psql -U postgres -d postgres -c "SELECT * FROM profiles LIMIT 10;"

# Xem users
docker exec supabase_db_Supabase psql -U postgres -d postgres -c "SELECT id, email, created_at FROM auth.users LIMIT 10;"
```

### Xem schema của table

```powershell
docker exec supabase_db_Supabase psql -U postgres -d postgres -c "\d profiles"
```

### Đếm số records

```powershell
docker exec supabase_db_Supabase psql -U postgres -d postgres -c "SELECT COUNT(*) FROM profiles;"
```

---

## 7. Thông tin kết nối đầy đủ

### Database Connection

```
Host: localhost
Port: 54322
Database: postgres
Username: postgres
Password: postgres
```

### Supabase API

```
URL: http://localhost:54321
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
Service Role Key: (xem trong Supabase Studio > Settings > API)
```

### Supabase Studio

```
URL: http://localhost:54323
```

---

## 8. Các tables quan trọng

### Auth Tables (schema: auth)

- `auth.users` - Users đã đăng ký
- `auth.sessions` - Sessions đang active
- `auth.refresh_tokens` - Refresh tokens

### Application Tables (schema: public)

- `profiles` - User profiles
- `habits` - Habits data
- `tasks` - Tasks data
- `goals` - Goals data
- `journal_entries` - Journal entries
- ... (xem trong Supabase Studio)

### Xem tất cả tables

```sql
-- Trong psql hoặc SQL Editor
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_schema IN ('public', 'auth')
ORDER BY table_schema, table_name;
```

---

## 9. Troubleshooting

### Lỗi: "Connection refused"

**Nguyên nhân:** Supabase chưa chạy hoặc port sai

**Giải pháp:**
```powershell
# Kiểm tra Supabase có chạy không
docker ps --filter "name=supabase"

# Kiểm tra port
docker port supabase_db_Supabase
```

### Lỗi: "Password authentication failed"

**Nguyên nhân:** Password sai

**Giải pháp:**
- Password mặc định: `postgres`
- Hoặc xem trong Supabase config

### Lỗi: "Database does not exist"

**Nguyên nhân:** Database name sai

**Giải pháp:**
- Dùng database: `postgres` (mặc định)
- Hoặc xem danh sách: `\l` trong psql

---

## 10. Tips & Tricks

### Export data

```powershell
# Export table ra CSV
docker exec supabase_db_Supabase psql -U postgres -d postgres -c "COPY profiles TO STDOUT WITH CSV HEADER" > profiles.csv
```

### Import data

```powershell
# Import từ CSV
docker exec -i supabase_db_Supabase psql -U postgres -d postgres -c "COPY profiles FROM STDIN WITH CSV HEADER" < profiles.csv
```

### Backup database

```powershell
# Backup toàn bộ database
docker exec supabase_db_Supabase pg_dump -U postgres postgres > backup.sql
```

### Restore database

```powershell
# Restore từ backup
docker exec -i supabase_db_Supabase psql -U postgres -d postgres < backup.sql
```

---

## Khuyến nghị

- **Cho người mới**: Dùng **Supabase Studio** (http://localhost:54323)
- **Cho developer**: Dùng **psql** hoặc **VS Code Extension**
- **Cho DBA**: Dùng **pgAdmin** hoặc **DBeaver**

