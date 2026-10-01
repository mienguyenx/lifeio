# Module 03 — Habits (UI v3b)

Trang Thói quen được dựng lại theo bố cục UI mẫu (Module 03), **toàn bộ dữ liệu & tính năng lấy từ code hiện có** (`useLifeOSStore`, `useSyncedStore`, các component `components/habits/*`). Không thêm trường dữ liệu mới.

## Cấu trúc
```
src/features/habits/
  HabitsPage.tsx                 # Trang chính: header · tabs Hôm nay/Thống kê/Thử thách · FAB mobile
  hooks/useHabits.ts             # Bọc store: active/archived, stats, increment(debounce 300ms), check, challenge, CRUD
  types/habit.types.ts           # HabitFormValue, HabitTab, ChallengeType
  utils/habit.utils.ts           # ngày GMT+7, tiến độ, màu, nhãn, thử thách 21/30/66, form <-> habit
  components/
    HabitStatsCard.tsx           # Hero "Hôm nay của bạn" (vòng %) + 3 ô Streak hiện tại/dài nhất/Tỷ lệ 30 ngày
    WeekStrip.tsx                # Dải tuần T2→CN, chọn ngày quá khứ để đánh dấu bù
    HabitCard.tsx                # Hàng thói quen: icon pastel · tên · streak · tiến độ · nút check/+1
    HabitCreateModal.tsx         # Thêm/sửa: mẫu (admin templates), icon, màu, lĩnh vực, tần suất, mục tiêu+đơn vị, nhắc nhở, phiên bản tối thiểu, mục tiêu liên kết, mô tả
    HabitDetailModal.tsx         # Chi tiết: icon lớn, 3 chỉ số, tiến độ ngày +/- & ghi chú, thử thách, lịch tháng, ghi chú gần đây, cài đặt
    HabitInsightsChart.tsx       # Thống kê 7/30/90 ngày: 4 ô, biểu đồ cột, top thói quen
    HabitChallenges.tsx          # Thử thách 21/30/66 ngày: Đang diễn ra / Khám phá / Hoàn thành
    HabitEmptyState.tsx          # Trạng thái trống với Taro
```

## Ánh xạ tính năng (cũ → mới)
| Tính năng có sẵn | Vị trí mới |
|---|---|
| Danh sách, lọc tần suất/lĩnh vực, sắp xếp 5 kiểu ↑↓, tìm kiếm, nhóm theo lĩnh vực | Tab Hôm nay — chip + select |
| Đánh dấu/tăng giảm số lần, ghi chú hoàn thành | Nút check trên hàng, modal chi tiết |
| Vuốt trên mobile (+1 / xóa) | `SwipeableCard` |
| Mẫu thói quen (admin templates + usage_count) | Form thêm → “Chọn từ mẫu” |
| Liên kết mục tiêu, targetDays, nhắc nhở, phiên bản tối thiểu, icon/màu | Form thêm/sửa |
| Quản lý lịch sử | Nút “Lịch sử” (`HabitHistoryManager`) |
| Dự đoán AI, so sánh/cạnh tranh | Cột phải + tab Thống kê (`HabitPredictionCard`, `HabitCompetitionCard`) |
| Thử thách 21/30/66 | Tab Thử thách |
| Lưu trữ / khôi phục / xóa vào thùng rác | Modal chi tiết, `ArchivedHabitsSection`, AlertDialog |
| `?add` từ Quick Add | Mở form thêm |

## Route
- `/habits` → `features/habits/HabitsPage`
- `/habits/classic` → giao diện cũ (`pages/HabitsPageLegacy.tsx`) để đối chiếu.
