import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Button, ErrorBanner } from '../../components';
import { colors, spacing } from '../../constants/theme';
import { senderRoutesApi } from '../../services/api';
import type { SenderStackParamList } from '../../navigation/SenderNavigator';
import type { AvailableRoute } from '../../types';
import { ApiError } from '../../utils/ApiError';

type Props = NativeStackScreenProps<SenderStackParamList, 'AvailableRoutes'>;

export function AvailableRoutesScreen({ navigation }: Props) {
  const [routes, setRoutes] = useState<AvailableRoute[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh: boolean) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const result = await senderRoutesApi.listAvailableRoutes();
      setRoutes(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load routes.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Refetch on every focus (not just first mount) so returning here after a
  // cancelled/failed booking attempt shows current data, matching the pattern
  // already used by admin's RouteListScreen.
  useFocusEffect(
    useCallback(() => {
      load(false);
    }, [load]),
  );

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
      <Text style={styles.helperIntro}>
        These are the demo routes currently available for booking.
      </Text>

      <FlatList
        data={routes ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>No routes available</Text>
            <Text style={styles.emptySubtitle}>Check back later or pull to refresh.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() =>
              navigation.navigate('SelectHalts', {
                routeId: item.id,
                routeName: item.name,
                routeRef: item.routeRef,
              })
            }
          >
            {item.routeRef ? <Text style={styles.routeRef}>Route {item.routeRef}</Text> : null}
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardSubtitle}>
              {item.origin} → {item.destination}
            </Text>
          </Pressable>
        )}
      />

      {error ? (
        <View style={styles.footer}>
          <ErrorBanner message={error} />
        </View>
      ) : null}
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
  helperIntro: {
    fontSize: 13,
    color: colors.textMuted,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
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
  routeRef: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
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
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
