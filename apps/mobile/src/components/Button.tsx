import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { colors, radius, spacing, typography } from '../constants/theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  loading?: boolean;
  variant?: Variant;
}

const VARIANT_STYLES: Record<Variant, { button: ViewStyle; label: TextStyle; spinnerColor: string }> = {
  primary: {
    button: { backgroundColor: colors.primary },
    label: { color: colors.onPrimary },
    spinnerColor: colors.onPrimary,
  },
  secondary: {
    button: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.ink300 },
    label: { color: colors.textSecondary },
    spinnerColor: colors.primary,
  },
  danger: {
    button: { backgroundColor: colors.danger },
    label: { color: colors.onPrimary },
    spinnerColor: colors.onPrimary,
  },
  ghost: {
    button: { backgroundColor: 'transparent' },
    label: { color: colors.primary },
    spinnerColor: colors.primary,
  },
};

export function Button({ label, loading = false, variant = 'primary', disabled, ...pressableProps }: ButtonProps) {
  const variantStyle = VARIANT_STYLES[variant];
  return (
    <Pressable
      style={[styles.button, variantStyle.button, (disabled || loading) && styles.disabled]}
      disabled={disabled || loading}
      {...pressableProps}
    >
      {loading ? (
        <ActivityIndicator color={variantStyle.spinnerColor} />
      ) : (
        <Text style={[styles.label, variantStyle.label]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.medium,
  },
});
