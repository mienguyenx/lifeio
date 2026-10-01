# Module 07 — AI Coach (UI v3)

Theo `references/ai-ref-1.webp`, dùng LIO UI Kit. Trang cũ: `/ai-chat/classic`.

## Cấu trúc
```
src/features/ai-coach/
  AICoachPage.tsx              # Desktop 3 cột: Lịch sử | Chat | Bối cảnh (xl). Mobile: Trò chuyện|Lịch sử|Bối cảnh
  hooks/useCoach.ts            # Gửi + stream SSE tới functionUrl('ai-coach') (giữ logic cũ, toast 429/402), số liệu hôm nay, gợi ý
  utils/coach.utils.ts         # QUICK_PROMPTS (5 câu cũ), QUICK_ACTIONS (lối tắt prompt), readSSE, exportChatPdf (jsPDF như cũ)
  components/ChatHistory.tsx   # savedConversations: tìm, mở, xóa, “Mới”
  components/ChatThread.tsx    # Bong bóng chat (markdown), yêu thích, tạo ghi chú, sao chép
  components/Composer.tsx      # Ô nhập (Enter gửi, Shift+Enter xuống dòng) + chip hỏi tiếp
  components/CoachHome.tsx     # Màn chào Ori + lưới hành động nhanh + câu hỏi gợi ý
  components/ContextPanel.tsx  # Thông tin của bạn (mục tiêu, thói quen, việc, tâm trạng, Vision) + Gợi ý hôm nay
```

## Dữ liệu gửi cho AI
`userContext` như cũ (lifePurpose, visions, personalValues, lifeRoles, traits, 5 mục tiêu) **+ `dailyStats` và `lifeWheelScores`** — các trường backend `aiCoachPrompt.ts` đã hỗ trợ và `AICoachButton` đã dùng.

## Không làm
- Nhập giọng nói, “Tùy chỉnh AI” (phong cách trả lời), tự tạo task/kế hoạch từ câu trả lời — repo chưa có.
- Mascot dùng **Ori** (theo VISUAL_SPEC) thay cho thỏ trong ảnh mẫu.

---
## Cập nhật Module 15/16 — AI Coach (tham chiếu `references/ai-coach-ref-2.webp`)
- Khung thống nhất: PageHeader → tabs `Trò chuyện | Lịch sử | Phân tích` (desktop & mobile như nhau).
- **Trò chuyện (desktop):** HeroBanner “Xin chào” + hàng hành động nhanh (QUICK_ACTIONS = prompt soạn sẵn) + 3 cột: Cuộc trò chuyện đã lưu | Chat | Thông tin của bạn + Gợi ý hôm nay. Ô chat trống hiển thị lời chào + câu hỏi gợi ý. Mobile: hero nằm trong khung chat khi chưa có tin nhắn.
- **Phân tích:** 4 StatTile (Điểm cân bằng Life Wheel, Tiến độ mục tiêu, Thói quen hôm nay, Tâm trạng 7 ngày), Phân tích dữ liệu cuộc sống (điểm 10 lĩnh vực + nút hỏi cách cải thiện lĩnh vực thấp nhất), Kế hoạch được đề xuất (gợi ý thật → gửi prompt), Thống kê sử dụng (số cuộc trò chuyện đã lưu theo tuần, tổng tin nhắn, yêu thích).
- **Không làm:** templates hội thoại theo lĩnh vực/mục tiêu, thời gian sử dụng, đính kèm tệp/ghi âm, cài đặt giọng điệu ngay trong trang (đã có ở Onboarding/Cá nhân hóa).
