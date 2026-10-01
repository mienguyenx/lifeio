# Module 03 — Habits / Thói quen (UI v3 — restyle)

Tham chiếu hình ảnh: `../references/habits-ref-1.webp`. **Nguyên tắc:** ảnh chỉ dùng làm tham chiếu *phong cách* — tính năng, dữ liệu, luồng xử lý giữ nguyên theo source code hiện có (`pages/HabitsPage.tsx`, `useLifeOSStore`, `useSyncedStore`).

## Đã đổi (chỉ phần trình bày)
- `components/habits/HabitVisuals.tsx` (mới): `HabitsOverview` (hero "Hôm nay của bạn" + 3 ô số liệu dùng đúng chỉ số cũ: completedToday/totalHabits, totalStreak, avgCompletion 30 ngày), `HabitIconTile`, `HabitCheckButton` (vòng tiến độ cho habit nhiều lần/ngày), `HabitProgressBar` (màu theo lĩnh vực), `HabitDots` (heatmap 7/14/30 ngày), `StreakPill`, `getHabitCount`.
- `HabitCardStandard`, `HabitCardCompact`: giao diện mới, **props giữ nguyên**.
- `HabitsPage`: header "Thói quen", overview mới (desktop + mobile), card chi tiết & card mobile (vẫn swipe trái/phải), form thêm: tần suất dạng pill, stepper mục tiêu/ngày.
- `HabitAreaGroup`, `HabitDetailModal`: bo góc, tab pill, progress theo màu lĩnh vực.

## Không đổi
Lọc/sắp xếp/tìm kiếm, view mode (list/standard/compact) + nhóm theo lĩnh vực, templates, liên kết Goal, lịch sử (HabitHistoryManager), AI dự đoán, thử thách, cuộc đua, top streaks, lưu trữ, thùng rác, sync Supabase.

## Sửa lỗi
- Desktop: form "Thêm thói quen" trước đây không được render (`{AddHabitDialog}` chỉ có ở nhánh mobile) → đã thêm vào nhánh desktop.
