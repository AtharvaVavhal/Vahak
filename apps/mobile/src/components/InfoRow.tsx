import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../constants/theme';

export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  label: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
  },
  value: {
    fontSize: typography.size.sm,
    color: colors.text,
    fontWeight: typography.weight.medium,
    flexShrink: 1,
    textAlign: 'right',
  },
});
