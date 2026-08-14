import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';

import { Button, StatusBadge } from '../../components';
import { PARCEL_SIZE_LABELS } from '../../constants/consignment';
import { colors, spacing } from '../../constants/theme';
import type { RecipientStackParamList } from '../../navigation/RecipientNavigator';
import { formatFare } from '../../utils/format';

type Props = NativeStackScreenProps<RecipientStackParamList, 'DeliveryConfirmation'>;

/** Only ever reached with a consignment whose `status` the backend itself set to DELIVERED. */
export function DeliveryConfirmationScreen({ route, navigation }: Props) {
  const { consignment } = route.params;

  return (
    <View style={styles.container}>
      <View style={styles.body}>
        <Text style={styles.title}>Delivered</Text>
        <Text style={styles.trackingCode}>{consignment.trackingCode}</Text>
        <StatusBadge status={consignment.status} />

        <View style={styles.summary}>
          <Text style={styles.summaryLine}>{PARCEL_SIZE_LABELS[consignment.parcelSize]} parcel</Text>
          <Text style={styles.summaryLine}>Fare: {formatFare(consignment.fare)}</Text>
        </View>
      </View>

      <Button label="Back to home" onPress={() => navigation.popToTop()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  body: {
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  trackingCode: {
    fontSize: 15,
    color: colors.textMuted,
  },
  summary: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  summaryLine: {
    fontSize: 14,
    color: colors.text,
  },
});
