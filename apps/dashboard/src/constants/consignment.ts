import { CircleCheckBig, CircleX, Clock3, FileEdit, KeyRound, PackageCheck, type LucideIcon } from 'lucide-react';

import { UserRole, ConsignmentStatus, ParcelSize } from '../types';

/** Ordered "happy path" workflow. CANCELLED is a terminal branch from any non-final status, not a step. */
export const CONSIGNMENT_STATUS_WORKFLOW: ConsignmentStatus[] = [
  ConsignmentStatus.CREATED,
  ConsignmentStatus.BOOKED,
  ConsignmentStatus.ACCEPTED,
  ConsignmentStatus.IN_TRANSIT,
  ConsignmentStatus.DELIVERED,
];

/** Plain-language stage names — used for the workflow stepper captions and as the role-agnostic fallback badge text. */
export const CONSIGNMENT_STATUS_LABELS: Record<ConsignmentStatus, string> = {
  CREATED: 'Draft',
  BOOKED: 'Waiting',
  ACCEPTED: 'In custody',
  IN_TRANSIT: 'Handover in progress',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

/**
 * IN_TRANSIT is set the moment a conductor *starts* the handover (PIN issued) — i.e. right as
 * the parcel is arriving at the recipient, not while it's riding the bus between halts. The
 * dashboard is admin-only (read-only for consignments), so it always uses the neutral framing.
 */
export function getConsignmentStatusLabel(status: ConsignmentStatus, viewerRole?: UserRole): string {
  if (status === ConsignmentStatus.IN_TRANSIT) {
    if (viewerRole === UserRole.RECIPIENT) return 'Ready — enter your PIN';
    if (viewerRole === UserRole.CONDUCTOR) return 'Awaiting recipient verification';
    return 'Handover in progress';
  }
  return CONSIGNMENT_STATUS_LABELS[status];
}

interface StatusVisual {
  /** Tailwind arbitrary-value classes for text/background/border — precise per-status hexes from the design system. */
  classes: string;
  icon: LucideIcon;
}

/** Precise, distinguishable per-status visual treatment. BOOKED and ACCEPTED must not share a look. */
export const CONSIGNMENT_STATUS_VISUALS: Record<ConsignmentStatus, StatusVisual> = {
  CREATED: { classes: 'text-[#64748B] bg-[#F1F5F9] border-[#E2E8F0]', icon: FileEdit },
  BOOKED: { classes: 'text-[#B45309] bg-[#FEF3C7] border-[#FDE68A]', icon: Clock3 },
  ACCEPTED: { classes: 'text-[#1E3A8A] bg-[#E4EBFB] border-[#B9C8F3]', icon: PackageCheck },
  IN_TRANSIT: { classes: 'text-[#6D28D9] bg-[#EDE4FB] border-[#D8C7F5]', icon: KeyRound },
  DELIVERED: { classes: 'text-[#15803D] bg-[#DCFCE7] border-[#BBF7D0]', icon: CircleCheckBig },
  CANCELLED: { classes: 'text-[#B91C1C] bg-[#FEE2E2] border-[#FCA5A5]', icon: CircleX },
};

export const PARCEL_SIZE_LABELS: Record<ParcelSize, string> = {
  SMALL: 'Small',
  MEDIUM: 'Medium',
  LARGE: 'Large',
};

/** Tailwind class pairs (background/text) per bus active state — used by ActiveBadge. */
export const ACTIVE_STATUS_CLASSES: Record<'active' | 'inactive', string> = {
  active: 'bg-success-tint text-success',
  inactive: 'bg-ink-150 text-ink-500',
};
