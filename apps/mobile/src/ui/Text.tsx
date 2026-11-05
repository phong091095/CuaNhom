import { Text as RNText, type TextProps, type TextStyle } from 'react-native';
import { useColors } from '@/theme/ThemeProvider';
import { FONT_FAMILY, TYPE, type ColorTokens, type FontWeight, type TextVariant } from '@/theme/tokens';

export interface TxtProps extends TextProps {
  variant?: TextVariant;
  /** Tên token màu. Mặc định `text`. */
  color?: keyof ColorTokens;
  weight?: FontWeight;
  /** Số đều chiều rộng (tiền, kích thước) để cột số thẳng hàng. */
  tabular?: boolean;
  align?: TextStyle['textAlign'];
}

/** Chữ dùng trong toàn app: luôn Be Vietnam Pro, cỡ và chiều cao dòng theo thang chữ. */
export function Txt({ variant = 'body', color = 'text', weight, tabular, align, style, ...rest }: TxtProps) {
  const c = useColors();
  const t = TYPE[variant];
  const w = weight ?? t.weight;
  const num = tabular ?? t.tabular;
  return (
    <RNText
      {...rest}
      style={[
        {
          fontFamily: FONT_FAMILY[w],
          fontSize: t.fontSize,
          lineHeight: t.lineHeight,
          color: c[color],
          ...(num ? { fontVariant: ['tabular-nums'] as TextStyle['fontVariant'] } : {}),
          ...(align ? { textAlign: align } : {}),
        },
        style,
      ]}
    />
  );
}
