/**
 * Số lần dữ liệu đổi từ nơi khác màn đang hiện (ví dụ bấm Hoàn tác ở snackbar sau khi đã rời màn chi tiết cửa).
 * Màn đang mở theo dõi số này để tự tải lại.
 */
import { create } from 'zustand';

export const useDataRevision = create<{ rev: number; bump: () => void }>((set) => ({
  rev: 0,
  bump: () => set((s) => ({ rev: s.rev + 1 })),
}));
