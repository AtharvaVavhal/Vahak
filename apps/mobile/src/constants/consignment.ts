import { colors } from './theme';
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

export const CONSIGNMENT_STATUS_COLORS: Record<ConsignmentStatus, string> = {
  CREATED: colors.textMuted,
  BOOKED: colors.primary,
  ACCEPTED: colors.primary,
  IN_TRANSIT: colors.warning,
  DELIVERED: colors.success,
  CANCELLED: colors.danger,
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
