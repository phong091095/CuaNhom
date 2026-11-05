import type { DoorTemplate, PriceBook } from '../src/types';

/** Bảng giá thử (không phải giá thật). */
export const BOOK: PriceBook = {
  KHUNG: { code: 'KHUNG', name: 'Khung', group: 'nhom', unit: 'm', kgPerM: 2, costPrice: 100_000, salePrice: 110_000 },
  CANH: { code: 'CANH', name: 'Cánh', group: 'nhom', unit: 'm', kgPerM: 1.5, costPrice: 50_000, salePrice: 55_000 },
  TG: { code: 'TG', name: 'Trung gian', group: 'nhom', unit: 'm', kgPerM: 1, costPrice: 40_000, salePrice: 44_000 },
  K5: { code: 'K5', name: 'Kính 5 ly', group: 'kinh', unit: 'm²', thicknessMm: 5, costPrice: 200_000, salePrice: 220_000 },
  K8: { code: 'K8', name: 'Kính 8 ly', group: 'kinh', unit: 'm²', thicknessMm: 8, costPrice: 300_000, salePrice: 330_000 },
  BANLE: { code: 'BANLE', name: 'Bản lề', group: 'phukien', unit: 'cái', costPrice: 30_000, salePrice: 33_000 },
  KEO: { code: 'KEO', name: 'Silicone', group: 'phukien', unit: 'chai', costPrice: 50_000, salePrice: 55_000 },
  NEM: { code: 'NEM', name: 'Nêm kính', group: 'phukien', unit: 'cái', costPrice: 1_000, salePrice: 1_100 },
  NC: { code: 'NC', name: 'Nhân công', group: 'nhancong', unit: 'm²', costPrice: 100_000, salePrice: 110_000 },
};

/** Mẫu thử nhỏ, đủ mọi loại dòng để kiểm thứ tự BR-01…BR-11. */
export function fixtureTemplate(): DoorTemplate {
  return {
    id: 'thu-cua',
    version: 1,
    status: 'verified',
    name: 'Cửa thử',
    system: 'thu',
    group: 'cua-di',
    symbolPrefix: 'D',
    drawing: { kind: 'swing', leaves: 'soCanh' },
    defaults: { W: 800, H: 2200 },
    params: [
      {
        key: 'soCanh',
        label: 'Số cánh',
        type: 'choice',
        default: 2,
        options: [
          { value: 2, label: '2 cánh' },
          { value: 4, label: '4 cánh' },
        ],
      },
      { key: 'khe', label: 'Khe hở chân', type: 'number', unit: 'mm', default: 10, min: 0, max: 30 },
    ],
    constants: { khung: { value: 36, note: 'Khung chiếm' } },
    derived: [{ key: 'soBanLe', expr: 'H > 2400 ? 4 : 3' }],
    profiles: [
      { role: 'khung_dung', label: 'Khung đứng', code: 'KHUNG', length: 'H', qty: 2, angle: '45/45' },
      { role: 'khung_ngang', label: 'Khung ngang', code: 'KHUNG', length: 'W', qty: 1, angle: '45/45', position: 'Trên' },
      { role: 'canh_dung', label: 'Cánh đứng', code: 'CANH', length: 'H - khung - 5 - khe', qty: 'soCanh * 2' },
      { role: 'canh_ngang', label: 'Cánh ngang', code: 'CANH', length: '(W - khung * 2) / soCanh', qty: 'soCanh * 2' },
      { role: 'trung_gian', label: 'Trung gian', code: 'TG', length: 'canh_dung', qty: 'soCanh == 4 ? 1 : 0' },
    ],
    glass: [
      { label: 'Kính cánh', width: 'canh_ngang - 100', height: 'canh_dung - 100.05', qty: 'soCanh', defaultCode: 'K5' },
    ],
    accessories: [
      { code: 'BANLE', qty: 'soBanLe' },
      { code: 'KEO', qty: '2 * (W + H) / 1000 * 0.48' },
      { code: 'NEM', qty: 'glass_perimeter_total / 1000' },
      { code: 'BANLE', qty: 0, note: 'dòng 0 phải bị bỏ qua' },
    ],
    labor: [{ code: 'NC', qty: 'area' }],
    checks: [
      { id: 'rong', level: 'error', when: 'W < 600 or W > 1200', message: 'Rộng nên trong khoảng 600–1200 mm', field: 'W' },
      { id: 'canh', level: 'warning', when: 'canh_ngang > 300', message: 'Cánh rộng {canh_ngang} mm' },
      { id: 'banle', level: 'info', when: 'soBanLe == 4', message: 'Dùng {soBanLe} bản lề' },
    ],
  };
}
