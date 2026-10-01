# Module 10 — Tài chính (Finance)

Tham chiếu: `docs/design/references/finance-ref-1.webp`. Code: `frontend/src/features/finance/`. Trang cũ: `/finance/classic` (`pages/FinancePageLegacy.tsx`).

## Cấu trúc
- `PageHeader` “Tài chính” + `ModuleHelpButton` · `SearchToggle` (tìm giao dịch → tự chuyển tab Giao dịch) · “Thêm giao dịch” (desktop) / `Fab` (mobile) · `?add`.
- `SegmentedTabs`: **Tổng quan | Giao dịch | Xu hướng | Liên kết**.
- Tổng quan: `HeroBanner` (mascot **lumi**) + `PeriodNav` theo tháng → 4 `StatTile` (Tổng thu nhập, Tổng chi tiêu — kèm % so với tháng trước, Số dư, Tỷ lệ tiết kiệm/mục tiêu 20%) → `CashflowChart` (`GroupedBars` thu/chi theo tuần) + `CategoryBreakdown` (`Donut`) → Giao dịch gần đây (`TxRow`). Cột phải xl: `FinanceSidePanel` (MascotCard, Chi nhanh, InsightCard, Mục tiêu tài chính, Mẹo).
- Giao dịch: `TransactionList` — `FilterChips` Tất cả/Thu nhập/Chi tiêu + chọn danh mục, nhóm theo ngày (tổng ròng/ngày), menu Sửa/Xóa (`AlertDialog`).
- Xu hướng: `FinanceTrends` (`TrendArea` 6/12 tháng: Chi tiêu/Thu nhập/Số dư + `StatStrip`), `CategoryBreakdown` có thanh %, `CashflowChart`.
- Liên kết: `AreaDashboardSection area="finance"`.
- Form: `TransactionModal` (Chi tiêu | Thu nhập, số tiền, lưới danh mục, mô tả, ngày; Hủy | Lưu).

## Dữ liệu
- `financeTransactions` (store) + `useFinanceSync` (saveTransaction/updateTransaction/deleteTransaction); danh mục, màu, mẹo, preset chi nhanh giữ nguyên trang cũ. Bổ sung: chọn/sửa **ngày** giao dịch (trường `date` vốn có).
- Mục tiêu tài chính: `goals` có `area === 'finance'` (trang cũ gọi là “Ngân sách”).
- AI Insights: quy tắc tại chỗ (`financeInsights()`): tỷ lệ tiết kiệm so 20%, danh mục chi nhiều nhất, chi tiêu tăng/giảm so với tháng trước.

## Không làm
Ngân sách theo danh mục (budget), tài khoản/ví & số dư từng ví, giao dịch định kỳ, đầu tư/danh mục tài sản, nợ/khoản vay, đa tiền tệ & cài đặt tiền tệ, xuất CSV/báo cáo, nhắc thanh toán hóa đơn.
