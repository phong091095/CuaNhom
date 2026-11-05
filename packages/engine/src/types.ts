/**
 * Kiểu dữ liệu của engine (SRS mục 4.1, 5.1).
 * Mẫu cửa và bảng giá là dữ liệu JSON; engine chỉ đọc, không chứa công thức riêng của mẫu nào.
 */

/** Biểu thức (chuỗi) hoặc hằng số. */
export type Expr = string | number;

export type MaterialGroup = 'nhom' | 'kinh' | 'phukien' | 'nhancong';

export const MATERIAL_GROUPS: readonly MaterialGroup[] = ['nhom', 'kinh', 'phukien', 'nhancong'];

export const MATERIAL_GROUP_LABELS: Record<MaterialGroup, string> = {
  nhom: 'Nhôm',
  kinh: 'Kính',
  phukien: 'Phụ kiện',
  nhancong: 'Nhân công',
};

/**
 * Vật tư đã có giá (giá gốc, giá bán) theo đơn vị tính của engine:
 * nhôm theo m dài, kính theo m², phụ kiện theo đơn vị của nó, nhân công theo m².
 */
export interface PricedMaterial {
  code: string;
  name: string;
  group: MaterialGroup;
  /** Đơn vị hiển thị: "m", "m²", "cái", "chai"… */
  unit: string;
  /** Nhôm: kg/m. */
  kgPerM?: number;
  /** Kính: tổng độ dày các lớp kính (mm), không tính khe khí (BR-07). */
  thicknessMm?: number;
  /** Giá gốc theo đơn vị tính. */
  costPrice: number;
  /** Giá bán theo đơn vị tính. */
  salePrice: number;
}

export type PriceBook = Readonly<Record<string, PricedMaterial>>;

export type TemplateGroup = 'cua-di' | 'cua-so' | 'vach';

export const TEMPLATE_GROUP_LABELS: Record<TemplateGroup, string> = {
  'cua-di': 'Cửa đi',
  'cua-so': 'Cửa sổ',
  vach: 'Vách',
};

export interface ParamOption {
  value: number;
  label: string;
}

export interface ParamDef {
  key: string;
  label: string;
  type: 'number' | 'choice';
  default: number;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: ParamOption[];
  hint?: string;
}

export interface ConstantDef {
  value: number;
  note?: string;
}

export interface DerivedDef {
  key: string;
  expr: Expr;
  label?: string;
  note?: string;
}

export interface ProfileRowDef {
  /** Vai trò thanh, dùng làm tên biến: <role>, <role>_qty, <role>_total. */
  role: string;
  label: string;
  /** Mã vật tư nhóm nhôm. */
  code: string;
  /** Chiều dài cắt (mm), làm tròn 0,1 mm. */
  length: Expr;
  /** Số thanh cho 1 bộ (số nguyên ≥ 0). */
  qty: Expr;
  /** Góc cắt hai đầu, ví dụ "45/45", "90/90". */
  angle?: string;
  /** Vị trí, ví dụ "Trên, dưới". */
  position?: string;
}

export interface GlassRowDef {
  /** Tiền tố biến: kinh → kinh_w, kinh_h, kinh_qty, kinh_area, kinh_weight. Mặc định "kinh". */
  key?: string;
  label: string;
  width: Expr;
  height: Expr;
  qty: Expr;
  /** Mã kính mặc định (nhóm kính). Người dùng đổi được (FR-DOR-04). */
  defaultCode: string;
}

export interface AccessoryRowDef {
  code: string;
  /** Số lượng cho 1 bộ, được phép là số lẻ (làm tròn lên sau khi nhân số bộ – BR-04). */
  qty: Expr;
  note?: string;
}

export interface LaborRowDef {
  code: string;
  /** Khối lượng nhân công cho 1 bộ, thường là `area` (m²) – BR-05, không làm tròn. */
  qty: Expr;
}

export type CheckLevel = 'error' | 'warning' | 'info';

export interface CheckDef {
  id: string;
  level: CheckLevel;
  /** Điều kiện; khác 0 là vi phạm. */
  when: Expr;
  /** Câu thông báo. Có thể chèn biến: "{canh_ngang}". */
  message: string;
  /** Ô nhập liên quan để hiện lỗi ngay dưới ô (W, H hoặc khóa tham số). */
  field?: string;
}

export interface DrawingSpec {
  kind: 'swing' | 'sliding' | 'fixed' | 'awning';
  /** Số cánh: số cố định hoặc tên tham số (ví dụ "soCanh"). */
  leaves?: number | string;
  /** Tham số chọn phía bản lề: 0 = bản lề trái, 1 = bản lề phải. */
  hingeParam?: string;
  /** Tham số chọn hướng mở: 0 = mở ra ngoài, 1 = mở vào trong. */
  openInParam?: string;
}

