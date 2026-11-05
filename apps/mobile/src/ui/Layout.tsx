/**
 * Khung màn hình: nền bg, vùng an toàn, thanh tiêu đề, thanh nút cố định đáy,
 * trạng thái rỗng / lỗi (mỗi màn danh sách đều có).
 */
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAppTheme, useColors } from '@/theme/ThemeProvider';
import { elevation, SIZE } from '@/theme/tokens';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';
import { Txt } from './Text';

/** Thanh tiêu đề màn con: nút "Quay lại" có chữ, tiêu đề 17 Bold, hành động phải. */
export function Header({
  title,
  back = true,
  right,
  backLabel = 'Quay lại',
  onBack,
}: {
  title: string;
  back?: boolean;
  right?: ReactNode;
  /** Ví dụ "Hủy" ở form tạo dự án. */
  backLabel?: string;
  /** Thay hành vi mặc định (lùi về màn trước). */
  onBack?: () => void;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 4, backgroundColor: c.bg, borderBottomColor: c.divider }]}>
      {back ? (
        <Button
          kind="ghost"
          compact
          label={backLabel}
          icon={backLabel === 'Quay lại' ? 'chevL' : undefined}
          onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
          testID="header-back"
        />
      ) : (
        <View style={{ width: 8 }} />
      )}
      <Txt variant="header" numberOfLines={1} style={{ flex: 1 }} accessibilityRole="header">
        {title}
      </Txt>
      {right}
    </View>
  );
}

/** Tiêu đề lớn của màn gốc trong tab (28 Bold) kèm dòng phụ bên phải. */
export function ScreenTitle({ title, aside }: { title: string; aside?: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.title, { paddingTop: insets.top + 8 }]}>
      <Txt variant="title" accessibilityRole="header">
        {title}
      </Txt>
      {aside ? <Txt variant="caption" color="text2">{aside}</Txt> : null}
    </View>
  );
}

/** Nền màn hình, nội dung giới hạn bề ngang trên máy tính bảng. */
export function Screen({ children }: { children: ReactNode }) {
  const c = useColors();
  return <View style={[styles.screen, { backgroundColor: c.bg }]}>{children}</View>;
}

/**
 * Vùng cuộn. Màn có thanh nút cố định: đệm đáy = cao thanh nút + 16 (68 một nút, 84 hai nút)
 * để thẻ cuối luôn cuộn hết.
 */
export function Body({ children, bottomBar, ...rest }: ScrollViewProps & { bottomBar?: 0 | 1 | 2 }) {
  const pad = bottomBar === 2 ? SIZE.bottomBarPad2 : bottomBar === 1 ? SIZE.bottomBarPad : 24;
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.body, { paddingBottom: pad + (bottomBar ? 16 : 0) }]}
      {...rest}
    >
      {children}
    </ScrollView>
  );
}

/** Thanh nút cố định đáy màn (nút chính trong tầm ngón cái – SRS mục 6). */
export function BottomBar({ children }: { children: ReactNode }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12), backgroundColor: c.surface, borderTopColor: c.divider }]}>
      {children}
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon: IconName;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const c = useColors();
  return (
    <View style={styles.state}>
      <View style={[styles.stateIcon, { backgroundColor: c.primarySoft }]}>
        <Icon name={icon} color={c.onPrimarySoft} size={32} />
      </View>
      <Txt variant="section" align="center">
        {title}
      </Txt>
      <Txt color="text2" align="center">
        {message}
      </Txt>
      {actionLabel && onAction ? <Button label={actionLabel} icon="plus" onPress={onAction} style={{ alignSelf: 'stretch' }} /> : null}
    </View>
  );
}

/** Trạng thái lỗi: icon + lý do + Thử lại. Không làm mất dữ liệu đã nhập. */
export function ErrorState({ title, message, onRetry }: { title: string; message: string; onRetry: () => void }) {
  const c = useColors();
  return (
    <View style={styles.state}>
      <View style={[styles.stateIcon, { backgroundColor: c.errorSoft }]}>
        <Icon name="alert" color={c.error} size={32} />
      </View>
      <Txt variant="section" align="center">
        {title}
      </Txt>
      <Txt color="text2" align="center">
        {message}
      </Txt>
      <Button label="Thử lại" icon="refresh" kind="secondary" onPress={onRetry} style={{ alignSelf: 'stretch' }} />
    </View>
  );
}

/** Tiêu đề nhóm trong form/danh sách (18 SemiBold). */
export function SectionTitle({ children }: { children: string }) {
  return (
    <Txt variant="section" accessibilityRole="header" style={{ marginTop: 8 }}>
      {children}
    </Txt>
  );
}

/** Nút nổi (FAB) – luôn có chữ (quy tắc "icon luôn có nhãn"); nằm trên thanh tab. */
export function Fab({ label, icon, onPress, testID }: { label: string; icon: IconName; onPress: () => void; testID?: string }) {
  const { colors: c, dark } = useAppTheme();
  return (
    <View pointerEvents="box-none" style={styles.fabWrap}>
      <Pressable
        testID={testID}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => [styles.fab, { backgroundColor: c.accent, opacity: pressed ? 0.85 : 1 }, elevation(1, dark)]}
      >
        <Icon name={icon} color={c.onAccent} />
        <Txt variant="bodyStrong" style={{ color: c.onAccent }}>
          {label}
        </Txt>
      </Pressable>
    </View>
  );
}

/** Khối giữ chỗ khi đang tải (Handoff1: skeleton đúng khung thật, không dùng vòng xoay). */
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  const c = useColors();
  return (
    <View
      accessibilityLabel="Đang tải"
      style={{ padding: 16, borderRadius: 16, backgroundColor: c.surface, borderWidth: 1, borderColor: c.divider, gap: 10 }}
    >
      {Array.from({ length: lines }, (_, i) => (
        <View key={i} style={{ width: `${[55, 85, 40, 70][i % 4]}%`, height: i === 0 ? 20 : 14, borderRadius: 6, backgroundColor: c.surface2 }} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  fabWrap: { position: 'absolute', right: 16, bottom: 16 },
  fab: { minHeight: 56, paddingLeft: 16, paddingRight: 20, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 8 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
    paddingBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  body: { paddingHorizontal: 16, paddingTop: 12, gap: 12, width: '100%', maxWidth: SIZE.maxContent, alignSelf: 'center' },
  bottomBar: { paddingTop: 12, paddingHorizontal: 16, borderTopWidth: StyleSheet.hairlineWidth, gap: 8 },
  state: { alignItems: 'center', gap: 12, paddingVertical: 32, paddingHorizontal: 16 },
  stateIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
});
