import { ShieldCheck } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PARCEL_SIZE_LABELS } from '../constants/consignment';
import { colors, radius, spacing, typography } from '../constants/theme';
import { ConsignmentStatus, UserRole, type ConsignmentDetail } from '../types';
import { formatDateTime, formatFare } from '../utils/format';
import { Card } from './Card';
import { InfoRow } from './InfoRow';
import { StatusBadge } from './StatusBadge';
import { WorkflowStepper } from './WorkflowStepper';

interface CustodyMessage {
  text: string;
  /** Renders as a bordered notice card with an icon instead of plain caption text — for "this isn't yours" style states. */
  isNotice: boolean;
}

/**
 * Purely status-driven, role-aware "who has it / what's next" copy. No conductor name/phone —
 * the API never returns one (ConsignmentDetail only has `conductorId`), so this never claims more
 * than the client actually knows.
 */
function getCustodyMessage(
  status: ConsignmentStatus,
  viewerRole: UserRole,
  isMine?: boolean,
): CustodyMessage | null {
  switch (status) {
    case ConsignmentStatus.CREATED:
      return { text: "This consignment hasn't been booked by the sender yet.", isNotice: false };
    case ConsignmentStatus.BOOKED:
      return { text: 'Waiting for a conductor to accept this consignment.', isNotice: false };
    case ConsignmentStatus.ACCEPTED:
      if (viewerRole === UserRole.CONDUCTOR) {
        return isMine
          ? { text: "You're carrying this consignment. Start the handover when you reach the recipient.", isNotice: false }
          : { text: 'This consignment was already accepted by another conductor.', isNotice: true };
      }
      return { text: 'A conductor has accepted this consignment and is carrying it.', isNotice: false };
    case ConsignmentStatus.IN_TRANSIT:
      if (viewerRole === UserRole.RECIPIENT) {
        return isMine
          ? { text: 'Enter the PIN the conductor shared with you to complete delivery.', isNotice: false }
          : { text: "This delivery isn't addressed to your account, so it can't be verified from here.", isNotice: true };
      }
      if (viewerRole === UserRole.CONDUCTOR) {
        return {
          text:
            'The handover PIN was already issued to the recipient and cannot be shown again. ' +
            'The recipient completes delivery by verifying it in their own app.',
          isNotice: false,
        };
      }
      return { text: 'Handover in progress — the conductor has issued a PIN to the recipient.', isNotice: false };
    case ConsignmentStatus.DELIVERED:
      return { text: 'This consignment has been delivered.', isNotice: false };
    case ConsignmentStatus.CANCELLED:
      return { text: 'This consignment was cancelled.', isNotice: false };
    default:
      return null;
  }
}

interface ConsignmentDetailViewProps {
  consignment: ConsignmentDetail;
  viewerRole: UserRole;
  /** Only meaningful for CONDUCTOR/RECIPIENT — whether this is specifically assigned/addressed to the viewer. */
  isMine?: boolean;
  /** Role-specific bottom action (Accept/Start handover/Enter PIN/Cancel) — omitted entirely for ADMIN and terminal states. */
  action?: ReactNode;
}

export function ConsignmentDetailView({ consignment, viewerRole, isMine, action }: ConsignmentDetailViewProps) {
  const isTerminal =
    consignment.status === ConsignmentStatus.DELIVERED || consignment.status === ConsignmentStatus.CANCELLED;
  const custody = getCustodyMessage(consignment.status, viewerRole, isMine);

  const showSenderCard = viewerRole !== UserRole.SENDER;
  const showRecipientCard = viewerRole !== UserRole.RECIPIENT;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.trackingCode, styles.mono]}>{consignment.trackingCode}</Text>
        <StatusBadge status={consignment.status} viewerRole={viewerRole} />
      </View>

      <WorkflowStepper
        currentStatus={consignment.status}
        subdued={consignment.status === ConsignmentStatus.DELIVERED}
      />

      {custody ? (
        custody.isNotice ? (
          <View style={styles.noticeCard}>
            <ShieldCheck size={16} color={colors.textSecondary} strokeWidth={2} />
            <Text style={styles.noticeText}>{custody.text}</Text>
          </View>
        ) : (
          <Text style={[styles.custodyText, isTerminal && styles.custodyTextSubdued]}>{custody.text}</Text>
        )
      ) : null}

      <Card title="Parcel">
        <InfoRow label="Size" value={PARCEL_SIZE_LABELS[consignment.parcelSize]} />
        {consignment.description ? <InfoRow label="Description" value={consignment.description} /> : null}
        <InfoRow label="Fare" value={formatFare(consignment.fare)} />
      </Card>

      <Card title="Route">
        <InfoRow label="Route" value={`${consignment.route.origin} → ${consignment.route.destination}`} />
        <InfoRow label="Pickup halt" value={consignment.pickupHalt.name} />
        <InfoRow label="Dropoff halt" value={consignment.dropoffHalt.name} />
        {consignment.bus ? <InfoRow label="Bus" value={consignment.bus.registration} /> : null}
      </Card>

      {showSenderCard ? (
        <Card title="Sender">
          <InfoRow label="Name" value={consignment.sender.name} />
          <InfoRow label="Phone" value={consignment.sender.phone} />
        </Card>
      ) : null}

      {showRecipientCard ? (
        <Card title="Recipient">
          <InfoRow label="Name" value={consignment.recipient.name} />
          <InfoRow label="Phone" value={consignment.recipient.phone} />
        </Card>
      ) : null}

      <Card title="Timeline">
        <InfoRow label="Created" value={formatDateTime(consignment.createdAt)} />
        <InfoRow label="Last updated" value={formatDateTime(consignment.updatedAt)} />
      </Card>

      {!isTerminal && action ? action : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackingCode: {
    fontSize: typography.size.md + 1,
    fontWeight: typography.weight.bold,
    color: colors.text,
  },
  mono: {
    fontFamily: typography.monoFontFamily,
  },
  custodyText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
  custodyTextSubdued: {
    color: colors.textMuted,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.ink300,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  noticeText: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
});
