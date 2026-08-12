import { ConsignmentStatus, ParcelSize } from '../types';

/** Ordered "happy path" workflow. CANCELLED is a terminal branch from any non-final status, not a step. */
export const CONSIGNMENT_STATUS_WORKFLOW: ConsignmentStatus[] = [
  ConsignmentStatus.CREATED,
  ConsignmentStatus.BOOKED,
  ConsignmentStatus.ACCEPTED,
  ConsignmentStatus.IN_TRANSIT,
  ConsignmentStatus.DELIVERED,
];

export const CONSIGNMENT_STATUS_LABELS: Record<ConsignmentStatus, string> = {
  CREATED: 'Created',
  BOOKED: 'Booked',
  ACCEPTED: 'Accepted by conductor',
  IN_TRANSIT: 'In transit',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

/** Tailwind class pairs (background/text) per status — used by StatusBadge. */
export const CONSIGNMENT_STATUS_CLASSES: Record<ConsignmentStatus, string> = {
  CREATED: 'bg-slate-100 text-slate-700',
  BOOKED: 'bg-blue-100 text-blue-700',
  ACCEPTED: 'bg-blue-100 text-blue-700',
  IN_TRANSIT: 'bg-amber-100 text-amber-800',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export const PARCEL_SIZE_LABELS: Record<ParcelSize, string> = {
  SMALL: 'Small',
  MEDIUM: 'Medium',
  LARGE: 'Large',
};
