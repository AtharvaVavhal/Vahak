import { useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radius, spacing, typography } from '../constants/theme';

const LENGTH = 6;

interface PinInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  editable?: boolean;
  testID?: string;
}

/** Six individual digit boxes backed by one invisible TextInput — the standard RN pattern for this UI without a new dependency. */
export function PinInput({ value, onChange, error = false, editable = true, testID }: PinInputProps) {
  const inputRef = useRef<TextInput>(null);

  return (
    <Pressable onPress={() => inputRef.current?.focus()} style={styles.row}>
      {Array.from({ length: LENGTH }).map((_, index) => {
        const digit = value[index] ?? '';
        const isCursor = editable && index === value.length;
        return (
          <View key={index} style={[styles.box, isCursor && styles.boxActive, error && styles.boxError]}>
            <Text style={styles.digit}>{digit}</Text>
          </View>
        );
      })}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => onChange(text.replace(/[^0-9]/g, '').slice(0, LENGTH))}
        keyboardType="number-pad"
        maxLength={LENGTH}
        editable={editable}
        autoFocus
        style={styles.hiddenInput}
        testID={testID}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  box: {
    width: 44,
    height: 52,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.ink300,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  boxActive: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  boxError: {
    borderColor: colors.danger,
  },
  digit: {
    fontSize: typography.codeEmphasis.fontSize,
    fontWeight: typography.codeEmphasis.fontWeight,
    fontFamily: typography.codeEmphasis.fontFamily,
    color: colors.text,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 1,
    width: 1,
  },
});
