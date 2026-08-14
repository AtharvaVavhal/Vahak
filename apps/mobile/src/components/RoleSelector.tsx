import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../constants/theme';
import { REGISTERABLE_ROLES, type RegisterableRole } from '../types';
import { Chip } from './Chip';

const ROLE_LABELS: Record<RegisterableRole, string> = {
  SENDER: 'Sender',
  CONDUCTOR: 'Conductor',
  RECIPIENT: 'Recipient',
};

const ROLE_DESCRIPTIONS: Record<RegisterableRole, string> = {
  SENDER: 'Book and track parcels you send.',
  CONDUCTOR: 'Accept consignments and hand them over.',
  RECIPIENT: 'Receive parcels and verify handover PINs.',
};

interface RoleSelectorProps {
  value: RegisterableRole;
  onChange: (role: RegisterableRole) => void;
}

/** Registration role picker. Intentionally sourced from REGISTERABLE_ROLES only — ADMIN is never offered here. */
export function RoleSelector({ value, onChange }: RoleSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>I am a</Text>
      <View style={styles.options}>
        {REGISTERABLE_ROLES.map((role) => (
          <Chip key={role} label={ROLE_LABELS[role]} selected={role === value} onPress={() => onChange(role)} />
        ))}
      </View>
      <Text style={styles.description}>{ROLE_DESCRIPTIONS[value]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    fontSize: typography.label.fontSize,
    lineHeight: typography.label.lineHeight,
    fontWeight: typography.label.fontWeight,
    color: colors.text,
  },
  options: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  description: {
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    color: colors.textMuted,
  },
});
