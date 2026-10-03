/**
 * Thu nhỏ & nén ảnh người dùng chọn (JPEG) trước khi lưu dạng data URL,
 * tránh lưu ảnh gốc vài MB làm chậm đồng bộ.
 */
export function compressImage(file: File, max = 1280, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) { reject(new Error('Tệp không phải ảnh')); return; }
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale); const h = Math.round(img.height * scale);
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); // PNG trong suốt → nền trắng
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(img.src);
      resolve(c.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => { URL.revokeObjectURL(img.src); reject(new Error('Không đọc được ảnh')); };
    img.src = URL.createObjectURL(file);
  });
}
