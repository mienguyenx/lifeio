# 🔍 Debug: Các module mới không load data từ database

## ✅ Đã thêm logging chi tiết

Đã thêm logging vào tất cả các sync hooks để debug vấn đề không load data.

## 📋 Cách kiểm tra:

### 1. Mở Browser Console (F12)

### 2. Refresh trang và xem logs:

Khi app khởi động, bạn sẽ thấy các logs sau:

```
[DataSync] Initial load triggered - user: ... online: true
[DataSync] Calling loadAllData()
[DataSync] Loading data from External Supabase
[DataSync] User: ... Session: true Online: true
[HealthSync] Loading health logs for user: ...
[FinanceSync] Loading transactions for user: ...
[LearningSync] Loading courses for user: ...
[LearningSync] Loading books for user: ...
[RelationshipsSync] Loading contacts for user: ...
[RelationshipsSync] Loading interactions for user: ...
```

### 3. Kiểm tra các trường hợp:

#### Nếu thấy: `[DataSync] No user, skipping load`
→ **User chưa đăng nhập** → Cần đăng nhập trước

#### Nếu thấy: `[DataSync] No session, skipping load`
→ **Session chưa có** → Có thể cần đăng nhập lại

#### Nếu thấy: `[HealthSync] No user, skipping load`
→ **User chưa có khi hook được gọi** → Kiểm tra xem user có đăng nhập không

#### Nếu thấy: `[HealthSync] Loading health logs for user: ...` nhưng không có request trong Network
→ **Có thể có lỗi trong `ensureValidSession()`** → Xem có lỗi gì không

#### Nếu thấy: `[HealthSync] Error loading health logs: ...`
→ **Có lỗi khi query database** → Xem chi tiết lỗi

### 4. Kiểm tra Network Tab:

1. Mở **Network** tab trong DevTools
2. Filter: `health_logs` hoặc `learning_books` hoặc `finance_transactions`
3. Refresh trang
4. Xem có request nào không

**Nếu không thấy request:**
- Có thể `loadAllData()` không được gọi
- Hoặc user chưa đăng nhập
- Hoặc có điều kiện nào đó ngăn không cho load

**Nếu thấy request nhưng failed:**
- Xem status code (401 = chưa đăng nhập, 403 = không có quyền, 404 = table không tồn tại)
- Xem response body để biết lỗi chi tiết

### 5. Test thủ công:

```javascript
// Kiểm tra user
await __LIFEOS_DEBUG__.checkSession()

// Test query thủ công
const { data, error } = await __LIFEOS_DEBUG__.getActiveSupabase()
  .from('learning_books')
  .select('*')
  .limit(5);
console.log('Learning Books:', data, error);
```

## 🎯 Các nguyên nhân có thể:

1. **User chưa đăng nhập**
   - Kiểm tra: `await __LIFEOS_DEBUG__.checkSession()`
   - Nếu `hasSession: false` → Cần đăng nhập

2. **useDataSync không được gọi**
   - Kiểm tra logs: `[DataSync] Initial load triggered`
   - Nếu không thấy → Có thể `DataSyncProvider` chưa được mount

3. **Điều kiện `isOnline` = false**
   - Kiểm tra logs: `online: true/false`
   - Nếu `false` → Sẽ load từ cache thay vì database

4. **Session không hợp lệ**
   - Kiểm tra: `ensureValidSession()` có throw error không
   - Xem logs: `Error ensuring valid session`

5. **RLS Policies chặn query**
   - Kiểm tra: Request có status 403 không
   - Xem response: `permission denied` hoặc `new row violates row-level security policy`

## 🔧 Giải pháp:

### Nếu user chưa đăng nhập:
1. Đăng nhập vào app
2. Refresh trang
3. Xem logs lại

### Nếu có lỗi RLS:
1. Kiểm tra user có đúng không
2. Kiểm tra RLS policies trong database
3. Test query thủ công với user đó

### Nếu không thấy request trong Network:
1. Kiểm tra `useDataSync` có được gọi không
2. Kiểm tra `DataSyncProvider` có được mount không
3. Kiểm tra `loadAllData()` có được gọi không

## 📝 Checklist:

- [ ] User đã đăng nhập (`hasSession: true`)
- [ ] Thấy log `[DataSync] Initial load triggered`
- [ ] Thấy log `[DataSync] Calling loadAllData()`
- [ ] Thấy logs từ các sync hooks (`[HealthSync]`, `[FinanceSync]`, etc.)
- [ ] Thấy requests trong Network tab
- [ ] Requests có status 200 (không phải 401/403/404)
- [ ] Data được load vào store

