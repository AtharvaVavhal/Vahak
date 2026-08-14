import { CircleAlert } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../constants/theme';

export function ErrorBanner({ message }: { message: string }) {
  return (
    <View style={styles.container}>
      <CircleAlert size={16} color={colors.danger} strokeWidth={2} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.dangerTint,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  text: {
    flex: 1,
    color: colors.danger,
    fontSize: typography.size.sm,
  },
});
