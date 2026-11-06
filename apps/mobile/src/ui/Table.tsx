/**
 * Bảng dạng thẻ (chi tiết cửa D6, thông số hệ D4): nhóm dòng có viền ngăn, dòng tiêu đề nhóm (nền surface2),
 * dòng tổng (nền primarySoft). Mỗi dòng đọc liền một câu cho trình đọc màn hình.
 */
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useColors } from '@/theme/ThemeProvider';
import { Card } from './Controls';
import { Txt } from './Text';

export function RowGroup({ children, testID }: { children: ReactNode; testID?: string }) {
  // Kéo lên một nét để viền trên của dòng đầu nằm dưới viền thẻ.
  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <View testID={testID} style={{ marginTop: -StyleSheet.hairlineWidth }}>
        {children}
      </View>
    </Card>
  );
}

export function InfoRow({
  title,
  sub,
  lines,
  value,
  aside,
  head,
  total,
  testID,
}: {
  title: string;
  sub?: string;
  /** Các dòng phụ thêm (công thức, ghi chú). */
  lines?: string[];
  value?: string;
  /** Phần tử phụ dưới tiêu đề (ví dụ huy hiệu mức kiểm tra). */
  aside?: ReactNode;
  head?: boolean;
  total?: boolean;
  testID?: string;
}) {
  const c = useColors();
  const strong = head || total;
  return (
    <View
      testID={testID}
      style={[styles.row, { borderTopColor: c.divider }, head && { backgroundColor: c.surface2, minHeight: 44 }, total && { backgroundColor: c.primarySoft }]}
      accessible
      accessibilityLabel={[title, sub, ...(lines ?? []), value].filter(Boolean).join(', ')}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant={strong ? 'bodyStrong' : 'body'} weight={strong ? 'bold' : undefined} style={total ? { color: c.onPrimarySoft } : undefined}>
          {title}
        </Txt>
        {aside}
        {sub ? (
          <Txt variant="caption" color="text2" tabular>
            {sub}
          </Txt>
        ) : null}
        {lines?.map((l, i) => (
          <Txt key={i} variant="caption" color="text2" tabular>
            {l}
          </Txt>
        ))}
      </View>
      {value ? (
        <Txt variant="bodyStrong" weight={total ? 'bold' : undefined} tabular style={[{ textAlign: 'right', flexShrink: 1 }, total ? { color: c.onPrimarySoft } : null]}>
          {value}
        </Txt>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
