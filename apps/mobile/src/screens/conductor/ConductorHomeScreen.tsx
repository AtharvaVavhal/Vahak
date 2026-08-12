import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components';
import { colors, spacing } from '../../constants/theme';
import { useAuth } from '../../hooks';
import type { ConductorStackParamList } from '../../navigation/ConductorNavigator';

type Props = NativeStackScreenProps<ConductorStackParamList, 'ConductorHome'>;

export function ConductorHomeScreen({ navigation }: Props) {
  const { user, logout } = useAuth();

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View>
        <Text style={styles.greeting}>Welcome, {user?.name}</Text>
        <Text style={styles.meta}>
          {user?.phone}
          {user?.email ? ` · ${user.email}` : ''}
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.card} onPress={() => navigation.navigate('FindConsignment')}>
          <Text style={styles.cardTitle}>Find a consignment</Text>
          <Text style={styles.cardSubtitle}>
            {"Look up a booked consignment by ID to accept it, or check one you're carrying."}
          </Text>
        </Pressable>
      </View>

      <Button label="Log out" onPress={() => logout()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'space-between',
    padding: spacing.lg,
    gap: spacing.xl,
    backgroundColor: colors.background,
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
  actions: {
    gap: spacing.md,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
  },
});
