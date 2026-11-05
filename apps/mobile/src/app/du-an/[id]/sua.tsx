/** Sửa dự án (B6). */
import { useLocalSearchParams } from 'expo-router';
import { ProjectForm } from '@/features/projects/ProjectForm';

export default function EditProjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ProjectForm projectId={id} />;
}
