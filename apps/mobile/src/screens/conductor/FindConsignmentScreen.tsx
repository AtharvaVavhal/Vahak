import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { Button, ErrorBanner, TextField } from '../../components';
import { colors, spacing } from '../../constants/theme';
import { consignmentsApi } from '../../services/api';
import type { ConductorStackParamList } from '../../navigation/ConductorNavigator';
import { ApiError } from '../../utils/ApiError';
import { validateRequiredUuid } from '../../utils/validation';

type Props = NativeStackScreenProps<ConductorStackParamList, 'FindConsignment'>;

export function FindConsignmentScreen({ navigation }: Props) {
  const [consignmentId, setConsignmentId] = useState('');
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const handleLookup = useCallback(async () => {
    if (submittingRef.current) return;

    const error = validateRequiredUuid('Consignment ID', consignmentId);
    setFieldError(error ?? undefined);
    setFormError(null);
    if (error) return;

    submittingRef.current = true;
    setSubmitting(true);
    try {
      // Confirms the ID resolves before navigating — findById has no role/ownership
      // restriction, so this also works for a consignment this conductor hasn't touched yet.
      await consignmentsApi.getConsignmentById(consignmentId.trim());
      navigation.navigate('ConductorConsignmentDetail', { consignmentId: consignmentId.trim() });
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Something went wrong. Try again.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [consignmentId, navigation]);

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.helperIntro}>
          {"There's no bookable-consignment queue exposed to conductors yet — enter the ID given " +
            'by the sender or dispatcher.'}
        </Text>

        {formError ? <ErrorBanner message={formError} /> : null}

        <TextField
          label="Consignment ID *"
          value={consignmentId}
          onChangeText={(text) => {
            setConsignmentId(text);
            if (fieldError) setFieldError(undefined);
          }}
          error={fieldError}
          placeholder="Consignment ID"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!submitting}
        />

        <Button label="Look up" onPress={handleLookup} loading={submitting} disabled={submitting} />
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
  helperIntro: {
    fontSize: 13,
    color: colors.textMuted,
  },
});
