import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { Button, Chip, EmptyState, ErrorBanner, LoadingState, StepIndicator } from '../../components';
import { ICONS } from '../../constants/icons';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { senderRoutesApi } from '../../services/api';
import type { SenderStackParamList } from '../../navigation/SenderNavigator';
import type { AvailableHalt } from '../../types';
import { ApiError } from '../../utils/ApiError';

type Props = NativeStackScreenProps<SenderStackParamList, 'SelectHalts'>;

export function SelectHaltsScreen({ route, navigation }: Props) {
  const { routeId, routeName, routeRef } = route.params;

  const [halts, setHalts] = useState<AvailableHalt[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pickupHaltId, setPickupHaltId] = useState<string | null>(null);
  const [dropoffHaltId, setDropoffHaltId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Backend-provided order is authoritative — never re-sort client-side.
      const result = await senderRoutesApi.listAvailableHalts(routeId);
      setHalts(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load stops for this route.');
    } finally {
      setLoading(false);
    }
  }, [routeId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const sameHaltSelected = pickupHaltId !== null && pickupHaltId === dropoffHaltId;
  const canContinue = pickupHaltId !== null && dropoffHaltId !== null && !sameHaltSelected;

  const handleContinue = () => {
    if (!canContinue || !halts) return;
    const pickup = halts.find((h) => h.id === pickupHaltId);
    const dropoff = halts.find((h) => h.id === dropoffHaltId);
    if (!pickup || !dropoff) return;

    navigation.navigate('BookParcel', {
      routeId,
      routeName,
      routeRef,
      pickupHaltId: pickup.id,
      pickupHaltName: pickup.name,
      dropoffHaltId: dropoff.id,
      dropoffHaltName: dropoff.name,
    });
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error && !halts) {
    return (
      <View style={styles.centered}>
        <ErrorBanner message={error} />
        <Button label="Retry" onPress={() => load()} variant="secondary" />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <StepIndicator step={2} total={4} />
        {routeRef ? <Text style={styles.routeRef}>Route {routeRef}</Text> : null}
        <Text style={styles.routeName}>{routeName}</Text>
        <Text style={styles.helperIntro}>Tap to set this stop as your pickup or dropoff.</Text>
      </View>

      <FlatList
        data={halts ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState icon={ICONS.halt} title="No stops on this route" />}
        renderItem={({ item }) => {
          const isPickup = item.id === pickupHaltId;
          const isDropoff = item.id === dropoffHaltId;
          return (
            <View style={styles.row}>
              <View style={styles.rowInfo}>
                <ICONS.halt size={16} color={colors.textMuted} strokeWidth={2} />
                <Text style={styles.sequence}>{item.sequence}</Text>
                <Text style={styles.haltName}>{item.name}</Text>
              </View>
              <View style={styles.chipGroup}>
                <Chip label="Pickup" selected={isPickup} onPress={() => setPickupHaltId(item.id)} />
                <Chip label="Dropoff" selected={isDropoff} onPress={() => setDropoffHaltId(item.id)} />
              </View>
            </View>
          );
        }}
      />

      <View style={styles.footer}>
        {sameHaltSelected ? (
          <ErrorBanner message="Pickup and dropoff must be different stops." />
        ) : null}
        {error ? <ErrorBanner message={error} /> : null}
        <Button label="Continue" onPress={handleContinue} disabled={!canContinue} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.xs,
  },
  routeRef: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.primary,
  },
  routeName: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text,
  },
  helperIntro: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.sm,
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    gap: spacing.md,
  },
  rowInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  sequence: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.textMuted,
    minWidth: 16,
  },
  haltName: {
    fontSize: typography.size.md - 1,
    color: colors.text,
    flexShrink: 1,
  },
  chipGroup: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  footer: {
    padding: spacing.lg,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
