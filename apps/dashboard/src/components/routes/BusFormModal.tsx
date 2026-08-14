'use client';

import { useRef, useState } from 'react';

import { Button, ErrorBanner, Modal, TextField } from '../ui';
import { adminApi } from '../../services/api';
import type { Bus } from '../../types';
import { ApiError } from '../../utils/ApiError';
import { validateRequiredText } from '../../utils/validation';

interface BusFormModalProps {
  routeId: string;
  /** Present -> edit mode; absent -> create mode. */
  initialBus?: Bus;
  onClose: () => void;
  onSaved: (bus: Bus) => void;
}

export function BusFormModal({ routeId, initialBus, onClose, onSaved }: BusFormModalProps) {
  const isEditing = Boolean(initialBus);
  const [registration, setRegistration] = useState(initialBus?.registration ?? '');
  const [active, setActive] = useState(initialBus?.active ?? true);
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submittingRef.current) return;

    const error = validateRequiredText('Registration', registration);
    setFieldError(error ?? undefined);
    setFormError(null);
    if (error) return;

    submittingRef.current = true;
    setSubmitting(true);
    try {
      const saved = initialBus
        ? await adminApi.updateBus(initialBus.id, { registration: registration.trim(), active })
        : await adminApi.createBus(routeId, { registration: registration.trim() });
      onSaved(saved);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <Modal title={isEditing ? 'Edit bus' : 'New bus'} onClose={onClose}>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        {formError ? <ErrorBanner message={formError} /> : null}
        <TextField
          label="Registration"
          value={registration}
          onChange={(e) => {
            setRegistration(e.target.value);
            if (fieldError) setFieldError(undefined);
          }}
          error={fieldError}
          placeholder="e.g. MH-12-AB-1234"
          disabled={submitting}
        />
        {isEditing ? (
          <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              disabled={submitting}
              className="h-4 w-4 rounded border-ink-300 text-brand focus:ring-brand"
            />
            Active
          </label>
        ) : null}
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" label="Cancel" variant="secondary" onClick={onClose} disabled={submitting} />
          <Button type="submit" label={isEditing ? 'Save changes' : 'Add bus'} loading={submitting} />
        </div>
      </form>
    </Modal>
  );
}
