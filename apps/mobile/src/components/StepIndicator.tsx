import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../constants/theme';

/** Persistent "2 of 4" progress caption for the sender booking flow (screens 2–4). */
export function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, index) => (
        <View key={index} style={[styles.dot, index < step && styles.dotFilled]} />
      ))}
      <Text style={styles.label}>
        {step} of {total}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.ink150,
  },
  dotFilled: {
    backgroundColor: colors.primary,
  },
  label: {
    marginLeft: spacing.xs,
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
});
