import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useLayoutEffect, useState } from 'react';
import { Pressable, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';

import { Button, Card, EmptyState, ErrorBanner, HeaderLogoutButton, LoadingState, StatusBadge } from '../../components';
import { ICONS } from '../../constants/icons';
import { colors, spacing, typography } from '../../constants/theme';
import { useAuth } from '../../hooks';
import { consignmentsApi } from '../../services/api';
import type { ConductorTabScreenProps } from '../../navigation/ConductorNavigator';
import { ConsignmentStatus, type ConsignmentDetail } from '../../types';
import { ApiError } from '../../utils/ApiError';
import { formatFare } from '../../utils/format';

type Props = ConductorTabScreenProps<'Queue'>;

interface Section {
  title: string;
  data: ConsignmentDetail[];
}

/**
 * GET /consignments/conductor returns everything a conductor is authorized to
 * see (findById's own CONDUCTOR predicate, as a list) in one query — grouped
 * here client-side into "needs a decision" (BOOKED, unclaimed) vs. "yours, in
 * progress" (already accepted by this conductor, any later status). The
 * grouping is presentational only; the authorization boundary is the
 * backend's, not re-derived here.
 */
function toSections(consignments: ConsignmentDetail[]): Section[] {
  const needsDecision = consignments.filter((c) => c.status === ConsignmentStatus.BOOKED);
  const inProgress = consignments.filter((c) => c.status !== ConsignmentStatus.BOOKED);
  const sections: Section[] = [];
  // Time-sensitive section first, when populated.
  if (needsDecision.length > 0) sections.push({ title: 'Needs a decision', data: needsDecision });
  if (inProgress.length > 0) sections.push({ title: 'Yours, in progress', data: inProgress });
  return sections;
}

export function AvailableConsignmentsScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [consignments, setConsignments] = useState<ConsignmentDetail[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ headerRight: () => <HeaderLogoutButton /> });
  }, [navigation]);

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
          <EmptyState
            icon={ICONS.conductorQueue}
            title="Nothing right now"
            subtitle="Booked consignments waiting to be accepted will show up here."
          />
        }
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              navigation.navigate('ConductorConsignmentDetail', { consignmentId: item.id })
            }
          >
            <Card style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={[styles.trackingCode, styles.mono]}>{item.trackingCode}</Text>
                <StatusBadge status={item.status} viewerRole={user?.role} />
              </View>
              <Text style={styles.routeName}>{item.route.name}</Text>
              <Text style={styles.haltLine}>
                {item.pickupHalt.name} → {item.dropoffHalt.name}
              </Text>
              <Text style={styles.fare}>{formatFare(item.fare)}</Text>
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
  list: {
    padding: spacing.lg,
    flexGrow: 1,
  },
  sectionHeader: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  card: {
    marginBottom: spacing.md,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trackingCode: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.text,
  },
  mono: {
    fontFamily: typography.monoFontFamily,
  },
  routeName: {
    fontSize: typography.size.md - 1,
    fontWeight: typography.weight.medium,
    color: colors.text,
  },
  haltLine: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
  },
  fare: {
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
