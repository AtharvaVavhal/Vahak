'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button, ErrorBanner, TextField } from '../../components/ui';
import { useAuth } from '../../hooks';
import { ApiError } from '../../utils/ApiError';
import { validatePassword, validatePhone } from '../../utils/validation';

interface FieldErrors {
  phone?: string;
  password?: string;
}

export default function LoginPage() {
  const { login, isAuthenticated, isBootstrapping } = useAuth();
  const router = useRouter();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!isBootstrapping && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isBootstrapping, isAuthenticated, router]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
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
        router.replace('/dashboard');
      } catch (error) {
        setFormError(error instanceof ApiError ? error.message : 'Something went wrong. Try again.');
      } finally {
        submittingRef.current = false;
        setSubmitting(false);
      }
    },
    [phone, password, login, router],
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Vahak Admin</h1>
        <p className="mt-1 text-sm text-slate-500">Sign in with an admin account to continue.</p>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          {formError ? <ErrorBanner message={formError} /> : null}

          <TextField
            label="Phone number"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: undefined }));
            }}
            error={fieldErrors.phone}
            placeholder="10-digit phone number"
            inputMode="numeric"
            maxLength={10}
            autoComplete="tel"
            disabled={submitting}
          />

          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
            }}
            error={fieldErrors.password}
            placeholder="Your password"
            autoComplete="current-password"
            disabled={submitting}
          />

          <Button type="submit" label="Log in" loading={submitting} disabled={submitting} className="mt-2" />
        </form>
      </div>
    </div>
  );
}
