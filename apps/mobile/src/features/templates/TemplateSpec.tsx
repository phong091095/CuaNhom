/**
 * Thông số hệ (D4 · Q4: chỉ xem): khe hở và hằng số, công thức cắt từng thanh nhôm, kính và phụ kiện, giới hạn kích thước.
 * Công thức đọc thành chữ (describeExpr) theo tên biến của mẫu: "Rộng − 36 × 2 − 5 × 2".
 * Mở từ form nhập cửa (D5) và chi tiết cửa (D6); có tham số "v" thì xem đúng phiên bản bộ cửa đang dùng.
 */
import { formatNumber, glassKey, type CheckLevel, type DoorTemplate } from '@matadoor/engine';
import { findSystem, findTemplate } from '@matadoor/data';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { getDb } from '@/db/client';
import { listMaterials } from '@/db/repos/materials';
import { getTemplateSnapshot } from '@/db/repos/snapshots';
import { exprText, paramValueLabel } from '@/domain/templateText';
import { Badge, Body, Card, ErrorState, Header, InfoRow, RowGroup, Screen, SectionTitle, SkeletonCard, Tabs, Txt, type BadgeTone } from '@/ui';

type TabId = 'khe' | 'nhom' | 'kinh' | 'gioihan';
const TABS: { value: TabId; label: string }[] = [
  { value: 'khe', label: 'Khe hở & hằng số' },
  { value: 'nhom', label: 'Profile nhôm' },
  { value: 'kinh', label: 'Kính & phụ kiện' },
  { value: 'gioihan', label: 'Giới hạn' },
];

const LEVEL: Record<CheckLevel, { label: string; tone: BadgeTone }> = {
  error: { label: 'Lỗi – không cho lưu', tone: 'error' },
  warning: { label: 'Cảnh báo', tone: 'warning' },
  info: { label: 'Thông tin', tone: 'info' },
};

interface Loaded {
  template: DoorTemplate;
  /** Tên vật tư theo mã (Thư viện của xưởng). */
  names: Map<string, string>;
  /** Phiên bản đang xem cũ hơn mẫu kèm app. */
  newer: number | null;
}

export function TemplateSpec({ templateId, version }: { templateId: string; version?: number }) {
  const [data, setData] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>('khe');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      const db = await getDb();
      const bundled = findTemplate(templateId);
      const template = (version !== undefined ? await getTemplateSnapshot(db, templateId, version) : null) ?? bundled;
      if (!template) throw new Error('Không tìm thấy mẫu cửa.');
      const names = new Map((await listMaterials(db)).map((m) => [m.code, m.name]));
      if (alive) setData({ template, names, newer: bundled && bundled.version > template.version ? bundled.version : null });
    })().catch((e: unknown) => {
      if (alive) setError(e instanceof Error ? e.message : String(e));
    });
    return () => {
      alive = false;
    };
  }, [templateId, version, attempt]);

  if (error) {
    return (
      <Screen>
        <Header title="Thông số hệ" />
        <ErrorState title="Không mở được thông số hệ" message={error} onRetry={() => {
            setError(null);
            setAttempt((a) => a + 1);
          }}
        />
      </Screen>
    );
  }
  if (!data) {
    return (
      <Screen>
        <Header title="Thông số hệ" />
        <Body>
          <SkeletonCard lines={3} />
          <SkeletonCard lines={5} />
        </Body>
      </Screen>
    );
  }

  const t = data.template;
  return (
    <Screen>
      <Header title="Thông số hệ" />
      <Body>
        <Card>
          <View style={{ gap: 4 }}>
            <Txt variant="section" weight="bold" testID="spec-title">
              {t.name}
            </Txt>
            <Txt variant="caption" color="text2">
              {findSystem(t.system)?.name ?? t.system} · phiên bản {t.version}
            </Txt>
            {t.status === 'verified' ? (
              <Badge tone="success" icon="checkCircle" label="Đã khớp đáp án mẫu trong đặc tả" />
            ) : (
              <Badge tone="warning" icon="alert" label="Chưa đối chiếu đáp án mẫu" />
            )}
            {data.newer ? <Badge tone="info" icon="info" label={`Đang xem phiên bản bộ cửa dùng; mẫu mới là phiên bản ${data.newer}`} /> : null}
            <Txt variant="caption" color="text2">
              Chỉ để xem. Giá vật tư sửa ở Thư viện; mọi bộ cửa dùng chung một nguồn giá.
            </Txt>
          </View>
        </Card>
        <Tabs options={TABS} value={tab} onChange={setTab} accessibilityLabel="Phần thông số" />
        {tab === 'khe' ? <ConstantsTab t={t} /> : null}
        {tab === 'nhom' ? <ProfilesTab t={t} names={data.names} /> : null}
        {tab === 'kinh' ? <GlassTab t={t} names={data.names} /> : null}
        {tab === 'gioihan' ? <ChecksTab t={t} /> : null}
      </Body>
    </Screen>
  );
}

const num = (x: number) => formatNumber(x, { maxDecimals: 3, grouping: false });

