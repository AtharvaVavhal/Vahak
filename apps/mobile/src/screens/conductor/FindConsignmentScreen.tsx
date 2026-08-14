import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button, ErrorBanner, HeaderLogoutButton, Screen, TextField } from '../../components';
import { colors, typography } from '../../constants/theme';
import { consignmentsApi } from '../../services/api';
import type { ConductorTabScreenProps } from '../../navigation/ConductorNavigator';
import { ApiError } from '../../utils/ApiError';
import { validateRequiredUuid } from '../../utils/validation';

type Props = ConductorTabScreenProps<'Find'>;

export function FindConsignmentScreen({ navigation }: Props) {
  const [consignmentId, setConsignmentId] = useState('');
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  useLayoutEffect(() => {
    navigation.setOptions({ headerRight: () => <HeaderLogoutButton /> });
  }, [navigation]);

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
    <Screen>
      <Text style={styles.helperIntro}>
        Already have a tracking ID? Look it up directly here — otherwise browse the queue tab
        for consignments waiting to be accepted.
      </Text>

      {formError ? <ErrorBanner message={formError} /> : null}

      <TextField
        testID="find-consignment-id-input"
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

      <Button
        testID="find-consignment-lookup-button"
        label="Look up"
        onPress={handleLookup}
        loading={submitting}
        disabled={submitting}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  helperIntro: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
  },
});
