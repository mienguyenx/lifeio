# ✅ Đã sửa lỗi Google Drive

## 🔧 Các vấn đề đã được sửa

### 1. ✅ Token không được lưu trữ (Mất kết nối sau refresh)

**Vấn đề**: Token chỉ được lưu trong memory, khi refresh trang thì mất.

**Giải pháp**:
- ✅ Lưu token vào `localStorage` với key `google_drive_access_token`
- ✅ Lưu expiry time vào `localStorage` với key `google_drive_token_expiry`
- ✅ Tự động load token từ storage khi khởi động
- ✅ Kiểm tra expiry và tự động xóa token hết hạn
- ✅ Token được restore khi gọi `isSignedIn()` hoặc `getAccessToken()`

**Code changes**:
```typescript
// Lưu token
function saveTokenToStorage(token: string, expiresIn?: number): void {
  localStorage.setItem(STORAGE_KEY, token);
  const expiry = Date.now() + (expiresIn ? expiresIn * 1000 : 3600 * 1000);
  localStorage.setItem(STORAGE_EXPIRY_KEY, expiry.toString());
}

// Load token
function loadTokenFromStorage(): string | null {
  const token = localStorage.getItem(STORAGE_KEY);
  const expiry = localStorage.getItem(STORAGE_EXPIRY_KEY);
  if (token && expiry && Date.now() < parseInt(expiry, 10) - 5 * 60 * 1000) {
    return token;
  }
  return null;
}
```

### 2. ✅ Lỗi `origins don't match`

**Vấn đề**: Lỗi `origins don't match https://accounts.google.com https://life.hoanong.com` do FedCM configuration.

**Giải pháp**:
- ✅ Tắt `use_fedcm_for_prompt` tạm thời để tránh lỗi origins mismatch
- ✅ OAuth flow không cần `id.initialize()` nên có thể bỏ qua nếu gây lỗi
- ✅ Vẫn giữ code để có thể bật lại FedCM sau khi Google Cloud Console được cấu hình đúng

**Code changes**:
```typescript
// Không sử dụng FedCM để tránh lỗi origins mismatch
window.google.accounts.id.initialize({
  client_id: GOOGLE_CLIENT_ID,
  // use_fedcm_for_prompt: true, // Tắt tạm thời
});
```

## 📝 Cần làm tiếp

### Cấu hình Google Cloud Console

Để hoàn toàn fix lỗi `origins don't match`, bạn cần:

1. **Vào Google Cloud Console**:
   - [Google Cloud Console](https://console.cloud.google.com)
   - APIs & Services → Credentials

2. **Mở OAuth 2.0 Client ID**:
   - Client ID: `977885052084-qveo8i7crckfrrg2br5kv4c3cet9o71e.apps.googleusercontent.com`

3. **Thêm Authorized JavaScript origins**:
   ```
   https://life.hoanong.com
   ```

4. **Thêm Authorized redirect URIs**:
   ```
   https://life.hoanong.com
   ```

5. **Save và đợi 2-3 phút**

## ✅ Kết quả

Sau khi rebuild:
- ✅ Token được lưu vào localStorage
- ✅ Token được restore sau khi refresh trang
- ✅ Kết nối Google Drive được giữ nguyên sau refresh
- ✅ Token tự động expire sau 1 giờ (hoặc theo expiry từ Google)
- ✅ Lỗi origins don't match được giảm thiểu (cần cấu hình Google Cloud Console để fix hoàn toàn)

## 🧪 Test

1. **Kết nối Google Drive**:
   - Vào Admin Panel → Backup
   - Click "Kết nối Google Drive"
   - Chọn tài khoản và cấp quyền

2. **Kiểm tra token được lưu**:
   - Mở DevTools → Application → Local Storage
   - Kiểm tra có key `google_drive_access_token` và `google_drive_token_expiry`

3. **Test refresh**:
   - Refresh trang (F5)
   - Kiểm tra vẫn hiển thị "Đã kết nối"
   - Console không còn lỗi `origins don't match` (hoặc ít hơn)

4. **Test token expiry**:
   - Đợi 1 giờ hoặc manually set expiry time trong localStorage về quá khứ
   - Refresh trang
   - Token sẽ tự động bị xóa và yêu cầu đăng nhập lại

