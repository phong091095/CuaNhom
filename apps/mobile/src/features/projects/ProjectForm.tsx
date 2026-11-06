/**
 * Form tạo / sửa dự án (B2, B6). Chỉ tên công trình bắt buộc (FR-PRJ-01); SĐT sai dạng chỉ nhắc.
 * Nháp tự lưu sau mỗi thay đổi (NFR-REL-01); rời màn khi chưa lưu thì hỏi.
 */
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { getDb } from '@/db/client';
import { loadDraft } from '@/db/repos/drafts';
import { createProject, getProject, PHONE_HELP, phoneHint, updateProject } from '@/db/repos/projects';
import { logEvent } from '@/db/repos/events';
import { ValidationError } from '@/domain/errors';
import { useFormGuard } from '@/features/forms/useFormGuard';
import { Body, BottomBar, Button, ErrorState, Header, Screen, SkeletonCard, TextField, Txt, useSnackbar } from '@/ui';

export interface ProjectFormValues {
  name: string;
  customer: string;
  phone: string;
  address: string;
}

const EMPTY: ProjectFormValues = { name: '', customer: '', phone: '', address: '' };

function same(a: ProjectFormValues, b: ProjectFormValues): boolean {
  return a.name === b.name && a.customer === b.customer && a.phone === b.phone && a.address === b.address;
}



export function ProjectForm({ projectId }: { projectId?: string }) {
  const editing = !!projectId;
  const draftKey = editing ? `project:edit:${projectId}` : 'project:new';
  const snack = useSnackbar();
  const [initial, setInitial] = useState<ProjectFormValues | null>(null);
  const [values, setValues] = useState<ProjectFormValues>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof ProjectFormValues, string>>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Tải dự án (khi sửa) và nháp còn dở.
  useEffect(() => {
    let alive = true;
    (async () => {
      const db = await getDb();
      let base = EMPTY;
      if (projectId) {
        const p = await getProject(db, projectId);
        if (!p || p.deletedAt !== null) throw new Error('Dự án không còn hoặc đã bị xóa.');
        base = { name: p.name, customer: p.customer, phone: p.phone, address: p.address };
      }
      const draft = await loadDraft<ProjectFormValues>(db, draftKey);
      if (!alive) return;
      setInitial(base);
      if (draft && !same(draft.value, base)) {
        setValues({ ...EMPTY, ...draft.value });
        snack.show('Đã mở lại phần đang nhập dở');
      } else {
        setValues(base);
      }
    })().catch((e: unknown) => {
      if (alive) setLoadError(e instanceof Error ? e.message : String(e));
    });
    return () => {
      alive = false;
    };
  }, [projectId, draftKey, snack]);

  const dirty = initial !== null && !same(values, initial);

  const guard = useFormGuard({ draftKey, values, dirty, ready: initial !== null, saving });

  const set = useCallback(
    (k: keyof ProjectFormValues) => (v: string) => {
      setValues((s) => ({ ...s, [k]: v }));
      setErrors((e) => ({ ...e, [k]: undefined }));
    },
    [],
  );

  const submit = async () => {
    setSaving(true);
    try {
      const db = await getDb();
      if (projectId) {
        await updateProject(db, projectId, values);
      } else {
        const p = await createProject(db, values);
        await logEvent(db, 'project_created', { projectId: p.id });
        await guard.markSaved();
        snack.show(`Đã tạo dự án “${p.name}”`, { tone: 'success' });
        router.replace(`/du-an/${p.id}`);
        return;
      }
      await guard.markSaved();
      snack.show('Đã lưu thông tin dự án', { tone: 'success' });
      if (router.canGoBack()) router.back();
      else router.replace(`/du-an/${projectId}`);
    } catch (e) {
      setSaving(false);
      if (e instanceof ValidationError && e.field in EMPTY) {
        setErrors({ [e.field]: e.message });
      } else {
        snack.show(e instanceof Error ? e.message : 'Không lưu được, hãy thử lại');
      }
    }
  };

  const title = editing ? 'Chỉnh sửa dự án' : 'Tạo dự án';
  if (loadError) {
    return (
      <Screen>
        <Header title={title} />
        <ErrorState title="Không mở được dự án" message={loadError} onRetry={() => router.back()} />
      </Screen>
    );
  }
  return (
    <Screen>
      <Header title={title} backLabel="Hủy" onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      <Body bottomBar={1}>
        {initial === null ? (
          <SkeletonCard lines={4} />
        ) : (
          <>
            {!editing ? (
              <Txt color="text2">Mỗi dự án là một khách hàng hoặc công trình. Tạo xong bạn thêm các bộ cửa vào dự án.</Txt>
            ) : null}
            <TextField
              testID="field-name"
              label="Tên công trình"
              required
              icon="projects"
              value={values.name}
              onChangeText={set('name')}
              placeholder="Ví dụ: Nhà anh Đoài"
              error={errors.name}
              maxLength={120}
              autoFocus={!editing}
            />
            <TextField
              testID="field-customer"
              label="Tên khách hàng"
              icon="user"
              value={values.customer}
              onChangeText={set('customer')}
              placeholder="Ví dụ: Anh Đoài"
              autoComplete="name"
            />
            <TextField
              testID="field-phone"
              label="Số điện thoại khách"
              icon="phone"
              kind="phone"
              value={values.phone}
              onChangeText={set('phone')}
              placeholder="Ví dụ: 0923 456 789"
              warning={phoneHint(values.phone)}
              hint={PHONE_HELP}
            />
            <TextField
              testID="field-address"
              label="Địa chỉ"
              icon="pin"
              value={values.address}
              onChangeText={set('address')}
              placeholder="Số nhà, đường, tỉnh/thành"
              autoComplete="street-address"
            />
            <Txt variant="caption" color="text2">
              * là ô bắt buộc.
            </Txt>
          </>
        )}
      </Body>
      <BottomBar>
        <Button
          testID="submit-project"
          label={editing ? 'Lưu' : 'Tạo dự án'}
          icon={editing ? 'check' : 'plus'}
          loading={saving}
          disabled={initial === null}
          onPress={submit}
        />
      </BottomBar>
      {guard.dialog}
    </Screen>
  );
}
