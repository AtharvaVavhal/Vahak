import { StyleSheet, Text, View } from 'react-native';

import { CONSIGNMENT_STATUS_COLORS, CONSIGNMENT_STATUS_LABELS } from '../constants/consignment';
import type { ConsignmentStatus } from '../types';

export function StatusBadge({ status }: { status: ConsignmentStatus }) {
  const color = CONSIGNMENT_STATUS_COLORS[status];
  return (
    <View style={[styles.badge, { borderColor: color, backgroundColor: `${color}1A` }]}>
      <Text style={[styles.text, { color }]}>{CONSIGNMENT_STATUS_LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});
