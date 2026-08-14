import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useLayoutEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { HeaderLogoutButton } from '../../components';
import { ICONS } from '../../constants/icons';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { useAuth } from '../../hooks';
import type { AdminStackParamList } from '../../navigation/AdminNavigator';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminHome'>;

export function AdminHomeScreen({ navigation }: Props) {
  const { user } = useAuth();

  useLayoutEffect(() => {
    navigation.setOptions({ headerRight: () => <HeaderLogoutButton /> });
  }, [navigation]);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View>
        <Text style={styles.greeting}>Welcome, {user?.name}</Text>
        <Text style={styles.meta}>{user?.phone}</Text>
      </View>

      <Pressable style={styles.primaryCard} onPress={() => navigation.navigate('RouteList')}>
        <View style={styles.primaryIconWrap}>
          <ICONS.route size={22} color={colors.onPrimary} strokeWidth={2.25} />
        </View>
        <Text style={styles.primaryTitle}>Routes</Text>
        <Text style={styles.primarySubtitle}>Manage routes, their halts, and assigned buses.</Text>
      </Pressable>

      <Pressable style={styles.secondaryRow} onPress={() => navigation.navigate('AdminFindConsignment')}>
        <ICONS.search size={18} color={colors.textSecondary} strokeWidth={2} />
        <Text style={styles.secondaryLabel}>Find a consignment</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: spacing.lg,
    gap: spacing.lg,
    backgroundColor: colors.background,
  },
  greeting: {
    fontSize: typography.title.fontSize,
    lineHeight: typography.title.lineHeight,
    fontWeight: typography.title.fontWeight,
    color: colors.text,
  },
  meta: {
    fontSize: typography.size.md - 1,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  primaryCard: {
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  primaryIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryHover,
    marginBottom: spacing.xs,
  },
  primaryTitle: {
    fontSize: typography.heading.fontSize,
    fontWeight: typography.heading.fontWeight,
    color: colors.onPrimary,
  },
  primarySubtitle: {
    fontSize: typography.size.sm,
    color: colors.primaryTint,
  },
  secondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
  },
  secondaryLabel: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.weight.medium,
    color: colors.textSecondary,
  },
});