export interface DoorTemplate {
  id: string;
  /** Phiên bản dữ liệu mẫu; đổi công thức phải tăng (SRS 5.2). */
  version: number;
  /** verified: đã khớp đáp án mẫu; draft: chờ dữ liệu (không hiện ở bản phát hành). */
  status: 'verified' | 'draft';
  name: string;
  /** Hệ nhôm, ví dụ "xingfa55". */
  system: string;
  group: TemplateGroup;
  /** Tiền tố ký hiệu bộ cửa: D (cửa đi), S (cửa sổ), V (vách) – FR-DOR-02. */
  symbolPrefix: string;
  /** Nguồn dữ liệu, ví dụ "cửa_mẫu.xlsx, sheet G-AD2". */
  source?: string;
  order?: number;
  drawing: DrawingSpec;
  defaults: { W: number; H: number };
  params: ParamDef[];
  constants: Record<string, ConstantDef>;
  derived: DerivedDef[];
  profiles: ProfileRowDef[];
  glass: GlassRowDef[];
  accessories: AccessoryRowDef[];
  labor: LaborRowDef[];
  checks: CheckDef[];
}

/** Đầu vào một bộ cửa (DoorItem rút gọn cho engine). */
export interface DoorInput {
  /** Rộng (mm). */
  W: number;
  /** Cao (mm). */
  H: number;
  /** Số bộ (≥ 1). */
  qty: number;
  /** Giá trị tham số; thiếu thì lấy mặc định của mẫu. */
  params?: Record<string, number>;
  /** Mã kính theo từng ô kính (khóa = key của dòng kính). Thiếu thì lấy kính mặc định. */
  glass?: Record<string, string>;
}

// ---------------------------------------------------------------- kết quả

export interface ProfileLine {
  role: string;
  label: string;
  code: string;
  name: string;
  /** Chiều dài cắt 1 thanh (mm, 0,1). */
  length: number;
  qtyPerSet: number;
  /** Số thanh cho mọi bộ. */
  qty: number;
  angle?: string;
  position?: string;
  /** Tổng chiều dài (m) cho mọi bộ. */
  totalM: number;
  kg: number;
  cost: number;
  sale: number;
}

export interface GlassLine {
  key: string;
  label: string;
  code: string;
  name: string;
  width: number;
  height: number;
  qtyPerSet: number;
  qty: number;
  /** m² một tấm. */
  areaEach: number;
  /** m² mọi tấm. */
  area: number;
  /** kg một tấm (BR-07). */
  weightEach: number;
  cost: number;
  sale: number;
}

export interface AccessoryLine {
  code: string;
  name: string;
  unit: string;
  /** Số lẻ cho 1 bộ. */
  rawPerSet: number;
  /** Số lẻ cho mọi bộ (= rawPerSet × số bộ). */
  raw: number;
  /** Số lấy (làm tròn lên – BR-04). */
  qty: number;
  cost: number;
  sale: number;
  note?: string;
}

export interface LaborLine {
  code: string;
  name: string;
  unit: string;
  qtyPerSet: number;
  /** Khối lượng cho mọi bộ (không làm tròn – BR-05). */
  qty: number;
  cost: number;
  sale: number;
}

export interface CheckResult {
  id: string;
  level: CheckLevel;
  message: string;
  field?: string;
}

export interface MoneyByGroup {
  nhom: number;
  kinh: number;
  phukien: number;
  nhancong: number;
  total: number;
}

export interface DoorResult {
  /** Không có lỗi dữ liệu và không có kiểm tra mức Lỗi → được lưu (BR-11). */
  ok: boolean;
  /** Lỗi dữ liệu mẫu (biểu thức sai, thiếu vật tư…): phải sửa dữ liệu, không phải lỗi người dùng. */
  dataErrors: string[];
  checks: CheckResult[];
  /** Diện tích 1 bộ (m²). */
  areaPerSet: number;
  /** Diện tích tính giá = W × H / 1e6 × số bộ (BR-08). */
  area: number;
  qty: number;
  profiles: ProfileLine[];
  glass: GlassLine[];
  accessories: AccessoryLine[];
  labor: LaborLine[];
  /** Giá gốc cho mọi bộ, theo nhóm. */
  cost: MoneyByGroup;
  /** Giá bán cho mọi bộ, theo nhóm. */
  sale: MoneyByGroup;
  /** Lãi = giá bán − giá gốc (BR-09), cho mọi bộ. */
  profit: number;
  /** Giá bán 1 bộ (số thực). */
  salePerSet: number;
  /** Giá vốn 1 bộ (số thực). */
  costPerSet: number;
  /** Đơn giá bán / m² (BR-09). */
  salePerM2: number;
  /** Toàn bộ biến sau khi tính (để xem thông số, gỡ lỗi). */
  scope: Record<string, number>;
}
