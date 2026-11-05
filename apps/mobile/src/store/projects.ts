/**
 * Store danh sách dự án (B1) – Zustand. Màn hình đọc từ đây; mọi ghi đi qua repository rồi tải lại.
 */
import { create } from 'zustand';
import { getDb } from '@/db/client';
import { createProject, listProjects, restoreProject, softDeleteProject, duplicateProject } from '@/db/repos/projects';
import { logEvent } from '@/db/repos/events';
import { computeProjectTotals, type ProjectTotals } from '@/domain/projectCalc';
import type { Project, ProjectInput, ProjectListItem } from '@/domain/types';

interface ProjectsState {
  items: ProjectListItem[];
  /** Tổng (OP1, giá vốn, m²) từng dự án – tính sau khi có danh sách. */
  totals: Record<string, ProjectTotals>;
  query: string;
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  setQuery: (q: string) => Promise<void>;
  create: (input: ProjectInput) => Promise<Project>;
  /** Xóa mềm; trả về hàm hoàn tác (dùng cho snackbar 10 giây). */
  remove: (id: string) => Promise<() => Promise<void>>;
  duplicate: (id: string) => Promise<Project>;
}

export const useProjects = create<ProjectsState>((set, get) => ({
  items: [],
  totals: {},
  query: '',
  loading: false,
  error: null,
  load: async () => {
    set({ loading: true, error: null });
    try {
      const db = await getDb();
      const items = await listProjects(db, get().query);
      set({ items, loading: false });
      const totals = await computeProjectTotals(db, items.map((p) => p.id));
      set({ totals: { ...get().totals, ...Object.fromEntries(totals) } });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : String(e) });
    }
  },
  setQuery: async (q) => {
    set({ query: q });
    await get().load();
  },
  create: async (input) => {
    const db = await getDb();
    const p = await createProject(db, input);
    await logEvent(db, 'project_created', { projectId: p.id });
    await get().load();
    return p;
  },
  remove: async (id) => {
    const db = await getDb();
    await softDeleteProject(db, id);
    await get().load();
    return async () => {
      await restoreProject(await getDb(), id);
      await get().load();
    };
  },
  duplicate: async (id) => {
    const db = await getDb();
    const p = await duplicateProject(db, id);
    await get().load();
    return p;
  },
}));
