# 🔧 Fix: Lỗi bấm vào Habits và các module khác không mở được modal

## 📋 Vấn đề

Khi click vào Habits, Goals hoặc các module khác, modal/dialog không mở được hoặc bị lỗi.

## 🔍 Nguyên nhân

1. **HabitsPage & GoalsPage**: Sử dụng `open={!!selectedHabit}` hoặc `open={!!selectedGoal}` thay vì state riêng cho modal
2. **Thiếu state riêng**: Không có `isDetailModalOpen` state để control modal riêng biệt
3. **onOpenChange không đúng**: Chỉ set null khi close, không handle đúng cách

## ✅ Đã sửa

### 1. HabitsPage

**Thêm state:**
```typescript
const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
```

**Sửa tất cả onClick handlers:**
```typescript
onClick={() => {
  setSelectedHabit(habit);
  setIsDetailModalOpen(true);
}}
```

**Sửa modal:**
```typescript
<HabitDetailModal
  habit={selectedHabit}
  open={isDetailModalOpen}
  onOpenChange={(open) => {
    setIsDetailModalOpen(open);
    if (!open) {
      setSelectedHabit(null);
    }
  }}
/>
```

### 2. GoalsPage

**Thêm state:**
```typescript
const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
```

**Sửa tất cả onClick handlers:**
```typescript
onClick={() => {
  setSelectedGoal(goal);
  setIsDetailModalOpen(true);
}}
```

**Sửa modal:**
```typescript
<GoalDetailModal
  goal={selectedGoal}
  open={isDetailModalOpen}
  onOpenChange={(open) => {
    setIsDetailModalOpen(open);
    if (!open) {
      setSelectedGoal(null);
    }
  }}
/>
```

### 3. NotesPage

**OK** - Đã dùng Dialog với `open={!!selectedNote}`, hoạt động tốt.

## 🚀 Cách áp dụng

### Bước 1: Rebuild container

```powershell
docker-compose build --no-cache lifeos-app
docker-compose up -d --force-recreate lifeos-app
```

### Bước 2: Test trong browser

1. **Habits:**
   - Mở https://life.hoanong.com/habits
   - Click vào một habit card
   - Modal sẽ mở ✅

2. **Goals:**
   - Mở https://life.hoanong.com/goals
   - Click vào một goal card
   - Modal sẽ mở ✅

3. **Notes:**
   - Mở https://life.hoanong.com/notes
   - Click vào một note
   - Dialog sẽ mở ✅

## 📝 Files đã sửa

1. `src/pages/HabitsPage.tsx`
   - Thêm `isDetailModalOpen` state
   - Sửa tất cả onClick handlers
   - Sửa `HabitDetailModal` props

2. `src/pages/GoalsPage.tsx`
   - Thêm `isDetailModalOpen` state
   - Sửa tất cả onClick handlers
   - Sửa `GoalDetailModal` props

## 🔍 Debug

Nếu vẫn không mở được modal:

1. **Kiểm tra Console:**
   - F12 > Console
   - Tìm errors liên quan đến modal/dialog

2. **Kiểm tra State:**
   - React DevTools
   - Xem `isDetailModalOpen` có được set thành `true` không

3. **Kiểm tra Props:**
   - Xem modal component có nhận đúng props không
   - `open` prop phải là boolean, không phải `!!selectedItem`

## ✅ Kết quả mong đợi

- ✅ Click vào habit → Modal mở
- ✅ Click vào goal → Modal mở
- ✅ Click vào note → Dialog mở
- ✅ Click vào task → Modal mở (đã OK từ trước)
- ✅ Console không có errors
- ✅ Modal đóng đúng cách khi click outside hoặc ESC

