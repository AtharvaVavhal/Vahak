import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { Button, ConsignmentDetailView, ErrorBanner, HandoverPinSheet, LoadingState } from '../../components';
import { spacing } from '../../constants/theme';
import { useAuth } from '../../hooks';
import { consignmentsApi } from '../../services/api';
import type { ConductorStackParamList } from '../../navigation/ConductorNavigator';
import { ConsignmentStatus, UserRole, type ConsignmentDetail } from '../../types';
import { ApiError } from '../../utils/ApiError';
import { confirmAction } from '../../utils/confirm';

type Props = NativeStackScreenProps<ConductorStackParamList, 'ConductorConsignmentDetail'>;

export interface RevealedHandover {
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

  const handleAcceptPress = useCallback(() => {
    confirmAction(
      'Accept this consignment?',
      "You'll be responsible for carrying it to the dropoff halt.",
      'Accept',
      performAccept,
    );
  }, [performAccept]);

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

  const handleInitiateHandoverPress = useCallback(() => {
    confirmAction(
      'Start handover?',
      "This generates a one-time PIN for the recipient. You'll only see it once.",
      'Start handover',
      performInitiateHandover,
    );
  }, [performInitiateHandover]);

  if (loading) {
    return <LoadingState />;
  }

  if (loadError || !consignment) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md }}>
        <ErrorBanner message={loadError ?? 'Consignment not found.'} />
        <Button label="Retry" onPress={load} variant="secondary" />
      </View>
    );
  }

  const isMyAcceptedConsignment = consignment.conductorId === user?.id;
  const canAccept = consignment.status === ConsignmentStatus.BOOKED;
  const canInitiateHandover =
    consignment.status === ConsignmentStatus.ACCEPTED && isMyAcceptedConsignment;

  return (
    <>
      <ConsignmentDetailView
        consignment={consignment}
        viewerRole={UserRole.CONDUCTOR}
        isMine={isMyAcceptedConsignment}
        action={
          <View style={{ gap: spacing.sm }}>
            {acceptError ? <ErrorBanner message={acceptError} /> : null}
            {handoverError ? <ErrorBanner message={handoverError} /> : null}

            {canAccept ? (
              <Button
                label="Accept consignment"
                onPress={handleAcceptPress}
                loading={accepting}
                disabled={accepting}
              />
            ) : null}

            {canInitiateHandover && !revealedHandover ? (
              <Button
                label="Start handover"
                onPress={handleInitiateHandoverPress}
                loading={handingOver}
                disabled={handingOver}
              />
            ) : null}
          </View>
        }
      />

      {revealedHandover ? (
        <HandoverPinSheet
          visible
          pin={revealedHandover.pin}
          expiresAt={revealedHandover.expiresAt}
          onDone={() => setRevealedHandover(null)}
        />
      ) : null}
    </>
  );
}
