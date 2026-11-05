/**
 * Logo hướng A (artboard LogoMark/LogoFinal). Chỉ dùng ở icon, splash, Cài đặt, đầu trang báo giá.
 */
import Svg, { Path, Rect } from 'react-native-svg';

export function Logo({ size = 48 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" accessibilityLabel="MATADOOR">
      <Rect x={0} y={0} width={48} height={48} rx={10.75} fill="#0B5C75" />
      <Path d="M13 11h22v26H13z" fill="#6CC7DE" />
      <Path d="M9 37h30 M13 37V11h22v26" fill="none" stroke="#FFFFFF" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M19 31V18l5 6 5-6v13" fill="none" stroke="#0B5C75" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
