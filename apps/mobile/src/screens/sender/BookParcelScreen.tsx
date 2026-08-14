import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { Button, ErrorBanner, InfoRow, ParcelSizeSelector, TextField } from '../../components';
import { colors, spacing } from '../../constants/theme';
import { consignmentsApi } from '../../services/api';
import type { SenderStackParamList } from '../../navigation/SenderNavigator';
import { ParcelSize, type CreateConsignmentRequest } from '../../types';
import { ApiError } from '../../utils/ApiError';
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

  const handleSubmit = useCallback(async () => {
    // Guards against a double-tap firing two submissions before React re-renders the disabled button.
    if (submittingRef.current) return;

    const errors: FieldErrors = {
      recipientId: validateRequiredUuid('Recipient ID', form.recipientId) ?? undefined,
      busId: validateOptionalUuid('Bus ID', form.busId) ?? undefined,
    };
    setFieldErrors(errors);
    setFormError(null);
    if (Object.values(errors).some(Boolean)) return;

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

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionTitle}>Booking review</Text>
        <InfoRow label="Route" value={routeRef ? `${routeRef} · ${routeName}` : routeName} />
        <InfoRow label="Pickup" value={pickupHaltName} />
        <InfoRow label="Dropoff" value={dropoffHaltName} />
        <InfoRow label="Fare" value="Determined by the server after booking" />

        {formError ? <ErrorBanner message={formError} /> : null}

        <Text style={styles.sectionTitle}>Consignment details</Text>

        <TextField
          label="Recipient ID *"
          value={form.recipientId}
          onChangeText={setField('recipientId')}
          error={fieldErrors.recipientId}
          placeholder="Recipient's account ID"
          autoCapitalize="none"
          autoCorrect={false}
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

        <Button label="Confirm booking" onPress={handleSubmit} loading={submitting} disabled={submitting} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginTop: spacing.sm,
  },
});
