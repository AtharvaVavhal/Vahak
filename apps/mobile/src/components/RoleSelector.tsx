import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../constants/theme';
import { REGISTERABLE_ROLES, type RegisterableRole } from '../types';

const ROLE_LABELS: Record<RegisterableRole, string> = {
  SENDER: 'Sender',
  CONDUCTOR: 'Conductor',
  RECIPIENT: 'Recipient',
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
        {REGISTERABLE_ROLES.map((role) => {
          const selected = role === value;
          return (
            <Pressable
              key={role}
              onPress={() => onChange(role)}
              style={[styles.option, selected && styles.optionSelected]}
            >
              <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                {ROLE_LABELS[role]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  options: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  option: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: '#EFF6FF',
  },
  optionText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  optionTextSelected: {
    color: colors.primary,
  },
});
