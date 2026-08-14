import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, ErrorBanner, InfoRow, StatusBadge } from '../../components';
import {
  CONSIGNMENT_STATUS_LABELS,
  CONSIGNMENT_STATUS_WORKFLOW,
  PARCEL_SIZE_LABELS,
} from '../../constants/consignment';
import { colors, spacing } from '../../constants/theme';
import { consignmentsApi } from '../../services/api';
import type { AdminStackParamList } from '../../navigation/AdminNavigator';
import { ConsignmentStatus, type ConsignmentDetail } from '../../types';
import { ApiError } from '../../utils/ApiError';
import { formatDateTime, formatFare } from '../../utils/format';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminConsignmentDetail'>;

/**
 * Read-only by design: the backend has no ADMIN-permitted mutation on consignments
 * (accept/handover/verify/cancel are all locked to CONDUCTOR/RECIPIENT/SENDER specifically),
 * so this screen never renders an action button.
 */
export function AdminConsignmentDetailScreen({ route }: Props) {
  const { consignmentId } = route.params;

  const [consignment, setConsignment] = useState<ConsignmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await consignmentsApi.getConsignmentById(consignmentId);
      setConsignment(data);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Could not load this consignment.');
    } finally {
      setLoading(false);
    }
  }, [consignmentId]);

  useEffect(() => {
    // Fetching on mount to synchronize with the backend, per React's documented data-fetching
    // pattern (react.dev/learn/synchronizing-with-effects#fetching-data) — not derived state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (loadError || !consignment) {
    return (
      <View style={styles.centered}>
        <ErrorBanner message={loadError ?? 'Consignment not found.'} />
        <Button label="Retry" onPress={load} />
      </View>
    );
  }

  const isCancelled = consignment.status === ConsignmentStatus.CANCELLED;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.trackingCode}>{consignment.trackingCode}</Text>
        <StatusBadge status={consignment.status} />
      </View>

      {!isCancelled ? (
        <View style={styles.workflow}>
          {CONSIGNMENT_STATUS_WORKFLOW.map((step, index) => {
            const stepIndex = CONSIGNMENT_STATUS_WORKFLOW.indexOf(consignment.status);
            const reached = stepIndex >= 0 && index <= stepIndex;
            return (
              <View key={step} style={styles.workflowStep}>
                <View style={[styles.workflowDot, reached && styles.workflowDotReached]} />
                <Text style={[styles.workflowLabel, reached && styles.workflowLabelReached]}>
                  {CONSIGNMENT_STATUS_LABELS[step]}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Parcel</Text>
        <InfoRow label="Size" value={PARCEL_SIZE_LABELS[consignment.parcelSize]} />
        {consignment.description ? <InfoRow label="Description" value={consignment.description} /> : null}
        <InfoRow label="Fare" value={formatFare(consignment.fare)} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Route</Text>
        <InfoRow label="Route" value={`${consignment.route.origin} → ${consignment.route.destination}`} />
        <InfoRow label="Pickup halt" value={consignment.pickupHalt.name} />
        <InfoRow label="Dropoff halt" value={consignment.dropoffHalt.name} />
        {consignment.bus ? <InfoRow label="Bus" value={consignment.bus.registration} /> : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sender</Text>
        <InfoRow label="Name" value={consignment.sender.name} />
        <InfoRow label="Phone" value={consignment.sender.phone} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recipient</Text>
        <InfoRow label="Name" value={consignment.recipient.name} />
        <InfoRow label="Phone" value={consignment.recipient.phone} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Timeline</Text>
        <InfoRow label="Created" value={formatDateTime(consignment.createdAt)} />
        <InfoRow label="Last updated" value={formatDateTime(consignment.updatedAt)} />
      </View>
    </ScrollView>
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
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackingCode: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  workflow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  workflowStep: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  workflowDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
  },
  workflowDotReached: {
    backgroundColor: colors.primary,
  },
  workflowLabel: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
  },
  workflowLabelReached: {
    color: colors.primary,
    fontWeight: '600',
  },
  section: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.xs,
    backgroundColor: colors.surface,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
});
