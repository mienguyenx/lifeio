Perplexity API (pplx-api và Sonar API) hỗ trợ các mô hình chính từ dòng Sonar (tối ưu cho search realtime và reasoning) cùng một số mô hình open-source khác khi gọi từ server.[1][2][3]

## Mô Hình Sonar Chính
Những mô hình này có tích hợp web search tự động, phù hợp cho chat completions và grounded answers:
- **sonar-pro**: Flagship model cho query phức tạp, context 200k tokens.[3][1]
- **sonar**: Base model cho general queries, context 128k tokens.[2][1]
- **sonar-small** / **sonar-medium** / **sonar-small-online**: Phiên bản nhẹ, nhanh cho task đơn giản.[2]
- **sonar-reasoning** / **sonar-reasoning-pro**: Chuyên reasoning và logic.[1][3]
- **sonar-deep-research**: Cho nghiên cứu sâu.[3]

## Mô Hình Khác
- **pplx-7b-online**, **pplx-70b-online**: Nhỏ/lớn với internet access.[2]
- **pplx-7b-chat**, **pplx-70b-chat**: Conversational không search.[2]
- **mistral-7b-instruct**, **llama-2-70b-chat**, **codellama-34b**: Open-source cho chat/code.[4]