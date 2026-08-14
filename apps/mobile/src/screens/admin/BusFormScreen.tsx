import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { Button, ErrorBanner, LoadingState, Screen, TextField } from '../../components';
import { colors, spacing, typography } from '../../constants/theme';
import { adminApi } from '../../services/api';
import type { AdminStackParamList } from '../../navigation/AdminNavigator';
import { ApiError } from '../../utils/ApiError';
import { validateRequiredText } from '../../utils/validation';

type Props = NativeStackScreenProps<AdminStackParamList, 'BusForm'>;

export function BusFormScreen({ route, navigation }: Props) {
  const { routeId, busId } = route.params;
  const isEditing = Boolean(busId);

  const [registration, setRegistration] = useState('');
  const [active, setActive] = useState(true);
  const [loadingExisting, setLoadingExisting] = useState(isEditing);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!busId) return;
    let cancelled = false;
    async function loadExisting() {
      setLoadingExisting(true);
      setLoadError(null);
      try {
        const existing = await adminApi.getBus(busId as string);
        if (!cancelled) {
          setRegistration(existing.registration);
          setActive(existing.active);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof ApiError ? err.message : 'Could not load this bus.');
        }
      } finally {
        if (!cancelled) setLoadingExisting(false);
      }
    }
    loadExisting();
    return () => {
      cancelled = true;
    };
  }, [busId, reloadToken]);

  const handleSubmit = useCallback(async () => {
    if (submittingRef.current) return;

    const error = validateRequiredText('Registration', registration);
    setFieldError(error ?? undefined);
    setFormError(null);
    if (error) return;

    submittingRef.current = true;
    setSubmitting(true);
    try {
      if (busId) {
        await adminApi.updateBus(busId, { registration: registration.trim(), active });
      } else {
        await adminApi.createBus(routeId, { registration: registration.trim() });
      }
      navigation.goBack();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [registration, active, routeId, busId, navigation]);

  if (loadingExisting) {
    return <LoadingState />;
  }

  if (loadError) {
    return (
      <View style={styles.centered}>
        <ErrorBanner message={loadError} />
        <Button label="Retry" onPress={() => setReloadToken((t) => t + 1)} variant="secondary" />
      </View>
    );
  }

  return (
    <Screen>
      {formError ? <ErrorBanner message={formError} /> : null}

      <TextField
        label="Registration *"
        value={registration}
        onChangeText={(text) => {
          setRegistration(text);
          if (fieldError) setFieldError(undefined);
        }}
        error={fieldError}
        placeholder="e.g. MH-12-AB-1234"
        autoCapitalize="characters"
        autoCorrect={false}
        editable={!submitting}
      />

      {isEditing ? (
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Active</Text>
          <Switch value={active} onValueChange={setActive} disabled={submitting} />
        </View>
      ) : null}

      <Button
        label={isEditing ? 'Save changes' : 'Add bus'}
        onPress={handleSubmit}
        loading={submitting}
        disabled={submitting}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.text,
  },
});
