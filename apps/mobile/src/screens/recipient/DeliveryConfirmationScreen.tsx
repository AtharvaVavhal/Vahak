import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CircleCheckBig } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Card } from '../../components';
import { PARCEL_SIZE_LABELS } from '../../constants/consignment';
import { colors, spacing, typography } from '../../constants/theme';
import type { RecipientStackParamList } from '../../navigation/RecipientNavigator';
import { formatFare } from '../../utils/format';

type Props = NativeStackScreenProps<RecipientStackParamList, 'DeliveryConfirmation'>;

/** Only ever reached with a consignment whose `status` the backend itself set to DELIVERED. */
export function DeliveryConfirmationScreen({ route, navigation }: Props) {
  const { consignment } = route.params;

  return (
    <View style={styles.container}>
      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <CircleCheckBig size={40} color={colors.success} strokeWidth={2} />
        </View>

        <Text style={styles.title}>Delivered</Text>
        <Text style={[styles.trackingCode, styles.mono]}>{consignment.trackingCode}</Text>

        <Card style={styles.summary}>
          <Text style={styles.summaryLine}>{PARCEL_SIZE_LABELS[consignment.parcelSize]} parcel</Text>
          <Text style={styles.summaryLine}>Fare: {formatFare(consignment.fare)}</Text>
        </Card>
      </View>

      <Button label="Back to home" onPress={() => navigation.popToTop()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.xxl,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    alignSelf: 'stretch',
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.successTint,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.display.fontSize,
    lineHeight: typography.display.lineHeight,
    fontWeight: typography.display.fontWeight,
    color: colors.text,
  },
  trackingCode: {
    fontSize: typography.codeEmphasis.fontSize,
    fontWeight: typography.codeEmphasis.fontWeight,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  mono: {
    fontFamily: typography.monoFontFamily,
  },
  summary: {
    marginTop: spacing.xxl,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  summaryLine: {
    fontSize: typography.body.fontSize,
    color: colors.text,
  },
});
