import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../constants/theme';

/** Shown while AuthProvider restores a session (GET /auth/me) from the stored JWT. */
export function BootstrapScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vahak</Text>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    gap: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
});
