import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { colors, radius, spacing, typography } from '../constants/theme';

interface ChipProps extends Omit<PressableProps, 'style'> {
  label: string;
  selected?: boolean;
}

/** Shared selection chip — parcel size, pickup/dropoff halt, role selection. One visual system, not one per screen. */
export function Chip({ label, selected = false, ...pressableProps }: ChipProps) {
  return (
    <Pressable style={[styles.chip, selected && styles.chipSelected]} {...pressableProps}>
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 44,
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.ink300,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },
  label: {
    fontSize: typography.label.fontSize,
    lineHeight: typography.label.lineHeight,
    fontWeight: typography.label.fontWeight,
    color: colors.textSecondary,
  },
  labelSelected: {
    color: colors.primary,
  },
});
