import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { Button, ConsignmentDetailView, ErrorBanner, LoadingState } from '../../components';
import { CANCELLABLE_STATUSES } from '../../constants/consignment';
import { spacing } from '../../constants/theme';
import { consignmentsApi } from '../../services/api';
import type { SenderStackParamList } from '../../navigation/SenderNavigator';
import { UserRole, type ConsignmentDetail } from '../../types';
import { ApiError } from '../../utils/ApiError';
import { confirmAction } from '../../utils/confirm';

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
    confirmAction('Cancel consignment?', 'This cannot be undone.', 'Cancel consignment', performCancel, true);
  }, [performCancel]);

  if (loading) {
    return <LoadingState />;
  }

  if (error || !consignment) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md }}>
        <ErrorBanner message={error ?? 'Consignment not found.'} />
        <Button label="Retry" onPress={load} variant="secondary" />
      </View>
    );
  }

  const canCancel = CANCELLABLE_STATUSES.includes(consignment.status);

  return (
    <ConsignmentDetailView
      consignment={consignment}
      viewerRole={UserRole.SENDER}
      action={
        canCancel ? (
          <View style={{ gap: spacing.sm }}>
            {actionError ? <ErrorBanner message={actionError} /> : null}
            <Button
              label="Cancel consignment"
              onPress={handleCancelPress}
              loading={cancelling}
              disabled={cancelling}
              variant="danger"
            />
          </View>
        ) : undefined
      }
    />
  );
}
