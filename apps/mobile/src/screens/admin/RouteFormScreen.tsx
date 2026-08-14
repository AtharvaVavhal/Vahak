import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { Button, ErrorBanner, LoadingState, Screen, TextField } from '../../components';
import { spacing } from '../../constants/theme';
import { adminApi } from '../../services/api';
import type { AdminStackParamList } from '../../navigation/AdminNavigator';
import { ApiError } from '../../utils/ApiError';
import { validateRequiredText } from '../../utils/validation';

type Props = NativeStackScreenProps<AdminStackParamList, 'RouteForm'>;

interface FormState {
  name: string;
  origin: string;
  destination: string;
}

const initialForm: FormState = { name: '', origin: '', destination: '' };

type FieldErrors = Partial<Record<keyof FormState, string>>;

export function RouteFormScreen({ route, navigation }: Props) {
  const routeId = route.params?.routeId;
  const isEditing = Boolean(routeId);

  const [form, setForm] = useState<FormState>(initialForm);
  const [loadingExisting, setLoadingExisting] = useState(isEditing);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!routeId) return;
    let cancelled = false;
    async function loadExisting() {
      setLoadingExisting(true);
      setLoadError(null);
      try {
        const existing = await adminApi.getRoute(routeId as string);
        if (!cancelled) {
          setForm({ name: existing.name, origin: existing.origin, destination: existing.destination });
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof ApiError ? err.message : 'Could not load this route.');
        }
      } finally {
        if (!cancelled) setLoadingExisting(false);
      }
    }
    loadExisting();
    return () => {
      cancelled = true;
    };
  }, [routeId, reloadToken]);

  const setField = (field: keyof FormState) => (text: string) => {
    setForm((prev) => ({ ...prev, [field]: text }));
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const handleSubmit = useCallback(async () => {
    if (submittingRef.current) return;

    const errors: FieldErrors = {
      name: validateRequiredText('Name', form.name) ?? undefined,
      origin: validateRequiredText('Origin', form.origin) ?? undefined,
      destination: validateRequiredText('Destination', form.destination) ?? undefined,
    };
    setFieldErrors(errors);
    setFormError(null);
    if (Object.values(errors).some(Boolean)) return;

    const payload = {
      name: form.name.trim(),
      origin: form.origin.trim(),
      destination: form.destination.trim(),
    };

    submittingRef.current = true;
    setSubmitting(true);
    try {
      if (routeId) {
        await adminApi.updateRoute(routeId, payload);
      } else {
        await adminApi.createRoute(payload);
      }
      navigation.goBack();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [form, routeId, navigation]);

  if (loadingExisting) {
    return <LoadingState />;
  }

  if (loadError) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md }}>
        <ErrorBanner message={loadError} />
        <Button label="Retry" onPress={() => setReloadToken((t) => t + 1)} variant="secondary" />
      </View>
    );
  }

  return (
    <Screen>
      {formError ? <ErrorBanner message={formError} /> : null}

      <TextField
        label="Name *"
        value={form.name}
        onChangeText={setField('name')}
        error={fieldErrors.name}
        placeholder="e.g. Pune to Mumbai"
        editable={!submitting}
      />

      <TextField
        label="Origin *"
        value={form.origin}
        onChangeText={setField('origin')}
        error={fieldErrors.origin}
        placeholder="e.g. Pune"
        editable={!submitting}
      />

      <TextField
        label="Destination *"
        value={form.destination}
        onChangeText={setField('destination')}
        error={fieldErrors.destination}
        placeholder="e.g. Mumbai"
        editable={!submitting}
      />

      <Button
        label={isEditing ? 'Save changes' : 'Create route'}
        onPress={handleSubmit}
        loading={submitting}
        disabled={submitting}
      />
    </Screen>
  );
}
