import { type ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors, spacing } from '../constants/theme';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string | null;
  rightAccessory?: ReactNode;
}

export function TextField({ label, error, rightAccessory, style, ...inputProps }: TextFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, error ? styles.inputRowError : null]}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.textMuted}
          {...inputProps}
        />
        {rightAccessory}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
  },
  inputRowError: {
    borderColor: colors.danger,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    fontSize: 15,
    color: colors.text,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
  },
});
