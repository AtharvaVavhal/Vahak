import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../constants/theme';
import { useAuth } from '../hooks';
import { Button } from './Button';

/** Shared body for the minimal per-role placeholder home screens. */
export function RoleHomeContent({ roleLabel }: { roleLabel: string }) {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.roleLabel}>{roleLabel}</Text>
        <Text style={styles.greeting}>Welcome, {user?.name}</Text>
        <Text style={styles.meta}>
          {user?.phone}
          {user?.email ? ` · ${user.email}` : ''}
        </Text>
      </View>

      <Button label="Log out" onPress={() => logout()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  roleLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  meta: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
