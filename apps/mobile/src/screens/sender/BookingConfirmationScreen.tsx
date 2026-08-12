import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { Button, ErrorBanner, StatusBadge } from '../../components';
import { colors, spacing } from '../../constants/theme';
import { PARCEL_SIZE_LABELS } from '../../constants/consignment';
import { consignmentsApi } from '../../services/api';
import type { SenderStackParamList } from '../../navigation/SenderNavigator';
import { ConsignmentStatus } from '../../types';
import { ApiError } from '../../utils/ApiError';
import { formatFare } from '../../utils/format';

type Props = NativeStackScreenProps<SenderStackParamList, 'BookingConfirmation'>;

export function BookingConfirmationScreen({ route, navigation }: Props) {
  const [consignment, setConsignment] = useState(route.params.consignment);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const retryingRef = useRef(false);

  const needsBookingRetry = consignment.status === ConsignmentStatus.CREATED;

  const handleRetryBooking = useCallback(async () => {
    // Guards against a double-tap firing two submissions before React re-renders the disabled button.
    if (retryingRef.current) return;
    retryingRef.current = true;
    setRetrying(true);
    setRetryError(null);
    try {
      const booked = await consignmentsApi.bookConsignment(consignment.id);
      setConsignment(booked);
    } catch (error) {
      setRetryError(error instanceof ApiError ? error.message : 'Could not confirm the booking.');
    } finally {
      retryingRef.current = false;
      setRetrying(false);
    }
  }, [consignment.id]);

  return (
    <View style={styles.container}>
      <View style={styles.body}>
        <Text style={styles.title}>
          {needsBookingRetry ? 'Consignment created' : 'Booking confirmed'}
        </Text>
        <Text style={styles.trackingCode}>{consignment.trackingCode}</Text>
        <StatusBadge status={consignment.status} />

        {needsBookingRetry ? (
          <Text style={styles.notice}>
            {"The consignment was created, but confirming the booking didn't go through. You can retry " +
              'below, or from the consignment detail screen later.'}
          </Text>
        ) : null}

        {retryError ? <ErrorBanner message={retryError} /> : null}

        <View style={styles.summary}>
          <Text style={styles.summaryLine}>{PARCEL_SIZE_LABELS[consignment.parcelSize]} parcel</Text>
          <Text style={styles.summaryLine}>Fare: {formatFare(consignment.fare)}</Text>
        </View>

        {needsBookingRetry ? (
          <Button label="Confirm booking" onPress={handleRetryBooking} loading={retrying} disabled={retrying} />
        ) : null}
      </View>

      <View style={styles.actions}>
        <Button
          label="View details"
          onPress={() =>
            navigation.replace('ConsignmentDetail', { consignmentId: consignment.id })
          }
        />
        <Button label="Back to home" onPress={() => navigation.popToTop()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  body: {
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  trackingCode: {
    fontSize: 15,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
    color: colors.textMuted,
  },
  notice: {
    fontSize: 13,
    color: colors.warning,
  },
  summary: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  summaryLine: {
    fontSize: 14,
    color: colors.text,
  },
  actions: {
    gap: spacing.sm,
  },
});
