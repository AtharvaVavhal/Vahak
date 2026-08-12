'use client';

import { useCallback, useRef, useState } from 'react';

import { Button, ErrorBanner, InfoRow, LoadingSpinner, StatusBadge, TextField } from '../../../components/ui';
import { CONSIGNMENT_STATUS_LABELS, CONSIGNMENT_STATUS_WORKFLOW, PARCEL_SIZE_LABELS } from '../../../constants/consignment';
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
        <h1 className="text-xl font-bold text-slate-900">Find a consignment</h1>
        <p className="text-sm text-slate-500">
          There&apos;s no admin-wide consignment listing on the backend — look up a specific
          consignment by its ID.
        </p>
      </div>

      <form className="flex items-end gap-3" onSubmit={handleLookup} noValidate>
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
  const isCancelled = consignment.status === ConsignmentStatus.CANCELLED;
  const stepIndex = CONSIGNMENT_STATUS_WORKFLOW.indexOf(consignment.status);

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-sm font-semibold text-slate-900">{consignment.trackingCode}</h2>
        <StatusBadge status={consignment.status} />
      </div>

      {!isCancelled ? (
        <div className="flex items-center gap-1">
          {CONSIGNMENT_STATUS_WORKFLOW.map((step, index) => (
            <div key={step} className="flex flex-1 flex-col items-center gap-1">
              <div className={`h-2 w-full rounded-full ${index <= stepIndex ? 'bg-blue-600' : 'bg-slate-200'}`} />
              <span className={`text-[11px] ${index <= stepIndex ? 'font-medium text-blue-700' : 'text-slate-400'}`}>
                {CONSIGNMENT_STATUS_LABELS[step]}
              </span>
            </div>
          ))}
        </div>
      ) : null}
      <p className="text-xs text-slate-400">
        Status reflects the consignment&apos;s current state only — the backend doesn&apos;t expose
        per-event history (ConsignmentEvent rows are written server-side but never returned by any
        API response), so this isn&apos;t a timestamped timeline.
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-md border border-slate-100 p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Parcel</h3>
          <InfoRow label="Size" value={PARCEL_SIZE_LABELS[consignment.parcelSize]} />
          {consignment.description ? <InfoRow label="Description" value={consignment.description} /> : null}
          <InfoRow label="Fare" value={formatFare(consignment.fare)} />
        </div>

        <div className="rounded-md border border-slate-100 p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Route</h3>
          <InfoRow label="Route" value={`${consignment.route.origin} → ${consignment.route.destination}`} />
          <InfoRow label="Pickup halt" value={consignment.pickupHalt.name} />
          <InfoRow label="Dropoff halt" value={consignment.dropoffHalt.name} />
          {consignment.bus ? <InfoRow label="Bus" value={consignment.bus.registration} /> : null}
        </div>

        <div className="rounded-md border border-slate-100 p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Sender</h3>
          <InfoRow label="Name" value={consignment.sender.name} />
          <InfoRow label="Phone" value={consignment.sender.phone} />
        </div>

        <div className="rounded-md border border-slate-100 p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Recipient</h3>
          <InfoRow label="Name" value={consignment.recipient.name} />
          <InfoRow label="Phone" value={consignment.recipient.phone} />
        </div>
      </div>

      <div className="rounded-md border border-slate-100 p-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Timeline</h3>
        <InfoRow label="Created" value={new Date(consignment.createdAt).toLocaleString()} />
        <InfoRow label="Last updated" value={new Date(consignment.updatedAt).toLocaleString()} />
      </div>
    </div>
  );
}
