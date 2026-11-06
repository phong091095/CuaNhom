/**
 * Bộ icon nét 1,8 px trên lưới 24 (artboard Icon). Icon luôn đi kèm nhãn chữ (quy tắc thiết kế):
 * component này chỉ vẽ hình và ẩn khỏi trình đọc màn hình; nhãn do nút chứa nó cung cấp.
 */
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const PATHS = {
  projects: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  library: 'M3 5h6a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H3z M21 5h-6a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h7z',
  user: 'M12 12a4 4 0 1 0 0-8a4 4 0 0 0 0 8z M4 21a8 8 0 0 1 16 0',
  search: 'M11 18a7 7 0 1 0 0-14a7 7 0 0 0 0 14z M20 20l-4-4',
  plus: 'M12 5v14 M5 12h14',
  more: 'M3.2 12a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0 -3.6 0 M10.2 12a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0 -3.6 0 M17.2 12a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0 -3.6 0',
  pin: 'M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z M12 12.5a2.5 2.5 0 1 0 0-5a2.5 2.5 0 0 0 0 5z',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
  chevL: 'M15 18l-6-6 6-6',
  chevR: 'M9 6l6 6-6 6',
  chevD: 'M6 9l6 6 6-6',
  door: 'M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17 M3 21h18 M14 11v2',
  alu: 'M3 6h18v4H3z M3 14h18v4H3z M7 6v4 M7 14v4',
  glass: 'M4 4h16v16H4z M8 13l5-5 M10 17l7-7',
  acc: 'M8 15a4 4 0 1 1 0-8a4 4 0 0 1 0 8z M12 11h9 M18 11v3 M21 11v2',
  quote: 'M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z M14 3v5h5 M8 13h8 M8 17h5',
  check: 'M5 12l5 5L20 7',
  x: 'M6 6l12 12 M18 6L6 18',
  trash: 'M4 7h16 M9 7V4h6v3 M6 7l1 13h10l1-13 M10 11v6 M14 11v6',
  edit: 'M4 20h4L19 9l-4-4L4 16z M13 7l4 4',
  percent: 'M19 5L5 19 M7 9a2 2 0 1 0 0-4a2 2 0 0 0 0 4z M17 19a2 2 0 1 0 0-4a2 2 0 0 0 0 4z',
  export: 'M12 4v11 M7 10l5 5 5-5 M5 20h14',
  alert: 'M12 3l10 18H2z M12 10v5 M12 18h.01',
  refresh: 'M20 12a8 8 0 1 1-2.3-5.7 M20 4v4h-4',
  ruler: 'M3 16L16 3l5 5L8 21z M7 12l2 2 M10 9l2 2 M13 6l2 2',
  info: 'M12 21a9 9 0 1 0 0-18a9 9 0 0 0 0 18z M12 11v5 M12 8h.01',
  checkCircle: 'M12 21a9 9 0 1 0 0-18a9 9 0 0 0 0 18z M8 12l3 3 5-6',
  cut: 'M6 9a3 3 0 1 0 0-6a3 3 0 0 0 0 6z M6 21a3 3 0 1 0 0-6a3 3 0 0 0 0 6z M8.1 7.9L20 20 M8.1 16.1L20 4',
  image: 'M4 5h16v14H4z M4 16l5-5 4 4 3-3 4 4',
  copy: 'M9 9h11v11H9z M5 15H4V4h11v1',
  share: 'M12 3v12 M7 8l5-5 5 5 M5 13v7h14v-7',
  file: 'M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z M14 3v5h5',
  lock: 'M6 11h12v10H6z M8 11V8a4 4 0 0 1 8 0v3',
  minus: 'M5 12h14',
  arrowR: 'M5 12h14 M13 6l6 6-6 6',
  arrowUp: 'M12 19V5 M6 11l6-6 6 6',
  arrowDown: 'M12 5v14 M6 13l6 6 6-6',
  clock: 'M12 21a9 9 0 1 0 0-18a9 9 0 0 0 0 18z M12 7v5l3 2',
  shield: 'M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z M9 12l2 2 4-4',
  restore: 'M4 12a8 8 0 1 0 2.3-5.7 M4 4v4h4 M12 8v4l3 2',
  building: 'M4 21V7l8-4 8 4v14 M4 21h16 M9 21v-5h6v5 M8 10h2 M14 10h2',
  camera: 'M4 7h3l2-2h6l2 2h3v12H4z M12 16a3 3 0 1 0 0-6a3 3 0 0 0 0 6z',
  filter: 'M4 5h16l-6 8v6l-4-2v-4z',
  gear: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z M19.4 13.5l1.7 1.3-1.7 3-2-.8a7.6 7.6 0 0 1-2 1.2l-.3 2.1h-3.4l-.3-2.1a7.6 7.6 0 0 1-2-1.2l-2 .8-1.7-3 1.7-1.3a7.4 7.4 0 0 1 0-2.4L3.7 9.5l1.7-3 2 .8a7.6 7.6 0 0 1 2-1.2l.3-2.1h3.4l.3 2.1a7.6 7.6 0 0 1 2 1.2l2-.8 1.7 3-1.7 1.3a7.4 7.4 0 0 1 0 2.4z',
  sort: 'M7 4v16 M4 17l3 3 3-3 M17 20V4 M14 7l3-3 3 3',
  bar: 'M3 9h18v6H3z M8 9v6 M13 9v6',
  tag: 'M3 12V4h8l10 10-8 8z M8 8.5h.01',
  section: 'M5 4h14v4h-9v12H5z M10 8h4v4h-4z',
  folder: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M3 10h18',
  calc: 'M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z M8 7h8 M8 12h.01 M12 12h.01 M16 12h.01 M8 16h.01 M12 16h.01 M16 16h.01',
} as const;

export type IconName = keyof typeof PATHS;

export const ICON_NAMES = Object.keys(PATHS) as IconName[];

export function Icon({ name, color, size = 24 }: { name: IconName; color: string; size?: number }) {
  const filled = name === 'more';
  // aria-hidden: ẩn khỏi trình đọc màn hình trên cả Android, iOS và web.
  return (
    <View aria-hidden style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path
        d={PATHS[name]}
        fill={filled ? color : 'none'}
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}
