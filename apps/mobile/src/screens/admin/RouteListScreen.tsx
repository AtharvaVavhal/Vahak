import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Button, ErrorBanner } from '../../components';
import { colors, spacing } from '../../constants/theme';
import { adminApi } from '../../services/api';
import type { AdminStackParamList } from '../../navigation/AdminNavigator';
import type { RouteWithRelations } from '../../types';
import { ApiError } from '../../utils/ApiError';

type Props = NativeStackScreenProps<AdminStackParamList, 'RouteList'>;

const PAGE_LIMIT = 20;

export function RouteListScreen({ navigation }: Props) {
  const [routes, setRoutes] = useState<RouteWithRelations[] | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh: boolean) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const result = await adminApi.listRoutes(1, PAGE_LIMIT);
      setRoutes(result.data);
      setPage(result.meta.page);
      setTotalPages(result.meta.totalPages);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load routes.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Refetch every time this screen regains focus (e.g. returning from creating/editing a
  // route), not just on first mount — otherwise a stacked screen pop would show stale data.
  useFocusEffect(
    useCallback(() => {
      load(false);
    }, [load]),
  );

  const loadMore = useCallback(async () => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    try {
      const result = await adminApi.listRoutes(page + 1, PAGE_LIMIT);
      setRoutes((prev) => [...(prev ?? []), ...result.data]);
      setPage(result.meta.page);
      setTotalPages(result.meta.totalPages);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load more routes.');
    } finally {
      setLoadingMore(false);
    }
  }, [page, totalPages, loadingMore]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error && !routes) {
    return (
      <View style={styles.centered}>
        <ErrorBanner message={error} />
        <Button label="Retry" onPress={() => load(false)} />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <FlatList
        data={routes ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>No routes yet</Text>
            <Text style={styles.emptySubtitle}>Create one to get started.</Text>
          </View>
        }
        ListFooterComponent={
          page < totalPages ? (
            <Button label="Load more" onPress={loadMore} loading={loadingMore} disabled={loadingMore} />
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate('RouteDetail', { routeId: item.id })}
          >
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardSubtitle}>
              {item.origin} → {item.destination}
            </Text>
            <Text style={styles.meta}>
              {item.halts.length} halt{item.halts.length === 1 ? '' : 's'} · {item.buses.length} bus
              {item.buses.length === 1 ? '' : 'es'}
            </Text>
          </Pressable>
        )}
      />

      <View style={styles.footer}>
        {error ? <ErrorBanner message={error} /> : null}
        <Button label="Add route" onPress={() => navigation.navigate('RouteForm', {})} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.md,
    flexGrow: 1,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    backgroundColor: colors.surface,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
  },
  meta: {
    fontSize: 12,
    color: colors.textMuted,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
  },
  footer: {
    padding: spacing.lg,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
