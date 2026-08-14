import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../constants/theme';

export function LoadingState({ label }: { label?: string }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.primary} />
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  label: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
  },
});
