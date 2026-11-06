/**
 * Dùng chung cho mọi form nhập liệu (NFR-REL-01 và nguyên tắc "không bao giờ mất số đã nhập"):
 * - nháp tự lưu sau mỗi thay đổi (chờ 500 ms sau lần gõ cuối), xóa khi không còn khác bản gốc;
 * - rời màn khi chưa lưu thì hỏi "Bỏ thay đổi?"; chọn bỏ thì xóa nháp rồi mới rời.
 */
import { usePreventRemove } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getDb } from '@/db/client';
import { clearDraft, saveDraft } from '@/db/repos/drafts';
import { Dialog } from '@/ui';

export const DRAFT_DEBOUNCE_MS = 500;

export interface FormGuard {
  /** Gọi sau khi lưu thành công: ngừng ghi nháp, xóa nháp, cho rời màn không hỏi. */
  markSaved: () => Promise<void>;
  /** Hộp thoại "Bỏ thay đổi?" – đặt trong màn hình. */
  dialog: React.ReactElement;
}

export function useFormGuard<T>({
  draftKey,
  values,
  dirty,
  ready,
  saving,
}: {
  draftKey: string;
  values: T;
  /** Khác bản gốc? */
  dirty: boolean;
  /** Đã nạp xong dữ liệu ban đầu (trước đó không ghi nháp). */
  ready: boolean;
  /** Đang lưu (không chặn rời màn sau khi lưu xong). */
  saving: boolean;
}): FormGuard {
  /** Đã lưu: ref cho effect ghi nháp, state cho phần chặn rời màn (đọc khi render). */
  const saved = useRef(false);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState<{ repeat: () => void } | null>(null);
  const [discarding, setDiscarding] = useState(false);

  useEffect(() => {
    if (!ready || saved.current) return;
    const t = setTimeout(() => {
      getDb()
        .then((db) => (dirty ? saveDraft(db, draftKey, values) : clearDraft(db, draftKey)))
        .catch(() => {});
    }, DRAFT_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [values, dirty, ready, draftKey]);

  usePreventRemove(dirty && !saving && !discarding && !done, ({ repeat }) => setPending({ repeat }));

  // Tắt chặn rồi mới thực hiện lại lần rời màn (nếu không sẽ bị chặn lần nữa).
  useEffect(() => {
    if (discarding && pending) pending.repeat();
  }, [discarding, pending]);

  const markSaved = useCallback(async () => {
    saved.current = true;
    setDone(true);
    try {
      await clearDraft(await getDb(), draftKey);
    } catch {
      // nháp còn sót sẽ bị bỏ qua lần sau vì trùng bản gốc
    }
  }, [draftKey]);

  const dialog = (
    <Dialog
      visible={pending !== null && !discarding}
      title="Bỏ thay đổi?"
      message="Những gì bạn vừa nhập chưa được lưu."
      confirmLabel="Bỏ thay đổi"
      cancelLabel="Tiếp tục sửa"
      destructive
      onConfirm={() => {
        saved.current = true;
        getDb()
          .then((db) => clearDraft(db, draftKey))
          .catch(() => {})
          .finally(() => setDiscarding(true));
      }}
      onCancel={() => setPending(null)}
    />
  );
  return { markSaved, dialog };
}
