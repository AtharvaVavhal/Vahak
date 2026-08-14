import { KeyRound } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../constants/theme';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';

function formatCountdown(expiresAt: string): string {
  const remainingMs = new Date(expiresAt).getTime() - Date.now();
  if (remainingMs <= 0) return 'Expired';
  const totalSeconds = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `Expires in ${minutes}:${String(seconds).padStart(2, '0')}`;
}

interface HandoverPinSheetProps {
  visible: boolean;
  pin: string;
  expiresAt: string;
  onDone: () => void;
}

/** PIN reveal — the one place in the app that uses a bottom sheet. Nothing else should compete for attention here. */
export function HandoverPinSheet({ visible, pin, expiresAt, onDone }: HandoverPinSheetProps) {
  const [countdown, setCountdown] = useState(() => formatCountdown(expiresAt));

  useEffect(() => {
    if (!visible) return;
    // Sheet remounts fresh each time it becomes visible, so the useState initializer above
    // already reflects `expiresAt` correctly at this point — only the ticking needs an effect.
    const interval = setInterval(() => setCountdown(formatCountdown(expiresAt)), 1000);
    return () => clearInterval(interval);
  }, [visible, expiresAt]);

  return (
    <BottomSheet visible={visible} dismissable={false}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <KeyRound size={24} color={colors.onPrimary} strokeWidth={2.25} />
        </View>

        <Text style={styles.title}>Handover PIN</Text>

        <Text style={styles.pin}>{pin}</Text>

        <Text style={styles.countdown}>{countdown}</Text>

        <Text style={styles.notice}>Share this with the recipient now — it won&apos;t be shown again.</Text>

        <Button label="Done, I've shared it" onPress={onDone} />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.verify,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.heading.fontSize,
    fontWeight: typography.heading.fontWeight,
    color: colors.verify,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pin: {
    fontSize: typography.codePin.fontSize,
    fontWeight: typography.codePin.fontWeight,
    fontFamily: typography.codePin.fontFamily,
    letterSpacing: typography.codePin.letterSpacing,
    color: colors.text,
    marginTop: spacing.xs,
  },
  countdown: {
    fontSize: typography.label.fontSize,
    fontWeight: typography.label.fontWeight,
    color: colors.verify,
  },
  notice: {
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    maxWidth: 260,
  },
});
