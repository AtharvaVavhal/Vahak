import { StyleSheet, Text, View } from 'react-native';

import { CONSIGNMENT_STATUS_VISUALS, getConsignmentStatusLabel } from '../constants/consignment';
import { radius, typography } from '../constants/theme';
import type { ConsignmentStatus, UserRole } from '../types';

export function StatusBadge({ status, viewerRole }: { status: ConsignmentStatus; viewerRole?: UserRole }) {
  const visual = CONSIGNMENT_STATUS_VISUALS[status];
  const Icon = visual.icon;
  return (
    <View style={[styles.badge, { borderColor: visual.border, backgroundColor: visual.background }]}>
      <Icon size={12} color={visual.text} strokeWidth={2.25} />
      <Text style={[styles.text, { color: visual.text }]}>{getConsignmentStatusLabel(status, viewerRole)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.pill,
    height: 26,
    paddingHorizontal: 10,
  },
  text: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.weight.bold,
  },
});
