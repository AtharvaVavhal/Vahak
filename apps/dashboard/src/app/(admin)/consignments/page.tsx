'use client';

import { useCallback, useRef, useState } from 'react';

import { Button, Card, ErrorBanner, InfoRow, LoadingSpinner, StatusBadge, TextField, WorkflowStepper } from '../../../components/ui';
import { PARCEL_SIZE_LABELS } from '../../../constants/consignment';
import { consignmentsApi } from '../../../services/api';
import { ConsignmentStatus, type ConsignmentDetail } from '../../../types';
import { ApiError } from '../../../utils/ApiError';
import { formatFare } from '../../../utils/format';
import { validateRequiredUuid } from '../../../utils/validation';

export default function ConsignmentsPage() {
  const [consignmentId, setConsignmentId] = useState('');
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [consignment, setConsignment] = useState<ConsignmentDetail | null>(null);
  const submittingRef = useRef(false);

  const handleLookup = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (submittingRef.current) return;

      const error = validateRequiredUuid('Consignment ID', consignmentId);
      setFieldError(error ?? undefined);
      setFormError(null);
      if (error) return;

      submittingRef.current = true;
      setLoading(true);
      setConsignment(null);
      try {
        setConsignment(await consignmentsApi.getConsignmentById(consignmentId.trim()));
      } catch (err) {
        setFormError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
      } finally {
        submittingRef.current = false;
        setLoading(false);
      }
    },
    [consignmentId],
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-ink-900">Find a consignment</h1>
        <p className="text-sm text-ink-500">
          There&apos;s no admin-wide consignment listing on the backend — look up a specific
          consignment by its ID.
        </p>
      </div>

      <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={handleLookup} noValidate>
        <div className="w-full max-w-md">
          <TextField
            label="Consignment ID"
            value={consignmentId}
            onChange={(e) => {
              setConsignmentId(e.target.value);
              if (fieldError) setFieldError(undefined);
            }}
            error={fieldError}
            placeholder="Consignment ID"
            disabled={loading}
          />
        </div>
        <Button type="submit" label="Look up" loading={loading} disabled={loading} />
      </form>

      {formError ? <ErrorBanner message={formError} /> : null}
      {loading ? <LoadingSpinner /> : null}

      {consignment ? <ConsignmentDetailCard consignment={consignment} /> : null}
    </div>
  );
}

function ConsignmentDetailCard({ consignment }: { consignment: ConsignmentDetail }) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-sm font-semibold text-ink-900">{consignment.trackingCode}</h2>
        <StatusBadge status={consignment.status} />
      </div>

      <div className="mt-4">
        <WorkflowStepper currentStatus={consignment.status} subdued={consignment.status === ConsignmentStatus.DELIVERED} />
      </div>

      <p className="mt-4 text-xs text-ink-500">
        Status reflects the consignment&apos;s current state only — the backend doesn&apos;t expose
        per-event history (ConsignmentEvent rows are written server-side but never returned by any
        API response), so this isn&apos;t a timestamped timeline.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-sm border border-ink-150 p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Parcel</h3>
          <InfoRow label="Size" value={PARCEL_SIZE_LABELS[consignment.parcelSize]} />
          {consignment.description ? <InfoRow label="Description" value={consignment.description} /> : null}
          <InfoRow label="Fare" value={formatFare(consignment.fare)} />
        </div>

        <div className="rounded-sm border border-ink-150 p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Route</h3>
          <InfoRow label="Route" value={`${consignment.route.origin} → ${consignment.route.destination}`} />
          <InfoRow label="Pickup halt" value={consignment.pickupHalt.name} />
          <InfoRow label="Dropoff halt" value={consignment.dropoffHalt.name} />
          {consignment.bus ? <InfoRow label="Bus" value={consignment.bus.registration} /> : null}
        </div>

        <div className="rounded-sm border border-ink-150 p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Sender</h3>
          <InfoRow label="Name" value={consignment.sender.name} />
          <InfoRow label="Phone" value={consignment.sender.phone} />
        </div>

        <div className="rounded-sm border border-ink-150 p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Recipient</h3>
          <InfoRow label="Name" value={consignment.recipient.name} />
          <InfoRow label="Phone" value={consignment.recipient.phone} />
        </div>
      </div>

      <div className="mt-4 rounded-sm border border-ink-150 p-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Timeline</h3>
        <InfoRow label="Created" value={new Date(consignment.createdAt).toLocaleString()} />
        <InfoRow label="Last updated" value={new Date(consignment.updatedAt).toLocaleString()} />
      </div>
    </Card>
  );
}
