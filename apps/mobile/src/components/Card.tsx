import { StyleSheet, Text, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { colors, radius, spacing, typography } from '../constants/theme';

interface CardProps extends ViewProps {
  title?: string;
  style?: StyleProp<ViewStyle>;
}

export function Card({ title, style, children, ...rest }: CardProps) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  title: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
});
