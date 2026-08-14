import { StyleSheet, Text, View } from 'react-native';

import { PARCEL_SIZE_LABELS, PARCEL_SIZES } from '../constants/consignment';
import { colors, spacing, typography } from '../constants/theme';
import type { ParcelSize } from '../types';
import { Chip } from './Chip';

interface ParcelSizeSelectorProps {
  value: ParcelSize;
  onChange: (size: ParcelSize) => void;
}

export function ParcelSizeSelector({ value, onChange }: ParcelSizeSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Parcel size</Text>
      <View style={styles.options}>
        {PARCEL_SIZES.map((size) => (
          <Chip
            key={size}
            label={PARCEL_SIZE_LABELS[size]}
            selected={size === value}
            onPress={() => onChange(size)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    fontSize: typography.label.fontSize,
    lineHeight: typography.label.lineHeight,
    fontWeight: typography.label.fontWeight,
    color: colors.text,
  },
  options: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
});
