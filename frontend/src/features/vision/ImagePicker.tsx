import { useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { compressImage } from '@/lib/imageCompress';

/** Chọn nhiều ảnh (nén JPEG trước khi lưu). Ảnh đầu tiên là ảnh bìa. */
export function ImagePicker({ value, onChange, max = 4, label = 'Thêm ảnh' }: { value: string[]; onChange: (v: string[]) => void; max?: number; label?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'));
    if (ref.current) ref.current.value = '';
    const room = max - value.length;
    if (!files.length) return;
    if (room <= 0) { toast.error(`Tối đa ${max} ảnh`); return; }
    setBusy(true);
    try {
      const urls = await Promise.all(files.slice(0, room).map((f) => compressImage(f, 1280, 0.8)));
      onChange([...value, ...urls].slice(0, max));
      if (files.length > room) toast.message(`Chỉ thêm ${room} ảnh (tối đa ${max})`);
    } catch { toast.error('Không đọc được ảnh'); } finally { setBusy(false); }
  };
  const makeCover = (i: number) => onChange([value[i], ...value.filter((_, j) => j !== i)]);
  return (
    <div>
      {value.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mb-2">
          {value.map((src, i) => (
            <div key={src.slice(-40) + i} className="relative aspect-square rounded-xl overflow-hidden bg-secondary">
              <button type="button" className="h-full w-full" onClick={() => i && makeCover(i)} title={i ? 'Đặt làm ảnh bìa' : 'Ảnh bìa'}>
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
              {i === 0 && <span className="absolute left-1 bottom-1 rounded-full bg-black/55 text-white text-[10px] font-semibold px-1.5 py-0.5 pointer-events-none">Ảnh bìa</span>}
              <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="absolute right-1 top-1 h-6 w-6 grid place-items-center rounded-full bg-black/50 text-white" aria-label="Xóa ảnh"><X className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
      )}
      <input ref={ref} type="file" accept="image/*" multiple className="hidden" onChange={pick} />
      <Button type="button" variant="outline" className="h-10 rounded-full gap-1.5" disabled={busy || value.length >= max} onClick={() => ref.current?.click()}>
        <ImagePlus className="h-4 w-4" />{busy ? 'Đang xử lý…' : value.length ? `${label} (${value.length}/${max})` : label}
      </Button>
    </div>
  );
}

/** Ảnh có thể bấm để phóng to. */
export function Lightbox({ src, onClose }: { src: string | null; onClose: () => void }) {
  if (!src) return null;
  return (
    <button type="button" onClick={onClose} className="fixed inset-0 z-[100] bg-black/85 grid place-items-center p-4" aria-label="Đóng ảnh">
      <img src={src} alt="" className="max-h-full max-w-full rounded-xl object-contain" />
    </button>
  );
}
