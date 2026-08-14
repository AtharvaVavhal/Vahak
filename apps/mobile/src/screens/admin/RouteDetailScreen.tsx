import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, ErrorBanner, InfoRow } from '../../components';
import { colors, spacing } from '../../constants/theme';
import { adminApi } from '../../services/api';
import type { AdminStackParamList } from '../../navigation/AdminNavigator';
import type { RouteWithRelations } from '../../types';
import { ApiError } from '../../utils/ApiError';

type Props = NativeStackScreenProps<AdminStackParamList, 'RouteDetail'>;

export function RouteDetailScreen({ route, navigation }: Props) {
  const { routeId } = route.params;

  const [routeData, setRouteData] = useState<RouteWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [deletingRoute, setDeletingRoute] = useState(false);
  const [routeActionError, setRouteActionError] = useState<string | null>(null);

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [itemActionError, setItemActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await adminApi.getRoute(routeId);
      setRouteData(data);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Could not load this route.');
    } finally {
      setLoading(false);
    }
  }, [routeId]);

  // Refetch on focus so returning from RouteForm/HaltForm/BusForm shows current data.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const performDeleteRoute = useCallback(async () => {
    setRouteActionError(null);
    setDeletingRoute(true);
    try {
      await adminApi.deleteRoute(routeId);
      navigation.goBack();
    } catch (err) {
      setRouteActionError(err instanceof ApiError ? err.message : 'Could not delete this route.');
      setDeletingRoute(false);
    }
  }, [routeId, navigation]);

  const confirmDeleteRoute = useCallback(() => {
    Alert.alert('Delete route?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete route', style: 'destructive', onPress: performDeleteRoute },
    ]);
  }, [performDeleteRoute]);

  const performDeleteHalt = useCallback(
    async (haltId: string) => {
      setItemActionError(null);
      setPendingDeleteId(haltId);
      try {
        await adminApi.deleteHalt(haltId);
        setRouteData((prev) => (prev ? { ...prev, halts: prev.halts.filter((h) => h.id !== haltId) } : prev));
      } catch (err) {
        setItemActionError(err instanceof ApiError ? err.message : 'Could not delete this halt.');
      } finally {
        setPendingDeleteId(null);
      }
    },
    [],
  );

  const confirmDeleteHalt = useCallback(
    (haltId: string, name: string) => {
      Alert.alert(`Delete "${name}"?`, 'This cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete halt', style: 'destructive', onPress: () => performDeleteHalt(haltId) },
      ]);
    },
    [performDeleteHalt],
  );

  const performDeleteBus = useCallback(async (busId: string) => {
    setItemActionError(null);
    setPendingDeleteId(busId);
    try {
      await adminApi.deleteBus(busId);
      setRouteData((prev) => (prev ? { ...prev, buses: prev.buses.filter((b) => b.id !== busId) } : prev));
    } catch (err) {
      setItemActionError(err instanceof ApiError ? err.message : 'Could not delete this bus.');
    } finally {
      setPendingDeleteId(null);
    }
  }, []);

  const confirmDeleteBus = useCallback(
    (busId: string, registration: string) => {
      Alert.alert(`Delete "${registration}"?`, 'This cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete bus', style: 'destructive', onPress: () => performDeleteBus(busId) },
      ]);
    },
    [performDeleteBus],
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (loadError || !routeData) {
    return (
      <View style={styles.centered}>
        <ErrorBanner message={loadError ?? 'Route not found.'} />
        <Button label="Retry" onPress={load} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Route</Text>
        <InfoRow label="Name" value={routeData.name} />
        <InfoRow label="Origin" value={routeData.origin} />
        <InfoRow label="Destination" value={routeData.destination} />
      </View>

      {routeActionError ? <ErrorBanner message={routeActionError} /> : null}
      <View style={styles.rowButtons}>
        <View style={styles.rowButtonHalf}>
          <Button label="Edit route" onPress={() => navigation.navigate('RouteForm', { routeId })} />
        </View>
        <View style={styles.rowButtonHalf}>
          <Button label="Delete route" onPress={confirmDeleteRoute} loading={deletingRoute} disabled={deletingRoute} />
        </View>
      </View>

      {itemActionError ? <ErrorBanner message={itemActionError} /> : null}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Halts</Text>
          <Pressable onPress={() => navigation.navigate('HaltForm', { routeId })}>
            <Text style={styles.addLink}>+ Add halt</Text>
          </Pressable>
        </View>

        {routeData.halts.length === 0 ? <Text style={styles.emptyText}>No halts yet.</Text> : null}

        {routeData.halts.map((halt) => (
          <View key={halt.id} style={styles.itemRow}>
            <Pressable
              style={styles.itemInfo}
              onPress={() => navigation.navigate('HaltForm', { routeId, haltId: halt.id })}
            >
              <Text style={styles.itemTitle}>
                {halt.sequence}. {halt.name}
              </Text>
              {halt.latitude && halt.longitude ? (
                <Text style={styles.itemSubtitle}>
                  {halt.latitude}, {halt.longitude}
                </Text>
              ) : null}
            </Pressable>
            <Button
              label="Delete"
              onPress={() => confirmDeleteHalt(halt.id, halt.name)}
              loading={pendingDeleteId === halt.id}
              disabled={pendingDeleteId !== null}
            />
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Buses</Text>
          <Pressable onPress={() => navigation.navigate('BusForm', { routeId })}>
            <Text style={styles.addLink}>+ Add bus</Text>
          </Pressable>
        </View>

        {routeData.buses.length === 0 ? <Text style={styles.emptyText}>No buses yet.</Text> : null}

        {routeData.buses.map((bus) => (
          <View key={bus.id} style={styles.itemRow}>
            <Pressable
              style={styles.itemInfo}
              onPress={() => navigation.navigate('BusForm', { routeId, busId: bus.id })}
            >
              <Text style={styles.itemTitle}>{bus.registration}</Text>
              <Text style={styles.itemSubtitle}>{bus.active ? 'Active' : 'Inactive'}</Text>
            </Pressable>
            <Button
              label="Delete"
              onPress={() => confirmDeleteBus(bus.id, bus.registration)}
              loading={pendingDeleteId === bus.id}
              disabled={pendingDeleteId !== null}
            />
          </View>
        ))}
      </View>
    </ScrollView>
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
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  section: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.xs,
    backgroundColor: colors.surface,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  addLink: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  rowButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rowButtonHalf: {
    flex: 1,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  itemSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
  },
});
