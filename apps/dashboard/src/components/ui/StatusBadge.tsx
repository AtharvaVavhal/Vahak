import { CONSIGNMENT_STATUS_CLASSES, CONSIGNMENT_STATUS_LABELS } from '../../constants/consignment';
import type { ConsignmentStatus } from '../../types';

export function StatusBadge({ status }: { status: ConsignmentStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${CONSIGNMENT_STATUS_CLASSES[status]}`}
    >
      {CONSIGNMENT_STATUS_LABELS[status]}
    </span>
  );
}

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
      }`}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}
