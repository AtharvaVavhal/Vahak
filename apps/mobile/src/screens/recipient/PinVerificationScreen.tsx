import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { Button, ErrorBanner, TextField } from '../../components';
import { colors, spacing } from '../../constants/theme';
import { consignmentsApi } from '../../services/api';
import type { RecipientStackParamList } from '../../navigation/RecipientNavigator';
import { ConsignmentStatus } from '../../types';
import { ApiError } from '../../utils/ApiError';
import { validateHandoverPin } from '../../utils/validation';

type Props = NativeStackScreenProps<RecipientStackParamList, 'PinVerification'>;

export function PinVerificationScreen({ route, navigation }: Props) {
  const { consignmentId } = route.params;

  // PIN lives only in this local state for the duration of the screen — never persisted,
  // never hashed or compared on-device, sent only in the verifyHandover request body below.
  const [pin, setPin] = useState('');
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const handleVerify = useCallback(async () => {
    if (submittingRef.current) return;

    const error = validateHandoverPin(pin);
    setFieldError(error ?? undefined);
    setFormError(null);
    if (error) return;

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
      setFormError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
      setPin('');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [consignmentId, pin, navigation]);

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Verify handover</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit PIN the conductor gave you to confirm delivery.
        </Text>

        {formError ? <ErrorBanner message={formError} /> : null}

        <TextField
          label="Handover PIN *"
          value={pin}
          onChangeText={(text) => {
            setPin(text.replace(/[^0-9]/g, '').slice(0, 6));
            if (fieldError) setFieldError(undefined);
          }}
          error={fieldError}
          placeholder="6-digit PIN"
          keyboardType="number-pad"
          maxLength={6}
          editable={!submitting}
        />

        <Button label="Verify" onPress={handleVerify} loading={submitting} disabled={submitting} />
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
});
