/**
 * Màn ẩn bày mọi component và trạng thái để so với artboard "Hệ thống thiết kế – Component".
 * Chỉ vào được ở bản dev (Cài đặt → Công cụ). Số liệu mẫu tính bằng engine thật.
 */
import { useState } from 'react';
import { View } from 'react-native';
import { bindUnits, formatArea, formatMm, formatMoney, formatSize } from '@matadoor/engine';
import { useColors } from '@/theme/ThemeProvider';
import {
  Badge,
  Body,
  BottomBar,
  BottomSheet,
  Button,
  Card,
  Chip,
  ChipRow,
  Dialog,
  EmptyState,
  ErrorState,
  Header,
  Icon,
  ICON_NAMES,
  ListRow,
  Screen,
  SectionTitle,
  Segmented,
  Select,
  Stepper,
  TextField,
  Txt,
  useSnackbar,
} from '@/ui';

export default function DevComponents() {
  const c = useColors();
  const snack = useSnackbar();
  const [w, setW] = useState('800');
  const [qty, setQty] = useState(1);
  const [chips, setChips] = useState({ di: true, so: false, vach: false });
  const [seg, setSeg] = useState<'op1' | 'op2'>('op1');
  const [glass, setGlass] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const [dialog, setDialog] = useState<'confirm' | 'destroy' | null>(null);
  const [selected, setSelected] = useState(false);

  return (
    <Screen>
      <Header title="Bộ component" />
      <Body bottomBar={1}>
        <SectionTitle>Chữ</SectionTitle>
        <Txt variant="display">{formatMoney(10384357)}</Txt>
        <Txt variant="title">Tiêu đề màn 28</Txt>
        <Txt variant="dialogTitle">Tiêu đề hộp thoại 20</Txt>
        <Txt variant="section">Tiêu đề mục 18</Txt>
        <Txt>Nội dung 16 – Kích thước {formatSize(800, 2200)}, nẹp {formatMm(2012.6)}, {formatArea(7.465)}</Txt>
        <Txt variant="label">Nhãn ô nhập 14</Txt>
        <Txt variant="caption" color="text2">
          Chữ phụ 14 (thiết kế 13, nâng lên theo SRS NFR-USE-02)
        </Txt>

        <SectionTitle>Nút</SectionTitle>
        <Button label="Lưu bộ cửa" onPress={() => snack.show('Đã lưu cửa D1', { tone: 'success' })} />
        <Button label="Nút chính vô hiệu" disabled />
        <Button label="Đang xử lý" loading />
        <Button label="Nút phụ" kind="secondary" icon="copy" onPress={() => {}} />
        <Button label="Xóa dự án" kind="destructive" icon="trash" onPress={() => setDialog('destroy')} />
        <Button label="Liên kết Sửa" kind="ghost" icon="edit" onPress={() => {}} />

        <SectionTitle>Ô nhập</SectionTitle>
        <TextField label="Chiều rộng (W)" value={w} onChangeText={setW} unit="mm" kind="decimal" required />
        <TextField label="Chiều rộng (W)" value="1500" unit="mm" kind="decimal" error={bindUnits('Rộng cửa đi 1 cánh nên trong khoảng 600–1200 mm')} />
        <TextField label="Đơn giá kính" value="230.000" unit="đ/m²" readOnly hint="Theo Thư viện" />
        <TextField label="Số điện thoại" value="" placeholder="0923 456 789" kind="phone" />
        <Stepper label="Số bộ" value={qty} onChange={setQty} min={1} max={99} unit="bộ" />
        <Select
          label="Loại kính"
          value={glass}
          onChange={setGlass}
          options={[
            { value: 'KINH-TRANG-8', label: 'Kính trắng 8 ly', description: '230.000 đ/m²' },
            { value: 'KINH-CL-10', label: 'Kính cường lực 10 ly', description: '450.000 đ/m²' },
          ]}
        />

        <SectionTitle>Chọn, hiển thị, lớp phủ</SectionTitle>
        <ChipRow>
          <Chip label="Cửa đi (1)" selected={chips.di} onPress={() => setChips((s) => ({ ...s, di: !s.di }))} />
          <Chip label="Cửa sổ (1)" selected={chips.so} onPress={() => setChips((s) => ({ ...s, so: !s.so }))} />
          <Chip label="Vách" selected={chips.vach} onPress={() => setChips((s) => ({ ...s, vach: !s.vach }))} />
        </ChipRow>
        <Segmented
          accessibilityLabel="Kiểu báo giá"
          value={seg}
          onChange={setSeg}
          options={[
            { value: 'op1', label: 'Theo từng bộ' },
            { value: 'op2', label: 'Đồng giá m²' },
          ]}
        />
        <Card selected={selected} onPress={() => setSelected((s) => !s)} accessibilityLabel="Thẻ D1">
          <Txt variant="bodyStrong">D1 · Cửa đi mở quay 1 cánh</Txt>
          <Txt variant="caption" color="text2">
            {formatSize(800, 2200)} · 2 bộ
          </Txt>
        </Card>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Badge label="Báo giá" icon="quote" tone="primary" />
          <Badge label="Đã lưu" icon="checkCircle" tone="success" />
          <Badge label="Hao hụt 12%" icon="alert" tone="warning" />
          <Badge label="Có lỗi" icon="alert" tone="error" />
          <Badge label="Giá riêng" icon="tag" tone="info" />
          <Badge label="Cần xác nhận" icon="info" />
        </View>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <ListRow icon="alu" title="Nhôm" subtitle="2 mã · 11,62 m" value={formatMoney(872224)} onPress={() => {}} />
          <ListRow icon="glass" title="Kính" subtitle="1,365 m²" value={formatMoney(313950)} />
        </Card>
        <Button label="Hộp thoại xác nhận" kind="secondary" onPress={() => setDialog('confirm')} />
        <Button label="Snackbar có Hoàn tác" kind="secondary" onPress={() => snack.show('Đã xóa dự án “Anh Đoài”', { onUndo: () => snack.show('Đã khôi phục') })} />
        <EmptyState icon="projects" title="Chưa có dự án nào" message="Trạng thái rỗng: icon + tiêu đề + mô tả + một hành động." actionLabel="Tạo dự án đầu tiên" onAction={() => {}} />
        <ErrorState title="Không đọc được dữ liệu" message="Dữ liệu đã nhập vẫn an toàn. Hãy thử lại." onRetry={() => {}} />
        <SectionTitle>Icon</SectionTitle>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {ICON_NAMES.map((n) => (
            <View key={n} style={{ alignItems: 'center', width: 64, gap: 2 }}>
              <Icon name={n} color={c.text} />
              <Txt variant="caption" color="text2" numberOfLines={1}>
                {n}
              </Txt>
            </View>
          ))}
        </View>
      </Body>
      <BottomBar>
        <Button label="Mở bottom sheet" onPress={() => setSheet(true)} />
      </BottomBar>
      <BottomSheet
        visible={sheet}
        onClose={() => setSheet(false)}
        title="Thao tác dự án"
        footer={<Button label="Xong" onPress={() => setSheet(false)} />}
      >
        <ListRow icon="edit" title="Sửa thông tin" onPress={() => setSheet(false)} />
        <ListRow icon="copy" title="Nhân bản dự án" onPress={() => setSheet(false)} />
        <ListRow icon="export" title="Xuất file" onPress={() => setSheet(false)} />
      </BottomSheet>
      <Dialog
        visible={dialog !== null}
        title={dialog === 'destroy' ? 'Xóa dự án “Anh Đoài”?' : 'Lưu thay đổi?'}
        message={
          dialog === 'destroy'
            ? 'Dự án chuyển vào Đã xóa gần đây và tự xóa hẳn sau 30 ngày.'
            : 'Bạn đã sửa thông tin xưởng nhưng chưa lưu.'
        }
        confirmLabel={dialog === 'destroy' ? 'Xóa' : 'Lưu'}
        destructive={dialog === 'destroy'}
        onConfirm={() => setDialog(null)}
        onCancel={() => setDialog(null)}
      />
    </Screen>
  );
}
