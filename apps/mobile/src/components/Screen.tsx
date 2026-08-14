import { type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors, spacing } from '../constants/theme';

interface ScreenProps {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Wrap content in KeyboardAvoidingView. Defaults to true — needed on any screen with text inputs. */
  keyboardAvoiding?: boolean;
  /** Wrap content in a ScrollView. Defaults to true. */
  scroll?: boolean;
  /**
   * Safe-area edges to inset. Leave unset (default) for screens rendered under a native-stack
   * header, which already accounts for the top inset — only screens with `headerShown: false`
   * (auth, bootstrap) need `['top', 'bottom']` here.
   */
  safeAreaEdges?: Edge[];
}

export function Screen({
  children,
  contentContainerStyle,
  keyboardAvoiding = true,
  scroll = true,
  safeAreaEdges,
}: ScreenProps) {
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.content, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, contentContainerStyle]}>{children}</View>
  );

  const body = keyboardAvoiding ? (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {content}
    </KeyboardAvoidingView>
  ) : (
    <View style={styles.flex}>{content}</View>
  );

  if (safeAreaEdges && safeAreaEdges.length > 0) {
    return (
      <SafeAreaView style={styles.flex} edges={safeAreaEdges}>
        {body}
      </SafeAreaView>
    );
  }

  return <View style={styles.flex}>{body}</View>;
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
});
