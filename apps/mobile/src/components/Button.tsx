import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { colors, spacing } from '../constants/theme';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  loading?: boolean;
}

export function Button({ label, loading = false, disabled, ...pressableProps }: ButtonProps) {
  return (
    <Pressable style={styles.button} disabled={disabled || loading} {...pressableProps}>
      {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.label}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
