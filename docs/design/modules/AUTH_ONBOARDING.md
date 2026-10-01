# Module 17 — Auth / Login / Register / Onboarding

Tham chiếu: `references/auth-onboarding-ref-1.webp`. Trang mới: `features/auth/AuthPage.tsx` (`/auth`), bản cũ: `/auth/classic`.

## Đăng nhập / Đăng ký
- **Desktop:** thanh trên (logo, ThemeToggle, nút Đăng nhập) → banner chào mừng (Taro/go + 4 điểm nổi bật) → 3 cột: thẻ **Đăng nhập** | thẻ **Tạo tài khoản mới** | thẻ trích dẫn + 3 điểm nổi bật.
- **Mobile:** màn chào (logo, mascot, “Bắt đầu ngay” / “Tôi đã có tài khoản”) → thẻ Đăng nhập hoặc Đăng ký có nút quay lại.
- **Giữ nguyên logic:** `signIn`, `signUp(email, password, name)` + xác nhận mật khẩu + SimpleCaptcha, zod (email, ≥6 ký tự), Ghi nhớ đăng nhập (`localStorage.rememberedEmail`), Quên mật khẩu (`resetPassword`), Đặt lại mật khẩu (`?reset=true` → `supabase.auth.updateUser`), hiện/ẩn mật khẩu, toast tiếng Việt, tự chuyển về `/` khi đã đăng nhập. Đăng ký thành công → chuyển sang thẻ Đăng nhập (mobile).
- Input có `autoComplete` chuẩn (username/current-password/new-password) để trình quản lý mật khẩu hoạt động.
- **Không làm:** Đăng nhập Google/Apple (repo chưa có provider), đa ngôn ngữ, checkbox điều khoản dịch vụ.

## Onboarding (5 bước) — `components/onboarding/OnboardingWizard.tsx`
- Thẻ 560px bo 28px, thanh tiến độ + `n/5`, mascot theo bước, nút chính “Tiếp tục (n/5)”, nút quay lại tròn.
- Bước: Tên → Nhóm người dùng (7 archetype) → Phong cách coaching (giọng AI + cách lập kế hoạch) → Lịch trình (thức/ngủ) → Ưu tiên lĩnh vực (đánh số thứ tự) → **Hoàn thành!** (Mochi/celebrate, “Vào ứng dụng”).
- Dữ liệu không đổi: `setUser`, `saveOnboardingCompleted(prefs)` (lưu Supabase khi bấm Hoàn thành), `setUserPreferences(prefs)` khi bấm “Vào ứng dụng” (TodayPage ẩn wizard theo store nên phải cập nhật store sau màn Hoàn thành).
- Lớp phủ `z-[60]` để nằm trên BottomNav.
- **Không làm:** chọn mục tiêu ban đầu, đánh giá nhanh Life Areas, thiết lập thông báo trong onboarding.
