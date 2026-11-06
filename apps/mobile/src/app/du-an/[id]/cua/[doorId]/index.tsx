/** Chi tiết bộ cửa (D6). */
import { useLocalSearchParams } from 'expo-router';
import { DoorDetail } from '@/features/doors/DoorDetail';

export default function DoorDetailScreen() {
  const { id, doorId } = useLocalSearchParams<{ id: string; doorId: string }>();
  return <DoorDetail projectId={id} doorId={doorId} />;
}
