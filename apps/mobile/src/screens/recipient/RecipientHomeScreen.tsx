import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { KeyRound } from 'lucide-react-native';
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Button, Card, EmptyState, ErrorBanner, HeaderLogoutButton, LoadingState, StatusBadge } from '../../components';
import { ICONS } from '../../constants/icons';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { consignmentsApi } from '../../services/api';
import type { RecipientStackParamList } from '../../navigation/RecipientNavigator';
import { ConsignmentStatus, type ConsignmentDetail } from '../../types';
import { ApiError } from '../../utils/ApiError';

type Props = NativeStackScreenProps<RecipientStackParamList, 'RecipientHome'>;

export function RecipientHomeScreen({ navigation }: Props) {
  const [consignments, setConsignments] = useState<ConsignmentDetail[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ headerRight: () => <HeaderLogoutButton /> });
  }, [navigation]);

  const load = useCallback(async (isRefresh: boolean) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const result = await consignmentsApi.getRecipientConsignments();
      setConsignments(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load deliveries.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(false);
    }, [load]),
  );

  const { ready, rest } = useMemo(() => {
    const all = consignments ?? [];
    // GET /consignments/recipient is already scoped to this recipient — every item here is theirs.
    const readyItems = all.filter((c) => c.status === ConsignmentStatus.IN_TRANSIT);
    const readyIds = new Set(readyItems.map((c) => c.id));
    return { ready: readyItems, rest: all.filter((c) => !readyIds.has(c.id)) };
  }, [consignments]);

  if (loading) {
    return <LoadingState />;
  }

  if (error && !consignments) {
    return (
      <View style={styles.centered}>
        <ErrorBanner message={error} />
        <Button label="Retry" onPress={() => load(false)} variant="secondary" />
      </View>
    );
  }

  return (
    <FlatList
      data={rest}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
      ListHeaderComponent={
        ready.length > 0 ? (
          <View style={styles.readySection}>
            {ready.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => navigation.navigate('PinVerification', { consignmentId: item.id })}
                style={styles.readyCard}
              >
                <View style={styles.readyIconWrap}>
                  <KeyRound size={20} color={colors.onPrimary} strokeWidth={2.25} />
                </View>
                <View style={styles.readyBody}>
                  <Text style={[styles.readyTrackingCode, styles.mono]}>{item.trackingCode}</Text>
                  <Text style={styles.readyTitle}>Ready — enter your PIN</Text>
                  <Text style={styles.readySubtitle}>From {item.sender.name}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null
      }
      ListEmptyComponent={
        ready.length === 0 ? (
          <EmptyState icon={ICONS.recipientInbox} title="No deliveries yet" subtitle="Parcels sent to you will show up here." />
        ) : null
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() => navigation.navigate('RecipientConsignmentDetail', { consignmentId: item.id })}
        >
          <Card>
            <View style={styles.cardTop}>
              <Text style={[styles.trackingCode, styles.mono]}>{item.trackingCode}</Text>
              <StatusBadge status={item.status} />
            </View>
            <Text style={styles.senderLine}>From {item.sender.name}</Text>
            <Text style={styles.haltLine}>
              {item.pickupHalt.name} → {item.dropoffHalt.name}
            </Text>
          </Card>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.md,
    flexGrow: 1,
  },
  readySection: {
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  readyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.verify,
    backgroundColor: colors.verifyTint,
    padding: spacing.md,
  },
  readyIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.verify,
  },
  readyBody: {
    flex: 1,
    gap: 2,
  },
  readyTrackingCode: {
    fontSize: typography.caption.fontSize,
    color: colors.verify,
  },
  readyTitle: {
    fontSize: typography.heading.fontSize,
    fontWeight: typography.heading.fontWeight,
    color: colors.verify,
  },
  readySubtitle: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trackingCode: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.text,
  },
  mono: {
    fontFamily: typography.monoFontFamily,
  },
  senderLine: {
    fontSize: typography.size.md - 1,
    fontWeight: typography.weight.medium,
    color: colors.text,
  },
  haltLine: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
  },
});
