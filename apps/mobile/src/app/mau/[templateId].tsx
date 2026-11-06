/** Thông số hệ của một mẫu cửa (D4) – "v" là phiên bản bộ cửa đang dùng (bản chụp). */
import { useLocalSearchParams } from 'expo-router';
import { TemplateSpec } from '@/features/templates/TemplateSpec';

export default function TemplateSpecScreen() {
  const { templateId, v } = useLocalSearchParams<{ templateId: string; v?: string }>();
  const version = v !== undefined && /^\d+$/.test(v) ? Number(v) : undefined;
  return <TemplateSpec templateId={templateId} {...(version !== undefined ? { version } : {})} />;
}
