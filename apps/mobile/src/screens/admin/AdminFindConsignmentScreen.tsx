import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button, ErrorBanner, Screen, TextField } from '../../components';
import { colors, typography } from '../../constants/theme';
import { consignmentsApi } from '../../services/api';
import type { AdminStackParamList } from '../../navigation/AdminNavigator';
import { ApiError } from '../../utils/ApiError';
import { validateRequiredUuid } from '../../utils/validation';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminFindConsignment'>;

export function AdminFindConsignmentScreen({ navigation }: Props) {
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
      // GET /consignments/:id has no role/ownership restriction, so this works for ADMIN too.
      await consignmentsApi.getConsignmentById(consignmentId.trim());
      navigation.navigate('AdminConsignmentDetail', { consignmentId: consignmentId.trim() });
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
        {"There's no consignment-wide listing endpoint exposed to admins yet — enter a " +
          'specific consignment ID to view it.'}
      </Text>

      {formError ? <ErrorBanner message={formError} /> : null}

      <TextField
        testID="admin-find-consignment-id-input"
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
        testID="admin-find-consignment-lookup-button"
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
