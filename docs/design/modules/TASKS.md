# Module 02 — Tasks / Công việc (UI v3)

Tham chiếu: `../references/tasks-ref-1.webp`, `tasks-ref-2.webp`, `tasks-ref-3.webp` (+ `app-screens-ref.webp` cho toàn app).

## Cấu trúc code
```
frontend/src/features/tasks/
├─ TasksPage.tsx              # route /tasks (desktop + mobile)
├─ components/
│  ├─ TaskStats.tsx           # 4 thẻ: hôm nay · ưu tiên cao · quá hạn · % hoàn thành
│  ├─ TaskFilter.tsx          # TaskTabs, ViewSwitcher, TaskSearch, TaskFilterPopover
│  ├─ TaskItem.tsx            # TaskRow (desktop), TaskCard (mobile), chips, menu
│  ├─ TaskList.tsx            # nhóm: Quá hạn → Hôm nay → Sắp tới → Chưa đặt hạn → Đã xong
│  ├─ TaskBoard.tsx           # Kanban Cần làm / Đang làm / Hoàn thành, kéo-thả HTML5
│  ├─ TaskCalendar.tsx        # lịch tháng (desktop: chip; mobile: chấm + agenda)
│  ├─ TaskQuickAdd.tsx        # thêm nhanh (Dialog desktop / Drawer mobile)
│  ├─ TaskDetailModal.tsx     # chi tiết: trạng thái, lĩnh vực, ngày/giờ, ưu tiên, checklist, ghi chú
│  ├─ TaskFormFields.tsx      # PriorityPicker, AreaSelect, field styles
│  ├─ TaskSidePanel.tsx       # Mochi động viên · Focus Pomodoro · Thêm nhanh
│  └─ TaskEmptyState.tsx      # empty state theo tab (Mochi)
├─ hooks/useTasks.ts          # dữ liệu + counts + actions (useLifeOSStore + useSyncedStore)
├─ types/task.types.ts
└─ utils/task.utils.ts        # ngày, nhóm, sort, meta ưu tiên/trạng thái/lĩnh vực
```
Trang cũ vẫn truy cập được tại `/tasks/classic` (`pages/TasksPageLegacy.tsx`) — lịch sử, lưu trữ, biểu đồ năng suất, tag, liên kết mục tiêu.

## Dữ liệu
- `tasks`, `addTask`, `updateTask`, `deleteTask`, `addSubtask`, `toggleSubtask`, `deleteSubtask` qua `useSyncedStore` (local Zustand + persist, sync Supabase khi có).
- Giờ của công việc dùng `reminderTime` (HH:mm). Lặp lại dùng `recurring` (store tự tạo bản kế tiếp khi hoàn thành).
- Focus: `usePomodoroStore.start(taskId)`; task `todo` tự chuyển `in_progress`.
- URL: `/tasks?view=list|board|calendar`, `/tasks?new=1` mở Thêm nhanh.

## Trạng thái UI
Bình thường · Empty (theo tab + khi tìm kiếm) · Đang thêm/sửa · Kéo thả (cột highlight) · Quá hạn (đỏ) · Đã xong (gạch ngang) · Dark mode · Responsive (<768 mobile, ≥1280 có side panel).
