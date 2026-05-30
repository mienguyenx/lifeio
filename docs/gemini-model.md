Tính đến tháng 12 năm 2025, Google đã cập nhật danh mục mô hình Gemini trên API (thông qua Google AI Studio và Vertex AI) với các dòng từ 2.0 đến **Gemini 3** mới nhất.

Dưới đây là các nhóm mô hình chính mà bạn có thể sử dụng qua API:

### 1. Dòng Gemini 3 (Thế hệ mới nhất)

Đây là các mô hình tiên tiến nhất, tập trung vào khả năng đại lý (agentic), hiểu đa phương thức sâu sắc và suy luận phức tạp.

* **Gemini 3 Pro (`gemini-3-pro-preview`)**: Mô hình mạnh mẽ nhất hiện nay. Tối ưu cho các tác vụ lập trình phức tạp, suy luận đa bước và xử lý đa phương thức (văn bản, hình ảnh, video, âm thanh).
* **Gemini 3 Flash (`gemini-3-flash-preview`)**: Phiên bản cân bằng giữa tốc độ và trí thông minh, phù hợp cho các ứng dụng cần phản hồi nhanh nhưng vẫn yêu cầu khả năng xử lý của thế hệ thứ 3.

### 2. Dòng Gemini 2.5 (Ổn định & Hiệu quả)

Dòng này hiện là lựa chọn phổ biến nhất cho các sản phẩm thương mại nhờ sự ổn định và chi phí tối ưu.

* **Gemini 2.5 Pro (`gemini-2.5-pro`)**: Mô hình "thông minh" chủ lực, hỗ trợ cửa sổ ngữ cảnh lên tới **2 triệu token**. Đặc biệt mạnh về khả năng "Deep Think" (suy luận sâu).
* **Gemini 2.5 Flash (`gemini-2.5-flash`)**: Tốc độ cực nhanh, giá rẻ, phù hợp để xử lý dữ liệu lớn hoặc làm trợ lý hội thoại thời gian thực.
* **Gemini 2.5 Flash-Lite (`gemini-2.5-flash-lite`)**: Phiên bản siêu nhẹ, tối ưu hóa tối đa về chi phí và độ trễ cho các tác vụ đơn giản như phân loại văn bản hoặc tóm tắt ngắn.

---

### Bảng so sánh nhanh các Model API chính

| Model | Mã API chính | Điểm mạnh nhất | Ngữ cảnh (Context) |
| --- | --- | --- | --- |
| **Gemini 3 Pro** | `gemini-3-pro-preview` | Đa phương thức, lập trình, Agent | 1M - 2M tokens |
| **Gemini 3 Flash** | `gemini-3-flash-preview` | Tốc độ cao thế hệ mới | 1M tokens |
| **Gemini 2.5 Pro** | `gemini-2.5-pro` | Suy luận sâu (Reasoning), phân tích dữ liệu | 2M tokens |
| **Gemini 2.5 Flash** | `gemini-2.5-flash` | Đa năng, giá tốt, độ trễ thấp | 1M tokens |
| **Gemini 2.5 Flash-Lite** | `gemini-2.5-flash-lite` | Rẻ nhất, nhanh nhất cho tác vụ nhẹ | 1M tokens |

---

### 3. Các mô hình chuyên dụng khác

Ngoài các mô hình ngôn ngữ lớn (LLM), API còn cung cấp các model hỗ trợ:

* **Gemini 2.5 Flash Image (`gemini-2.5-flash-image`)**: Chuyên dụng để tạo và chỉnh sửa hình ảnh (dựa trên công nghệ Nano Banana).
* **Gemini 2.5 Flash TTS**: Mô hình chuyển văn bản thành giọng nói (Text-to-Speech) với độ trễ thấp.
* **Embeddings**: `text-embedding-005` hoặc `gemini-embedding-001` dùng cho các hệ thống tìm kiếm ngữ nghĩa (RAG).

**Lưu ý về phiên bản:**

* Các bản có đuôi `-preview` hoặc `-exp` thường là bản thử nghiệm mới nhất, có thể thay đổi nhanh chóng.
* Các bản có số hiệu cụ thể (ví dụ: `09-2025`) là các bản cố định (stable/pinned) giúp hệ thống của bạn hoạt động ổn định không bị ảnh hưởng bởi cập nhật model.
