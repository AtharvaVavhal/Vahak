import { ACTIVE_STATUS_CLASSES, CONSIGNMENT_STATUS_VISUALS, getConsignmentStatusLabel } from '../../constants/consignment';
import type { ConsignmentStatus, UserRole } from '../../types';

export function StatusBadge({ status, viewerRole }: { status: ConsignmentStatus; viewerRole?: UserRole }) {
  const visual = CONSIGNMENT_STATUS_VISUALS[status];
  const Icon = visual.icon;
  return (
    <span
      className={`inline-flex h-[26px] items-center gap-1 rounded-full border px-2.5 text-xs font-bold ${visual.classes}`}
    >
      <Icon size={12} strokeWidth={2.25} />
      {getConsignmentStatusLabel(status, viewerRole)}
    </span>
  );
}

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        ACTIVE_STATUS_CLASSES[active ? 'active' : 'inactive']
      }`}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}
