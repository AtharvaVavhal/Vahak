import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, typography } from '../constants/theme';
import { TextField } from './TextField';
import type { TextInputProps } from 'react-native';

interface PasswordFieldProps extends Omit<TextInputProps, 'secureTextEntry' | 'style'> {
  label: string;
  error?: string | null;
}

export function PasswordField({ label, error, ...inputProps }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      label={label}
      error={error}
      secureTextEntry={!visible}
      autoCapitalize="none"
      autoCorrect={false}
      rightAccessory={
        <Pressable onPress={() => setVisible((current) => !current)} hitSlop={8}>
          <Text style={styles.toggle}>{visible ? 'Hide' : 'Show'}</Text>
        </Pressable>
      }
      {...inputProps}
    />
  );
}

const styles = StyleSheet.create({
  toggle: {
    color: colors.primary,
    fontWeight: typography.weight.medium,
    fontSize: typography.size.sm,
  },
});
