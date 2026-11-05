/** Store thông tin xưởng và mặc định (Cài đặt) – Zustand. */
import { create } from 'zustand';
import { getDb } from '@/db/client';
import { getWorkshop, updateWorkshop, type WorkshopPatch } from '@/db/repos/workshop';
import type { Workshop } from '@/domain/types';

interface WorkshopState {
  workshop: Workshop | null;
  load: () => Promise<void>;
  save: (patch: WorkshopPatch) => Promise<Workshop>;
}

export const useWorkshop = create<WorkshopState>((set) => ({
  workshop: null,
  load: async () => {
    set({ workshop: await getWorkshop(await getDb()) });
  },
  save: async (patch) => {
    const w = await updateWorkshop(await getDb(), patch);
    set({ workshop: w });
    return w;
  },
}));
