import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button, ErrorBanner, StatusBadge } from '../../components';
import { colors, spacing } from '../../constants/theme';
import { consignmentsApi } from '../../services/api';
import type { ConductorStackParamList } from '../../navigation/ConductorNavigator';
import { ConsignmentStatus, type ConsignmentDetail } from '../../types';
import { ApiError } from '../../utils/ApiError';
import { formatFare } from '../../utils/format';

type Props = NativeStackScreenProps<ConductorStackParamList, 'AvailableConsignments'>;

interface Section {
  title: string;
  data: ConsignmentDetail[];
}

/**
 * GET /consignments/conductor returns everything a conductor is authorized to
 * see (findById's own CONDUCTOR predicate, as a list) in one query — grouped
 * here client-side into "available to accept" (BOOKED, unclaimed) vs. "my
 * deliveries" (already accepted by this conductor, any later status). The
 * grouping is presentational only; the authorization boundary is the
 * backend's, not re-derived here.
 */
function toSections(consignments: ConsignmentDetail[]): Section[] {
  const available = consignments.filter((c) => c.status === ConsignmentStatus.BOOKED);
  const mine = consignments.filter((c) => c.status !== ConsignmentStatus.BOOKED);
  const sections: Section[] = [];
  if (available.length > 0) sections.push({ title: 'Available to accept', data: available });
  if (mine.length > 0) sections.push({ title: 'My deliveries', data: mine });
  return sections;
}

export function AvailableConsignmentsScreen({ navigation }: Props) {
  const [consignments, setConsignments] = useState<ConsignmentDetail[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh: boolean) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const result = await consignmentsApi.getConductorConsignments();
      setConsignments(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load consignments.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Refetch on every focus — accepting a consignment or returning from its
  // detail screen should move it between sections immediately.
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

  const sections = toSections(consignments ?? []);

  return (
    <View style={styles.flex}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>Nothing right now</Text>
            <Text style={styles.emptySubtitle}>
              Booked consignments waiting to be accepted will show up here.
            </Text>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() =>
              navigation.navigate('ConductorConsignmentDetail', { consignmentId: item.id })
            }
          >
            <View style={styles.cardTop}>
              <Text style={styles.trackingCode}>{item.trackingCode}</Text>
              <StatusBadge status={item.status} />
            </View>
            <Text style={styles.routeName}>{item.route.name}</Text>
            <Text style={styles.haltLine}>
              {item.pickupHalt.name} → {item.dropoffHalt.name}
            </Text>
            <Text style={styles.fare}>{formatFare(item.fare)}</Text>
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
    flexGrow: 1,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
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
  routeName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  haltLine: {
    fontSize: 13,
    color: colors.textMuted,
  },
  fare: {
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
