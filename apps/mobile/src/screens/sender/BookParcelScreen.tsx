import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Card, ErrorBanner, InfoRow, ParcelSizeSelector, Screen, StepIndicator, TextField } from '../../components';
import { ICONS } from '../../constants/icons';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { consignmentsApi } from '../../services/api';
import type { SenderStackParamList } from '../../navigation/SenderNavigator';
import { ParcelSize, type CreateConsignmentRequest } from '../../types';
import { ApiError } from '../../utils/ApiError';
import { confirmAction } from '../../utils/confirm';
import { validateOptionalUuid, validateRequiredUuid } from '../../utils/validation';

type Props = NativeStackScreenProps<SenderStackParamList, 'BookParcel'>;

interface FormState {
  recipientId: string;
  busId: string;
  description: string;
}

const initialForm: FormState = {
  recipientId: '',
  busId: '',
  description: '',
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

export function BookParcelScreen({ route, navigation }: Props) {
  const { routeId, routeName, routeRef, pickupHaltId, pickupHaltName, dropoffHaltId, dropoffHaltName } =
    route.params;

  const [form, setForm] = useState<FormState>(initialForm);
  const [parcelSize, setParcelSize] = useState<ParcelSize>(ParcelSize.SMALL);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const setField = (field: keyof FormState) => (text: string) => {
    setForm((prev) => ({ ...prev, [field]: text }));
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const performSubmit = useCallback(async () => {
    if (submittingRef.current) return;

    // Route/pickup/dropoff come from the browsing flow (AvailableRoutesScreen ->
    // SelectHaltsScreen), never typed by hand. `fare` is intentionally omitted —
    // the backend is the sole authority on price (see types/consignment.ts) and
    // always assigns its own server-computed demo fare regardless of what's sent.
    const payload: CreateConsignmentRequest = {
      recipientId: form.recipientId.trim(),
      routeId,
      pickupHaltId,
      dropoffHaltId,
      parcelSize,
      ...(form.busId.trim() ? { busId: form.busId.trim() } : {}),
      ...(form.description.trim() ? { description: form.description.trim() } : {}),
    };

    submittingRef.current = true;
    setSubmitting(true);
    try {
      const created = await consignmentsApi.createConsignment(payload);

      // "Book Parcel" is one user action; the backend models it as create -> book.
      // If the immediate book confirmation fails, keep the created consignment and let
      // the user retry from the confirmation/detail screen rather than losing the booking.
      let finalConsignment = created;
      try {
        finalConsignment = await consignmentsApi.bookConsignment(created.id);
      } catch {
        // fall through with `created` (status CREATED)
      }

      navigation.replace('BookingConfirmation', { consignment: finalConsignment });
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Something went wrong. Try again.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [form, parcelSize, routeId, pickupHaltId, dropoffHaltId, navigation]);

  const handleSubmit = useCallback(() => {
    // Guards against a double-tap firing two submissions before React re-renders the disabled button.
    if (submittingRef.current) return;

    const errors: FieldErrors = {
      recipientId: validateRequiredUuid('Recipient ID', form.recipientId) ?? undefined,
      busId: validateOptionalUuid('Bus ID', form.busId) ?? undefined,
    };
    setFieldErrors(errors);
    setFormError(null);
    if (Object.values(errors).some(Boolean)) return;

    confirmAction('Confirm this booking?', 'This books the parcel on the selected route.', 'Confirm booking', performSubmit);
  }, [form, performSubmit]);

  return (
    <Screen>
      <StepIndicator step={3} total={4} />

      <Card title="Route">
        <InfoRow label="Route" value={routeRef ? `${routeRef} · ${routeName}` : routeName} />
        <InfoRow label="Pickup" value={pickupHaltName} />
        <InfoRow label="Dropoff" value={dropoffHaltName} />
      </Card>

      <View style={styles.fareCard}>
        <View style={styles.fareIconWrap}>
          <ICONS.fare size={18} color={colors.textSecondary} strokeWidth={2} />
        </View>
        <View style={styles.fareBody}>
          <Text style={styles.fareLabel}>Fare</Text>
          <Text style={styles.fareValue}>Determined by the server after booking</Text>
        </View>
      </View>

      {formError ? <ErrorBanner message={formError} /> : null}

      <TextField
        testID="book-recipient-id-input"
        label="Recipient ID *"
        value={form.recipientId}
        onChangeText={setField('recipientId')}
        error={fieldErrors.recipientId}
        placeholder="Recipient's account ID"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!submitting}
      />

      <ParcelSizeSelector value={parcelSize} onChange={setParcelSize} />

      <TextField
        label="Description (optional)"
        value={form.description}
        onChangeText={setField('description')}
        placeholder="What's in the parcel?"
        multiline
        numberOfLines={3}
        editable={!submitting}
      />

      <TextField
        label="Bus ID (optional)"
        value={form.busId}
        onChangeText={setField('busId')}
        error={fieldErrors.busId}
        placeholder="Leave blank if unknown"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!submitting}
      />

      <Button
        testID="confirm-booking-button"
        label="Confirm booking"
        onPress={handleSubmit}
        loading={submitting}
        disabled={submitting}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  fareCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  fareIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  fareBody: {
    flex: 1,
    gap: 2,
  },
  fareLabel: {
    fontSize: typography.label.fontSize,
    fontWeight: typography.label.fontWeight,
    color: colors.text,
  },
  fareValue: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
});
