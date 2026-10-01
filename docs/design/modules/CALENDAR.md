# Module 04 — Calendar / Planner (UI v3)

Trang Lịch dựng lại theo bố cục UI mẫu Module 04. **Dữ liệu lấy từ store hiện có** — Calendar cũ là trang tổng hợp chỉ-đọc từ 6 nguồn; bản mới giữ nguyên các nguồn đó, thêm chế độ xem theo giờ và cho phép tạo/dời lịch **Task** (không tạo bảng "event" mới).

## Cấu trúc
```
src/features/calendar/
  CalendarPage.tsx              # Header · toolbar (‹ › Hôm nay · kỳ · Tháng/Tuần/Ngày/Danh sách) · bộ lọc · cột phải
  hooks/useCalendar.ts          # Gom mục lịch từ store + createEvent (→ Task) + moveTask (kéo-thả)
  types/calendar.types.ts       # CalendarItem, CalendarView, EventDraft
  utils/calendar.utils.ts       # khoảng ngày, nhãn, màu theo nguồn, xếp làn khối chồng giờ
  components/
    MonthView.tsx               # Lưới tháng, chip mục, +N, double-click/“+” để thêm, thả task để đổi ngày
    TimeGridView.tsx            # Lưới giờ Tuần/Ngày: hàng “Cả ngày”, khối theo giờ, vạch giờ hiện tại, click ô trống để thêm, thả task để đổi ngày+giờ
    AgendaView.tsx              # Danh sách 30 ngày theo ngày
    MiniCalendar.tsx            # Lịch nhỏ cột phải (chấm = có mục)
    CalendarSidePanel.tsx       # Hôm nay / Thêm nhanh / Focus hôm nay / câu trích Mochi
    CalendarFilters.tsx         # Lọc theo nguồn (đồng thời là chú giải màu)
    EventModal.tsx              # Thêm sự kiện / việc cần làm
    EventDetail.tsx             # Chi tiết mục chỉ-đọc + “Mở trong …”
    EventChip.tsx               # Chip & hàng mục lịch
```

## Nguồn dữ liệu (giữ như Calendar cũ)
| Nguồn | Ngày | Giờ |
|---|---|---|
| Task có hạn | `dueDate` | `reminderTime`; thời lượng = `estimatedPomodoros × workDuration` |
| Task hoàn thành không có hạn | `completedAt` | — |
| Habit đã hoàn thành | `completedDates` | `reminderTime` của habit |
| Nhật ký | `date` | — |
| Phiên Focus (work) | `completedAt` | `completedAt − duration` → `completedAt` |
| Review tuần / tháng | `weekStart` / `month-01` | — |
| Hạn mục tiêu | `targetDate` | — |

## Ánh xạ UI mẫu → tính năng có thật
| UI mẫu | Thực hiện |
|---|---|
| Add Event (Sự kiện / Việc cần làm) | Tạo **Task**: tiêu đề, mô tả, ngày, giờ (`reminderTime`), cả ngày, lặp lại (`recurring`), nhắc trước (`reminderMinutes`), lĩnh vực, ưu tiên, gắn mục tiêu (`goalId`) |
| Event Detail (checklist, ghi chú…) | Task → `TaskDetailModal` (checklist = subtasks, Focus, hoàn thành, xóa); Habit → `HabitDetailModal`; nguồn khác → `EventDetail` + liên kết module |
| Quick Add | Tạo Task cả ngày vào ngày đang chọn |
| Focus Time | Tổng phút phiên Focus hôm nay; vòng % = mục hôm nay đã xong |
| Danh mục màu | Màu theo nguồn dữ liệu (Công việc/Thói quen/Nhật ký/Focus/Review/Mục tiêu) |
| Không làm | Địa điểm, thành viên, tệp đính kèm, bình luận — repo chưa có dữ liệu này |

## Route
- `/calendar` → `features/calendar/CalendarPage` (hỗ trợ `?add`)
- `/calendar/classic` → giao diện cũ (`pages/CalendarPageLegacy.tsx`)
