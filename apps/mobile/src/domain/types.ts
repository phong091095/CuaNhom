/**
 * Thực thể dữ liệu người dùng (SRS 5.1) ở dạng app dùng (camelCase).
 * Kết quả tính (cắt, vật tư, giá) KHÔNG lưu ở đây – luôn tính lại bằng engine (SRS 5.2).
 */
import type { CutSettings, MaterialGroup } from '@matadoor/engine';
import type { GroupFactors, MaterialRecord } from '@matadoor/data';

export type ProjectStatus = 'bao_gia' | 'dat_coc' | 'gia_cong' | 'da_lap';

/** FR-PRJ-04. */
export const PROJECT_STATUSES: readonly ProjectStatus[] = ['bao_gia', 'dat_coc', 'gia_cong', 'da_lap'];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  bao_gia: 'Báo giá',
  dat_coc: 'Đã cọc',
  gia_cong: 'Đang gia công',
  da_lap: 'Đã lắp',
};

/** Huy hiệu trạng thái: luôn icon + chữ (không dùng màu cảnh báo cho trạng thái thường). */
export const PROJECT_STATUS_BADGE: Record<ProjectStatus, { tone: 'primary' | 'info' | 'neutral' | 'success'; icon: 'quote' | 'tag' | 'cut' | 'checkCircle' }> = {
  bao_gia: { tone: 'primary', icon: 'quote' },
  dat_coc: { tone: 'info', icon: 'tag' },
  gia_cong: { tone: 'neutral', icon: 'cut' },
  da_lap: { tone: 'success', icon: 'checkCircle' },
};

export interface Workshop {
  name: string;
  phone: string;
  address: string;
  /** Ảnh logo dạng data URI (đã thu nhỏ ≤ 512 px) – nằm luôn trong file sao lưu. */
  logo: string | null;
  /** Ghi chú báo giá mẫu (FR-QUO-06). */
  quoteNote: string;
  vatEnabled: boolean;
  /** Thuế suất 0..1. */
  vatRate: number;
  /** Tham số cắt mặc định cho dự án mới (FR-SET-02). */
  defaultCut: CutSettings;
  /** Hệ số lợi nhuận theo nhóm vật tư (FR-MAT-02, Q1). */
  factors: GroupFactors;
  updatedAt: number;
}

export interface Project {
  id: string;
  /** Tên công trình – bắt buộc (FR-PRJ-01). */
  name: string;
  customer: string;
  phone: string;
  address: string;
  status: ProjectStatus;
  /** Tham số cắt riêng của dự án (FR-CUT-02). */
  cut: CutSettings;
  /** Đơn giá OP2 đã chốt (đ/m²); null = dùng giá gợi ý. */
  op2Price: number | null;
  note: string;
  isSample: boolean;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
}

export interface ProjectListItem extends Project {
  /** Số dòng bộ cửa (loại). */
  doorCount: number;
  /** Tổng số bộ. */
  setCount: number;
}

export interface ProjectInput {
  name: string;
  customer?: string;
  phone?: string;
  address?: string;
  note?: string;
}

export interface DoorItem {
  id: string;
  projectId: string;
  /** Ký hiệu: D1, S2… (FR-DOR-02). */
  symbol: string;
  templateId: string;
  /** Phiên bản mẫu lúc tạo/cập nhật – bộ cửa tính theo đúng phiên bản này (SRS 5.2). */
  templateVersion: number;
  W: number;
  H: number;
  qty: number;
  params: Record<string, number>;
  glass: Record<string, string>;
  /** Màu nhôm (FR-DOR-05). */
  color: string | null;
  /** Vị trí lắp (FR-DOR-08). */
  location: string | null;
  note: string | null;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
}

export interface DoorInput {
  symbol: string;
  templateId: string;
  templateVersion: number;
  W: number;
  H: number;
  qty: number;
  params?: Record<string, number>;
  glass?: Record<string, string>;
  color?: string | null;
  location?: string | null;
  note?: string | null;
}

export type MaterialOrigin = 'bundled' | 'user';

/** Vật tư trong bảng giá của xưởng (gói kèm + kính xưởng tự thêm). */
export interface MaterialRow extends MaterialRecord {
  origin: MaterialOrigin;
  /** Người dùng đã sửa giá (gói dữ liệu mới không ghi đè). */
  priceEdited: boolean;
  /** Ẩn khỏi ô chọn (SRS 5.2: không xóa vật tư mẫu đang dùng, chỉ sửa giá hoặc ẩn). */
  hidden: boolean;
  updatedAt: number;
}

export type QuoteMode = 'op1' | 'op2';
export type QuoteAudience = 'khach' | 'noi_bo';

/** Báo giá đã xuất: bản chụp không đổi theo bảng giá mới (FR-MAT-03). */
export interface StoredQuote {
  id: string;
  projectId: string;
  /** BG-YYMM-NNN. */
  number: string;
  mode: QuoteMode;
  audience: QuoteAudience;
  total: number;
  /** Bản chụp QuoteDoc (định nghĩa ở GĐ 9); lưu dạng JSON. */
  doc: unknown;
  fileName: string | null;
  createdAt: number;
}

export interface TrashItem {
  kind: 'project' | 'door';
  id: string;
  /** Tên hiện: tên dự án hoặc "D1 · tên dự án". */
  title: string;
  projectId: string;
  deletedAt: number;
  /** Ngày sẽ tự xóa hẳn. */
  purgeAt: number;
}

export type { MaterialGroup };
