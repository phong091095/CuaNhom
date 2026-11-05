/**
 * Danh sách dự án (B1). GĐ 3 mới có khung: tiêu đề, ô tìm, trạng thái rỗng.
 * Danh sách thật, tạo dự án, xóa và hoàn tác làm ở GĐ 5 (sau khi có lưu trữ ở GĐ 4).
 */
import { useState } from 'react';
import { Body, EmptyState, Screen, ScreenTitle, TextField } from '@/ui';

export default function ProjectsScreen() {
  const [q, setQ] = useState('');
  return (
    <Screen>
      <ScreenTitle title="Dự án" />
      <Body>
        <TextField
          label="Tìm dự án"
          value={q}
          onChangeText={setQ}
          placeholder="Tên khách, công trình, SĐT"
          returnKeyType="search"
          testID="project-search"
        />
        <EmptyState
          icon="projects"
          title="Chưa có dự án nào"
          message="Tạo dự án cho khách hàng đầu tiên để bắt đầu bóc tách vật tư và làm báo giá."
        />
      </Body>
    </Screen>
  );
}
