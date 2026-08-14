import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, typography } from '../constants/theme';
import { useAuth } from '../hooks';

/** Native-header logout action shared by every role's home screen — keeps logout out of primary content. */
export function HeaderLogoutButton() {
  const { logout } = useAuth();
  return (
    <Pressable onPress={() => logout()} hitSlop={8} style={styles.button}>
      <Text style={styles.label}>Log out</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: typography.label.fontSize,
    fontWeight: typography.label.fontWeight,
    color: colors.primary,
  },
});
