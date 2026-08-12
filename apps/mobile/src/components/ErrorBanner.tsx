import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../constants/theme';

export function ErrorBanner({ message }: { message: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 8,
    padding: spacing.sm,
  },
  text: {
    color: colors.danger,
    fontSize: 13,
  },
});
