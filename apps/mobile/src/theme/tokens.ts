/**
 * Token thiết kế (docs/thiet-ke/HO_SO_BAN_GIAO.md – Handoff1).
 * Mọi màu trong app phải đi qua token; không viết mã màu trong màn hình.
 *
 * Lệch thiết kế: cỡ chữ nhỏ nhất 14 thay cho 13 (SRS NFR-USE-02: chữ ≥ 14 sp).
 */

export interface ColorTokens {
  bg: string;
  surface: string;
  surface2: string;
  text: string;
  text2: string;
  border: string;
  divider: string;
  primary: string;
  onPrimary: string;
  primarySoft: string;
  onPrimarySoft: string;
  accent: string;
  onAccent: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  error: string;
  onError: string;
  errorSoft: string;
  info: string;
  infoSoft: string;
  /** Ô kính trong bản vẽ cửa. */
  glass: string;
  /** Thẻ tổng nổi bật (báo giá ở chi tiết dự án). */
  hero: string;
  onHero: string;
  onHero2: string;
  /** Lớp mờ phía sau sheet, hộp thoại. */
  scrim: string;
  snack: string;
  onSnack: string;
  snackAction: string;
  snackOk: string;
}

export const LIGHT: ColorTokens = {
  bg: '#F3F6F7',
  surface: '#FFFFFF',
  surface2: '#E4EBEE',
  text: '#10212A',
  text2: '#4B5D66',
  border: '#77878F',
  divider: '#D8E0E4',
  primary: '#0B5C75',
  onPrimary: '#FFFFFF',
  primarySoft: '#DDEFF4',
  onPrimarySoft: '#073F51',
  accent: '#C2410C',
  onAccent: '#FFFFFF',
  success: '#1A6E39',
  successSoft: '#DDF3E4',
  warning: '#8F5500',
  warningSoft: '#FCEFD6',
  error: '#B42318',
  onError: '#FFFFFF',
  errorSoft: '#FDE5E3',
  info: '#5B3E96',
  infoSoft: '#EEE8F8',
  glass: '#CFE7EF',
  hero: '#0B5C75',
  onHero: '#FFFFFF',
  onHero2: '#CFE6EE',
  scrim: 'rgba(8,20,26,0.5)',
  snack: '#1B2B33',
  onSnack: '#FFFFFF',
  snackAction: '#8FD6E8',
  snackOk: '#7FDCA2',
};

export const DARK: ColorTokens = {
  bg: '#0B1317',
  surface: '#141F25',
  surface2: '#22323A',
  text: '#E6EDF0',
  text2: '#A3B3BB',
  border: '#71838C',
  divider: '#27363E',
  primary: '#6CC7DE',
  onPrimary: '#032733',
  primarySoft: '#12384A',
  onPrimarySoft: '#BFE8F3',
  accent: '#FF8F5A',
  onAccent: '#2A0E00',
  success: '#62C98A',
  successSoft: '#123524',
  warning: '#F0B54A',
  warningSoft: '#3A2A0B',
  error: '#FF8C82',
  onError: '#2B0704',
  errorSoft: '#3D1512',
  info: '#CDB8F2',
  infoSoft: '#2A2140',
  glass: '#1E4656',
  hero: '#12384A',
  onHero: '#FFFFFF',
  onHero2: '#BFE8F3',
  scrim: 'rgba(0,0,0,0.62)',
  snack: '#E6EDF0',
  onSnack: '#10212A',
  snackAction: '#0B5C75',
  snackOk: '#1A6E39',
};

/** Khoảng cách 4/8 (pt). Lề màn hình 16 · giữa các thẻ 12 · giữa các nhóm 24. */
export const SPACE = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 24, xl: 32, xxl: 48 } as const;

/** Bo góc. */
export const RADIUS = { chip: 8, input: 12, card: 16, button: 14, sheet: 20, pill: 999 } as const;

/** Kích thước chuẩn (pt). */
export const SIZE = {
  /** Nút chính, ô nhập. */
  control: 52,
  /** Vùng chạm tối thiểu (SRS NFR-USE-02: ≥ 48 dp). */
  touch: 48,
  /** Chip lọc. */
  chip: 48,
  /** Segmented. */
  segmented: 56,
  /** Thanh tab (chưa tính vùng an toàn dưới). */
  tabBar: 64,
  /** Khoảng đệm cuối danh sách khi có thanh nút cố định: một nút 52 + 16. */
  bottomBarPad: 68,
  /** Hai nút xếp dọc. */
  bottomBarPad2: 84,
  /** Bề ngang tối đa của nội dung trên máy tính bảng. */
  maxContent: 720,
} as const;

export type TextVariant =
  | 'display'
  | 'title'
  | 'dialogTitle'
  | 'section'
  | 'header'
  | 'body'
  | 'bodyStrong'
  | 'label'
  | 'caption'
  | 'captionStrong';

export type FontWeight = 'regular' | 'medium' | 'semibold' | 'bold';

export interface TextStyleToken {
  fontSize: number;
  lineHeight: number;
  weight: FontWeight;
  tabular?: boolean;
}

/** Thang chữ. Chiều cao dòng ≥ 1,3 lần cỡ chữ để dấu tiếng Việt không chạm dòng trên. */
export const TYPE: Record<TextVariant, TextStyleToken> = {
  display: { fontSize: 32, lineHeight: 40, weight: 'bold', tabular: true },
  title: { fontSize: 28, lineHeight: 38, weight: 'bold' },
  dialogTitle: { fontSize: 20, lineHeight: 28, weight: 'bold' },
  section: { fontSize: 18, lineHeight: 26, weight: 'semibold' },
  header: { fontSize: 17, lineHeight: 24, weight: 'bold' },
  body: { fontSize: 16, lineHeight: 24, weight: 'regular' },
  bodyStrong: { fontSize: 16, lineHeight: 24, weight: 'semibold' },
  label: { fontSize: 14, lineHeight: 20, weight: 'medium' },
  caption: { fontSize: 14, lineHeight: 20, weight: 'regular' },
  captionStrong: { fontSize: 14, lineHeight: 20, weight: 'semibold' },
};

/** Tên font đã nạp theo độ đậm (Android không tự chọn độ đậm cho font tự nạp). */
export const FONT_FAMILY: Record<FontWeight, string> = {
  regular: 'BeVietnamPro_400Regular',
  medium: 'BeVietnamPro_500Medium',
  semibold: 'BeVietnamPro_600SemiBold',
  bold: 'BeVietnamPro_700Bold',
};

/** Đổ bóng E1 (nút nổi, snackbar), E2 (sheet, hộp thoại). Dark mode bỏ bóng. */
export function elevation(level: 0 | 1 | 2, dark: boolean) {
  if (dark || level === 0) return {};
  return level === 1
    ? { boxShadow: '0px 4px 14px rgba(16,33,42,0.18)' }
    : { boxShadow: '0px -8px 32px rgba(16,33,42,0.18)' };
}
