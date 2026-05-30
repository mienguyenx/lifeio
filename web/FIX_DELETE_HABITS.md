# 🔧 Fix: Không xóa được Habits

## 📋 Vấn đề

Khi xóa Habits trong module Habits, habit không bị xóa (không chuyển vào thùng rác).

## 🔍 Nguyên nhân

1. **Code đang dùng soft delete** (set `deleted_at`) thay vì hard delete
2. **Thiếu error handling** khi sync với Supabase
3. **Không có retry logic** nếu sync thất bại

## ✅ Đã sửa

### 1. Thêm retry logic trong `useSyncedStore.deleteHabit`

```typescript
const deleteHabit = useCallback(async (id: string) => {
  store.deleteHabit(id);
  
  if (shouldSync) {
    console.log('Syncing habit soft delete to Supabase:', id);
    const result = await habitsSync.updateHabit(id, { deletedAt: new Date().toISOString() });
    if (!result) {
      console.error('Failed to sync habit soft delete, retrying...');
      // Retry once
      await new Promise(resolve => setTimeout(resolve, 500));
      await habitsSync.updateHabit(id, { deletedAt: new Date().toISOString() });
    }
  }
}, [store, habitsSync, shouldSync]);
```

### 2. Cải thiện error handling trong `useHabitsSync.updateHabit`

```typescript
const { error, data: updatedData } = await supabase
  .from('habits')
  .update(data)
  .eq('id', id)
  .eq('user_id', user.id)
  .select();

if (error) {
  console.error('Error updating habit:', error);
  throw error;
}

if (!updatedData || updatedData.length === 0) {
  console.warn('No rows updated for habit:', id);
  return false;
}
```

## 🧪 Kiểm tra

### Test UPDATE trong database:
```sql
-- Test update deleted_at
UPDATE public.habits 
SET deleted_at = NOW() 
WHERE id = '...' 
RETURNING id, name, deleted_at;

-- Result: ✅ OK - Có thể update
```

### RLS Policy:
```sql
-- Policy cho phép ALL (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Users can CRUD own habits" 
ON public.habits FOR ALL 
USING (auth.uid() = user_id);
```

## 🚀 Cách áp dụng

### Bước 1: Rebuild container

```powershell
docker-compose build --no-cache lifeos-app
docker-compose up -d --force-recreate lifeos-app
```

### Bước 2: Test trong browser

1. Mở https://life.hoanong.com/habits
2. Chọn một habit
3. Click "Xóa" (hoặc swipe left trên mobile)
4. Xác nhận xóa
5. Kiểm tra:
   - Habit biến mất khỏi danh sách
   - Có thể thấy trong Trash (nếu có trang Trash)

### Bước 3: Kiểm tra Console

1. F12 > Console
2. Tìm log: `Syncing habit soft delete to Supabase: <id>`
3. Không có errors

### Bước 4: Kiểm tra Database

```sql
-- Xem habits đã bị soft delete
SELECT id, name, deleted_at, archived_at 
FROM public.habits 
WHERE user_id = '1e878c69-3e31-473b-b5c4-73ca8dab7449'
  AND deleted_at IS NOT NULL;
```

## 📝 Lưu ý

1. **Soft delete**: Habits không bị xóa thật, chỉ set `deleted_at`. Có thể khôi phục sau.
2. **Hard delete**: Để xóa thật, dùng `permanentDeleteHabit` trong Trash page.
3. **Sync**: Nếu offline, thay đổi sẽ được queue và sync khi online.

## 🔍 Debug

Nếu vẫn không xóa được:

1. **Kiểm tra Console errors:**
   - F12 > Console
   - Tìm errors liên quan đến Supabase

2. **Kiểm tra Network:**
   - F12 > Network
   - Tìm request đến `supabase.hoanong.com/rest/v1/habits`
   - Xem Status code và Response

3. **Kiểm tra Database:**
   ```sql
   -- Xem habits của user
   SELECT id, name, deleted_at, user_id 
   FROM public.habits 
   WHERE user_id = '1e878c69-3e31-473b-b5c4-73ca8dab7449';
   ```

4. **Kiểm tra RLS:**
   ```sql
   -- Xem policies
   SELECT policyname, cmd, qual 
   FROM pg_policies 
   WHERE tablename = 'habits';
   ```

## ✅ Kết quả mong đợi

- ✅ Click "Xóa" → Habit biến mất khỏi danh sách
- ✅ Habit được set `deleted_at` trong database
- ✅ Có thể khôi phục từ Trash
- ✅ Console không có errors
- ✅ Sync thành công với Supabase

