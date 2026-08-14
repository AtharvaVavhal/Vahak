import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Animated, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, elevation, radius, spacing } from '../constants/theme';

interface BottomSheetProps {
  visible: boolean;
  onClose?: () => void;
  children: ReactNode;
  /** Set false to require an explicit in-sheet action (e.g. "Done") rather than a scrim tap / back gesture. */
  dismissable?: boolean;
}

/** Reserved for the conductor's PIN reveal — not a general-purpose replacement for Alert.alert confirmations. */
export function BottomSheet({ visible, onClose, children, dismissable = true }: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const [translateY] = useState(() => new Animated.Value(320));

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : 320,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [visible, translateY]);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={dismissable ? onClose : undefined}>
      <View style={styles.container}>
        <Pressable style={styles.scrim} onPress={dismissable ? onClose : undefined} />
        <Animated.View
          style={[
            styles.sheet,
            elevation.overlay,
            { paddingBottom: spacing.lg + insets.bottom, transform: [{ translateY }] },
          ]}
        >
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(11, 18, 32, 0.4)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
  },
});
