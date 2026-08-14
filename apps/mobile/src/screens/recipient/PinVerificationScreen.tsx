import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button, ErrorBanner, PinInput, Screen } from '../../components';
import { colors, spacing, typography } from '../../constants/theme';
import { consignmentsApi } from '../../services/api';
import type { RecipientStackParamList } from '../../navigation/RecipientNavigator';
import { ConsignmentStatus } from '../../types';
import { ApiError } from '../../utils/ApiError';
import { confirmAction } from '../../utils/confirm';
import { validateHandoverPin } from '../../utils/validation';

type Props = NativeStackScreenProps<RecipientStackParamList, 'PinVerification'>;

/**
 * Maps the backend's actual verifyHandover error messages (consignments.service.ts) to a
 * distinct UI state — never a fabricated "N attempts remaining" count, since the API never
 * returns one.
 */
function classifyPinError(message: string): 'expired' | 'alreadyVerified' | 'maxAttempts' | 'wrong' {
  if (message.includes('expired')) return 'expired';
  if (message.includes('already been verified')) return 'alreadyVerified';
  if (message.includes('Maximum')) return 'maxAttempts';
  return 'wrong';
}

export function PinVerificationScreen({ route, navigation }: Props) {
  const { consignmentId } = route.params;

  // PIN lives only in this local state for the duration of the screen — never persisted,
  // never hashed or compared on-device, sent only in the verifyHandover request body below.
  const [pin, setPin] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const performVerify = useCallback(async () => {
    if (submittingRef.current) return;

    submittingRef.current = true;
    setSubmitting(true);
    try {
      const result = await consignmentsApi.verifyHandover(consignmentId, pin);
      // The backend is the source of truth: only treat this as a real delivery once its own
      // response says so, not merely because the HTTP call returned 2xx.
      if (result.consignment.status !== ConsignmentStatus.DELIVERED) {
        setFormError('Verification did not complete. Please try again.');
        return;
      }
      navigation.replace('DeliveryConfirmation', { consignment: result.consignment });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Something went wrong. Try again.';
      const kind = classifyPinError(message);

      if (kind === 'alreadyVerified') {
        // Already delivered (e.g. a double-tap, or the recipient verified from another device) —
        // route to the existing confirmation screen using data the API already gives us, rather
        // than inventing a new endpoint.
        try {
          const consignment = await consignmentsApi.getConsignmentById(consignmentId);
          if (consignment.status === ConsignmentStatus.DELIVERED) {
            navigation.replace('DeliveryConfirmation', { consignment });
            return;
          }
        } catch {
          // fall through to the generic message below
        }
      }

      setFormError(
        kind === 'expired'
          ? 'This code has expired — ask the conductor for a new handover.'
          : kind === 'maxAttempts'
            ? 'Too many incorrect attempts. Ask the conductor for a new handover.'
            : message,
      );
      setPin('');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [consignmentId, pin, navigation]);

  const handleVerify = useCallback(() => {
    if (submittingRef.current) return;

    const error = validateHandoverPin(pin);
    setFormError(error);
    if (error) return;

    confirmAction(
      'Confirm delivery?',
      'This completes the handover and cannot be undone.',
      'Verify',
      performVerify,
    );
  }, [pin, performVerify]);

  return (
    <Screen>
      <Text style={styles.title}>Verify handover</Text>
      <Text style={styles.subtitle}>
        Enter the 6-digit PIN the conductor gave you to confirm delivery.
      </Text>

      {formError ? <ErrorBanner message={formError} /> : null}

      <PinInput
        testID="handover-pin-input"
        value={pin}
        onChange={(text) => {
          setPin(text);
          if (formError) setFormError(null);
        }}
        error={Boolean(formError)}
        editable={!submitting}
      />

      <Button
        testID="handover-pin-verify-button"
        label="Verify"
        onPress={handleVerify}
        loading={submitting}
        disabled={submitting || pin.length < 6}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: typography.size.xl + 4,
    fontWeight: typography.weight.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.size.md - 1,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
});
