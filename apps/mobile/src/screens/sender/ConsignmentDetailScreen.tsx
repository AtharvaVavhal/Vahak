import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, ErrorBanner, InfoRow, StatusBadge } from '../../components';
import {
  CANCELLABLE_STATUSES,
  CONSIGNMENT_STATUS_LABELS,
  CONSIGNMENT_STATUS_WORKFLOW,
  PARCEL_SIZE_LABELS,
} from '../../constants/consignment';
import { colors, spacing } from '../../constants/theme';
import { consignmentsApi } from '../../services/api';
import type { SenderStackParamList } from '../../navigation/SenderNavigator';
import { ConsignmentStatus, type ConsignmentDetail } from '../../types';
import { ApiError } from '../../utils/ApiError';
import { formatDateTime, formatFare } from '../../utils/format';

type Props = NativeStackScreenProps<SenderStackParamList, 'ConsignmentDetail'>;

export function ConsignmentDetailScreen({ route }: Props) {
  const { consignmentId } = route.params;
  const [consignment, setConsignment] = useState<ConsignmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await consignmentsApi.getConsignmentById(consignmentId);
      setConsignment(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load this consignment.');
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

  const performCancel = useCallback(async () => {
    setActionError(null);
    setCancelling(true);
    try {
      const updated = await consignmentsApi.cancelConsignment(consignmentId);
      setConsignment((prev) => (prev ? { ...prev, ...updated } : prev));
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not cancel this consignment.');
    } finally {
      setCancelling(false);
    }
  }, [consignmentId]);

  const handleCancelPress = useCallback(() => {
    Alert.alert('Cancel consignment?', 'This cannot be undone.', [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Cancel consignment', style: 'destructive', onPress: performCancel },
    ]);
  }, [performCancel]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error || !consignment) {
    return (
      <View style={styles.centered}>
        <ErrorBanner message={error ?? 'Consignment not found.'} />
        <Button label="Retry" onPress={load} />
      </View>
    );
  }

  const isCancelled = consignment.status === ConsignmentStatus.CANCELLED;
  const canCancel = CANCELLABLE_STATUSES.includes(consignment.status);

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
        <Text style={styles.sectionTitle}>Recipient</Text>
        <InfoRow label="Name" value={consignment.recipient.name} />
        <InfoRow label="Phone" value={consignment.recipient.phone} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Timeline</Text>
        <InfoRow label="Created" value={formatDateTime(consignment.createdAt)} />
        <InfoRow label="Last updated" value={formatDateTime(consignment.updatedAt)} />
      </View>

      {actionError ? <ErrorBanner message={actionError} /> : null}

      {canCancel ? (
        <Button
          label="Cancel consignment"
          onPress={handleCancelPress}
          loading={cancelling}
          disabled={cancelling}
        />
      ) : null}
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
