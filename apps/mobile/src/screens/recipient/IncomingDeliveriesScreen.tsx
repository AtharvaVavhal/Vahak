import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Button, ErrorBanner, StatusBadge } from '../../components';
import { colors, spacing } from '../../constants/theme';
import { consignmentsApi } from '../../services/api';
import type { RecipientStackParamList } from '../../navigation/RecipientNavigator';
import type { ConsignmentDetail } from '../../types';
import { ApiError } from '../../utils/ApiError';

type Props = NativeStackScreenProps<RecipientStackParamList, 'IncomingDeliveries'>;

export function IncomingDeliveriesScreen({ navigation }: Props) {
  const [consignments, setConsignments] = useState<ConsignmentDetail[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh: boolean) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const result = await consignmentsApi.getRecipientConsignments();
      setConsignments(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load deliveries.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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

  if (error && !consignments) {
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
        data={consignments ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>No deliveries yet</Text>
            <Text style={styles.emptySubtitle}>Parcels sent to you will show up here.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() =>
              navigation.navigate('RecipientConsignmentDetail', { consignmentId: item.id })
            }
          >
            <View style={styles.cardTop}>
              <Text style={styles.trackingCode}>{item.trackingCode}</Text>
              <StatusBadge status={item.status} />
            </View>
            <Text style={styles.senderLine}>From {item.sender.name}</Text>
            <Text style={styles.haltLine}>
              {item.pickupHalt.name} → {item.dropoffHalt.name}
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
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trackingCode: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  senderLine: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  haltLine: {
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
    textAlign: 'center',
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
