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

---
## Cập nhật Module 15 — AI Insights (tham chiếu `references/ai-insights-ref-2.webp`)
- Thêm tabs `Tổng quan | Xu hướng | Lĩnh vực | Cải thiện` dưới PageHeader (trước đây một trang dài, không tabs).
- **Tổng quan:** Hero + **Điểm tổng thể /100** (trung bình Life Wheel ×10) + 4 StatTile + Tiến độ tuần + nhắc Review + Mục tiêu/Hoạt động/Sắp tới; side panel AI đề xuất cải thiện + Chat với AI Coach.
- **Xu hướng:** TrendsCard (6 chỉ số, 7/30/90 ngày) + Tiến độ tuần + Giờ tập trung hiệu quả.
- **Lĩnh vực:** LifeAreasCard (radar) + lưới thẻ điểm 10 lĩnh vực (/100, ↑↓ so với lần chấm trước).
- **Cải thiện:** 3 lĩnh vực thấp nhất + chỉ số tuần giảm (việc, thói quen, nhật ký, mục tiêu chậm) + AIImprovementSuggestions.
- Sửa: biểu đồ Tiến độ tuần bị cao 0 khi đứng riêng (ResponsiveContainer trong flex) → chiều cao cố định 240px.
- **Không làm:** tab Thành tựu/Dự đoán, “Mối tương quan thú vị”, cài đặt AI Coach trong trang — chưa có dữ liệu/logic.
