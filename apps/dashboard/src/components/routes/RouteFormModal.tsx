'use client';

import { useRef, useState } from 'react';

import { Button, ErrorBanner, Modal, TextField } from '../ui';
import { adminApi } from '../../services/api';
import type { Route } from '../../types';
import { ApiError } from '../../utils/ApiError';
import { validateRequiredText } from '../../utils/validation';

interface RouteFormModalProps {
  /** Present -> edit mode; absent -> create mode. */
  initialRoute?: Route;
  onClose: () => void;
  onSaved: (route: Route) => void;
}

interface FormState {
  name: string;
  origin: string;
  destination: string;
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

export function RouteFormModal({ initialRoute, onClose, onSaved }: RouteFormModalProps) {
  const isEditing = Boolean(initialRoute);
  const [form, setForm] = useState<FormState>({
    name: initialRoute?.name ?? '',
    origin: initialRoute?.origin ?? '',
    destination: initialRoute?.destination ?? '',
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const setField = (field: keyof FormState) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
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
      const saved = initialRoute
        ? await adminApi.updateRoute(initialRoute.id, payload)
        : await adminApi.createRoute(payload);
      onSaved(saved);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <Modal title={isEditing ? 'Edit route' : 'New route'} onClose={onClose}>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        {formError ? <ErrorBanner message={formError} /> : null}
        <TextField
          label="Name"
          value={form.name}
          onChange={(e) => setField('name')(e.target.value)}
          error={fieldErrors.name}
          placeholder="e.g. Pune to Mumbai"
          disabled={submitting}
        />
        <TextField
          label="Origin"
          value={form.origin}
          onChange={(e) => setField('origin')(e.target.value)}
          error={fieldErrors.origin}
          placeholder="e.g. Pune"
          disabled={submitting}
        />
        <TextField
          label="Destination"
          value={form.destination}
          onChange={(e) => setField('destination')(e.target.value)}
          error={fieldErrors.destination}
          placeholder="e.g. Mumbai"
          disabled={submitting}
        />
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" label="Cancel" variant="secondary" onClick={onClose} disabled={submitting} />
          <Button type="submit" label={isEditing ? 'Save changes' : 'Create route'} loading={submitting} />
        </div>
      </form>
    </Modal>
  );
}
