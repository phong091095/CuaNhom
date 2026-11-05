import { contrastRatio } from '../contrast';
import { DARK, LIGHT, TYPE, type ColorTokens } from '../tokens';

/** Cặp chữ/nền phải đạt ≥ 4,5:1; viền ô nhập (thành phần giao diện) ≥ 3:1 – WCAG 2.2 AA. */
const TEXT_PAIRS: [keyof ColorTokens, keyof ColorTokens][] = [
  ['text', 'bg'],
  ['text', 'surface'],
  ['text', 'surface2'],
  ['text2', 'bg'],
  ['text2', 'surface'],
  ['primary', 'surface'],
  ['primary', 'bg'],
  ['onPrimarySoft', 'primarySoft'],
  ['onAccent', 'accent'],
  ['onError', 'error'],
  ['error', 'surface'],
  ['error', 'errorSoft'],
  ['success', 'surface'],
  ['success', 'successSoft'],
  ['warning', 'surface'],
  ['warning', 'warningSoft'],
  ['info', 'infoSoft'],
  ['onSnack', 'snack'],
  ['snackAction', 'snack'],
  ['onHero', 'hero'],
  ['onHero2', 'hero'],
];

describe.each([
  ['Sáng', LIGHT],
  ['Tối', DARK],
])('token màu – chế độ %s', (_name, c) => {
  it.each(TEXT_PAIRS)('%s trên %s đạt 4,5:1', (fg, bg) => {
    expect(contrastRatio(c[fg], c[bg])).toBeGreaterThanOrEqual(4.5);
  });

  it('viền ô nhập trên bề mặt đạt 3:1', () => {
    expect(contrastRatio(c.border, c.surface)).toBeGreaterThanOrEqual(3);
  });
});

describe('thang chữ', () => {
  it('cỡ chữ nhỏ nhất 14 (NFR-USE-02)', () => {
    for (const t of Object.values(TYPE)) expect(t.fontSize).toBeGreaterThanOrEqual(14);
  });

  it('chiều cao dòng ≥ 1,25 lần cỡ chữ để dấu tiếng Việt không chạm dòng trên', () => {
    for (const t of Object.values(TYPE)) expect(t.lineHeight / t.fontSize).toBeGreaterThanOrEqual(1.25);
  });
});

describe('contrastRatio', () => {
  it('đen trên trắng là 21:1, cùng màu là 1:1', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#0B5C75', '#0B5C75')).toBeCloseTo(1, 5);
    expect(() => contrastRatio('red', '#FFFFFF')).toThrow('Màu không hợp lệ');
  });
});
