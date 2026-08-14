import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Button, Card, EmptyState, ErrorBanner, HeaderLogoutButton, LoadingState, StatusBadge } from '../../components';
import { ICONS } from '../../constants/icons';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { consignmentsApi } from '../../services/api';
import type { SenderStackParamList } from '../../navigation/SenderNavigator';
import { ConsignmentStatus, type ConsignmentListItem } from '../../types';
import { ApiError } from '../../utils/ApiError';
import { formatDateTime, formatFare } from '../../utils/format';

type Props = NativeStackScreenProps<SenderStackParamList, 'SenderHome'>;

const SUMMARY_STATUSES: { status: ConsignmentStatus; label: string }[] = [
  { status: ConsignmentStatus.IN_TRANSIT, label: 'in handover' },
  { status: ConsignmentStatus.ACCEPTED, label: 'in custody' },
  { status: ConsignmentStatus.BOOKED, label: 'awaiting pickup' },
];

export function SenderHomeScreen({ navigation }: Props) {
  const [consignments, setConsignments] = useState<ConsignmentListItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<ConsignmentStatus | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ headerRight: () => <HeaderLogoutButton /> });
  }, [navigation]);

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

  // Refetch every time this screen regains focus (e.g. returning from booking or cancelling a
  // consignment), not just on first mount — otherwise a stacked screen pop would show stale data.
  useFocusEffect(
    useCallback(() => {
      load(false);
    }, [load]),
  );

  const counts = useMemo(() => {
    const map = new Map<ConsignmentStatus, number>();
    for (const item of consignments ?? []) {
      map.set(item.status, (map.get(item.status) ?? 0) + 1);
    }
    return map;
  }, [consignments]);

  const visibleConsignments = useMemo(() => {
    if (!filterStatus) return consignments ?? [];
    return (consignments ?? []).filter((item) => item.status === filterStatus);
  }, [consignments, filterStatus]);

  if (loading) {
    return <LoadingState />;
  }

  if (error && !consignments) {
    return (
      <View style={styles.centered}>
        <ErrorBanner message={error} />
        <Button label="Retry" onPress={() => load(false)} variant="secondary" />
      </View>
    );
  }

  const activeSummary = SUMMARY_STATUSES.filter((s) => (counts.get(s.status) ?? 0) > 0);

  return (
    <FlatList
      data={visibleConsignments}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <Pressable
            style={styles.cta}
            onPress={() => navigation.navigate('AvailableRoutes')}
            testID="sender-send-parcel-cta"
          >
            <ICONS.bookParcel size={20} color={colors.onPrimary} strokeWidth={2.25} />
            <Text style={styles.ctaLabel}>Send a parcel</Text>
          </Pressable>

          {activeSummary.length > 0 ? (
            <View style={styles.summaryRow}>
              {activeSummary.map(({ status, label }) => {
                const isActive = filterStatus === status;
                return (
                  <Pressable
                    key={status}
                    onPress={() => setFilterStatus(isActive ? null : status)}
                    style={[styles.summaryChip, isActive && styles.summaryChipActive]}
                  >
                    <Text style={[styles.summaryText, isActive && styles.summaryTextActive]}>
                      {counts.get(status)} {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {filterStatus && visibleConsignments.length === 0 ? (
            <Text style={styles.filterEmpty}>No consignments with that status right now.</Text>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        !filterStatus ? (
          <EmptyState
            icon={ICONS.recipientInbox}
            title="No consignments yet"
            subtitle="Bookings you create will show up here."
          />
        ) : null
      }
      renderItem={({ item }) => (
        <Pressable onPress={() => navigation.navigate('ConsignmentDetail', { consignmentId: item.id })}>
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={[styles.trackingCode, styles.mono]}>{item.trackingCode}</Text>
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
          </Card>
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
  header: {
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  ctaLabel: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.weight.medium,
    color: colors.onPrimary,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  summaryChip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.ink150,
    backgroundColor: colors.surface,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
  },
  summaryChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },
  summaryText: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.weight.medium,
    color: colors.textSecondary,
  },
  summaryTextActive: {
    color: colors.primary,
  },
  filterEmpty: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  card: {
    marginBottom: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackingCode: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.text,
  },
  mono: {
    fontFamily: typography.monoFontFamily,
  },
  routeLine: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.medium,
    color: colors.text,
  },
  meta: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  fare: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.textMuted,
  },
});
