'use client';

import { useRef, useState } from 'react';

import { Button, ErrorBanner, Modal, TextField } from '../ui';
import { adminApi } from '../../services/api';
import type { CreateHaltRequest, Halt } from '../../types';
import { ApiError } from '../../utils/ApiError';
import { validateOptionalNumber, validateRequiredText, validateSequence } from '../../utils/validation';

interface HaltFormModalProps {
  routeId: string;
  /** Present -> edit mode; absent -> create mode. */
  initialHalt?: Halt;
  onClose: () => void;
  onSaved: (halt: Halt) => void;
}

interface FormState {
  name: string;
  sequence: string;
  latitude: string;
  longitude: string;
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

export function HaltFormModal({ routeId, initialHalt, onClose, onSaved }: HaltFormModalProps) {
  const isEditing = Boolean(initialHalt);
  const [form, setForm] = useState<FormState>({
    name: initialHalt?.name ?? '',
    sequence: initialHalt ? String(initialHalt.sequence) : '',
    latitude: initialHalt?.latitude ?? '',
    longitude: initialHalt?.longitude ?? '',
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
      const saved = initialHalt
        ? await adminApi.updateHalt(initialHalt.id, payload)
        : await adminApi.createHalt(routeId, payload);
      onSaved(saved);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <Modal title={isEditing ? 'Edit halt' : 'New halt'} onClose={onClose}>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        {formError ? <ErrorBanner message={formError} /> : null}
        <TextField
          label="Name"
          value={form.name}
          onChange={(e) => setField('name')(e.target.value)}
          error={fieldErrors.name}
          placeholder="e.g. Pune Station"
          disabled={submitting}
        />
        <TextField
          label="Sequence"
          value={form.sequence}
          onChange={(e) => setField('sequence')(e.target.value)}
          error={fieldErrors.sequence}
          placeholder="Position along the route, starting at 1"
          inputMode="numeric"
          disabled={submitting}
        />
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Latitude (optional)"
            value={form.latitude}
            onChange={(e) => setField('latitude')(e.target.value)}
            error={fieldErrors.latitude}
            placeholder="18.52"
            disabled={submitting}
          />
          <TextField
            label="Longitude (optional)"
            value={form.longitude}
            onChange={(e) => setField('longitude')(e.target.value)}
            error={fieldErrors.longitude}
            placeholder="73.85"
            disabled={submitting}
          />
        </div>
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" label="Cancel" variant="secondary" onClick={onClose} disabled={submitting} />
          <Button type="submit" label={isEditing ? 'Save changes' : 'Add halt'} loading={submitting} />
        </div>
      </form>
    </Modal>
  );
}
