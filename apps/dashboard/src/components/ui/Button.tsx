'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'dangerGhost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: ReactNode;
  loading?: boolean;
  variant?: Variant;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-hover',
  secondary: 'bg-surface text-ink-700 border border-ink-300 hover:bg-canvas',
  danger: 'bg-danger text-white hover:opacity-90',
  ghost: 'bg-transparent text-brand hover:bg-brand-tint',
  dangerGhost: 'bg-transparent text-danger hover:bg-danger-tint',
};

export function Button({ label, loading = false, variant = 'primary', disabled, className, ...rest }: ButtonProps) {
  return (
    <button
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-sm px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${VARIANT_CLASSES[variant]} ${className ?? ''}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden
        />
      ) : null}
      {label}
    </button>
  );
}
