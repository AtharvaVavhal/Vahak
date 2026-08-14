import {
  CircleCheckBig,
  CircleX,
  Clock3,
  FileEdit,
  KeyRound,
  PackageCheck,
  type LucideIcon,
} from 'lucide-react-native';

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
 * label must say what's actually true for the viewer, not "in transit" (which reads as "still
 * moving" and is backwards for everyone except a first read of the raw enum name).
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
  text: string;
  background: string;
  border: string;
  icon: LucideIcon;
}

/** Precise, distinguishable per-status visual treatment. BOOKED and ACCEPTED must not share a look. */
export const CONSIGNMENT_STATUS_VISUALS: Record<ConsignmentStatus, StatusVisual> = {
  CREATED: { text: '#64748B', background: '#F1F5F9', border: '#E2E8F0', icon: FileEdit },
  BOOKED: { text: '#B45309', background: '#FEF3C7', border: '#FDE68A', icon: Clock3 },
  ACCEPTED: { text: '#1E3A8A', background: '#E4EBFB', border: '#B9C8F3', icon: PackageCheck },
  IN_TRANSIT: { text: '#6D28D9', background: '#EDE4FB', border: '#D8C7F5', icon: KeyRound },
  DELIVERED: { text: '#15803D', background: '#DCFCE7', border: '#BBF7D0', icon: CircleCheckBig },
  CANCELLED: { text: '#B91C1C', background: '#FEE2E2', border: '#FCA5A5', icon: CircleX },
};

/** Mirrors ConsignmentsService.cancel's allowedStatuses. */
export const CANCELLABLE_STATUSES: ConsignmentStatus[] = [
  ConsignmentStatus.CREATED,
  ConsignmentStatus.BOOKED,
  ConsignmentStatus.ACCEPTED,
  ConsignmentStatus.IN_TRANSIT,
];

export const PARCEL_SIZE_LABELS: Record<ParcelSize, string> = {
  SMALL: 'Small',
  MEDIUM: 'Medium',
  LARGE: 'Large',
};

export const PARCEL_SIZES: ParcelSize[] = [ParcelSize.SMALL, ParcelSize.MEDIUM, ParcelSize.LARGE];
