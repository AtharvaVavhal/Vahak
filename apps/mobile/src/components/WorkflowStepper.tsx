import { StyleSheet, Text, View } from 'react-native';

import { CONSIGNMENT_STATUS_LABELS, CONSIGNMENT_STATUS_VISUALS, CONSIGNMENT_STATUS_WORKFLOW } from '../constants/consignment';
import { colors, spacing, typography } from '../constants/theme';
import type { ConsignmentStatus } from '../types';

interface WorkflowStepperProps {
  currentStatus: ConsignmentStatus;
  /** Dims the whole stepper once the consignment reaches a terminal, no-longer-actionable state. */
  subdued?: boolean;
}

/** Connected route-line progress indicator. Renders nothing for CANCELLED (a terminal branch, not a step). */
export function WorkflowStepper({ currentStatus, subdued = false }: WorkflowStepperProps) {
  const stepIndex = CONSIGNMENT_STATUS_WORKFLOW.indexOf(currentStatus);
  if (stepIndex < 0) return null;

  const lastIndex = CONSIGNMENT_STATUS_WORKFLOW.length - 1;
  const progressPct = lastIndex === 0 ? 0 : (stepIndex / lastIndex) * 100;

  return (
    <View style={subdued ? styles.subdued : undefined}>
      <View style={styles.track}>
        <View style={styles.trackLine} />
        <View style={[styles.trackLineFill, { width: `${progressPct}%` }]} />
        <View style={styles.dotsRow}>
          {CONSIGNMENT_STATUS_WORKFLOW.map((step, index) => {
            const isCurrent = index === stepIndex;
            const isCompleted = index < stepIndex;
            const CurrentIcon = CONSIGNMENT_STATUS_VISUALS[step].icon;
            return (
              <View key={step} style={styles.dotSlot}>
                {isCurrent ? (
                  <View style={styles.dotCurrent}>
                    <CurrentIcon size={8} color={colors.onPrimary} strokeWidth={3} />
                  </View>
                ) : (
                  <View style={[styles.dotSmall, isCompleted ? styles.dotCompleted : styles.dotFuture]} />
                )}
              </View>
            );
          })}
        </View>
      </View>
      <View style={styles.labelsRow}>
        {CONSIGNMENT_STATUS_WORKFLOW.map((step, index) => (
          <Text
            key={step}
            style={[
              styles.label,
              index === stepIndex && styles.labelCurrent,
              index > stepIndex && styles.labelFuture,
            ]}
            numberOfLines={2}
          >
            {CONSIGNMENT_STATUS_LABELS[step]}
          </Text>
        ))}
      </View>
    </View>
  );
}

const DOT_ROW_HEIGHT = 16;

const styles = StyleSheet.create({
  subdued: {
    opacity: 0.5,
  },
  track: {
    height: DOT_ROW_HEIGHT,
    justifyContent: 'center',
  },
  trackLine: {
    position: 'absolute',
    left: 8,
    right: 8,
    height: 2,
    backgroundColor: colors.ink150,
    borderRadius: 1,
  },
  trackLineFill: {
    position: 'absolute',
    left: 8,
    height: 2,
    backgroundColor: colors.primary,
    borderRadius: 1,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dotSlot: {
    width: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotCurrent: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotCompleted: {
    backgroundColor: colors.primary,
  },
  dotFuture: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.ink300,
  },
  labelsRow: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  label: {
    flex: 1,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  labelCurrent: {
    color: colors.primary,
    fontWeight: typography.weight.bold,
  },
  labelFuture: {
    color: colors.textMuted,
  },
});
