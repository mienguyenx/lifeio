# Module 05 — Goals (UI v3)

Trang Mục tiêu dựng lại theo `references/goals-ref-1.webp`, dùng LIO UI Kit. Dữ liệu & tính năng lấy từ trang cũ (`pages/GoalsPageLegacy.tsx`, còn ở `/goals/classic`).

## Cấu trúc
```
src/features/goals/
  GoalsPage.tsx                # Header (tìm, Lịch sử, Thêm) · Tổng quan|Thống kê · 4 StatTile · chip trạng thái · lọc lĩnh vực/hạn/sắp xếp · danh sách · cột phải
  hooks/useGoals.ts            # CRUD, hoàn thành/mở lại, tạm dừng, focus, mốc, cập nhật (qua useSyncedStore)
  utils/goal.utils.ts          # tab, hạn, sắp xếp, nhãn hạn, tính tiến độ, chuỗi cập nhật
  components/GoalRow.tsx       # Hàng mục tiêu: lĩnh vực, ⭐ mục tiêu lớn, 🔒 phụ thuộc, tiến độ, hạn, menu
  components/GoalCreateModal.tsx  # Mẫu (admin templates), tên, mô tả, lĩnh vực, ngày, nhắc trước hạn, ưu tiên, mục tiêu lớn, mốc ban đầu
  components/GoalDetailModal.tsx  # Lộ trình (mốc) · Liên kết (task/habit) · Thống kê · Tầm nhìn · Khác (phụ thuộc, cộng tác, chia sẻ)
  components/GoalInsights.tsx  # 30/90/365 ngày: tiến độ TB theo progressHistory, phân bổ lĩnh vực + các thẻ phân tích cũ
  components/GoalSidePanel.tsx # Lumi + tiến độ tổng thể + lọc theo lĩnh vực
```

## Không làm (repo chưa có dữ liệu/tính năng)
- Ngày bắt đầu tùy chọn riêng (dùng `createdAt`), file đính kèm, bình luận.
