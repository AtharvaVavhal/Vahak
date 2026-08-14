import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Button, Card, EmptyState, ErrorBanner, LoadingState } from '../../components';
import { ICONS } from '../../constants/icons';
import { colors, radius, spacing, typography } from '../../constants/theme';
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
    return <LoadingState />;
  }

  if (error && !routes) {
    return (
      <View style={styles.centered}>
        <ErrorBanner message={error} />
        <Button label="Retry" onPress={() => load(false)} variant="secondary" />
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
          <EmptyState
            icon={ICONS.route}
            title="No routes available"
            subtitle="Check back later or pull to refresh."
          />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              navigation.navigate('SelectHalts', {
                routeId: item.id,
                routeName: item.name,
                routeRef: item.routeRef,
              })
            }
          >
            <Card style={styles.card}>
              <View style={styles.iconWrap}>
                <ICONS.route size={18} color={colors.primary} strokeWidth={2} />
              </View>
              <View style={styles.cardBody}>
                {item.routeRef ? <Text style={styles.routeRef}>Route {item.routeRef}</Text> : null}
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardSubtitle}>
                  {item.origin} → {item.destination}
                </Text>
              </View>
            </Card>
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
    fontSize: typography.size.sm,
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryTint,
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  routeRef: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.primary,
  },
  cardTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.text,
  },
  cardSubtitle: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
