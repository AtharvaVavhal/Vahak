import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Button, ErrorBanner, PasswordField, Screen, TextField } from '../../components';
import { colors, spacing, typography } from '../../constants/theme';
import { useAuth } from '../../hooks';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import { ApiError } from '../../utils/ApiError';
import { validatePassword, validatePhone } from '../../utils/validation';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

interface FieldErrors {
  phone?: string;
  password?: string;
}

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const handleSubmit = useCallback(async () => {
    // Guards against a double-tap firing two submissions before React re-renders the disabled button.
    if (submittingRef.current) return;

    const errors: FieldErrors = {
      phone: validatePhone(phone) ?? undefined,
      password: validatePassword(password) ?? undefined,
    };
    setFieldErrors(errors);
    setFormError(null);
    if (errors.phone || errors.password) return;

    submittingRef.current = true;
    setSubmitting(true);
    try {
      await login({ phone, password });
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Something went wrong. Try again.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [phone, password, login]);

  return (
    <Screen contentContainerStyle={styles.content} safeAreaEdges={['top', 'bottom']}>
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>Log in to continue to Vahak.</Text>

      {formError ? <ErrorBanner message={formError} /> : null}

      <TextField
        testID="login-phone-input"
        label="Phone number"
        value={phone}
        onChangeText={(text) => {
          setPhone(text);
          if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: undefined }));
        }}
        error={fieldErrors.phone}
        placeholder="10-digit phone number"
        keyboardType="number-pad"
        maxLength={10}
        autoComplete="tel"
        textContentType="telephoneNumber"
        editable={!submitting}
      />

      <PasswordField
        testID="login-password-input"
        label="Password"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
        }}
        error={fieldErrors.password}
        placeholder="Your password"
        autoComplete="password"
        textContentType="password"
        editable={!submitting}
      />

      <Button
        testID="login-submit-button"
        label="Log in"
        onPress={handleSubmit}
        loading={submitting}
        disabled={submitting}
      />

      <Pressable onPress={() => navigation.navigate('Register')} disabled={submitting} style={styles.link}>
        <Text style={styles.linkText}>
          New to Vahak? <Text style={styles.linkTextStrong}>Create an account</Text>
        </Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: 'center',
    gap: spacing.md,
  },
  title: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.size.md,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  link: {
    alignItems: 'center',
    marginTop: spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  linkText: {
    fontSize: typography.size.sm + 1,
    color: colors.textMuted,
  },
  linkTextStrong: {
    color: colors.primary,
    fontWeight: typography.weight.medium,
  },
});
