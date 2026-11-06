/** Thêm bộ cửa (D5) – mẫu chọn ở D3 (tham số "mau"); "t0" là lúc mở D3 để đo thời gian một bộ cửa. */
import { useLocalSearchParams } from 'expo-router';
import { DoorForm } from '@/features/doors/DoorForm';

export default function NewDoorScreen() {
  const { id, mau, t0 } = useLocalSearchParams<{ id: string; mau: string; t0?: string }>();
  return <DoorForm projectId={id} templateId={mau} {...(t0 ? { startedAt: Number(t0) } : {})} />;
}
