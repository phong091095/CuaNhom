/**
 * Lớp phủ (Handoff1 mục 3): bottom sheet (bo góc trên 20, tay cầm 40 × 4), select dạng sheet,
 * hộp thoại (xác nhận · phá hủy · thông tin), snackbar (có Hoàn tác 10 giây).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme, useColors } from '@/theme/ThemeProvider';
import { elevation, RADIUS, SIZE } from '@/theme/tokens';
import { Button } from './Button';
import { Icon } from './Icon';
import { Txt } from './Text';

// ---------------------------------------------------------------- BottomSheet

export function BottomSheet({
  visible,
  onClose,
  title,
  children,
  footer,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Thanh nút cố định cuối sheet (một nút chính). */
  footer?: ReactNode;
}) {
  const { colors: c, dark } = useAppTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.fill}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: c.scrim }]} onPress={onClose} accessibilityRole="button" accessibilityLabel="Đóng" />
        <View
          style={[
            styles.sheet,
            { backgroundColor: c.surface, paddingBottom: Math.max(insets.bottom, 16) },
            elevation(2, dark),
          ]}
          accessibilityViewIsModal
        >
          <View style={[styles.handle, { backgroundColor: c.divider }]} />
          <View style={styles.sheetHeader}>
            <Txt variant="dialogTitle" style={{ flex: 1 }} accessibilityRole="header">
              {title}
            </Txt>
            <Button kind="ghost" compact label="Đóng" onPress={onClose} />
          </View>
          <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8, gap: 12 }}>
            {children}
          </ScrollView>
          {footer ? <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------- Select

export interface SelectOption<T> {
  value: T;
  label: string;
  description?: string;
}

/** Select dạng bottom sheet (không dùng select gốc). Chưa chọn thì hiện chữ phụ. */
export function Select<T extends string | number>({
  label,
  value,
  options,
  onChange,
  placeholder = 'Chọn',
  error,
  testID,
}: {
  label: string;
  value: T | null;
  options: SelectOption<T>[];
  onChange: (v: T) => void;
  placeholder?: string;
  error?: string | null;
  testID?: string;
}) {
  const c = useColors();
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <View style={{ gap: 6 }}>
      <Txt variant="label">{label}</Txt>
      <Pressable
        testID={testID}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${current?.label ?? placeholder}`}
        style={({ pressed }) => [
          styles.select,
          {
            borderColor: error ? c.error : c.border,
            borderWidth: error ? 2 : 1,
            backgroundColor: pressed ? c.surface2 : c.surface,
          },
        ]}
      >
        <Txt color={current ? 'text' : 'text2'} style={{ flex: 1 }} numberOfLines={1}>
          {current?.label ?? placeholder}
        </Txt>
        <Icon name="chevD" color={c.text2} />
      </Pressable>
      {error ? (
        <Txt variant="caption" color="error">
          {error}
        </Txt>
      ) : null}
      <BottomSheet visible={open} onClose={() => setOpen(false)} title={label}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <Pressable
              key={String(o.value)}
              onPress={() => {
                onChange(o.value);
                setOpen(false);
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              style={({ pressed }) => [
                styles.option,
                {
                  borderColor: on ? c.primary : c.divider,
                  borderWidth: on ? 2 : 1,
                  backgroundColor: on ? c.primarySoft : pressed ? c.surface2 : 'transparent',
                },
              ]}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Txt variant="bodyStrong" style={{ color: on ? c.onPrimarySoft : c.text }}>
                  {o.label}
                </Txt>
                {o.description ? <Txt variant="caption" color="text2">{o.description}</Txt> : null}
              </View>
              {on ? <Icon name="check" color={c.onPrimarySoft} /> : null}
            </Pressable>
          );
        })}
      </BottomSheet>
    </View>
  );
}

// ---------------------------------------------------------------- Dialog

export function Dialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Hủy',
  destructive,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  /** null = hộp thoại thông tin, chỉ có một nút. */
  cancelLabel?: string | null;
  /** Hộp thoại phá hủy dùng nút đỏ thay cho cam. */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { colors: c, dark } = useAppTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View style={[styles.fill, styles.center, { backgroundColor: c.scrim }]}>
        <View style={[styles.dialog, { backgroundColor: c.surface }, elevation(2, dark)]} accessibilityViewIsModal accessibilityRole="alert">
          <Txt variant="dialogTitle" accessibilityRole="header">
            {title}
          </Txt>
          {message ? <Txt color="text2">{message}</Txt> : null}
          <View style={{ gap: 8, marginTop: 8 }}>
            <Button label={confirmLabel} kind={destructive ? 'destructive' : 'primary'} onPress={onConfirm} />
            {cancelLabel ? <Button label={cancelLabel} kind="secondary" onPress={onCancel} /> : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------- Snackbar

interface SnackMessage {
  id: number;
  text: string;
  /** Có thì hiện nút "Hoàn tác" trong 10 giây. */
  onUndo?: () => void;
  tone?: 'normal' | 'success';
}

interface SnackApi {
  show: (text: string, opts?: { onUndo?: () => void; tone?: 'normal' | 'success' }) => void;
  /** Đặt khoảng cách từ đáy (khi màn có thanh nút cố định). */
  setBottomOffset: (px: number) => void;
}

const SnackContext = createContext<SnackApi | null>(null);

export const UNDO_MS = 10_000;
const PLAIN_MS = 4_000;

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const { colors: c, dark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [msg, setMsg] = useState<SnackMessage | null>(null);
  const [offset, setOffset] = useState(0);
  const seq = useRef(0);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg((m) => (m?.id === msg.id ? null : m)), msg.onUndo ? UNDO_MS : PLAIN_MS);
    return () => clearTimeout(t);
  }, [msg]);

  const show = useCallback<SnackApi['show']>((text, opts) => {
    seq.current += 1;
    setMsg({ id: seq.current, text, ...(opts?.onUndo ? { onUndo: opts.onUndo } : {}), tone: opts?.tone ?? 'normal' });
  }, []);
  const api = useMemo<SnackApi>(() => ({ show, setBottomOffset: setOffset }), [show]);

  return (
    <SnackContext.Provider value={api}>
      {children}
      {msg ? (
        <View
          pointerEvents="box-none"
          style={[styles.snackWrap, { bottom: Math.max(insets.bottom, 16) + offset }]}
        >
          <View style={[styles.snack, { backgroundColor: c.snack }, elevation(1, dark)]} accessibilityLiveRegion="polite" accessibilityRole="alert">
            {msg.tone === 'success' ? <Icon name="checkCircle" color={c.snackOk} /> : null}
            <Txt style={{ color: c.onSnack, flex: 1, paddingVertical: 12 }}>{msg.text}</Txt>
            {msg.onUndo ? (
              <Pressable
                onPress={() => {
                  msg.onUndo?.();
                  setMsg(null);
                }}
                accessibilityRole="button"
                accessibilityLabel="Hoàn tác"
                style={styles.snackBtn}
              >
                <Txt variant="bodyStrong" weight="bold" style={{ color: c.snackAction }}>
                  Hoàn tác
                </Txt>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
    </SnackContext.Provider>
  );
}

export function useSnackbar(): SnackApi {
  const v = useContext(SnackContext);
  if (!v) throw new Error('useSnackbar phải nằm trong SnackbarProvider');
  return v;
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'flex-end' },
  center: { justifyContent: 'center', padding: 24 },
  sheet: { borderTopLeftRadius: RADIUS.sheet, borderTopRightRadius: RADIUS.sheet, maxHeight: '90%', width: '100%', maxWidth: SIZE.maxContent, alignSelf: 'center' },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 8 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingRight: 8, paddingVertical: 8 },
  select: { minHeight: SIZE.control, borderRadius: RADIUS.input, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 8 },
  option: { minHeight: 56, borderRadius: RADIUS.input, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  dialog: { borderRadius: RADIUS.sheet, padding: 24, gap: 12, width: '100%', maxWidth: 480, alignSelf: 'center' },
  snackWrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
  snack: {
    width: '100%',
    maxWidth: SIZE.maxContent,
    minHeight: SIZE.control,
    borderRadius: RADIUS.input,
    paddingLeft: 16,
    paddingRight: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  snackBtn: { minHeight: SIZE.touch, paddingHorizontal: 12, justifyContent: 'center' },
});
