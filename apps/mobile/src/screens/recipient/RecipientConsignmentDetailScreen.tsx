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
import { useAuth } from '../../hooks';
import { consignmentsApi } from '../../services/api';
import type { RecipientStackParamList } from '../../navigation/RecipientNavigator';
import { ConsignmentStatus, type ConsignmentDetail } from '../../types';
import { ApiError } from '../../utils/ApiError';
import { formatDateTime, formatFare } from '../../utils/format';

type Props = NativeStackScreenProps<RecipientStackParamList, 'RecipientConsignmentDetail'>;

export function RecipientConsignmentDetailScreen({ route, navigation }: Props) {
  const { consignmentId } = route.params;
  const { user } = useAuth();

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
      setLoadError(err instanceof ApiError ? err.message : 'Could not load this delivery.');
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
  const isMyDelivery = consignment.recipientId === user?.id;
  const canVerify = consignment.status === ConsignmentStatus.IN_TRANSIT && isMyDelivery;

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
        <Text style={styles.sectionTitle}>Timeline</Text>
        <InfoRow label="Created" value={formatDateTime(consignment.createdAt)} />
        <InfoRow label="Last updated" value={formatDateTime(consignment.updatedAt)} />
      </View>

      {canVerify ? (
        <Button
          label="Enter handover PIN"
          onPress={() => navigation.navigate('PinVerification', { consignmentId: consignment.id })}
        />
      ) : null}

      {consignment.status === ConsignmentStatus.IN_TRANSIT && !isMyDelivery ? (
        <Text style={styles.notice}>
          {"This delivery isn't addressed to your account, so it can't be verified from here."}
        </Text>
      ) : null}

      {consignment.status === ConsignmentStatus.CREATED ? (
        <Text style={styles.notice}>{"This consignment hasn't been booked by the sender yet."}</Text>
      ) : null}

      {consignment.status === ConsignmentStatus.BOOKED ? (
        <Text style={styles.notice}>Waiting for a conductor to accept this consignment.</Text>
      ) : null}

      {consignment.status === ConsignmentStatus.ACCEPTED ? (
        <Text style={styles.notice}>{"The conductor hasn't started the handover yet."}</Text>
      ) : null}

      {consignment.status === ConsignmentStatus.DELIVERED ? (
        <Text style={styles.notice}>This consignment has already been delivered.</Text>
      ) : null}

      {isCancelled ? <Text style={styles.notice}>This consignment was cancelled.</Text> : null}
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
  notice: {
    fontSize: 13,
    color: colors.textMuted,
  },
});
