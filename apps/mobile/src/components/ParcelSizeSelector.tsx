import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PARCEL_SIZE_LABELS, PARCEL_SIZES } from '../constants/consignment';
import { colors, spacing } from '../constants/theme';
import type { ParcelSize } from '../types';

interface ParcelSizeSelectorProps {
  value: ParcelSize;
  onChange: (size: ParcelSize) => void;
}

export function ParcelSizeSelector({ value, onChange }: ParcelSizeSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Parcel size</Text>
      <View style={styles.options}>
        {PARCEL_SIZES.map((size) => {
          const selected = size === value;
          return (
            <Pressable
              key={size}
              onPress={() => onChange(size)}
              style={[styles.option, selected && styles.optionSelected]}
            >
              <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                {PARCEL_SIZE_LABELS[size]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  options: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  option: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: '#EFF6FF',
  },
  optionText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  optionTextSelected: {
    color: colors.primary,
  },
});
