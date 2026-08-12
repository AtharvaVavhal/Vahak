'use client';

import { useRef, useState } from 'react';

import { Button } from './Button';
import { ErrorBanner } from './ErrorBanner';
import { Modal } from './Modal';
import { ApiError } from '../../utils/ApiError';

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

/** Destructive-action confirmation. Guards against a double-tap firing two requests. */
export function ConfirmDialog({ title, description, confirmLabel = 'Delete', onConfirm, onClose }: ConfirmDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  const handleConfirm = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-sm text-slate-600">{description}</p>
      {error ? (
        <div className="mt-3">
          <ErrorBanner message={error} />
        </div>
      ) : null}
      <div className="mt-5 flex justify-end gap-2">
        <Button label="Cancel" variant="secondary" onClick={onClose} disabled={submitting} />
        <Button label={confirmLabel} variant="danger" onClick={handleConfirm} loading={submitting} />
      </div>
    </Modal>
  );
}
