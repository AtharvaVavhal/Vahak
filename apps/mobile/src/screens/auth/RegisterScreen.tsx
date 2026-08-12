import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { Button, ErrorBanner, PasswordField, RoleSelector, TextField } from '../../components';
import { colors, spacing } from '../../constants/theme';
import { useAuth } from '../../hooks';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import { UserRole, type RegisterableRole } from '../../types';
import { ApiError } from '../../utils/ApiError';
import { validateEmail, validateName, validatePassword, validatePhone } from '../../utils/validation';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

interface FieldErrors {
  name?: string;
  phone?: string;
  email?: string;
  password?: string;
}

export function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<RegisterableRole>(UserRole.SENDER);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const clearFieldError = (field: keyof FieldErrors) => {
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const handleSubmit = useCallback(async () => {
    // Guards against a double-tap firing two submissions before React re-renders the disabled button.
    if (submittingRef.current) return;

    const errors: FieldErrors = {
      name: validateName(name) ?? undefined,
      phone: validatePhone(phone) ?? undefined,
      email: validateEmail(email) ?? undefined,
      password: validatePassword(password) ?? undefined,
    };
    setFieldErrors(errors);
    setFormError(null);
    if (errors.name || errors.phone || errors.email || errors.password) return;

    submittingRef.current = true;
    setSubmitting(true);
    try {
      await register({
        name: name.trim(),
        phone,
        email: email ? email.trim() : undefined,
        password,
        role,
      });
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Something went wrong. Try again.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [name, phone, email, password, role, register]);

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Join Vahak to book, carry, or receive parcels.</Text>

        {formError ? <ErrorBanner message={formError} /> : null}

        <TextField
          label="Full name"
          value={name}
          onChangeText={(text) => {
            setName(text);
            clearFieldError('name');
          }}
          error={fieldErrors.name}
          placeholder="Your name"
          autoComplete="name"
          textContentType="name"
          editable={!submitting}
        />

        <TextField
          label="Phone number"
          value={phone}
          onChangeText={(text) => {
            setPhone(text);
            clearFieldError('phone');
          }}
          error={fieldErrors.phone}
          placeholder="10-digit phone number"
          keyboardType="number-pad"
          maxLength={10}
          autoComplete="tel"
          textContentType="telephoneNumber"
          editable={!submitting}
        />

        <TextField
          label="Email (optional)"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            clearFieldError('email');
          }}
          error={fieldErrors.email}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          editable={!submitting}
        />

        <PasswordField
          label="Password"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            clearFieldError('password');
          }}
          error={fieldErrors.password}
          placeholder="At least 8 characters"
          autoComplete="password-new"
          textContentType="newPassword"
          editable={!submitting}
        />

        <RoleSelector value={role} onChange={setRole} />

        <Button label="Create account" onPress={handleSubmit} loading={submitting} disabled={submitting} />

        <Pressable onPress={() => navigation.navigate('Login')} disabled={submitting} style={styles.link}>
          <Text style={styles.linkText}>
            Already have an account? <Text style={styles.linkTextStrong}>Log in</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  link: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  linkText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  linkTextStrong: {
    color: colors.primary,
    fontWeight: '600',
  },
});