function ConstantsTab({ t }: { t: DoorTemplate }) {
  return (
    <>
      <SectionTitle>Tham số khi nhập cửa</SectionTitle>
      <RowGroup>
        {t.params.map((p) => {
          const range = p.type === 'number' && p.min !== undefined && p.max !== undefined ? `Từ ${num(p.min)} đến ${num(p.max)}${p.unit ? ` ${p.unit}` : ''}` : null;
          const options = p.type === 'choice' ? (p.options ?? []).map((o) => o.label).join(' · ') : null;
          return (
            <InfoRow
              key={p.key}
              title={p.label}
              sub={`Mặc định: ${paramValueLabel(t, p.key, p.default)}`}
              lines={[range ?? (options ? `Chọn: ${options}` : null), p.hint ?? null].filter((x): x is string => !!x)}
            />
          );
        })}
      </RowGroup>
      <SectionTitle>Khe hở & hằng số</SectionTitle>
      <RowGroup testID="spec-constants">
        {Object.entries(t.constants).map(([k, c]) => (
          <InfoRow key={k} title={c.note ?? k} value={num(c.value)} />
        ))}
      </RowGroup>
      {t.derived.length > 0 ? (
        <>
          <SectionTitle>Giá trị tính thêm</SectionTitle>
          <RowGroup>
            {t.derived.map((d) => (
              <InfoRow key={d.key} title={d.label ?? d.key} sub={exprText(t, d.expr)} lines={d.note ? [d.note] : undefined} />
            ))}
          </RowGroup>
        </>
      ) : null}
    </>
  );
}

function ProfilesTab({ t, names }: { t: DoorTemplate; names: Map<string, string> }) {
  const codes = [...new Set(t.profiles.map((p) => p.code))];
  return (
    <>
      <SectionTitle>{`Công thức cắt · ${t.profiles.length} thanh`}</SectionTitle>
      {codes.map((code) => (
        <RowGroup key={code}>
          <InfoRow title={`${code} · ${names.get(code) ?? 'Vật tư không còn trong Thư viện'}`} head />
          {t.profiles
            .filter((p) => p.code === code)
            .map((p) => (
              <InfoRow
                key={p.role}
                title={p.label}
                testID={`spec-profile-${p.role}`}
                lines={[
                  `Dài = ${exprText(t, p.length)}`,
                  `Số thanh 1 bộ = ${exprText(t, p.qty)}`,
                  ...(p.angle ? [`Góc cắt ${p.angle.split('/').map((a) => `${a.trim()}°`).join('/')}`] : []),
                  ...(p.position ? [`Vị trí: ${p.position}`] : []),
                ]}
              />
            ))}
        </RowGroup>
      ))}
      <Txt variant="caption" color="text2">
        Chiều dài cắt làm tròn 0,1 mm. Hằng số được thay bằng giá trị ở mục Khe hở & hằng số.
      </Txt>
    </>
  );
}

function GlassTab({ t, names }: { t: DoorTemplate; names: Map<string, string> }) {
  return (
    <>
      <SectionTitle>Kính</SectionTitle>
      <RowGroup>
        {t.glass.map((g) => (
          <InfoRow
            key={glassKey(g.key)}
            title={g.label}
            sub={`Mặc định: ${names.get(g.defaultCode) ?? g.defaultCode}`}
            lines={[`Rộng kính = ${exprText(t, g.width)}`, `Cao kính = ${exprText(t, g.height)}`, `Số tấm 1 bộ = ${exprText(t, g.qty)}`]}
            testID={`spec-glass-${glassKey(g.key)}`}
          />
        ))}
      </RowGroup>
      <SectionTitle>Phụ kiện</SectionTitle>
      <RowGroup>
        {t.accessories.map((a) => (
          <InfoRow key={a.code} title={names.get(a.code) ?? a.code} sub={`Số lượng 1 bộ = ${exprText(t, a.qty)}`} lines={a.note ? [a.note] : undefined} />
        ))}
      </RowGroup>
      <SectionTitle>Nhân công</SectionTitle>
      <RowGroup>
        {t.labor.map((l) => (
          <InfoRow key={l.code} title={names.get(l.code) ?? l.code} sub={`Khối lượng 1 bộ = ${exprText(t, l.qty)}`} />
        ))}
      </RowGroup>
      <Txt variant="caption" color="text2">
        Số lẻ của phụ kiện làm tròn lên khi cộng cả dự án; nhân công không làm tròn.
      </Txt>
    </>
  );
}

function ChecksTab({ t }: { t: DoorTemplate }) {
  return (
    <>
      <SectionTitle>Giới hạn & kiểm tra kỹ thuật</SectionTitle>
      <RowGroup>
        {t.checks.map((c) => (
          <InfoRow
            key={c.id}
            title={c.message.replace(/\{[^}]+\}/g, '…')}
            aside={<Badge tone={LEVEL[c.level].tone} icon={c.level === 'info' ? 'info' : 'alert'} label={LEVEL[c.level].label} />}
            sub={`Khi ${exprText(t, c.when)}`}
            testID={`spec-check-${c.id}`}
          />
        ))}
      </RowGroup>
      <Txt variant="caption" color="text2">
        Kích thước mặc định khi vẽ thử: {num(t.defaults.W)} × {num(t.defaults.H)} mm.
      </Txt>
    </>
  );
}
