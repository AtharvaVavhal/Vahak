import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { Button, ErrorBanner, TextField } from '../../components';
import { colors, spacing } from '../../constants/theme';
import { adminApi } from '../../services/api';
import type { AdminStackParamList } from '../../navigation/AdminNavigator';
import type { CreateHaltRequest } from '../../types';
import { ApiError } from '../../utils/ApiError';
import { validateOptionalNumber, validateRequiredText, validateSequence } from '../../utils/validation';

type Props = NativeStackScreenProps<AdminStackParamList, 'HaltForm'>;

interface FormState {
  name: string;
  sequence: string;
  latitude: string;
  longitude: string;
}

const initialForm: FormState = { name: '', sequence: '', latitude: '', longitude: '' };

type FieldErrors = Partial<Record<keyof FormState, string>>;

export function HaltFormScreen({ route, navigation }: Props) {
  const { routeId, haltId } = route.params;
  const isEditing = Boolean(haltId);

  const [form, setForm] = useState<FormState>(initialForm);
  const [loadingExisting, setLoadingExisting] = useState(isEditing);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!haltId) return;
    let cancelled = false;
    async function loadExisting() {
      try {
        const existing = await adminApi.getHalt(haltId as string);
        if (!cancelled) {
          setForm({
            name: existing.name,
            sequence: String(existing.sequence),
            latitude: existing.latitude ?? '',
            longitude: existing.longitude ?? '',
          });
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof ApiError ? err.message : 'Could not load this halt.');
        }
      } finally {
        if (!cancelled) setLoadingExisting(false);
      }
    }
    loadExisting();
    return () => {
      cancelled = true;
    };
  }, [haltId]);

  const setField = (field: keyof FormState) => (text: string) => {
    setForm((prev) => ({ ...prev, [field]: text }));
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const handleSubmit = useCallback(async () => {
    if (submittingRef.current) return;

    const errors: FieldErrors = {
      name: validateRequiredText('Name', form.name) ?? undefined,
      sequence: validateSequence(form.sequence) ?? undefined,
      latitude: validateOptionalNumber('Latitude', form.latitude) ?? undefined,
      longitude: validateOptionalNumber('Longitude', form.longitude) ?? undefined,
    };
    setFieldErrors(errors);
    setFormError(null);
    if (Object.values(errors).some(Boolean)) return;

    const payload: CreateHaltRequest = {
      name: form.name.trim(),
      sequence: Number(form.sequence),
      ...(form.latitude ? { latitude: Number(form.latitude) } : {}),
      ...(form.longitude ? { longitude: Number(form.longitude) } : {}),
    };

    submittingRef.current = true;
    setSubmitting(true);
    try {
      if (haltId) {
        await adminApi.updateHalt(haltId, payload);
      } else {
        await adminApi.createHalt(routeId, payload);
      }
      navigation.goBack();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [form, routeId, haltId, navigation]);

  if (loadingExisting) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.centered}>
        <ErrorBanner message={loadError} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {formError ? <ErrorBanner message={formError} /> : null}

        <TextField
          label="Name *"
          value={form.name}
          onChangeText={setField('name')}
          error={fieldErrors.name}
          placeholder="e.g. Pune Station"
          editable={!submitting}
        />

        <TextField
          label="Sequence *"
          value={form.sequence}
          onChangeText={setField('sequence')}
          error={fieldErrors.sequence}
          placeholder="Position along the route, starting at 1"
          keyboardType="number-pad"
          editable={!submitting}
        />

        <TextField
          label="Latitude (optional)"
          value={form.latitude}
          onChangeText={setField('latitude')}
          error={fieldErrors.latitude}
          placeholder="e.g. 18.52"
          keyboardType="numbers-and-punctuation"
          editable={!submitting}
        />

        <TextField
          label="Longitude (optional)"
          value={form.longitude}
          onChangeText={setField('longitude')}
          error={fieldErrors.longitude}
          placeholder="e.g. 73.85"
          keyboardType="numbers-and-punctuation"
          editable={!submitting}
        />

        <Button
          label={isEditing ? 'Save changes' : 'Add halt'}
          onPress={handleSubmit}
          loading={submitting}
          disabled={submitting}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  content: {
    flexGrow: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
});
