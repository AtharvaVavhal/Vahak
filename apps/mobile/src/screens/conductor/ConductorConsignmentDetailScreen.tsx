import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, ErrorBanner, InfoRow, StatusBadge } from '../../components';
import {
  CONSIGNMENT_STATUS_WORKFLOW,
  CONSIGNMENT_STATUS_LABELS,
  PARCEL_SIZE_LABELS,
} from '../../constants/consignment';
import { colors, spacing } from '../../constants/theme';
import { useAuth } from '../../hooks';
import { consignmentsApi } from '../../services/api';
import type { ConductorStackParamList } from '../../navigation/ConductorNavigator';
import { ConsignmentStatus, type ConsignmentDetail } from '../../types';
import { ApiError } from '../../utils/ApiError';
import { formatDateTime, formatFare } from '../../utils/format';

type Props = NativeStackScreenProps<ConductorStackParamList, 'ConductorConsignmentDetail'>;

interface RevealedHandover {
  pin: string;
  expiresAt: string;
}

export function ConductorConsignmentDetailScreen({ route }: Props) {
  const { consignmentId } = route.params;
  const { user } = useAuth();

  const [consignment, setConsignment] = useState<ConsignmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const acceptingRef = useRef(false);

  const [handingOver, setHandingOver] = useState(false);
  const [handoverError, setHandoverError] = useState<string | null>(null);
  const handingOverRef = useRef(false);
  const [revealedHandover, setRevealedHandover] = useState<RevealedHandover | null>(null);

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

  const performAccept = useCallback(async () => {
    if (acceptingRef.current) return;
    acceptingRef.current = true;
    setAccepting(true);
    setAcceptError(null);
    try {
      const updated = await consignmentsApi.acceptConsignment(consignmentId);
      setConsignment((prev) => (prev ? { ...prev, ...updated } : prev));
    } catch (err) {
      setAcceptError(err instanceof ApiError ? err.message : 'Could not accept this consignment.');
    } finally {
      acceptingRef.current = false;
      setAccepting(false);
    }
  }, [consignmentId]);

  const performInitiateHandover = useCallback(async () => {
    if (handingOverRef.current) return;
    handingOverRef.current = true;
    setHandingOver(true);
    setHandoverError(null);
    try {
      const { handoverPin, handoverPinExpiresAt, ...updated } =
        await consignmentsApi.initiateHandover(consignmentId);
      setConsignment((prev) => (prev ? { ...prev, ...updated } : prev));
      setRevealedHandover({ pin: handoverPin, expiresAt: handoverPinExpiresAt });
    } catch (err) {
      setHandoverError(err instanceof ApiError ? err.message : 'Could not start the handover.');
    } finally {
      handingOverRef.current = false;
      setHandingOver(false);
    }
  }, [consignmentId]);

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
  const isMyAcceptedConsignment = consignment.conductorId === user?.id;
  const canAccept = consignment.status === ConsignmentStatus.BOOKED;
  const canInitiateHandover =
    consignment.status === ConsignmentStatus.ACCEPTED && isMyAcceptedConsignment;

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

      {revealedHandover ? (
        <View style={styles.pinCard}>
          <Text style={styles.pinCardTitle}>Handover PIN</Text>
          <Text style={styles.pinValue}>{revealedHandover.pin}</Text>
          <Text style={styles.pinNotice}>
            {'Share this with the recipient now — it will not be shown again. Expires ' +
              formatDateTime(revealedHandover.expiresAt) +
              '.'}
          </Text>
        </View>
      ) : null}

      {acceptError ? <ErrorBanner message={acceptError} /> : null}
      {handoverError ? <ErrorBanner message={handoverError} /> : null}

      {canAccept ? (
        <Button
          label="Accept consignment"
          onPress={performAccept}
          loading={accepting}
          disabled={accepting}
        />
      ) : null}

      {consignment.status === ConsignmentStatus.ACCEPTED && !isMyAcceptedConsignment ? (
        <Text style={styles.notice}>This consignment was already accepted by another conductor.</Text>
      ) : null}

      {canInitiateHandover ? (
        <Button
          label="Start handover"
          onPress={performInitiateHandover}
          loading={handingOver}
          disabled={handingOver}
        />
      ) : null}

      {consignment.status === ConsignmentStatus.IN_TRANSIT && !revealedHandover ? (
        <Text style={styles.notice}>
          {'The handover PIN was already issued to the recipient earlier and cannot be shown again. ' +
            'The recipient completes delivery by verifying it in their own app.'}
        </Text>
      ) : null}

      {consignment.status === ConsignmentStatus.CREATED ? (
        <Text style={styles.notice}>
          {"This consignment hasn't been booked by the sender yet, so it can't be accepted."}
        </Text>
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
  pinCard: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    padding: spacing.lg,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pinCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pinValue: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 6,
    color: colors.text,
  },
  pinNotice: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  notice: {
    fontSize: 13,
    color: colors.textMuted,
  },
});
