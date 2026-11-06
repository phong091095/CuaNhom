/** Sửa bộ cửa (D5) – tính theo bản chụp đúng phiên bản mẫu của bộ cửa. */
import { useLocalSearchParams } from 'expo-router';
import { DoorForm } from '@/features/doors/DoorForm';

export default function EditDoorScreen() {
  const { id, doorId } = useLocalSearchParams<{ id: string; doorId: string }>();
  return <DoorForm projectId={id} doorId={doorId} />;
}
