import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Button, ErrorBanner, StatusBadge } from '../../components';
import { colors, spacing } from '../../constants/theme';
import { consignmentsApi } from '../../services/api';
import type { SenderStackParamList } from '../../navigation/SenderNavigator';
import type { ConsignmentListItem } from '../../types';
import { ApiError } from '../../utils/ApiError';
import { formatDateTime, formatFare } from '../../utils/format';

type Props = NativeStackScreenProps<SenderStackParamList, 'MyConsignments'>;

export function MyConsignmentsScreen({ navigation }: Props) {
  const [consignments, setConsignments] = useState<ConsignmentListItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh: boolean) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await consignmentsApi.getMyConsignments();
      setConsignments(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load your consignments.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Refetch every time this screen regains focus (e.g. returning from cancelling a
  // consignment on the detail screen), not just on first mount — otherwise a stacked
  // screen pop would show a stale status.
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

  if (error) {
    return (
      <View style={styles.centered}>
        <ErrorBanner message={error} />
        <Button label="Retry" onPress={() => load(false)} />
      </View>
    );
  }

  return (
    <FlatList
      data={consignments ?? []}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No consignments yet</Text>
          <Text style={styles.emptySubtitle}>Bookings you create will show up here.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          style={styles.card}
          onPress={() => navigation.navigate('ConsignmentDetail', { consignmentId: item.id })}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.trackingCode}>{item.trackingCode}</Text>
            <StatusBadge status={item.status} />
          </View>
          <Text style={styles.routeLine}>
            {item.route.origin} → {item.route.destination}
          </Text>
          <Text style={styles.meta}>To {item.recipient.name}</Text>
          <View style={styles.cardFooter}>
            <Text style={styles.meta}>{formatDateTime(item.createdAt)}</Text>
            <Text style={styles.fare}>{formatFare(item.fare)}</Text>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackingCode: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  routeLine: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  meta: {
    fontSize: 12,
    color: colors.textMuted,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  fare: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
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
});
