/**
 * Danh sách dự án (B1 · SRS SCR-01): mới sửa trước, tìm không dấu, thẻ có báo giá,
 * nút nổi "Tạo dự án", xóa kèm Hoàn tác 10 giây.
 * Lệch thiết kế: không có banner "Không có mạng"/lỗi máy chủ/quảng cáo (app offline, NFR-SEC-01).
 */
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, View } from 'react-native';
import { ProjectActions, type ProjectActionsTarget } from '@/features/projects/ProjectActions';
import { ProjectCard } from '@/features/projects/ProjectCard';
import { useProjects } from '@/store/projects';
import { EmptyState, ErrorState, Fab, Screen, ScreenTitle, SearchField, SkeletonCard, useSnackbarVisible } from '@/ui';

export default function ProjectsScreen() {
  const { items, totals, query, loading, error, load, setQuery } = useProjects();
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [actions, setActions] = useState<ProjectActionsTarget | null>(null);
  const snackVisible = useSnackbarVisible();

  useFocusEffect(
    useCallback(() => {
      load().finally(() => setLoadedOnce(true));
    }, [load]),
  );

  const searching = query.trim() !== '';
  const count = !searching && items.length > 0 ? `${items.length} dự án` : undefined;

  let body: React.ReactNode;
  if (error) {
    body = <ErrorState title="Không đọc được danh sách dự án" message="Dữ liệu của bạn vẫn an toàn – hãy thử lại." onRetry={load} />;
  } else if (!loadedOnce && loading) {
    body = (
      <View style={{ paddingHorizontal: 16, gap: 12 }}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </View>
    );
  } else if (items.length === 0 && !searching) {
    body = (
      <EmptyState
        icon="projects"
        title="Chưa có dự án nào"
        message="Tạo dự án cho khách hàng đầu tiên để bắt đầu bóc tách vật tư và làm báo giá."
        actionLabel="Tạo dự án đầu tiên"
        onAction={() => router.push('/du-an/moi')}
      />
    );
  } else {
    body = (
      <FlatList
        data={items}
        keyExtractor={(p) => p.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 96, gap: 12, width: '100%', maxWidth: 720, alignSelf: 'center' }}
        ListEmptyComponent={
          <EmptyState icon="search" title="Không tìm thấy dự án" message="Thử tìm bằng tên khách, tên công trình, số điện thoại hoặc địa chỉ khác." />
        }
        renderItem={({ item }) => (
          <ProjectCard
            project={item}
            totals={totals[item.id]}
            onPress={() => router.push(`/du-an/${item.id}`)}
            onMore={() =>
              setActions({
                project: item,
                doorCount: item.doorCount,
                setCount: item.setCount,
                ...(totals[item.id] ? { op1: totals[item.id]!.op1 } : {}),
              })
            }
          />
        )}
      />
    );
  }

  return (
    <Screen>
      <ScreenTitle title="Dự án" aside={count} />
      <View style={{ paddingHorizontal: 16, paddingBottom: 12, width: '100%', maxWidth: 720, alignSelf: 'center' }}>
        <SearchField
          testID="project-search"
          value={query}
          onChangeText={setQuery}
          placeholder="Tìm tên khách, công trình, SĐT, địa chỉ"
          accessibilityLabel="Tìm dự án"
        />
      </View>
      <View style={{ flex: 1 }}>{body}</View>
      {(items.length > 0 || searching) && !snackVisible ? <Fab label="Tạo dự án" icon="plus" testID="fab-new-project" onPress={() => router.push('/du-an/moi')} /> : null}
      <ProjectActions target={actions} onClose={() => setActions(null)} onChanged={load} />
    </Screen>
  );
}
