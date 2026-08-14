import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TriangleAlert } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Card, ErrorBanner, StatusBadge, StepIndicator } from '../../components';
import { colors, radius, spacing, typography } from '../../constants/theme';
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
        <StepIndicator step={4} total={4} />

        <Text style={styles.title}>{needsBookingRetry ? 'Consignment created' : 'Booking confirmed'}</Text>

        <View style={styles.trackingRow}>
          <Text style={[styles.trackingCode, styles.mono]}>{consignment.trackingCode}</Text>
          <StatusBadge status={consignment.status} />
        </View>

        {needsBookingRetry ? (
          <View style={styles.warningCard}>
            <TriangleAlert size={18} color={colors.warning} strokeWidth={2} />
            <View style={styles.warningBody}>
              <Text style={styles.warningTitle}>Booking didn&apos;t go through</Text>
              <Text style={styles.warningText}>
                The consignment was created, but confirming the booking failed. Retry below, or from the
                consignment detail screen later.
              </Text>
              {retryError ? <ErrorBanner message={retryError} /> : null}
              <Button
                label="Retry booking"
                onPress={handleRetryBooking}
                loading={retrying}
                disabled={retrying}
                variant="secondary"
              />
            </View>
          </View>
        ) : null}

        <Card style={styles.summary}>
          <Text style={styles.summaryLine}>{PARCEL_SIZE_LABELS[consignment.parcelSize]} parcel</Text>
          <Text style={styles.summaryLine}>Fare: {formatFare(consignment.fare)}</Text>
        </Card>
      </View>

      <View style={styles.actions}>
        <Button
          label="View details"
          onPress={() =>
            navigation.replace('ConsignmentDetail', { consignmentId: consignment.id })
          }
        />
        <Button label="Back to home" onPress={() => navigation.popToTop()} variant="secondary" />
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
    fontSize: typography.title.fontSize,
    lineHeight: typography.title.lineHeight,
    fontWeight: typography.title.fontWeight,
    color: colors.text,
    marginTop: spacing.xs,
  },
  trackingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  trackingCode: {
    fontSize: typography.codeEmphasis.fontSize,
    fontWeight: typography.codeEmphasis.fontWeight,
    color: colors.text,
  },
  mono: {
    fontFamily: typography.monoFontFamily,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    alignSelf: 'stretch',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.warning,
    backgroundColor: colors.warningTint,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  warningBody: {
    flex: 1,
    gap: spacing.sm,
  },
  warningTitle: {
    fontSize: typography.label.fontSize,
    fontWeight: typography.label.fontWeight,
    color: colors.warning,
  },
  warningText: {
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    color: colors.textSecondary,
  },
  summary: {
    marginTop: spacing.sm,
    alignSelf: 'stretch',
  },
  summaryLine: {
    fontSize: typography.size.md - 1,
    color: colors.text,
  },
  actions: {
    gap: spacing.sm,
  },
});
