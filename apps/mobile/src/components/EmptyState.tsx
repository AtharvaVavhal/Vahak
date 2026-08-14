import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../constants/theme';

export function EmptyState({
  title,
  subtitle,
  icon: Icon,
}: {
  title: string;
  subtitle?: string;
  /** Contextual icon (e.g. Inbox, Route) — decorative context, not filler. */
  icon?: LucideIcon;
}) {
  return (
    <View style={styles.container}>
      {Icon ? (
        <View style={styles.iconWrap}>
          <Icon size={22} color={colors.textMuted} strokeWidth={1.75} />
        </View>
      ) : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.medium,
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
