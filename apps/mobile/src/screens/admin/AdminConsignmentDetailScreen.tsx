import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { Button, ConsignmentDetailView, ErrorBanner, LoadingState } from '../../components';
import { spacing } from '../../constants/theme';
import { consignmentsApi } from '../../services/api';
import type { AdminStackParamList } from '../../navigation/AdminNavigator';
import { UserRole, type ConsignmentDetail } from '../../types';
import { ApiError } from '../../utils/ApiError';

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

  return <ConsignmentDetailView consignment={consignment} viewerRole={UserRole.ADMIN} />;
}
