# Module 08 — Insights / Analytics (UI v3)

Route `/dashboard` (sidebar “Tổng quan”). Theo `references/insights-ref-1.webp`. Trang cũ: `/dashboard/classic`.

## Cấu trúc
```
src/features/insights/
  InsightsPage.tsx               # Header (Phân tích AI) · Hero Ori · 4 StatTile · Tiến độ tuần · Xu hướng · Lĩnh vực · Giờ tập trung · Review · Mục tiêu/Hoạt động/Sắp tới · cột phải AI Insights
  hooks/useInsights.ts           # Chuỗi 90 ngày: việc xong, thói quen, phút focus (pomodoro work), tâm trạng, nhật ký, cập nhật mục tiêu
  components/InsightCharts.tsx   # WeeklyProgress, TrendsCard (6 chỉ số × 7/30/90 ngày), LifeAreasCard, ProductiveHours
```

## Dùng lại
`LifeWheelMiniChart`, `AIImprovementSuggestions`, `DashboardAICoach` (mở bằng “Phân tích AI” — trước đây bị ẩn), `DashboardGoalsProgress`, `DashboardRecentActivity`, `DashboardUpcoming`, `Weekly/Monthly/YearlyReviewReminder`.

## Không làm
- Ma trận tương quan Habit → Goal, “Productivity %” tổng hợp, so sánh lĩnh vực theo kỳ, phân tích chi tiết Health — repo chưa có dữ liệu/logic.
