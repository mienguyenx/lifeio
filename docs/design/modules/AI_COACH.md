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
