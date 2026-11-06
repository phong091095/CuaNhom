/**
 * Thêm bộ cửa (D5) – mẫu chọn ở D3 (tham số "mau"); "t0" là lúc mở D3 để đo thời gian một bộ cửa;
 * "tu" = bộ cửa gốc khi chọn "Cửa cùng loại" ở chi tiết cửa (D6).
 */
import { useLocalSearchParams } from 'expo-router';
import { DoorForm } from '@/features/doors/DoorForm';

export default function NewDoorScreen() {
  const { id, mau, t0, tu } = useLocalSearchParams<{ id: string; mau: string; t0?: string; tu?: string }>();
  return <DoorForm projectId={id} templateId={mau} {...(tu ? { copyFromId: tu } : {})} {...(t0 ? { startedAt: Number(t0) } : {})} />;
}
