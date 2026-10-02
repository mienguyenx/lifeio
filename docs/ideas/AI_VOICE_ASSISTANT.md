# AI Coach & Voice — đã làm và ý tưởng tiếp theo

## Đã có (v1)
- **Ra lệnh bằng lời (gõ hoặc nói)**: “nhắc tôi gọi mẹ 6h chiều mai”, “tạo thói quen uống 8 ly nước mỗi ngày”, “hôm nay tôi đã đi bộ”, “chi 50k ăn trưa”, “ghi nhật ký: hôm nay…”. Backend `/functions/ai-assistant` dùng function-calling → đề xuất hành động; frontend hiện thẻ xác nhận rồi lưu qua store đồng bộ (local-first).
  - Hành động: tạo task / hoàn thành task / tạo thói quen / check-in thói quen / tạo mục tiêu (kèm cột mốc) / nhật ký / ghi chú / thu-chi.
- **Voice Chat** rảnh tay (nghe → trả lời bằng giọng → nghe tiếp), nói “đồng ý / hủy” để xác nhận, tuỳ chọn “tự lưu”. Mở từ AI Coach, header (Alt+V), Quick Add trên mobile.
- **Micro trong ô chat** (đọc chính tả), nút **Đọc to** cho từng câu trả lời.
- Nhận dạng: Web Speech API (Chrome/Edge/Safari), fallback ghi âm → WAV → `/functions/ai-transcribe` (Gemini) cho Firefox/PWA.
- AI dùng key trong env hoặc **key admin lưu ở Admin → API Keys** (không cần deploy lại).

## Ý tưởng tiếp theo (ưu tiên từ cao → thấp)
1. **Kế hoạch ngày bằng giọng nói** — “Lên kế hoạch hôm nay”: AI đọc task/lịch/thói quen, đề xuất time-block, xác nhận → tạo khung giờ trong Lịch.
2. **Check-in buổi sáng/tối** (2 phút): AI hỏi tâm trạng, năng lượng, 3 ưu tiên / điều biết ơn → tự tạo nhật ký + task. Gắn với nhắc nhở thông báo.
3. **Sửa/xoá bằng lời**: “dời việc gọi mẹ sang thứ 6”, “xoá task mua sữa”, “đổi giờ nhắc uống nước 9h” (thêm tool update_task, reschedule, delete có xác nhận).
4. **Hỏi dữ liệu của chính mình**: “tuần này tôi chi bao nhiêu cho ăn uống?”, “thói quen nào tôi hay bỏ?” — tool đọc dữ liệu (query_finance, habit_stats) thay vì chỉ gửi tóm tắt.
5. **Ghi nhớ lâu dài (AI Memory)** — tự trích xuất sở thích/mục tiêu từ hội thoại vào `ai_memories` (đã có bảng + trang quản lý), đưa vào prompt.
6. **Phân tích ảnh/tệp**: chụp hoá đơn → khoản chi; chụp trang sách → ghi chú; ảnh bữa ăn → log sức khoẻ (Gemini vision, `image_url`).
7. **Giọng đọc tự nhiên hơn**: TTS phía server (Gemini TTS / OpenAI tts) khi giọng vi-VN của trình duyệt kém; streaming đọc theo câu.
8. **Hội thoại thời gian thực** (Gemini Live / OpenAI Realtime qua WebSocket) — ngắt lời, độ trễ thấp.
9. **Lệnh nhanh không cần AI** (offline): bộ phân tích luật đơn giản cho “thêm task …”, “uống nước” khi mất mạng; đồng bộ sau.
10. **Telegram/phím tắt hệ thống**: gửi voice note tới bot Telegram (đã có cấu hình Telegram) → tạo task; Siri Shortcut/PWA share target.
11. **Coach chủ động**: thông báo gợi ý theo ngữ cảnh (thói quen sắp đứt chuỗi, task quá hạn, ngân sách vượt) + mở Voice Chat từ thông báo.
12. **Báo cáo tuần bằng giọng nói** — AI tóm tắt Weekly Review và hỏi 3 câu phản tư, lưu vào `weekly_reviews`.

## Lưu ý kỹ thuật
- iOS Safari: nhận dạng giọng nói cần HTTPS + quyền micro; PWA standalone có thể chặn → fallback ghi âm.
- Mọi lệnh ghi dữ liệu đều qua thẻ xác nhận (trừ khi bật “tự lưu”), AI không ghi thẳng DB.
- Giới hạn: ghi âm fallback tối đa 60 giây; body tối đa 8 MB.

## Giọng nói AI — ElevenLabs & Fish Audio (xoay vòng nhiều key)

- Admin → API Keys: thêm nhiều key provider `elevenlabs` / `fish_audio` (tùy chọn Voice ID / model riêng cho từng key).
- Admin → AI → **Giọng nói AI** (`/admin/ai/voice`): thứ tự xoay vòng (key kế tiếp), trạng thái từng key (sẵn sàng / tạm nghỉ / hết hạn mức), hạn mức ký tự ElevenLabs & tín dụng Fish Audio (nút “Kiểm tra hạn mức”), gỡ tạm nghỉ, nghe thử theo luồng xoay vòng hoặc từng key, cấu hình provider TTS/STT, chiến lược (xoay vòng đều / ưu tiên key chính / ít dùng nhất), giọng & model mặc định.
- Backend `lib/voiceGateway.ts`: `POST /functions/tts` (mp3), `GET /functions/voice/status`, admin `GET /functions/voice/pool`, `PUT /functions/voice/settings`, `POST /functions/voice/check|reset`. `ai-transcribe` ưu tiên ElevenLabs Scribe / Fish ASR rồi mới đến Gemini.
- Lỗi được phân loại: key sai → nghỉ 24h; hết hạn mức/tín dụng → 6h; 429 → N phút (cấu hình); lỗi máy chủ → 30s; luôn thử key kế tiếp rồi provider còn lại; hết key thì frontend đọc bằng giọng trình duyệt.
