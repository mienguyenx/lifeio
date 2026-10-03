import { create } from 'zustand';

/** Hành động "thêm" chính của trang hiện tại — nút ＋ giữa thanh điều hướng mobile sẽ ưu tiên hiện nó. */
export interface PageAction { label: string; onClick: () => void }
export const usePageAction = create<{ action: PageAction | null; set: (a: PageAction | null) => void }>((set) => ({
  action: null,
  set: (action) => set({ action }),
}));
